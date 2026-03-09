/**
 * TON-Eats Shop.tsx  – Buyer View
 *
 * Route: /store/:storeId
 *
 * Shows restaurant header info, product grid by category,
 * sticky cart bar, and opens the checkout drawer.
 */

import React, { useState, useMemo, useEffect } from "react";
import styled, { keyframes } from "styled-components";
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

import { AppContainer, FlexBoxCol } from "../components/styled/styled";
import ProductsList from "../components/ProductsList";
import Header from "../components/Header";
import CheckoutPage from "./CheckoutPage";
import { useCart } from "../providers/CartProvider";
import { useTONEatsEscrow } from "../hooks/useTONEatsEscrow";
import { useCurrency } from "../providers/useCurrency";

import { api } from "../services/api";

// ─── Animations ──────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ─── Styled ───────────────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  background: var(--tg-theme-bg-color, #f7f7f7);
  min-height: 100vh;
  padding-bottom: 110px;
`;

const HeroBanner = styled.div<{ $src: string }>`
  position: relative;
  width: 100%;
  height: 240px;
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
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%);
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  color: #fff;
  animation: ${fadeUp} 0.8s cubic-bezier(0.23, 1, 0.32, 1);
  width: 100%;
`;

const RestaurantName = styled.h1`
  font-size: 2.2rem;
  font-weight: 900;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
`;

const RestaurantMeta = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.9rem;
  font-weight: 700;
`;

const MetaChip = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.15);
  border-radius: 12px;
  padding: 5px 12px;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.2);
`;

const BackBtn = styled.button`
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 10;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(255,255,255,0.95);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  color: #1a1a1a;
  transition: all 0.2s;
  &:active { transform: scale(0.9); }
`;

const ContentSection = styled.div`
  padding: 20px 16px;
  animation: ${fadeUp} 0.6s cubic-bezier(0.23, 1, 0.32, 1) 0.1s both;
`;

const PromoBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #fdf2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-weight: 800;
  font-size: 0.75rem;
  padding: 8px 14px;
  border-radius: 10px;
  margin-bottom: 24px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// ─── Sticky Cart Bar ──────────────────────────────────────────────────────────

const StickyCartBar = styled.div<{ visible: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 16px;
  padding-bottom: env(safe-area-inset-bottom, 16px);
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0,0,0,0.05);
  transform: translateY(${(p) => (p.visible ? "0" : "100%") + "px"});
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 -8px 32px rgba(0,0,0,0.08);
`;

const CartBtn = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px 18px 24px;
  background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
  color: #fff;
  border: none;
  border-radius: 18px;
  font-size: 1.05rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  transition: all 0.2s;

  &:hover {
    background: #FF6B35;
    box-shadow: 0 10px 30px rgba(255, 107, 53, 0.4);
  }

  &:active { transform: scale(0.98); }
`;

const CartBadge = styled.span`
  background: rgba(255,255,255,0.2);
  border-radius: 10px;
  padding: 4px 12px;
  font-size: 0.9rem;
`;

// ─── Component ────────────────────────────────────────────────────────────────

const Shop: React.FC = () => {
  const { storeId = "1" } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { totalPrice, cartItems } = useCart();
  const { selectedCurrency } = useCurrency();
  const [openCheckout, setOpenCheckout] = useState(false);
  const { withdrawAll, contractAddress } = useTONEatsEscrow();

  const [store, setStore] = useState<any>(null);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [merchantData, rateData] = await Promise.all([
          api.getMerchant(storeId),
          api.getTonUsdRate()
        ]);

        setStore(merchantData);

        const rate = rateData.priceUsd || 6;
        const productsMapped = (merchantData.products || []).map((p: any) => ({
          ...p,
          price: selectedCurrency === "TON"
            ? parseFloat((p.priceUsdt / rate).toFixed(2))
            : p.priceUsdt
        }));

        setFilteredProducts(productsMapped);
      } catch (err) {
        console.error("Failed to load merchant:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [storeId, selectedCurrency]);

  const cartCount = cartItems.length;

  if (loading) return <PageWrapper><div style={{ padding: 40, textAlign: 'center' }}>Loading store...</div></PageWrapper>;
  if (!store) return <PageWrapper><div style={{ padding: 40, textAlign: 'center' }}>Store not found</div></PageWrapper>;

  return (
    <PageWrapper>
      <Header showConnectButton={true} />
      <ToastContainer position="top-center" autoClose={2500} />

      {/* ── Hero ── */}
      <HeroBanner $src={store.bannerUrl}>
        <BackBtn onClick={() => navigate("/")}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </BackBtn>
        <HeroOverlay />
        <HeroContent>
          <RestaurantName>{store.name}</RestaurantName>
          <RestaurantMeta>
            <MetaChip>
              <FontAwesomeIcon icon={faStar} />
              {store.rating}
            </MetaChip>
            <MetaChip>
              <FontAwesomeIcon icon={faClock} />
              {store.deliveryTime}
            </MetaChip>
            <MetaChip>
              <FontAwesomeIcon icon={faMotorcycle} />
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
            <ProductsList products={filteredProducts} />
          </FlexBoxCol>

          {/* Admin rescue button */}
          <div style={{ marginTop: 60, textAlign: 'center', opacity: 0.5 }}>
            <p style={{ fontSize: 10, margin: '0 0 10px' }}>Admin Protocol Controls</p>
            <button
              onClick={withdrawAll}
              style={{
                background: 'transparent',
                border: '1px solid #ccc',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Withdraw Safe Escrow Funds (Treasury Only)
            </button>
            <p style={{ fontSize: 9, marginTop: 4 }}>Contract: {contractAddress}</p>
          </div>
        </AppContainer>
      </ContentSection>

      {/* ── Checkout Drawer ── */}
      <CheckoutPage
        open={openCheckout}
        onClose={() => setOpenCheckout(false)}
        storeId={storeId}
      />

      {/* ── Sticky Cart Bar ── */}
      <StickyCartBar visible={cartCount > 0}>
        <CartBtn id="open-cart-btn" onClick={() => setOpenCheckout(true)}>
          <span>
            <FontAwesomeIcon icon={faShoppingBag} style={{ marginRight: 8 }} />
            View Cart ({cartCount} item{cartCount !== 1 ? "s" : ""})
          </span>
          <CartBadge>{totalPrice.toFixed(2)} {selectedCurrency}</CartBadge>
        </CartBtn>
      </StickyCartBar>
    </PageWrapper>
  );
};

export default Shop;
