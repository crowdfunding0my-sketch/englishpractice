// Vercel Serverless Function: POST /api/stripe/create-portal-session
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

  try {
    const stripe = getStripe();
    const supabaseAdmin = getSupabaseAdmin();
    const clientUrl = process.env.CLIENT_URL || `https://${req.headers.host}`;

    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      res.status(400).json({ error: "サブスクリプションが見つかりません" });
      return;
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
}
