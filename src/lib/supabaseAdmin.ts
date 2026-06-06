import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 服务端专用 Supabase 客户端:用 service_role(secret)key,绕过 RLS。
// 只能在服务器代码(API route / server action / 脚本)里 import,绝不进客户端组件——
// 因为 SUPABASE_SERVICE_ROLE_KEY 没有 NEXT_PUBLIC_ 前缀,不会打包进浏览器。
let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("缺少 Supabase 环境变量(NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY),请检查 .env.local。");
  }
  cached = createClient(url, serviceKey, { auth: { persistSession: false } });
  return cached;
}
