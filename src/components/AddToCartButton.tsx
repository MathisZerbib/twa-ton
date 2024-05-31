// AddToCartButton.js

import React from "react";
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

  // Hardcoded image source
  const tonLogoUrl = "ton.svg";

  return (
    <CenterDiv>
      <AddToCartButtonCard
        disabled={!connected}
        onClick={() => {
          console.log("Adding to cart", item);
          addToCart(item);
        }}
      >
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
