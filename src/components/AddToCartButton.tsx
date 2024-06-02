import React, { useState } from "react";
import { useTonConnect } from "../hooks/useTonConnect";
import { useCart } from "../providers/CartProvider";
import { CenterDiv, AddToCartButtonCard, FlexBoxRow } from "./styled/styled";
import { CartItemProps } from "./types";
import { useCurrency } from "../providers/useCurrency";

type AddToCartButtonProps = {
  amount: number;
  item: CartItemProps;
};

export function AddToCartButton({ amount, item }: AddToCartButtonProps) {
  const { connected } = useTonConnect();
  const { addToCart } = useCart();
  const [successMessage, setSuccessMessage] = useState("");
  const selectedCurrency = useCurrency().selectedCurrency;

  // Hardcoded image source
  const tonLogoUrl = "ton.svg";
  const usdtLogoUrl = "usdt.svg";

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

  return amount > 0 ? (
    <AddToCartButtonCard disabled={!connected} onClick={handleAddToCart}>
      <FlexBoxRow
        style={{
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {amount.toFixed(2)}

        <img
          src={selectedCurrency === "TON" ? tonLogoUrl : usdtLogoUrl}
          alt={"Buy with" + selectedCurrency}
          style={{
            width: "20px",
            height: "20px",
          }}
        />
      </FlexBoxRow>
    </AddToCartButtonCard>
  ) : (
    <CenterDiv>
      <p style={{ color: "red" }}>Out of stock</p>
    </CenterDiv>
  );
}
