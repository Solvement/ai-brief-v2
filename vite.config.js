import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { spawn } from "node:child_process";
import path from "node:path";

/**
 * Dev-only middleware: POST /__ingest streams `node scripts/ingest.mjs` stdout/stderr
 * back to the browser as plain text. When the child exits, sends `\n[done <code>]\n`
 * and closes. The UI button reads this stream and reloads on success.
 */
function ingestPlugin() {
  return {
    name: "gh-trending-ingest-trigger",
    apply: "serve",
    configureServer(server) {
      let busy = false;
      server.middlewares.use("/__ingest", (req, res, next) => {
        if (req.method !== "POST") return next();
        if (busy) {
          res.statusCode = 429;
          res.setHeader("content-type", "text/plain; charset=utf-8");
          res.end("[busy] 已经有一个 ingest 在跑，稍等\n");
          return;
        }
        busy = true;
        res.setHeader("content-type", "text/plain; charset=utf-8");
        res.setHeader("cache-control", "no-cache");
        res.setHeader("transfer-encoding", "chunked");

        const cwd = process.cwd();
        const env = { ...process.env, NODE_USE_ENV_PROXY: "1", FORCE_COLOR: "0" };
        const args = ["--no-warnings", path.join(cwd, "scripts", "ingest.mjs")];
        // Forward optional query args like ?force=1
        const url = new URL(req.url || "/", "http://x");
        if (url.searchParams.get("force") === "1") args.push("--no-cache");

        const child = spawn(process.execPath, args, { cwd, env });
        const start = Date.now();
        res.write(`[ingest] starting ${args.slice(1).join(" ")}\n`);
        child.stdout.on("data", (d) => res.write(d));
        child.stderr.on("data", (d) => res.write(d));
        child.on("close", (code) => {
          const dur = ((Date.now() - start) / 1000).toFixed(1);
          res.write(`\n[done exit=${code} in ${dur}s]\n`);
          res.end();
          busy = false;
        });
        child.on("error", (err) => {
          res.write(`\n[error] ${err.message}\n`);
          try { res.end(); } catch {}
          busy = false;
        });
        req.on("close", () => {
          // Client aborted; let the ingest continue in background. Don't kill.
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), ingestPlugin()],
  server: {
    host: "127.0.0.1",
    port: 5180,
    strictPort: true,
  },
  cacheDir: process.env.VITE_CACHE_DIR || "node_modules/.vite",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
  },
});
