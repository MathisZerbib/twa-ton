import React, { useEffect, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart, faArrowRight } from "@fortawesome/free-solid-svg-icons";

const floatIn = keyframes`
  from { transform: translateY(100px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const bump = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const BarWrapper = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  /* Telegram safe areas: standard padding + safe-area-inset for notched devices */
  padding: 16px 20px;
  padding-bottom: max(20px, env(safe-area-inset-bottom, 20px));
  padding-left: max(20px, env(safe-area-inset-left, 20px));
  padding-right: max(20px, env(safe-area-inset-right, 20px));
  z-index: 1000;
  pointer-events: none;
  animation: ${floatIn} 0.6s var(--transition-smooth) both;
`;

const GlassBar = styled.div`
  pointer-events: auto;
  background: hsla(var(--hue-brand), var(--sat-brand), var(--light-brand), 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 12px 32px hsla(var(--hue-brand), var(--sat-brand), var(--light-brand), 0.4);
  border: 1px solid hsla(var(--hue-brand), var(--sat-brand), var(--light-brand), 0.2);
  cursor: pointer;
  transition: all var(--transition-base);
  width: 100%;
  max-width: 760px;
  margin: 0 auto;

  &:active {
    transform: scale(0.97);
  }
`;

const LeftSide = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
`;

const CartIconBox = styled.div<{ $bump?: boolean }>`
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  ${p => p.$bump && css`animation: ${bump} 0.3s ease;`}
`;

const PriceDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const TotalLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.8;
`;

const PriceValue = styled.span`
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: -0.02em;
`;

const CheckoutLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-weight: 900;
  font-size: 1rem;
  white-space: nowrap;

  @media (max-width: 420px) {
    font-size: 0.9rem;
  }
`;

interface StickyBottomBarProps {
  totalPrice: number;
  selectedCurrency: string;
  showCheckout: () => void;
}

const StickyBottomBar: React.FC<StickyBottomBarProps> = ({
  totalPrice,
  selectedCurrency,
  showCheckout,
}) => {
  const [shouldBump, setShouldBump] = useState(false);

  useEffect(() => {
    if (totalPrice > 0) {
      setShouldBump(true);
      const timer = setTimeout(() => setShouldBump(false), 300);
      return () => clearTimeout(timer);
    }
  }, [totalPrice]);

  if (totalPrice === 0) return null;

  return (
    <BarWrapper>
      <GlassBar onClick={showCheckout}>
        <LeftSide>
          <CartIconBox $bump={shouldBump}>
            <FontAwesomeIcon icon={faShoppingCart} />
          </CartIconBox>
          <PriceDetails>
            <TotalLabel>Cart Total</TotalLabel>
            <PriceValue>
              {totalPrice.toFixed(selectedCurrency === "TON" ? 3 : 2)} {selectedCurrency}
            </PriceValue>
          </PriceDetails>
        </LeftSide>
        <CheckoutLabel>
          Review Order
          <FontAwesomeIcon icon={faArrowRight} />
        </CheckoutLabel>
      </GlassBar>
    </BarWrapper>
  );
};

export default StickyBottomBar;
