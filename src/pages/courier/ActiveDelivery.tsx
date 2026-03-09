/**
 * ActiveDelivery — Full-screen GPS navigation for the courier's active order.
 *
 * Uber-Eats-style delivery experience:
 *   1. Navigate to restaurant (map + route + ETA)
 *   2. Confirm pickup (swipe)
 *   3. Navigate to customer (map + route + ETA)
 *   4. Enter confirmation code → get paid
 *
 * Features:
 *   • Integrated Mapbox map with live GPS, route, and ETA
 *   • "Open in Maps" button for native turn-by-turn navigation
 *   • Swipe-to-confirm actions
 *   • Step progress timeline
 *   • Bottom sheet with order details
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faMapLocationDot,
  faPhone,
  faBagShopping,
  faLocationDot,
  faSpinner,
  faCheckCircle,
  faXmark,
  faNavicon,
  faChevronUp,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { BackendOrder } from "../../services/api";
import CourierNavMap, { NavPhase } from "../../components/CourierNavMap";
import DeliveryProgress, {
  DeliveryStep,
} from "../../components/courier/DeliveryProgress";
import SwipeButton from "../../components/courier/SwipeButton";
import { openNativeNavigation } from "../../hooks/useCourierLocation";

interface Props {
  order: BackendOrder;
  onPickup: () => Promise<void>;
  onConfirmCode: (code: string) => Promise<void>;
  onCancel: () => void;
  onComplete: () => void;
  gpsStatus: string;
}

// ─── Animations ─────────────────────────────────────────────────────────────

const fadeUp = keyframes`from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}`;
const spin = keyframes`to{transform:rotate(360deg)}`;
const scaleIn = keyframes`from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}`;
const pulseRing = keyframes`0%{box-shadow:0 0 0 0 rgba(255,107,53,0.4)}70%{box-shadow:0 0 0 14px rgba(255,107,53,0)}100%{box-shadow:0 0 0 0 rgba(255,107,53,0)}`;
const confetti = keyframes`0%{transform:translateY(0) rotate(0)}100%{transform:translateY(-100vh) rotate(720deg)}`;

// ─── Styled ─────────────────────────────────────────────────────────────────

const FullScreen = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  background: #f4f4f4;
`;

const MapArea = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
`;

const TopBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: env(safe-area-inset-top, 14px) 14px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.4) 0%,
    transparent 100%
  );
`;

const BackBtn = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  color: #1a1a1a;
  cursor: pointer;
  &:active {
    transform: scale(0.92);
  }
`;

const StatusPill = styled.div<{ $color: string }>`
  background: ${(p) => p.$color};
  color: #fff;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const LiveDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4caf50;
  display: inline-block;
  animation: ${pulseRing} 2s ease infinite;
`;

const BottomSheet = styled.div<{ $expanded: boolean }>`
  background: #fff;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.1);
  padding: 12px 18px 24px;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
  max-height: ${(p) => (p.$expanded ? "70vh" : "auto")};
  overflow-y: ${(p) => (p.$expanded ? "auto" : "visible")};
  animation: ${fadeUp} 0.4s ease;
  transition: max-height 0.3s ease;
`;

const Handle = styled.div`
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: #ddd;
  margin: 0 auto 12px;
`;

const ProgressRow = styled.div`
  margin-bottom: 16px;
`;

const Section = styled.div`
  margin-bottom: 14px;
`;

const SectionTitle = styled.div`
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #aaa;
  margin-bottom: 6px;
`;

const InfoCard = styled.div`
  background: #f8f8f8;
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const InfoIcon = styled.div<{ $bg: string }>`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: ${(p) => p.$bg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1rem;
  flex-shrink: 0;
`;

const InfoText = styled.div`
  flex: 1;
  min-width: 0;
`;

const InfoMain = styled.div`
  font-size: 0.88rem;
  font-weight: 700;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const InfoSub = styled.div`
  font-size: 0.75rem;
  color: #888;
  margin-top: 1px;
`;

const NavBtn = styled.button`
  background: linear-gradient(135deg, #4285f4, #356fe0);
  border: none;
  color: #fff;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  box-shadow: 0 2px 8px rgba(66, 133, 244, 0.35);
  flex-shrink: 0;
  &:active {
    transform: scale(0.95);
  }
`;

const ItemList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
`;

const ItemChip = styled.span`
  background: #f0f0f0;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #555;
`;

const CodeSection = styled.div`
  animation: ${scaleIn} 0.3s ease;
`;

const CodeInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  border-radius: 14px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  font-size: 1.6rem;
  font-weight: 900;
  letter-spacing: 0.25em;
  text-align: center;
  font-family: "SF Mono", "Fira Code", monospace;
  color: #1a1a2e;
  background: #f9f9f9;
  margin-bottom: 12px;
  transition: border-color 0.2s;
  &:focus {
    outline: none;
    border-color: #ff6b35;
  }
`;

const ConfirmBtn = styled.button<{ $disabled: boolean }>`
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: none;
  background: ${(p) =>
    p.$disabled
      ? "#e0e0e0"
      : "linear-gradient(135deg,#4caf50,#2e7d32)"};
  color: ${(p) => (p.$disabled ? "#aaa" : "#fff")};
  font-size: 0.95rem;
  font-weight: 800;
  cursor: ${(p) => (p.$disabled ? "not-allowed" : "pointer")};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: ${(p) =>
    p.$disabled ? "none" : "0 4px 14px rgba(76,175,80,0.4)"};
  &:active:not(:disabled) {
    transform: scale(0.97);
  }
`;

const SpinnerIcon = styled(FontAwesomeIcon)`
  animation: ${spin} 0.8s linear infinite;
`;

const ErrorMsg = styled.p`
  color: #f44336;
  font-size: 0.82rem;
  text-align: center;
  margin: 0 0 10px;
`;

// Celebration
const CelebrationOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 300;
  background: linear-gradient(160deg, #0f0c29, #1a1040, #24243e);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
  animation: ${scaleIn} 0.4s ease;
`;

const CelebEmoji = styled.div`
  font-size: 4rem;
`;

const CelebTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 900;
  color: #fff;
  margin: 0;
`;

const CelebSub = styled.p`
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  max-width: 280px;
  line-height: 1.5;
`;

const CelebBtn = styled.button`
  margin-top: 12px;
  padding: 14px 32px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #ff6b35, #f7931e);
  color: #fff;
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(255, 107, 53, 0.5);
  &:active {
    transform: scale(0.96);
  }
`;

const ExpandToggle = styled.button`
  border: none;
  background: transparent;
  color: #999;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
`;

// ─── Component ──────────────────────────────────────────────────────────────

const ActiveDelivery: React.FC<Props> = ({
  order,
  onPickup,
  onConfirmCode,
  onCancel,
  onComplete,
  gpsStatus,
}) => {
  const [pickingUp, setPickingUp] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [delivered, setDelivered] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Determine delivery step from order status
  const getStep = (): DeliveryStep => {
    switch (order.status) {
      case "accepted":
        return "heading_to_store";
      case "picked_up":
        return "heading_to_customer";
      case "delivered":
        return "delivered";
      default:
        return "heading_to_store";
    }
  };

  const step = getStep();

  // Map nav phase
  const navPhase: NavPhase =
    step === "heading_to_store" || step === "at_store" ? "pickup" : "dropoff";

  // Current destination
  const destLat =
    navPhase === "pickup"
      ? order.storeLat ?? 0
      : order.deliveryLat ?? 0;
  const destLng =
    navPhase === "pickup"
      ? order.storeLng ?? 0
      : order.deliveryLng ?? 0;
  const destLabel =
    navPhase === "pickup" ? "Restaurant" : order.deliveryAddress;
  const hasCoords =
    navPhase === "pickup"
      ? order.storeLat != null && order.storeLng != null
      : order.deliveryLat != null && order.deliveryLng != null;

  // Pickup swipe handler
  const handlePickupSwipe = useCallback(async () => {
    setPickingUp(true);
    try {
      await onPickup();
    } catch (e) {
      console.error(e);
    } finally {
      setPickingUp(false);
    }
  }, [onPickup]);

  // Confirm code handler
  const handleConfirm = useCallback(async () => {
    if (codeInput.length !== 4) return;
    setConfirming(true);
    setConfirmError(null);
    try {
      await onConfirmCode(codeInput);
      setDelivered(true);
    } catch (e: any) {
      setConfirmError(e.message ?? "Invalid code. Try again.");
    } finally {
      setConfirming(false);
    }
  }, [codeInput, onConfirmCode]);

  // Handle navigate button
  const handleOpenMaps = () => {
    if (hasCoords) {
      openNativeNavigation(destLat, destLng, destLabel);
    }
  };

  // Celebration screen
  if (delivered) {
    return (
      <CelebrationOverlay>
        <CelebEmoji>🎉</CelebEmoji>
        <CelebTitle>Delivery Complete!</CelebTitle>
        <CelebSub>
          Payment of {order.deliveryFeeTon.toFixed(3)} TON has been released to
          your wallet by the smart contract.
        </CelebSub>
        <CelebBtn onClick={onComplete}>Back to Orders</CelebBtn>
      </CelebrationOverlay>
    );
  }

  return (
    <FullScreen>
      {/* ── Map ── */}
      <MapArea>
        {hasCoords ? (
          <CourierNavMap
            phase={navPhase}
            storeLat={order.storeLat ?? 0}
            storeLng={order.storeLng ?? 0}
            deliveryLat={order.deliveryLat ?? 0}
            deliveryLng={order.deliveryLng ?? 0}
            storeName="Restaurant"
            deliveryAddress={order.deliveryAddress}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg,#1a1a2e,#0f3460)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <FontAwesomeIcon
              icon={faMapLocationDot}
              style={{ fontSize: "2rem", opacity: 0.5 }}
            />
            <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>
              Coordinates not available
            </p>
          </div>
        )}

        {/* Top bar overlay */}
        <TopBar>
          <BackBtn onClick={onCancel}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </BackBtn>
          <StatusPill
            $color={
              gpsStatus === "broadcasting"
                ? "#4caf50"
                : gpsStatus === "error"
                ? "#f44336"
                : "#FF6B35"
            }
          >
            <LiveDot />
            {gpsStatus === "broadcasting" && "Live GPS"}
            {gpsStatus === "searching" && "Finding location…"}
            {gpsStatus === "error" && "GPS Error"}
            {gpsStatus === "off" && "GPS Off"}
          </StatusPill>
          <div style={{ flex: 1 }} />
          <StatusPill $color="rgba(0,0,0,0.5)">
            #{order.orderId.slice(-6)}
          </StatusPill>
        </TopBar>
      </MapArea>

      {/* ── Bottom Sheet ── */}
      <BottomSheet $expanded={expanded}>
        <Handle />

        {/* Progress bar */}
        <ProgressRow>
          <DeliveryProgress step={step} />
        </ProgressRow>

        {/* ── Phase: Heading to Store ── */}
        {step === "heading_to_store" && (
          <>
            <Section>
              <SectionTitle>Navigate to restaurant</SectionTitle>
              <InfoCard>
                <InfoIcon $bg="linear-gradient(135deg,#FF6B35,#F7931E)">
                  <FontAwesomeIcon icon={faBagShopping} />
                </InfoIcon>
                <InfoText>
                  <InfoMain>Pick up order</InfoMain>
                  <InfoSub>
                    {order.items
                      .map((i) => `${i.qty}× ${i.name}`)
                      .join(", ") || "Items loading…"}
                  </InfoSub>
                </InfoText>
                {hasCoords && (
                  <NavBtn onClick={handleOpenMaps}>
                    <FontAwesomeIcon icon={faMapLocationDot} />
                    Navigate
                  </NavBtn>
                )}
              </InfoCard>
            </Section>

            <Section>
              <SwipeButton
                label="Swipe when arrived at restaurant"
                onSwipeComplete={handlePickupSwipe}
                color="#FF6B35"
                loading={pickingUp}
                icon={faBagShopping}
              />
            </Section>

            {/* Expandable order details */}
            <ExpandToggle onClick={() => setExpanded(!expanded)}>
              <FontAwesomeIcon icon={expanded ? faChevronDown : faChevronUp} />
              {expanded ? "Hide details" : "Show order details"}
            </ExpandToggle>
            {expanded && (
              <Section>
                <SectionTitle>Order Items</SectionTitle>
                <ItemList>
                  {order.items.map((item, i) => (
                    <ItemChip key={i}>
                      {item.qty}× {item.name}
                    </ItemChip>
                  ))}
                </ItemList>
                <div style={{ marginTop: 10, fontSize: "0.78rem", color: "#888" }}>
                  <strong>Deliver to:</strong> {order.deliveryAddress}
                </div>
                <div style={{ fontSize: "0.78rem", color: "#888", marginTop: 4 }}>
                  <strong>Earnings:</strong> {order.deliveryFeeTon.toFixed(3)} TON
                </div>
              </Section>
            )}
          </>
        )}

        {/* ── Phase: Heading to Customer (picked up) ── */}
        {step === "heading_to_customer" && (
          <>
            <Section>
              <SectionTitle>Deliver to customer</SectionTitle>
              <InfoCard>
                <InfoIcon $bg="linear-gradient(135deg,#4caf50,#2e7d32)">
                  <FontAwesomeIcon icon={faLocationDot} />
                </InfoIcon>
                <InfoText>
                  <InfoMain>{order.deliveryAddress}</InfoMain>
                  <InfoSub>
                    {order.items.length} item
                    {order.items.length !== 1 ? "s" : ""} ·{" "}
                    {order.deliveryFeeTon.toFixed(2)} TON
                  </InfoSub>
                </InfoText>
                {hasCoords && (
                  <NavBtn onClick={handleOpenMaps}>
                    <FontAwesomeIcon icon={faMapLocationDot} />
                    Navigate
                  </NavBtn>
                )}
              </InfoCard>
            </Section>

            <Section>
              <CodeSection>
                <SectionTitle>Enter customer's 4-digit code</SectionTitle>
                <CodeInput
                  type="number"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="• • • •"
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value.slice(0, 4));
                    setConfirmError(null);
                  }}
                />
                {confirmError && <ErrorMsg>❌ {confirmError}</ErrorMsg>}
                <ConfirmBtn
                  $disabled={codeInput.length !== 4 || confirming}
                  onClick={handleConfirm}
                >
                  {confirming ? (
                    <>
                      <SpinnerIcon icon={faSpinner} /> Verifying…
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheckCircle} /> Confirm Delivery
                      & Get Paid
                    </>
                  )}
                </ConfirmBtn>
              </CodeSection>
            </Section>
          </>
        )}

        {/* ── Phase: Delivered ── */}
        {step === "delivered" && (
          <Section>
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: "3rem" }}>✅</div>
              <p
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  margin: "8px 0 4px",
                }}
              >
                Order Delivered
              </p>
              <p style={{ color: "#888", fontSize: "0.85rem" }}>
                {order.deliveryFeeTon.toFixed(3)} TON earned
              </p>
            </div>
          </Section>
        )}
      </BottomSheet>
    </FullScreen>
  );
};

export default ActiveDelivery;
