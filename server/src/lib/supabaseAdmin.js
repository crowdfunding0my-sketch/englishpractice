import { createClient } from "@supabase/supabase-js";

// service_roleキーを使うAdminクライアント(RLSを越えて書き込む・JWT検証に使う)
// クライアント(ブラウザ)には絶対に渡さないこと
let client = null;

export function getSupabaseAdmin() {
  if (!client) {
    client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return client;
}
