import { createClient } from "@supabase/supabase-js";

// Supabaseの接続情報はclient/.envで管理する(VITE_接頭辞のみブラウザに公開される)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
