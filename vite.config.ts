import { defineConfig } from "vite";
import react from '@vitejs/plugin-react'
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills()],
  base: ((process.env.GITHUB_REPOSITORY ?? "") + "/").match(/(\/.*)/)![1],
  server: {
    // Allow localtunnel / ngrok / any tunnel hostname to proxy through Vite.
    // Required so TonConnect manifest is reachable from the public internet.
    allowedHosts: true,
    cors: true,
  },
});
