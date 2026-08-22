import { getSupabaseAdmin } from "./supabaseAdmin.js";

// リクエストのAuthorizationヘッダ(Supabaseのアクセストークン)からログインユーザーを特定する
export async function getUserFromRequest(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
