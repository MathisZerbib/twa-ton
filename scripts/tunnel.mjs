#!/usr/bin/env node
/**
 * scripts/tunnel.mjs
 *
 * Starts cloudflared, captures the trycloudflare.com URL from its output,
 * then auto-patches public/tonconnect-manifest.json with that URL.
 *
 * Usage: npm run tunnel
 */

import { spawn } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = resolve(__dirname, "../public/tonconnect-manifest.json");
const PORT = 5173;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function patchManifest(tunnelUrl) {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  manifest.url = tunnelUrl;
  manifest.iconUrl = `${tunnelUrl}/ton.svg`;
  manifest.termsOfUseUrl = tunnelUrl;
  manifest.privacyPolicyUrl = tunnelUrl;
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\n✅ Manifest patched → ${tunnelUrl}\n`);
}

// ─── Launch cloudflared ────────────────────────────────────────────────────────

console.log(`\n🌐 Starting cloudflared tunnel on port ${PORT}…\n`);

const cf = spawn("cloudflared", ["tunnel", "--url", `http://localhost:${PORT}`], {
  stdio: ["ignore", "pipe", "pipe"],
});

let urlFound = false;

function handleLine(line) {
  // Forward all output so the developer can see it
  process.stdout.write(line + "\n");

  // Extract the trycloudflare.com URL from cloudflared's log output
  if (!urlFound) {
    const match = line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match) {
      urlFound = true;
      const tunnelUrl = match[0];
      console.log(`\n🎉 Tunnel URL: ${tunnelUrl}`);
      patchManifest(tunnelUrl);
      console.log("📱 Open this URL in your browser, then scan the QR with TonKeeper.\n");
    }
  }
}

// cloudflared logs to stderr
let stderrBuf = "";
cf.stderr.on("data", (chunk) => {
  stderrBuf += chunk.toString();
  const lines = stderrBuf.split("\n");
  stderrBuf = lines.pop(); // keep the incomplete line
  lines.forEach(handleLine);
});

cf.stdout.on("data", (chunk) => {
  chunk.toString().split("\n").forEach(handleLine);
});

cf.on("close", (code) => {
  console.log(`\ncloudflared exited (code ${code})`);
  process.exit(code ?? 0);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down tunnel…");
  cf.kill("SIGTERM");
  process.exit(0);
});
