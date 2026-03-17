import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useTonConnect } from "../hooks/useTonConnect";
import { useCart } from "../providers/CartProvider";

type AddToCartButtonProps = {
  amount: number;
  item: { id: string; name: string; quantity: number; priceUsdt: number; imageUrl?: string };
};

const popIn = keyframes`
  0% { transform: scale(0.9); opacity: 0; filter: blur(4px); }
  60% { transform: scale(1.04); filter: blur(0); }
  100% { transform: scale(1); opacity: 1; }
`;

const StyledButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--btn-radius);
  padding: 14px 24px;
  font-size: 1rem;
  font-weight: 900;
  cursor: pointer;
  transition: all var(--transition-base);
  flex: 1;
  box-shadow: 0 8px 24px hsla(var(--hue-brand), var(--sat-brand), var(--light-brand), 0.3);
  letter-spacing: -0.01em;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px hsla(var(--hue-brand), var(--sat-brand), var(--light-brand), 0.4);
  }

  &:active {
    transform: scale(0.96);
  }

  &:disabled {
    background: var(--bg-tertiary);
    color: var(--text-hint);
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const SuccessOverlay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--success);
  color: #fff;
  border-radius: var(--btn-radius);
  padding: 14px 24px;
  font-size: 1rem;
  font-weight: 900;
  flex: 1;
  animation: ${popIn} 0.4s var(--transition-smooth) both;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
`;

import { useCurrency } from "../providers/useCurrency";

export function AddToCartButton({ amount, item }: AddToCartButtonProps) {
  const { connected } = useTonConnect();
  const { addToCart } = useCart();
  const { selectedCurrency } = useCurrency();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred("medium");
      }
    } catch (e) {}

    addToCart(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (added) {
    return (
      <SuccessOverlay>
        <FontAwesomeIcon icon={faCheck} /> Added to cart
      </SuccessOverlay>
    );
  }

  return (
    <StyledButton disabled={!connected && false /* Optional: allow adding even if limited */} onClick={handleAddToCart}>
      <FontAwesomeIcon icon={faPlus} size="sm" />
      Add • {amount.toFixed(2)} {selectedCurrency}
    </StyledButton>
  );
}
