import { defineConfig } from "vite";
import react from '@vitejs/plugin-react'
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ["buffer", "process", "util", "events", "stream", "crypto"],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  base: ((process.env.GITHUB_REPOSITORY ?? "") + "/").match(/(\/.*)/)![1],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("mapbox-gl") || id.includes("@turf")) return "mapbox";
          if (id.includes("lottie-web")) return "lottie";
          if (id.includes("@ton") || id.includes("ton-core") || id.includes("ton-crypto") || id.includes("@tonconnect")) return "ton";
        },
      },
    },
  },
  server: {
    // Allow localtunnel / ngrok / any tunnel hostname to proxy through Vite.
    // Required so TonConnect manifest is reachable from the public internet.
    allowedHosts: true,
    cors: true,
  },
});
