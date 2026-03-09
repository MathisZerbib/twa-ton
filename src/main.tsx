import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { CartProvider } from "./providers/CartProvider";

/**
 * TonConnect manifest URL.
 *
 * Always derived from the real origin the app is running on so the
 * manifest URL embedded in the QR code matches what TonKeeper fetches.
 *
 *  - localhost:5173  → http://localhost:5173/tonconnect-manifest.json
 *  - cloudflared URL → https://xyz.trycloudflare.com/tonconnect-manifest.json
 *  - production      → https://your-domain.com/tonconnect-manifest.json
 *
 * VITE_APP_URL is only used as an explicit CI/CD override (leave unset locally).
 */
const manifestUrl =
  `${import.meta.env.VITE_APP_URL ?? window.location.origin}/tonconnect-manifest.json`;

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <TonConnectUIProvider manifestUrl={manifestUrl}>
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <App />
      </CartProvider>
    </QueryClientProvider>
  </TonConnectUIProvider>
);
