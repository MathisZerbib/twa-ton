/**
 * TON-Eats App.tsx
 *
 * Two-app routing:
 *   /              → Customer (redirects to /store/1)
 *   /store/:id     → Customer shop + checkout
 *   /track/:id     → Customer live order tracker (after checkout)
 *   /courier       → Courier dashboard (requires wallet)
 *
 * Deep-link startapp param formats:
 *   "store_<id>_ref_<wallet>"  → customer referral link
 *   "courier"                  → opens the courier app directly
 */

import React, { useEffect, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import styled, { ThemeProvider as StyledThemeProvider } from "styled-components";
import { ThemeContext, ThemeProvider } from "./contexts/theme";
import Shop from "./pages/Shop";
import CourierDashboard from "./pages/CourierDashboard";
import OrderTracker from "./pages/OrderTracker";
import DiscoveryPage from "./pages/DiscoveryPage";
import MerchantOnboarding from "./pages/MerchantOnboarding";
import MyOrdersPage from "./pages/MyOrdersPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";

// ─── Deep-link Parser ─────────────────────────────────────────────────────────

function parseStartParam(startParam: string | undefined) {
  if (!startParam) return { storeId: null, referrerWallet: null, isCourier: false };

  const isCourier = startParam === "courier" || startParam.startsWith("courier_");
  const storeMatch = startParam.match(/store_([^_]+)/);
  const refMatch = startParam.match(/ref_(.+)$/);

  return {
    storeId: storeMatch ? storeMatch[1] : null,
    referrerWallet: refMatch ? refMatch[1] : null,
    isCourier,
  };
}

// ─── Root Router Logic ─────────────────────────────────────────────────────────

function RootRouter() {
  const tg = (window as any).Telegram?.WebApp;
  const startParam =
    tg?.initDataUnsafe?.start_param ||
    new URLSearchParams(window.location.search).get("startapp") ||
    undefined;

  const { isCourier, storeId } = parseStartParam(startParam);

  if (isCourier) return <Navigate to="/courier" replace />;
  if (storeId) return <Navigate to={`/store/${storeId}`} replace />;

  return <DiscoveryPage />;
}

// ─── OrderTracker Route Wrapper ─────────────────────────────────────────────────

function TrackPage() {
  const { orderId } = useParams<{ orderId: string }>();
  return orderId ? <OrderTracker orderId={orderId} /> : <Navigate to="/" replace />;
}

// ─── Styled ───────────────────────────────────────────────────────────────────

const AppContainer = styled.div`
  background-color: var(--tg-theme-bg-color, #ffffff);
  color: var(--tg-theme-text-color, #1a1a1a);
  min-height: 100vh;
  font-family: 'Inter', 'Segoe UI', sans-serif;
`;

// ─── Inner App ───────────────────────────────────────────────────────────────

function InnerApp() {
  const themeContext = useContext(ThemeContext);
  const themeMode = themeContext ? themeContext[0].themeName! : "light";

  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) { tg.ready(); tg.expand(); }

      const startParam =
        tg?.initDataUnsafe?.start_param ||
        new URLSearchParams(window.location.search).get("startapp") ||
        undefined;

      const { storeId, referrerWallet } = parseStartParam(startParam);

      if (referrerWallet) {
        sessionStorage.setItem("ton_eats_referrer", referrerWallet);
      }
      if (storeId) {
        sessionStorage.setItem("ton_eats_store_id", storeId);
      }
    } catch (e) {
      console.warn("[TON-Eats] Could not initialise Telegram WebApp:", e);
    }
  }, []);

  return (
    <StyledThemeProvider
      theme={{
        bgColor: themeMode === "light" ? "#f7f7f7" : "#1a1a2e",
        textColor: themeMode === "light" ? "#1a1a1a" : "#f0f0f0",
        buttonColor: "#FF6B35",
        buttonText: "#ffffff",
        darkBgColor: "#1a1a2e",
        darkTextColor: "#f0f0f0",
      }}
    >
      <AppContainer className={`app ${themeMode}`}>
        <Routes>
          <Route path="/" element={<RootRouter />} />
          {/* ── Customer App ── */}
          <Route path="/explore" element={<DiscoveryPage />} />
          <Route path="/store/:storeId" element={<Shop />} />
          <Route path="/track/:orderId" element={<TrackPage />} />
          {/* ── Courier App ── */}
          <Route path="/courier" element={<CourierDashboard />} />
          {/* ── Merchant App ── */}
          <Route path="/merchant/onboard" element={<MerchantOnboarding />} />
          {/* ── User Orders ── */}
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/order-history" element={<OrderHistoryPage />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppContainer>
    </StyledThemeProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <InnerApp />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
