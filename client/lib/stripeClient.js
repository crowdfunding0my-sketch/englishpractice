import Stripe from "stripe";

let client = null;

export function getStripe() {
  if (!client) {
    // Vercelのサーバーレス環境ではNode標準のhttps.Agent(keep-alive)が
    // コネクションエラーを起こしやすいため、fetchベースのHTTPクライアントを使う
    client = new Stripe(process.env.STRIPE_SECRET_KEY, {
      httpClient: Stripe.createFetchHttpClient(),
    });
  }
  return client;
}
