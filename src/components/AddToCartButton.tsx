import React, { useState } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useTonConnect } from "../hooks/useTonConnect";
import { useCart } from "../providers/CartProvider";

type AddToCartButtonProps = {
  amount: number;
  item: { id: string; name: string; quantity: number; priceUsdt: number; imageUrl?: string };
};

const StyledButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);

  &:hover {
    background: #FF6B35;
    transform: scale(1.02);
    box-shadow: 0 6px 16px rgba(255, 107, 53, 0.3);
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const SuccessOverlay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 0.9rem;
  font-weight: 800;
  flex: 1; /* Match button's flex */
  border: 1px solid rgba(76, 175, 80, 0.3);
  animation: none;
`;

import { useCurrency } from "../providers/useCurrency";

export function AddToCartButton({ amount, item }: AddToCartButtonProps) {
  const { connected } = useTonConnect();
  const { addToCart } = useCart();
  const { selectedCurrency } = useCurrency();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (added) {
    return (
      <SuccessOverlay>
        <FontAwesomeIcon icon={faCheck} /> Added
      </SuccessOverlay>
    );
  }

  return (
    <StyledButton disabled={!connected && false /* Optional: allow adding even if limited */} onClick={handleAddToCart}>
      <FontAwesomeIcon icon={faPlus} size="sm" />
      {amount.toFixed(2)} {selectedCurrency}
    </StyledButton>
  );
}
