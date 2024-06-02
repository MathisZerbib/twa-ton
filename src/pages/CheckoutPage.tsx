import { useState, useEffect } from "react";
import { useCart } from "../providers/CartProvider";
import { BuyWithCrypto } from "../components/PayWithCrypto";
import {
  SwipeableDrawer,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import CartItem from "../components/CartItem";
// import { CHAIN } from "@tonconnect/protocol";
import { useCurrency } from "../providers/useCurrency";
import AutoFetchGeolocation from "../components/AutoFetchGeolocation";

const EmptyCart = () => <p>Your cart is empty</p>;

function CheckoutPage({ open, onClose }: any) {
  const { cartItems, totalPrice, removeItem } = useCart();
  const { selectedCurrency, updateSelectedCurrency } = useCurrency();

  useEffect(() => {
    const currency = localStorage.getItem("selectedCurrency");
    if (currency) {
      updateSelectedCurrency(currency);
    }
  }, []);

  const closeDrawer = () => {
    onClose();
  };

  const totalPriceFixed = totalPrice.toFixed(3);

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
    >
      <AppBar
        style={{
          position: "relative",
          backgroundColor: "#000",
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={closeDrawer}
            aria-label="close"
          >
            <FontAwesomeIcon icon={faClose} />
          </IconButton>
          <h1
            style={{
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Checkout Page
          </h1>
        </Toolbar>
      </AppBar>
      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <AutoFetchGeolocation />

        <h2>Your Cart</h2>
        {cartItems.length > 0 ? (
          cartItems.map((item) => (
            <CartItem item={item} removeItem={removeItem} key={item.id} />
          ))
        ) : (
          <EmptyCart />
        )}

        <h2
          style={{
            marginTop: "20px",
          }}
        >
          Total Price: {parseFloat(totalPriceFixed)} {selectedCurrency}
        </h2>
        <div style={{ marginTop: "20px", marginBottom: "20px" }}>
          <BuyWithCrypto
            amount={totalPriceFixed}
            onClick={closeDrawer}
            currency={selectedCurrency}
          />
        </div>
      </div>
    </SwipeableDrawer>
  );
}

export default CheckoutPage;
