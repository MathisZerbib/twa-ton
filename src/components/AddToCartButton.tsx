import React, { useState } from "react";
import { useTonConnect } from "../hooks/useTonConnect";
import { useCart } from "../providers/CartProvider";
import { CenterDiv, AddToCartButtonCard } from "./styled/styled";
import { CartItemProps } from "./types";

type AddToCartButtonProps = {
  amount: number;
  item: CartItemProps;
};

export function AddToCartButton({ amount, item }: AddToCartButtonProps) {
  const { connected } = useTonConnect();
  const { addToCart } = useCart();
  const [successMessage, setSuccessMessage] = useState("");

  // Hardcoded image source
  const tonLogoUrl = "ton.svg";

  const handleAddToCart = async () => {
    try {
      await addToCart(item);
      setSuccessMessage("Added to cart!");
      setTimeout(() => setSuccessMessage(""), 3000); // Clear the message after 3 seconds
    } catch (error) {
      console.error("Failed to add to cart:", error);
      setSuccessMessage("Failed to add to cart.");
    }
  };

  return (
    <CenterDiv>
      <AddToCartButtonCard disabled={!connected} onClick={handleAddToCart}>
        <img
          src={tonLogoUrl}
          alt="Buy with TON"
          style={{
            width: "20px",
            height: "20px",
          }}
        />
        {amount} TON
      </AddToCartButtonCard>
    </CenterDiv>
  );
}
