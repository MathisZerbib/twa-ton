/**
 * TON-Eats CheckoutPage.tsx
 *
 * Redesigned checkout drawer:
 * - Shows cart items
 * - Shows 3-line price breakdown: Food Total / Delivery Fee / Protocol Fee
 * - Requires map pin selection before Pay button enables
 * - Triggers createOrder() on the escrow smart contract
 * - Shows viral share UI after success
 */

import { useState, useEffect, lazy, Suspense } from "react";
import styled, { keyframes, css } from "styled-components";
import { useCart } from "../providers/CartProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClose,
  faMapMarkerAlt,
  faMotorcycle,
  faCheckCircle,
  faShieldHalved,
  faSpinner,
  faGift,
} from "@fortawesome/free-solid-svg-icons";
import { SwipeableDrawer, IconButton } from "@mui/material";
import CartItem from "../components/CartItem";
import {
  useTONEatsEscrow,
  DELIVERY_FEE_TON,
  PROTOCOL_FEE_TON,
  REFERRER_CASHBACK_PERCENT,
} from "../hooks/useTONEatsEscrow";
import { useTonConnect } from "../hooks/useTonConnect";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useCurrency } from "../providers/useCurrency";

// ─── Default merchant address (fallback) ─────────────────────────────────────
const DEFAULT_MERCHANT = "EQBPEDbGdwaLv1DKntg9r6SjFIVplSaSJoJ-TVLe_2rqBOmH";
const LazyMapWithGeocoder = lazy(() => import("../components/MapWithGeocoder"));

// Simple Haversine distance in km
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─── Animations ──────────────────────────────────────────────────────────────
const fadeIn = keyframes`from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); }`;
const spin = keyframes`to { transform: rotate(360deg); }`;
const scaleIn = keyframes`from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); }`;

// ─── Styled ───────────────────────────────────────────────────────────────────

const DrawerContent = styled.div`
  background: var(--bg-primary);
  /* Responsive heights: 50vh min on mobile, scale to 95vh max */
  min-height: 50vh;
  max-height: 95vh;
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 28px 28px 0 0;
  display: flex;
  flex-direction: column;
  transition: background var(--transition-base);

  /* Adjust for very small screens */
  @media (max-height: 600px) {
    min-height: 80vh;
    max-height: 100vh;
  }

  /* Better spacing on larger screens */
  @media (min-height: 900px) {
    min-height: 60vh;
    max-height: 90vh;
  }
`;

const DrawerHandle = styled.div`
  width: 44px; height: 5px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  margin: 12px auto 0;
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--bg-tertiary);
`;

const DrawerTitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 900;
  margin: 0;
  color: var(--text-primary);
  letter-spacing: -0.02em;
`;

const Section = styled.div`
  padding: 20px;
  animation: ${fadeIn} 0.5s var(--transition-smooth) both;
  content-visibility: auto;
  contain-intrinsic-size: 1px 320px;
`;

const SectionLabel = styled.p`
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-hint);
  margin: 0 0 12px;
`;

// ── Price Breakdown ──────────────────────────────────────────────────────────

const PriceBox = styled.div`
  background: var(--bg-secondary);
  border: 1px solid var(--bg-tertiary);
  border-radius: 20px;
  padding: 20px;
  margin: 4px 20px 0;
  animation: ${fadeIn} 0.5s var(--transition-smooth) 0.1s both;
  box-shadow: var(--shadow-sm);
`;

const PriceLine = styled.div<{ bold?: boolean; accent?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: ${(p) => (p.bold ? "1.1rem" : "0.95rem")};
  font-weight: ${(p) => (p.bold ? "900" : "600")};
  color: ${(p) =>
    p.accent ? "var(--accent)" : "var(--text-primary)"};
  border-top: ${(p) => (p.bold ? "1px solid var(--bg-tertiary)" : "none")};
  margin-top: ${(p) => (p.bold ? "12px" : "0")};
  padding-top: ${(p) => (p.bold ? "16px" : "6px")};
`;

const PriceTag = styled.span`
  font-family: 'SF Mono', 'Fira Mono', monospace;
  letter-spacing: -0.02em;
`;

const InfoChip = styled.span`
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--text-hint);
  background: var(--bg-tertiary);
  border-radius: 6px;
  padding: 2px 8px;
  margin-left: 8px;
  text-transform: uppercase;
`;

// ── Map Section ───────────────────────────────────────────────────────────────

const MapCard = styled.div<{ $selected: boolean }>`
  margin: 0;
  border-radius: 20px;
  overflow: hidden;
  border: 2px solid ${(p) =>
    p.$selected ? "var(--accent)" : "var(--bg-tertiary)"};
  transition: all var(--transition-base);
  box-shadow: ${(p) => (p.$selected ? "var(--shadow-md)" : "none")};
`;

const MapPlaceholder = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px 20px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: var(--bg-tertiary); }
`;

const MapPinLabel = styled.div`
  margin: 12px 0 0;
  font-size: 0.88rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
`;

const ValidationError = styled.div`
  padding: 12px 16px;
  margin: 12px 20px 0;
  border-radius: var(--btn-radius);
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
  border: 1px solid var(--error);
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: ${fadeIn} 0.2s ease-in;
  
  svg {
    flex-shrink: 0;
  }
`;

// ── Pay Button ────────────────────────────────────────────────────────────────

const PayBtn = styled.button<{ disabled: boolean }>`
  margin: 24px 20px 0;
  width: calc(100% - 40px);
  padding: 20px;
  border-radius: 20px;
  border: none;
  font-size: 1.1rem;
  font-weight: 900;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  background: ${(p) =>
    p.disabled
      ? "var(--bg-tertiary)"
      : "var(--accent)"};
  color: ${(p) => (p.disabled ? "var(--text-hint)" : "#fff")};
  box-shadow: ${(p) =>
    p.disabled ? "none" : "0 10px 24px hsla(var(--hue-brand), var(--sat-brand), var(--light-brand), 0.3)"};
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  animation: ${fadeIn} 0.5s var(--transition-smooth) 0.2s both;

  &:active:not(:disabled) {
    transform: scale(0.97);
  }
`;

const SpinIcon = styled(FontAwesomeIcon)`
  animation: ${spin} 1s linear infinite;
`;

const WalletApprovalHint = styled.p`
  margin: 10px 24px 0;
  font-size: 0.78rem;
  line-height: 1.45;
  color: var(--text-hint);
  text-align: center;
`;

// ── Success Panel ─────────────────────────────────────────────────────────────

const SuccessPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  text-align: center;
  animation: ${scaleIn} 0.6s var(--transition-smooth) both;
  gap: 16px;
`;

const SuccessIcon = styled.div`
  font-size: 4.5rem;
  color: var(--success);
  filter: drop-shadow(0 10px 20px rgba(16,185,129,0.2));
`;

const SuccessTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0;
  color: var(--text-primary);
  letter-spacing: -0.04em;
`;

const SuccessDesc = styled.p`
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  max-width: 300px;
  font-weight: 500;
`;

// ── ReferralBanner (for users who arrived via a referral link) ────────────
const ReferralBanner = styled.div`
  margin: 0 20px 8px;
  background: hsla(122, 39%, 49%, 0.1);
  border: 1px solid hsla(122, 39%, 49%, 0.2);
  border-radius: 16px;
  padding: 12px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: ${fadeIn} 0.5s var(--transition-smooth);
`;
const ReferralBannerText = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: var(--success);
  line-height: 1.5;
  font-weight: 600;
  strong { color: var(--success-dark); font-weight: 800; }
`;

// ─── Empty Cart ───────────────────────────────────────────────────────────────

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  color: var(--text-hint);
  gap: 16px;
  font-size: 1rem;
  text-align: center;
  font-weight: 600;
`;

// ─── Map Drawer ───────────────────────────────────────────────────────────────

const MapDrawerContent = styled.div`
  /* Responsive map drawer height: 70% of viewport on mobile, 75% on larger screens */
  height: clamp(60vh, 75vh, 85vh);
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);

  @media (max-width: 480px) {
    height: 70vh;
  }
`;

const MapDrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid var(--bg-tertiary);
`;

const ConfirmAddrBtn = styled.button`
  padding: 12px 24px;
  min-height: 44px;
  border-radius: 14px;
  border: none;
  background: var(--accent);
  color: #fff;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 12px hsla(var(--hue-brand), var(--sat-brand), var(--light-brand), 0.3);
  transition: all var(--transition-fast);
  font-size: 1rem;
  
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  
  &:active:not(:disabled) {
    transform: scale(0.95);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  @media (prefers-reduced-motion: reduce) {
    &:active:not(:disabled) {
      transform: none;
    }
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────

interface CheckoutPageProps {
  open: boolean;
  onClose: () => void;
  storeId?: string;
}

type CheckoutState = "cart" | "paying" | "success";

function CheckoutPage({ open, onClose, storeId = "1" }: CheckoutPageProps) {
  const { cartItems, totalPrice, removeItem } = useCart();
  const { connected, wallet } = useTonConnect();
  const { createOrder, ready: contractReady } = useTONEatsEscrow();
  const { selectedCurrency } = useCurrency();
  const [rate, setRate] = useState(6.0); // Fallback rate

  useEffect(() => {
    api.getTonUsdRate().then((data) => {
      if (data.priceUsd) setRate(data.priceUsd);
    }).catch(console.error);
  }, []);

  const [selectedAddress, setSelectedAddress] = useState("");
  const [mapDrawerOpen, setMapDrawerOpen] = useState(false);
  const [pendingAddress, setPendingAddress] = useState("");
  const [pendingLat, setPendingLat] = useState<number | undefined>(undefined);
  const [pendingLng, setPendingLng] = useState<number | undefined>(undefined);
  const [state, setState] = useState<CheckoutState>("cart");
  const [eta, setEta] = useState<string>("20-30 min");
  const [store, setStore] = useState<any>(null);

  useEffect(() => {
    api.getMerchant(storeId).then(setStore).catch(console.error);
  }, [storeId]);

  const deliveryFee = selectedCurrency === "TON" ? DELIVERY_FEE_TON : (DELIVERY_FEE_TON * rate);
  const protocolFee = selectedCurrency === "TON" ? PROTOCOL_FEE_TON : (PROTOCOL_FEE_TON * rate);
  const foodTotal = totalPrice; // Already converted by CartProvider
  const grandTotal = foodTotal + deliveryFee + protocolFee;

  const foodTotalTon = selectedCurrency === "TON" ? foodTotal : (foodTotal / rate);

  const referrerWallet = sessionStorage.getItem("ton_eats_referrer") ?? undefined;
  const referrerCashback = (protocolFee * REFERRER_CASHBACK_PERCENT).toFixed(selectedCurrency === "TON" ? 3 : 2);

  const canPay =
    cartItems.length > 0 &&
    selectedAddress.length > 0 &&
    connected &&
    contractReady &&
    state === "cart";

  const navigate = useNavigate();

  const handlePay = async () => {
    if (!canPay || !wallet || !store) return;
    setState("paying");
    try {
      const merchantAddr = store.merchantWallet || DEFAULT_MERCHANT;
      // Generate a deterministic orderId to use for both Escrow chain and backend API
      const orderId = String(Date.now());
      // 1. Sign on-chain escrow tx, this will now await the on-chain confirmation (which includes the balance checks as well)
      await createOrder(orderId, foodTotalTon, merchantAddr, referrerWallet);
      // 2. Register order in backend → broadcasts to courier feed
      await api.createOrder({
        storeId,
        orderId,
        buyerWallet: wallet,
        merchantWallet: merchantAddr,
        deliveryAddress: selectedAddress,
        deliveryLat: pendingLat ?? null,
        deliveryLng: pendingLng ?? null,
        storeLat: store?.lat ?? null,
        storeLng: store?.lng ?? null,
        items: cartItems.map((i: any) => {
          const product = store.products?.find((p: any) => p.id === i.id);
          return {
            name: product?.name || i.id,
            qty: i.quantity ?? 1,
            priceUsdt: i.priceUsdt,
            priceTon: i.priceUsdt / rate
          };
        }),
        foodTotalTon: foodTotal,
        deliveryFeeTon: deliveryFee,
        protocolFeeTon: protocolFee,
        referrerWallet: referrerWallet ?? null,
      }).catch(e => console.warn("[CheckoutPage] Backend registration failed:", e));
      // 3. Navigate to live tracking page
      setState("success");
      setTimeout(() => {
        onClose();
        navigate(`/track/${orderId}`);
      }, 1800);
    } catch (err) {
      console.error("[TON-Eats] Order failed:", err);
      setState("cart");
    }
  };



  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => { setState("cart"); }, 400);
    }
  }, [open]);

  return (
    <>
      {/* ── Main Checkout Drawer ── */}
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        onOpen={() => { }}
        PaperProps={{ style: { borderRadius: "28px 28px 0 0", background: "transparent" } }}
        disableSwipeToOpen
        aria-labelledby="checkout-title"
      >
        <DrawerContent role="dialog" aria-label="Review order form">
          <DrawerHandle />

          {/* Header */}
          <DrawerHeader>
            <DrawerTitle id="checkout-title">
              {state === "success" ? "Order confirmed" : "Review Your Order"}
            </DrawerTitle>
            <IconButton
              onClick={onClose}
              size="small"
              aria-label="Close checkout"
              title="Close checkout form"
            >
              <FontAwesomeIcon icon={faClose} />
            </IconButton>
          </DrawerHeader>

          {/* ── SUCCESS STATE ── */}
          {state === "success" && (
            <SuccessPanel>
              <SuccessIcon>
                <FontAwesomeIcon icon={faCheckCircle} />
              </SuccessIcon>
              <SuccessTitle>Payment secured</SuccessTitle>
              <SuccessDesc>
                Your <strong>{grandTotal.toFixed(selectedCurrency === "TON" ? 3 : 2)} {selectedCurrency}</strong> is secured on-chain.
                Taking you to live tracking...
              </SuccessDesc>
            </SuccessPanel>
          )}

          {/* ── CART / PAYING STATE ── */}
          {state !== "success" && (
            <>
              {/* Cart Items */}
              <Section>
                <SectionLabel>Items</SectionLabel>
                {cartItems.length === 0 ? (
                  <EmptyState>
                    <span style={{ fontSize: "3rem" }}>🛒</span>
                    <span>Your cart is empty.<br />Add items to review your order.</span>
                  </EmptyState>
                ) : (
                  cartItems.map((item) => (
                    <CartItem key={item.id} item={item} onRemoveItem={removeItem} />
                  ))
                )}
              </Section>

              {cartItems.length > 0 && (
                <>
                  {/* Referral discount notice for arriving buyers */}
                  {referrerWallet && (
                    <ReferralBanner>
                      <FontAwesomeIcon icon={faGift} style={{ color: '#6ee7a0', flexShrink: 0 }} />
                      <ReferralBannerText>
                        <strong>Friend referral applied.</strong> Your friend earns cashback after this order is delivered.
                      </ReferralBannerText>
                    </ReferralBanner>
                  )}

                  {/* Price Breakdown */}
                  <SectionLabel style={{ padding: "0 20px" }}>Order Summary</SectionLabel>
                  <PriceBox>
                    <PriceLine>
                      <span>Food subtotal</span>
                      <PriceTag>{foodTotal.toFixed(selectedCurrency === "TON" ? 3 : 2)} {selectedCurrency}</PriceTag>
                    </PriceLine>
                    <PriceLine>
                      <span>
                        Delivery fee
                        <InfoChip>goes to courier</InfoChip>
                      </span>
                      <PriceTag>{deliveryFee.toFixed(selectedCurrency === "TON" ? 3 : 2)} {selectedCurrency}</PriceTag>
                    </PriceLine>
                    <PriceLine>
                      <span>
                        <FontAwesomeIcon icon={faShieldHalved} style={{ color: "#FF6B35", marginRight: 4 }} />
                        Blockchain security fee
                        <InfoChip>smart contract costs</InfoChip>
                      </span>
                      <PriceTag>{protocolFee.toFixed(selectedCurrency === "TON" ? 3 : 2)} {selectedCurrency}</PriceTag>
                    </PriceLine>
                    {referrerWallet && (
                      <PriceLine accent>
                        <span>🎁 Referrer Cashback</span>
                        <PriceTag>−{referrerCashback} {selectedCurrency}</PriceTag>
                      </PriceLine>
                    )}
                    <PriceLine bold>
                      <span>Total (secured in escrow)</span>
                      <PriceTag>{grandTotal.toFixed(selectedCurrency === "TON" ? 3 : 2)} {selectedCurrency}</PriceTag>
                    </PriceLine>
                  </PriceBox>

                  {/* Delivery Address */}
                  <Section>
                    <SectionLabel>Delivery Address</SectionLabel>
                    <MapCard $selected={selectedAddress.length > 0}>
                      <MapPlaceholder
                        id="select-address-btn"
                        onClick={() => setMapDrawerOpen(true)}
                        aria-invalid={cartItems.length > 0 && !selectedAddress}
                        aria-describedby="address-validation"
                        aria-label="Select delivery address on map"
                      >
                        <FontAwesomeIcon
                          icon={faMapMarkerAlt}
                          style={{ color: selectedAddress ? "#FF6B35" : "#aaa" }}
                        />
                        {selectedAddress || "Select your delivery address"}
                      </MapPlaceholder>
                    </MapCard>
                    {selectedAddress && (
                      <MapPinLabel>
                        <FontAwesomeIcon icon={faCheckCircle} style={{ color: "#4caf50" }} />
                        {selectedAddress} (Estimated arrival: {eta})
                      </MapPinLabel>
                    )}
                  </Section>

                  {/* Validation Errors */}
                  {cartItems.length > 0 && !selectedAddress && (
                    <ValidationError role="alert" aria-live="polite">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      <span>Please select your delivery address to continue</span>
                    </ValidationError>
                  )}

                  {cartItems.length > 0 && !connected && (
                    <ValidationError role="alert" aria-live="polite">
                      <FontAwesomeIcon icon={faShieldHalved} />
                      <span>Connect your wallet to continue</span>
                    </ValidationError>
                  )}

                  {/* Pay Button */}
                  <PayBtn
                    id="pay-with-ton-btn"
                    disabled={!canPay}
                    onClick={handlePay}
                    aria-disabled={!canPay}
                    aria-label={
                      state === "paying"
                        ? "Locking funds in escrow"
                        : !connected
                          ? "Connect wallet to continue"
                          : !selectedAddress
                            ? "Select delivery address to continue"
                            : `Pay ${grandTotal.toFixed(selectedCurrency === "TON" ? 3 : 2)} ${selectedCurrency} and place order`
                    }
                  >
                    {state === "paying" ? (
                      <>
                        <SpinIcon icon={faSpinner} />
                        Waiting for TON wallet confirmation…
                      </>
                    ) : !connected ? (
                      "Connect wallet to continue"
                    ) : !selectedAddress ? (
                      <>
                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                        Select delivery address to continue
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faMotorcycle} />
                        Pay {grandTotal.toFixed(selectedCurrency === "TON" ? 3 : 2)} {selectedCurrency} · Place Order
                      </>
                    )}
                  </PayBtn>

                  {connected && selectedAddress && state === "cart" && (
                    <WalletApprovalHint>
                      After tapping Place Order, approve the transaction in your TON wallet app on mobile.
                    </WalletApprovalHint>
                  )}

                  {state === "paying" && (
                    <WalletApprovalHint aria-live="polite">
                      Check your phone and validate this transaction in the TON app to complete your order.
                    </WalletApprovalHint>
                  )}

                  <Section style={{ paddingTop: 12 }}>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-hint)", textAlign: "center", lineHeight: 1.5, margin: 0 }}>
                      Funds are secured in a TON smart contract and released only after delivery confirmation.
                      Restaurants keep 100% of each order.
                    </p>
                  </Section>
                </>
              )}
            </>
          )}
        </DrawerContent>
      </SwipeableDrawer>

      {/* ── Map Selection Drawer ── */}
      <SwipeableDrawer
        anchor="bottom"
        open={mapDrawerOpen}
        onClose={() => setMapDrawerOpen(false)}
        onOpen={() => { }}
        PaperProps={{ style: { borderRadius: "28px 28px 0 0" } }}
      >
        <MapDrawerContent>
          <MapDrawerHeader>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>
              <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: "#FF6B35", marginRight: 8 }} />
              Confirm Delivery Address
            </h3>
            <ConfirmAddrBtn
              id="confirm-address-btn"
              onClick={() => {
                const tg = (window as any).Telegram?.WebApp;
                if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");
                
                if (pendingAddress) setSelectedAddress(pendingAddress);
                if (pendingLat && pendingLng && store && store.lat && store.lng) {
                  const dist = getDistanceFromLatLonInKm(pendingLat, pendingLng, store.lat, store.lng);
                  // Base prep time 15m + 5 mins per km
                  const estimatedMins = Math.round(15 + dist * 5);
                  setEta(`${estimatedMins}-${estimatedMins + 10} min`);
                }
                setMapDrawerOpen(false);
              }}
            >
              Use this address
            </ConfirmAddrBtn>
          </MapDrawerHeader>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <Suspense fallback={<div style={{ padding: 16, color: "var(--text-hint)" }}>Loading map...</div>}>
              <LazyMapWithGeocoder
                onSelectedAddress={(addr: string, lat?: number, lng?: number) => {
                  setPendingAddress(addr);
                  setPendingLat(lat);
                  setPendingLng(lng);
                }}
              />
            </Suspense>
          </div>
        </MapDrawerContent>
      </SwipeableDrawer>
    </>
  );
}

export default CheckoutPage;
