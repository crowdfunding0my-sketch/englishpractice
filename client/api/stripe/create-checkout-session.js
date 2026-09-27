// Vercel Serverless Function: POST /api/stripe/create-checkout-session
import { getStripe } from "../../lib/stripeClient.js";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin.js";
import { getUserFromRequest } from "../../lib/getUserFromRequest.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "認証が必要です" });
    return;
  }

  // TODO: 一時的なキー診断(値そのものは出さず、長さ・前後の空白有無だけ確認する)
  const rawKey = process.env.STRIPE_SECRET_KEY || "";
  const keyDiag = {
    length: rawKey.length,
    trimmedLength: rawKey.trim().length,
    startsCorrect: rawKey.startsWith("sk_test_") || rawKey.startsWith("sk_live_"),
    hasWhitespace: rawKey !== rawKey.trim(),
    hasQuotes: rawKey.includes('"') || rawKey.includes("'"),
    priceIdLength: (process.env.STRIPE_PRICE_ID || "").length,
    priceIdStartsCorrect: (process.env.STRIPE_PRICE_ID || "").startsWith("price_"),
  };

  try {
    const stripe = getStripe();
    const supabaseAdmin = getSupabaseAdmin();
    const clientUrl = process.env.CLIENT_URL || `https://${req.headers.host}`;

    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = existing?.stripe_customer_id;
    if (!customerId) {
      let customer;
      try {
        customer = await stripe.customers.create({
          email: user.email,
          metadata: { supabase_user_id: user.id },
        });
      } catch (err) {
        err.stage = "customers.create";
        throw err;
      }
      customerId = customer.id;
    }

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        client_reference_id: user.id,
        line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
        success_url: `${clientUrl}/?checkout=success`,
        cancel_url: `${clientUrl}/?checkout=cancel`,
        // 商品に税コードを設定していないため、Managed Payments(税コード必須)を無効化する
        managed_payments: { enabled: false },
      });
    } catch (err) {
      err.stage = "checkout.sessions.create";
      throw err;
    }

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    // TODO: 本番調査用の一時的な詳細出力。原因特定後は削除する。
    res.status(500).json({
      error: "決済ページの作成に失敗しました",
      stage: err.stage,
      debug: err.message,
      raw: err.raw?.message,
      cause: err.cause ? String(err.cause) : undefined,
      causeNested: err.cause?.cause ? String(err.cause.cause) : undefined,
      code: err.code,
      type: err.type,
      keyDiag,
    });
  }
}
