import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { spawn } from "node:child_process";
import path from "node:path";

/**
 * Dev-only middleware: streams local refresh scripts back to the browser as
 * plain text. UI buttons read the stream and reload after success.
 */
function ingestPlugin() {
  return {
    name: "gh-trending-ingest-trigger",
    apply: "serve",
    configureServer(server) {
      let ingestBusy = false;
      let articlesBusy = false;
      let radarBusy = false;
      server.middlewares.use("/__ingest", (req, res, next) => {
        if (req.method !== "POST") return next();
        if (ingestBusy) {
          res.statusCode = 429;
          res.setHeader("content-type", "text/plain; charset=utf-8");
          res.end("[busy] 已经有一个 ingest 在跑，稍等\n");
          return;
        }
        ingestBusy = true;
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
          ingestBusy = false;
        });
        child.on("error", (err) => {
          res.write(`\n[error] ${err.message}\n`);
          try { res.end(); } catch {}
          ingestBusy = false;
        });
        req.on("close", () => {
          // Client aborted; let the ingest continue in background. Don't kill.
        });
      });

      server.middlewares.use("/__refresh-articles", (req, res, next) => {
        if (req.method !== "POST") return next();
        if (articlesBusy) {
          res.statusCode = 429;
          res.setHeader("content-type", "text/plain; charset=utf-8");
          res.end("[busy] 已经有一个 articles refresh 在跑，稍等\n");
          return;
        }
        articlesBusy = true;
        res.setHeader("content-type", "text/plain; charset=utf-8");
        res.setHeader("cache-control", "no-cache");
        res.setHeader("transfer-encoding", "chunked");

        const cwd = process.cwd();
        const env = { ...process.env, NODE_USE_ENV_PROXY: "1", FORCE_COLOR: "0" };
        const args = ["--no-warnings", path.join(cwd, "scripts", "refresh-articles.mjs")];
        const child = spawn(process.execPath, args, { cwd, env });
        const start = Date.now();
        res.write(`[articles] starting ${args.slice(1).join(" ")}\n`);
        child.stdout.on("data", (d) => res.write(d));
        child.stderr.on("data", (d) => res.write(d));
        child.on("close", (code) => {
          const dur = ((Date.now() - start) / 1000).toFixed(1);
          if (code === 0) {
            const validateArgs = ["--no-warnings", path.join(cwd, "scripts", "validate-text-encoding.mjs")];
            const validateArticlesArgs = ["--no-warnings", path.join(cwd, "scripts", "validate-articles.mjs")];
            res.write(`[articles] validating text encoding\n`);
            const validateText = spawn(process.execPath, validateArgs, { cwd, env });
            validateText.stdout.on("data", (d) => res.write(d));
            validateText.stderr.on("data", (d) => res.write(d));
            validateText.on("close", (textCode) => {
              if (textCode !== 0) {
                res.write(`\n[done exit=${textCode} in ${dur}s]\n`);
                res.end();
                articlesBusy = false;
                return;
              }
              res.write(`[articles] validating articles schema\n`);
              const validateArticles = spawn(process.execPath, validateArticlesArgs, { cwd, env });
              validateArticles.stdout.on("data", (d) => res.write(d));
              validateArticles.stderr.on("data", (d) => res.write(d));
              validateArticles.on("close", (articlesCode) => {
                const totalDur = ((Date.now() - start) / 1000).toFixed(1);
                res.write(`\n[done exit=${articlesCode} in ${totalDur}s]\n`);
                res.end();
                articlesBusy = false;
              });
              validateArticles.on("error", (err) => {
                res.write(`\n[error] ${err.message}\n`);
                try { res.end(); } catch {}
                articlesBusy = false;
              });
            });
            validateText.on("error", (err) => {
              res.write(`\n[error] ${err.message}\n`);
              try { res.end(); } catch {}
              articlesBusy = false;
            });
            return;
          }
          res.write(`\n[done exit=${code} in ${dur}s]\n`);
          res.end();
          articlesBusy = false;
        });
        child.on("error", (err) => {
          res.write(`\n[error] ${err.message}\n`);
          try { res.end(); } catch {}
          articlesBusy = false;
        });
      });

      server.middlewares.use("/__refresh-paper-radar", (req, res, next) => {
        if (req.method !== "POST") return next();
        if (radarBusy) {
          res.statusCode = 429;
          res.setHeader("content-type", "text/plain; charset=utf-8");
          res.end("[busy] 已经有一个 paper radar 在跑，稍等\n");
          return;
        }
        radarBusy = true;
        res.setHeader("content-type", "text/plain; charset=utf-8");
        res.setHeader("cache-control", "no-cache");
        res.setHeader("transfer-encoding", "chunked");

        const cwd = process.cwd();
        const env = { ...process.env, NODE_USE_ENV_PROXY: "1", FORCE_COLOR: "0" };
        const start = Date.now();
        const steps = [
          ["discover", ["--no-warnings", path.join(cwd, "scripts", "papers-radar.mjs"), "discover", "--limit=160"]],
          ["triage", ["--no-warnings", path.join(cwd, "scripts", "papers-radar.mjs"), "triage", "--no-model"]],
          ["daily", ["--no-warnings", path.join(cwd, "scripts", "papers-radar.mjs"), "daily"]],
          ["validate", ["--no-warnings", path.join(cwd, "scripts", "validate-papers-radar.mjs")]],
          ["encoding", ["--no-warnings", path.join(cwd, "scripts", "validate-text-encoding.mjs")]],
        ];

        const runStep = (index) => {
          if (index >= steps.length) {
            const dur = ((Date.now() - start) / 1000).toFixed(1);
            res.write(`\n[done exit=0 in ${dur}s]\n`);
            res.end();
            radarBusy = false;
            return;
          }
          const [label, args] = steps[index];
          res.write(`[paper-radar] ${label}: ${args.slice(1).join(" ")}\n`);
          const child = spawn(process.execPath, args, { cwd, env });
          child.stdout.on("data", (d) => res.write(d));
          child.stderr.on("data", (d) => res.write(d));
          child.on("close", (code) => {
            if (code !== 0) {
              const dur = ((Date.now() - start) / 1000).toFixed(1);
              res.write(`\n[done exit=${code} in ${dur}s]\n`);
              res.end();
              radarBusy = false;
              return;
            }
            runStep(index + 1);
          });
          child.on("error", (err) => {
            res.write(`\n[error] ${err.message}\n`);
            try { res.end(); } catch {}
            radarBusy = false;
          });
        };

        runStep(0);
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
