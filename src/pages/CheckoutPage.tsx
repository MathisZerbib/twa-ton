import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../providers/CartProvider";
import styled from "styled-components";
import {
  Button,
  ButtonBuyTonStyled,
  CartItem,
  CheckoutButton,
  CheckoutContainer,
} from "../components/styled/styled";
import { BuyWithTon } from "../components/BuyWithTon";

const GoHomeButton = styled(Button)``;

const EmptyCart = () => <p>Your cart is empty</p>;

function CheckoutPage() {
  const { cartItems, totalPrice } = useCart();
  const navigate = useNavigate();

  const goHome = () => {
    navigate("/");
  };

  return (
    <div>
      <CheckoutContainer
        style={{
          height: "100vh",
        }}
      >
        <GoHomeButton onClick={goHome}>←</GoHomeButton>
        <h1>Checkout Page</h1>
        <h2>Your Cart</h2>
        {cartItems.length > 0 ? (
          cartItems.map((item) => (
            <CartItem key={item.id}>
              <p>
                {item.id} - {item.quantity} - {item.price} TON
              </p>
            </CartItem>
          ))
        ) : (
          <EmptyCart />
        )}
        <h2
          style={{
            marginTop: "20px",
            marginBottom: "20px",
          }}
        >
          Total Price: {totalPrice} TON
        </h2>{" "}
        {/* Display total price in TON */}
        <BuyWithTon amount={totalPrice} />
      </CheckoutContainer>
    </div>
  );
}

export default CheckoutPage;
