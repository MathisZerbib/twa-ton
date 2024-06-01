import { useNavigate } from "react-router-dom";
import { useCart } from "../providers/CartProvider";
import styled from "styled-components";
import {
  Button,
  CartItem,
  CheckoutContainer,
} from "../components/styled/styled";
import { BuyWithTon } from "../components/BuyWithTon";
import products from "../shop/Products";
import { Drawer } from "@mui/material";
import { MouseEventHandler } from "react";

const GoHomeButton = styled(Button)``;

const EmptyCart = () => <p>Your cart is empty</p>;

function CheckoutPage({ open, onClose }: any) {
  const { cartItems, totalPrice } = useCart();
  const navigate = useNavigate();

  const closeDrawer = () => {
    onClose();
  };

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}>
      <CheckoutContainer
        style={{
          minHeight: "100vh",
        }}
      >
        <GoHomeButton onClick={closeDrawer}>←</GoHomeButton>
        <h1>Checkout Page</h1>
        <h2>Your Cart</h2>
        {cartItems.length > 0 ? (
          cartItems.map((item) => {
            const product = products.find((product) => product.id === item.id);
            return (
              <CartItem
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                {product?.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={{
                      width: "100px",
                      height: "100px",
                    }}
                  />
                )}
                <p>
                  {product?.name} - {item.quantity}g
                </p>
                {/* <p>{product?.description}</p> */}
                <p>
                  {item.price} TON
                  {/* Display price in TON */}
                </p>
              </CartItem>
            );
          })
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
        <br />
      </CheckoutContainer>
    </Drawer>
  );
}

export default CheckoutPage;
