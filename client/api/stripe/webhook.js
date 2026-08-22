// Vercel Serverless Function: POST /api/stripe/webhook
// 署名検証に生のリクエストボディが必要なため、Vercelの自動ボディパースを無効化する
import { getStripe } from "../../lib/stripeClient.js";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const stripe = getStripe();
  const signature = req.headers["stripe-signature"];
  const rawBody = await readRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    await applySubscriptionEvent(event);
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook handling error:", err);
    res.status(500).json({ error: "webhook processing failed" });
  }
}
