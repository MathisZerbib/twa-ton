/**
 * TON-Eats Shop.tsx  – Buyer View
 *
 * Route: /store/:storeId
 *
 * Shows restaurant header info, product grid by category,
 * sticky cart bar, and opens the checkout drawer.
 */

import React, { useState, useMemo, useEffect, lazy, Suspense } from "react";
import styled, { keyframes } from "styled-components";
import LoadingAnimation from "../components/LoadingAnimation";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMotorcycle,
  faShoppingBag,
  faStar,
  faClock,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

import { AppContainer, FlexBoxCol, Button } from "../components/styled/styled";
import ProductsList from "../components/ProductsList";
import Header from "../components/Header";
import { useCart } from "../providers/CartProvider";
import { useCurrency } from "../providers/useCurrency";

import { api } from "../services/api";

const CheckoutPage = lazy(() => import("./CheckoutPage"));
const AdminRescuePanel = lazy(() => import("../components/AdminRescuePanel"));

// ─── Animations ──────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ─── Styled ───────────────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  background: var(--bg-primary);
  min-height: 100vh;
  padding-bottom: 110px;
  transition: background var(--transition-base);
`;

const HeroBanner = styled.div<{ $src: string }>`
  position: relative;
  width: 100%;
  height: 280px;
  background-image: url(${p => p.$src});
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
  padding: 24px;
`;

const HeroOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%);
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  color: #fff;
  animation: ${fadeUp} 0.8s cubic-bezier(0.23, 1, 0.32, 1);
  width: 100%;
`;

const RestaurantName = styled.h1`
  /* Responsive font sizing: 2.0rem on mobile, 2.6rem on tablet+ */
  font-size: clamp(1.8rem, 8vw, 2.6rem);
  font-weight: 900;
  margin: 0 0 12px;
  letter-spacing: -0.04em;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);

  @media (max-width: 320px) {
    font-size: 1.6rem;
  }
`;

const RestaurantMeta = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 0.9rem;
  font-weight: 700;
`;

const MetaChip = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.12);
  border-radius: 12px;
  padding: 6px 14px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.15);
  color: #fff;
`;

const BackBtn = styled.button`
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 10;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  transition: all var(--transition-fast);
  
  /* Adjust positioning for very small screens */
  @media (max-width: 320px) {
    top: 16px;
    left: 12px;
  }
  
  &:active {
    transform: scale(0.9);
  }
`;

const ContentSection = styled.div`
  padding: 24px 16px;
  max-width: 1360px;
  margin: 0 auto;
  animation: ${fadeUp} 0.6s cubic-bezier(0.23, 1, 0.32, 1) 0.1s both;

  /* Full width on mobile */
  @media (max-width: 480px) {
    padding: 16px 12px;
  }

  /* Better padding on larger screens */
  @media (min-width: 768px) {
    padding: 28px 20px;
  }
`;

const PromoBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: var(--accent-soft);
  border: 1px solid hsla(var(--hue-brand), var(--sat-brand), var(--light-brand), 0.25);
  color: var(--accent-dark);
  font-weight: 800;
  font-size: 0.75rem;
  padding: 10px 16px;
  border-radius: 12px;
  margin-bottom: 24px;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  body.dark &,
  :root[data-theme='dark'] & {
    color: var(--accent);
  }
`;

import { SkeletonCard, SkeletonLine, SkeletonBase } from "../components/Skeleton";
import StickyBottomBar from "../components/StickyBottomBar/StickyBottomBar";

const SkeletonHero = styled(SkeletonBase)`
  width: 100%;
  height: 280px;
  border-radius: 0;
`;

const SkeletonContent = styled.div`
  padding: 24px 16px;
  max-width: 1360px;
  margin: 0 auto;
  width: 100%;

  /* Full width on mobile */
  @media (max-width: 480px) {
    padding: 16px 12px;
  }

  /* Better padding on larger screens */
  @media (min-width: 768px) {
    padding: 28px 20px;
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────

const Shop: React.FC = () => {
  const { storeId = "1" } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { totalPrice, cartItems } = useCart();
  const { selectedCurrency } = useCurrency();
  const [openCheckout, setOpenCheckout] = useState(false);
  const [showAdminTools, setShowAdminTools] = useState(false);

  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rate, setRate] = useState(6.0);

  // 1. Load initial merchant data
  useEffect(() => {
    async function loadMerchant() {
      try {
        setLoading(true);
        // Simulate slightly longer load for skeletal effect
        const [merchantData, rateData] = await Promise.all([
          api.getMerchant(storeId),
          api.getTonUsdRate(),
        ]);
        setStore(merchantData);
        if (rateData.priceUsd) setRate(rateData.priceUsd);
      } catch (err) {
        console.error("Failed to load merchant:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMerchant();
  }, [storeId]);

  // 2. Compute mapped products whenever currency or rate changes
  const mappedProducts = useMemo(() => {
    if (!store?.products) return [];
    return store.products.map((p: any) => ({
      ...p,
      price: selectedCurrency === "TON"
        ? parseFloat((p.priceUsdt / rate).toFixed(3))
        : p.priceUsdt
    }));
  }, [store, selectedCurrency, rate]);

  if (loading) {
    return (
      <PageWrapper>
        <Header />
        <SkeletonHero />
        <SkeletonContent>
          <SkeletonLine $width="60%" $height="32px" style={{ marginBottom: 20 }} />
          <SkeletonLine $width="40%" $height="20px" style={{ marginBottom: 40 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </SkeletonContent>
      </PageWrapper>
    );
  }

  if (!store) {
    return (
      <PageWrapper>
        <Header />
        <div style={{ 
          padding: "100px 20px", 
          textAlign: 'center', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 24 
        }}>
          <div style={{ fontSize: "5rem", filter: "grayscale(1) opacity(0.5)" }}>🍱</div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 900, letterSpacing: "-0.04em" }}>Store Not Found</h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: 300, lineHeight: 1.6, fontWeight: 500 }}>
            Sorry, this restaurant is no longer available. Explore other options nearby.
          </p>
          <Button onClick={() => navigate("/")} style={{ padding: "16px 32px" }}>Back to Explore</Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Header showConnectButton={true} />
      <ToastContainer position="top-center" autoClose={2500} />

      {/* ── Hero ── */}
      <HeroBanner $src={store.bannerUrl}>
        <BackBtn onClick={() => navigate("/")} aria-label="Go back">
          <FontAwesomeIcon icon={faArrowLeft} />
        </BackBtn>
        <HeroOverlay />
        <HeroContent>
          <RestaurantName>{store.name}</RestaurantName>
          <RestaurantMeta>
            <MetaChip>
              <FontAwesomeIcon icon={faStar} style={{ color: "#FFD23F" }} />
              {store.rating}
            </MetaChip>
            <MetaChip>
              <FontAwesomeIcon icon={faClock} style={{ opacity: 0.7 }} />
              {store.deliveryTime}
            </MetaChip>
            <MetaChip>
              <FontAwesomeIcon icon={faMotorcycle} style={{ opacity: 0.7 }} />
              {selectedCurrency === "TON" ? "0.2 TON" : "$1.20"} delivery
            </MetaChip>
          </RestaurantMeta>
        </HeroContent>
      </HeroBanner>

      {/* ── Content ── */}
      <ContentSection>
        <PromoBadge>
          🎉 0% Commission Restaurant · Powered by TON Blockchain
        </PromoBadge>
        <AppContainer>
          <FlexBoxCol>
            <ProductsList products={mappedProducts} />
          </FlexBoxCol>

          {/* Admin rescue button (Distilled) */}
          <div style={{ marginTop: 100, padding: "32px 0", borderTop: "1px solid var(--bg-tertiary)", opacity: 0.5, textAlign: 'center' }}>
            <FlexBoxCol style={{ alignItems: "center", gap: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: "var(--text-hint)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Infrastructure Management</p>
              <button
                onClick={() => setShowAdminTools((v) => !v)}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 14,
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {showAdminTools ? "Hide Admin Tools" : "Show Admin Tools"}
              </button>
              {showAdminTools && (
                <Suspense fallback={<div style={{ color: "var(--text-hint)", fontSize: 12 }}>Loading admin tools...</div>}>
                  <AdminRescuePanel />
                </Suspense>
              )}
            </FlexBoxCol>
          </div>
        </AppContainer>
      </ContentSection>

      {/* ── Checkout Drawer ── */}
      {openCheckout && (
        <Suspense fallback={null}>
          <CheckoutPage
            open={openCheckout}
            onClose={() => setOpenCheckout(false)}
            storeId={storeId}
          />
        </Suspense>
      )}

      {/* ── Sticky Cart Bar ── */}
      <StickyBottomBar 
        totalPrice={totalPrice}
        selectedCurrency={selectedCurrency}
        showCheckout={() => {
          const tg = (window as any).Telegram?.WebApp;
          if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
          setOpenCheckout(true);
        }}
      />
    </PageWrapper>
  );
};

export default Shop;
