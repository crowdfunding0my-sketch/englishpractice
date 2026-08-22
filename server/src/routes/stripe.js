import { Router } from "express";
import express from "express";
import { getStripe } from "../lib/stripeClient.js";
import { getSupabaseAdmin } from "../lib/supabaseAdmin.js";

const router = Router();

// リクエストのAuthorizationヘッダ(Supabaseのアクセストークン)からログインユーザーを特定する
async function getUserFromRequest(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

router.post("/create-checkout-session", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "認証が必要です" });
  }

  try {
    const stripe = getStripe();
    const supabaseAdmin = getSupabaseAdmin();
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = existing?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${clientUrl}/?checkout=success`,
      cancel_url: `${clientUrl}/?checkout=cancel`,
      // 商品に税コードを設定していないため、Managed Payments(税コード必須)を無効化する
      managed_payments: { enabled: false },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    res.status(500).json({ error: "決済ページの作成に失敗しました" });
  }
});

router.post("/create-portal-session", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "認証が必要です" });
  }

  try {
    const stripe = getStripe();
    const supabaseAdmin = getSupabaseAdmin();
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      return res.status(400).json({ error: "サブスクリプションが見つかりません" });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${clientUrl}/`,
    });

    res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error("create-portal-session error:", err);
    res.status(500).json({ error: "プラン管理ページの作成に失敗しました" });
  }
});

// Stripeの署名検証には生のリクエストボディが必要なため、この経路だけexpress.raw()を使う
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const stripe = getStripe();
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await applySubscriptionEvent(event);
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook handling error:", err);
    res.status(500).json({ error: "webhook processing failed" });
  }
});

// current_period_endはサブスクリプション直下、または(新しいAPIバージョンでは)
// 先頭のsubscription itemの下に入っている場合があるため、両方に対応する
function getCurrentPeriodEnd(subscription) {
  const seconds = subscription.current_period_end ?? subscription.items?.data?.[0]?.current_period_end;
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function applySubscriptionEvent(event) {
  const supabaseAdmin = getSupabaseAdmin();
  const stripe = getStripe();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id;
    if (!userId) return;

    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    const { error } = await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: userId,
        stripe_customer_id: session.customer,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        current_period_end: getCurrentPeriodEnd(subscription),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (error) throw error;
    return;
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: subscription.status,
        current_period_end: getCurrentPeriodEnd(subscription),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_customer_id", subscription.customer);
    if (error) throw error;
  }
}

export default router;
