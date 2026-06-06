// scripts/test-supabase.mjs
// 一次性连通性自检:用 service_role(secret)key 往 feedback 表写一行再读回来。
// 证明「代码 → 云端 Postgres」链路通了(service_role 会绕过 RLS,所以即便表锁了也能写)。
// 运行:  node scripts/test-supabase.mjs   (从项目根目录)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// 手动加载 .env.local(不依赖 Node 版本的 --env-file),已存在的环境变量不覆盖。
try {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {
  console.error("❌ 没找到 .env.local,请在项目根目录运行。");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("❌ 缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY。请检查 .env.local 那 3 行。");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const testId = `selftest-${Date.now()}`;
console.log("→ 写入一行测试数据 item_id =", testId);

const { data: inserted, error: insErr } = await supabase
  .from("feedback")
  .insert({ item_type: "news", item_id: testId, item_title: "🔌 连接自检", note: "来自 test-supabase.mjs 的连通性测试" })
  .select()
  .single();

if (insErr) {
  console.error("❌ 写入失败:", insErr.message);
  console.error("   (如果提示找不到表 feedback,说明第 2 步建表没跑;如果是权限相关,确认用的是 service_role 而不是 anon。)");
  process.exit(1);
}
console.log("✅ 写入成功:", inserted);

const { data: rows, error: selErr } = await supabase
  .from("feedback")
  .select("id, created_at, item_type, item_id, item_title, note")
  .order("created_at", { ascending: false })
  .limit(5);

if (selErr) {
  console.error("❌ 读取失败:", selErr.message);
  process.exit(1);
}
console.log(`✅ 读回最近 ${rows.length} 行:`);
console.table(rows);
console.log("\n🎉 「代码 → 云端表」链路通了。去 Supabase 的 Table Editor 看 feedback 表,能看到这行。");
