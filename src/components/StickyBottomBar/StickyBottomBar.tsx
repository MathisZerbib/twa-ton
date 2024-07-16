import React from "react";
import styled from "styled-components";
import { Button, Fab } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";

// Enhanced styling for better aesthetics and responsiveness
const BottomBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const FullWidthCartButton = styled(Button)`
  background-color: transparent; // Make the background transparent
  color: #333; // Darker color for contrast
  &:hover {
    background-color: #f5f5f5; // Hover effect for feedback
  }
  @media (max-width: 600px) {
    font-size: 18px; // Smaller font size for smaller screens
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
  return (
    <BottomBar>
      <FullWidthCartButton
        color={selectedCurrency === "USDT" ? "primary" : "secondary"}
        aria-label="shopping-cart"
        size="large"
        onClick={showCheckout}
      >
        <FontAwesomeIcon icon={faShoppingCart} />
        <span>${totalPrice.toFixed(2)}</span>
      </FullWidthCartButton>
    </BottomBar>
  );
};

export default StickyBottomBar;
