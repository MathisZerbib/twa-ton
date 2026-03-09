#!/bin/bash
# ─────────────────────────────────────────────────────────
# TON-Eats dev startup with public HTTPS tunnel
# Usage: ./scripts/dev-tunnel.sh
# ─────────────────────────────────────────────────────────

set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$DIR/public/tonconnect-manifest.json"

echo "🍔 TON-Eats Dev Tunnel"
echo "━━━━━━━━━━━━━━━━━━━━━━"

# Kill any leftover Vite on 5173
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
sleep 1

# Start Vite in background (allowedHosts: all is set in vite.config.ts)
echo "▶ Starting Vite dev server..."
npx vite --host &
VITE_PID=$!
sleep 3

# Verify Vite is up
curl -s http://localhost:5173/ > /dev/null || { echo "❌ Vite failed to start"; exit 1; }
echo "✅ Vite running (PID $VITE_PID)"

# Start localtunnel and capture URL
echo "🌐 Opening HTTPS tunnel..."
TUNNEL_URL=$(npx localtunnel --port 5173 2>&1 | grep -o 'https://[^ ]*' | head -1 &)
sleep 5
TUNNEL_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

# Fallback: capture from localtunnel output directly
if [ -z "$TUNNEL_URL" ]; then
  LT_OUTPUT=$(npx localtunnel --port 5173 --print-requests 2>&1 &
  sleep 4
  jobs -l)
fi

# Simpler approach: just run lt and grab the URL
TUNNEL_OUTPUT=$(npx localtunnel --port 5173 2>&1 &
LTPID=$!
sleep 5
cat /proc/$LTPID/fd/1 2>/dev/null || true)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  Run these commands in TWO separate terminals:"
echo ""
echo "  Terminal 1 (Vite server):"
echo "    cd $DIR && npm run dev:lan"
echo ""
echo "  Terminal 2 (HTTPS tunnel):"
echo "    cd $DIR && npx localtunnel --port 5173"
echo ""
echo "  Then:"
echo "  1. Copy the 'your url is: https://...' from Terminal 2"
echo "  2. Update public/tonconnect-manifest.json 'url' field with that URL"
echo "  3. Open the HTTPS URL in your browser (not localhost)"
echo "  4. Scan the TonConnect QR code with TonKeeper ✅"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

wait $VITE_PID
