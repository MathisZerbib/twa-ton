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

import { useState, useEffect } from "react";
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
import MapWithGeocoder from "../components/MapWithGeocoder";
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
const BOT_NAME = import.meta.env.VITE_BOT_NAME ?? "YourTONEatsBot";

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
const pulse = keyframes`0%,100%{opacity:1} 50%{opacity:0.5}`;
const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;
const floatUp = keyframes`
  0%,100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
`;
const scaleIn = keyframes`from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); }`;

// ─── Styled ───────────────────────────────────────────────────────────────────

const DrawerContent = styled.div`
  background: var(--tg-theme-bg-color, #fff);
  min-height: 60vh;
  max-height: 95vh;
  overflow-y: auto;
  border-radius: 28px 28px 0 0;
  display: flex;
  flex-direction: column;
`;

const DrawerHandle = styled.div`
  width: 40px; height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  margin: 12px auto 0;
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 8px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
`;

const DrawerTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0;
  color: var(--tg-theme-text-color, #1a1a1a);
`;

const Section = styled.div`
  padding: 16px 20px;
  animation: ${fadeIn} 0.4s ease both;
`;

const SectionLabel = styled.p`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #999;
  margin: 0 0 10px;
`;

// ── Price Breakdown ──────────────────────────────────────────────────────────

const PriceBox = styled.div`
  background: linear-gradient(135deg, #fff8f5, #fff3ee);
  border: 1px solid rgba(255,107,53,0.15);
  border-radius: 16px;
  padding: 16px;
  margin: 4px 20px 0;
  animation: ${fadeIn} 0.4s ease 0.1s both;
`;

const PriceLine = styled.div<{ bold?: boolean; accent?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  font-size: ${(p) => (p.bold ? "1rem" : "0.9rem")};
  font-weight: ${(p) => (p.bold ? "800" : "500")};
  color: ${(p) =>
    p.accent ? "#FF6B35" : "var(--tg-theme-text-color, #1a1a1a)"};
  border-top: ${(p) => (p.bold ? "1px solid rgba(0,0,0,0.08)" : "none")};
  margin-top: ${(p) => (p.bold ? "8px" : "0")};
  padding-top: ${(p) => (p.bold ? "12px" : "5px")};
`;

const PriceTag = styled.span`
  font-family: 'SF Mono', 'Fira Mono', monospace;
`;

const InfoChip = styled.span`
  font-size: 0.7rem;
  color: #888;
  background: rgba(0,0,0,0.05);
  border-radius: 6px;
  padding: 2px 6px;
  margin-left: 6px;
`;

// ── Map Section ───────────────────────────────────────────────────────────────

const MapCard = styled.div<{ $selected: boolean }>`
  margin: 0 20px;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid ${(p) =>
    p.$selected ? "#FF6B35" : "rgba(0,0,0,0.1)"};
  transition: border-color 0.3s;
  animation: ${fadeIn} 0.4s ease 0.15s both;
`;

const MapPlaceholder = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 18px;
  background: #faf7f5;
  color: #666;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #f5f0ec; }
`;

const MapPinLabel = styled.div`
  margin: 8px 20px 0;
  font-size: 0.82rem;
  color: #555;
  display: flex;
  align-items: center;
  gap: 6px;
`;

// ── Pay Button ────────────────────────────────────────────────────────────────

const PayBtn = styled.button<{ disabled: boolean }>`
  margin: 20px 20px 0;
  width: calc(100% - 40px);
  padding: 18px;
  border-radius: 18px;
  border: none;
  font-size: 1.05rem;
  font-weight: 800;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  background: ${(p) =>
    p.disabled
      ? "linear-gradient(135deg, #ccc, #ddd)"
      : "linear-gradient(135deg, #FF6B35, #F7931E)"};
  color: ${(p) => (p.disabled ? "#999" : "#fff")};
  box-shadow: ${(p) =>
    p.disabled ? "none" : "0 8px 20px rgba(255,107,53,0.4)"};
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  animation: ${fadeIn} 0.4s ease 0.2s both;

  &:active:not(:disabled) {
    transform: scale(0.97);
  }
`;

const SpinIcon = styled(FontAwesomeIcon)`
  animation: ${spin} 1s linear infinite;
`;

// ── Success Panel ─────────────────────────────────────────────────────────────

const SuccessPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 24px;
  text-align: center;
  animation: ${fadeIn} 0.5s ease;
  gap: 14px;
`;

const SuccessIcon = styled.div`
  font-size: 3.5rem;
  color: #4caf50;
`;

const SuccessTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
  color: var(--tg-theme-text-color, #1a1a1a);
`;

const SuccessDesc = styled.p`
  font-size: 0.92rem;
  color: #666;
  line-height: 1.5;
  max-width: 280px;
`;

// ──   r (for users who arrived via a referral link) ───────────────
const ReferralBanner = styled.div`
  margin: 0 20px 4px;
  background: linear-gradient(135deg, #1b4332, #2d6a4f);
  border: 1px solid rgba(100, 220, 140, 0.3);
  border-radius: 14px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: ${fadeIn} 0.4s ease;
`;
const ReferralBannerText = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: #a7f3c0;
  line-height: 1.4;
  strong { color: #fff; }
`;



// ─── Empty Cart ───────────────────────────────────────────────────────────────

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #aaa;
  gap: 12px;
  font-size: 0.95rem;
  text-align: center;
`;

// ─── Map Drawer ───────────────────────────────────────────────────────────────

const MapDrawerContent = styled.div`
  height: 70vh;
  display: flex;
  flex-direction: column;
`;

const MapDrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
`;

const ConfirmAddrBtn = styled.button`
  padding: 10px 20px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #FF6B35, #F7931E);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
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
      >
        <DrawerContent>
          <DrawerHandle />

          {/* Header */}
          <DrawerHeader>
            <DrawerTitle>
              {state === "success" ? "🎉 Order Placed!" : "Your Order"}
            </DrawerTitle>
            <IconButton onClick={onClose} size="small">
              <FontAwesomeIcon icon={faClose} />
            </IconButton>
          </DrawerHeader>

          {/* ── SUCCESS STATE ── */}
          {state === "success" && (
            <SuccessPanel>
              <SuccessIcon>
                <FontAwesomeIcon icon={faCheckCircle} />
              </SuccessIcon>
              <SuccessTitle>Payment Locked in Escrow!</SuccessTitle>
              <SuccessDesc>
                Your <strong>{grandTotal.toFixed(2)} {selectedCurrency}</strong> is securely locked in the smart contract.
                Re-directing to live tracker...
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
                    <span>Your cart is empty.<br />Add some food first!</span>
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
                        <strong>Friend's link applied!</strong> A portion of the protocol fee
                        goes back to your friend as a crypto thank-you. 🎁
                      </ReferralBannerText>
                    </ReferralBanner>
                  )}

                  {/* Price Breakdown */}
                  <SectionLabel style={{ padding: "0 20px" }}>Price Breakdown</SectionLabel>
                  <PriceBox>
                    <PriceLine>
                      <span>🍔 Food Subtotal</span>
                      <PriceTag>{foodTotal.toFixed(2)} {selectedCurrency}</PriceTag>
                    </PriceLine>
                    <PriceLine>
                      <span>
                        🛵 Delivery Fee
                        <InfoChip>goes to courier</InfoChip>
                      </span>
                      <PriceTag>{deliveryFee.toFixed(2)} {selectedCurrency}</PriceTag>
                    </PriceLine>
                    <PriceLine>
                      <span>
                        <FontAwesomeIcon icon={faShieldHalved} style={{ color: "#FF6B35", marginRight: 4 }} />
                        Protocol Fee
                        <InfoChip>MRR treasury</InfoChip>
                      </span>
                      <PriceTag>{protocolFee.toFixed(2)} {selectedCurrency}</PriceTag>
                    </PriceLine>
                    {referrerWallet && (
                      <PriceLine accent>
                        <span>🎁 Referrer Cashback</span>
                        <PriceTag>−{referrerCashback} {selectedCurrency}</PriceTag>
                      </PriceLine>
                    )}
                    <PriceLine bold>
                      <span>Total (locked in escrow)</span>
                      <PriceTag>{grandTotal.toFixed(2)} {selectedCurrency}</PriceTag>
                    </PriceLine>
                  </PriceBox>

                  {/* Delivery Address */}
                  <Section>
                    <SectionLabel>Delivery Address</SectionLabel>
                    <MapCard $selected={selectedAddress.length > 0}>
                      <MapPlaceholder
                        id="select-address-btn"
                        onClick={() => setMapDrawerOpen(true)}
                      >
                        <FontAwesomeIcon
                          icon={faMapMarkerAlt}
                          style={{ color: selectedAddress ? "#FF6B35" : "#aaa" }}
                        />
                        {selectedAddress || "Tap to pin your delivery location"}
                      </MapPlaceholder>
                    </MapCard>
                    {selectedAddress && (
                      <MapPinLabel>
                        <FontAwesomeIcon icon={faCheckCircle} style={{ color: "#4caf50" }} />
                        {selectedAddress} (ETA: {eta})
                      </MapPinLabel>
                    )}
                  </Section>

                  {/* Pay Button */}
                  <PayBtn
                    id="pay-with-ton-btn"
                    disabled={!canPay}
                    onClick={handlePay}
                  >
                    {state === "paying" ? (
                      <>
                        <SpinIcon icon={faSpinner} />
                        Locking funds in escrow…
                      </>
                    ) : !connected ? (
                      "Connect TON Wallet first"
                    ) : !selectedAddress ? (
                      <>
                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                        Select delivery address first
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faMotorcycle} />
                        Pay {grandTotal.toFixed(2)} {selectedCurrency} · Place Order
                      </>
                    )}
                  </PayBtn>

                  <Section style={{ paddingTop: 12 }}>
                    <p style={{ fontSize: "0.72rem", color: "#aaa", textAlign: "center", lineHeight: 1.5, margin: 0 }}>
                      🔒 Funds are locked in a TON smart contract and released only after you confirm delivery.
                      0% commission to the restaurant.
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
              Pin Your Location
            </h3>
            <ConfirmAddrBtn
              id="confirm-address-btn"
              onClick={() => {
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
              Confirm
            </ConfirmAddrBtn>
          </MapDrawerHeader>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <MapWithGeocoder
              onSelectedAddress={(addr: string, lat?: number, lng?: number) => {
                setPendingAddress(addr);
                setPendingLat(lat);
                setPendingLng(lng);
              }}
            />
          </div>
        </MapDrawerContent>
      </SwipeableDrawer>
    </>
  );
}

export default CheckoutPage;
