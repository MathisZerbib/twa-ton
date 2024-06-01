import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { CartProvider } from "./providers/CartProvider";
import { Route, HashRouter, Routes } from "react-router-dom";
import CheckoutPage from "./pages/CheckoutPage";

// this manifest is used temporarily for development purposes
const manifestUrl =
  "https://raw.githubusercontent.com/ton-community/tutorials/main/03-client/test/public/tonconnect-manifest.json";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <TonConnectUIProvider manifestUrl={manifestUrl}>
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="checkout" element={<CheckoutPage />} />
          </Routes>{" "}
        </HashRouter>
      </CartProvider>
    </QueryClientProvider>
  </TonConnectUIProvider>
);
