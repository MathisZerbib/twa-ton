import { useState, useEffect } from "react";
import { useCart } from "../providers/CartProvider";
import { BuyWithTon } from "../components/BuyWithTon";
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
import { CHAIN } from "@tonconnect/protocol";

const EmptyCart = () => <p>Your cart is empty</p>;

function CheckoutPage({ open, onClose }: any) {
  const { cartItems, totalPrice, removeItem } = useCart();
  const [selectedCurrency, setSelectedCurrency] = useState<string>("TON");

  useEffect(() => {
    const currency = localStorage.getItem("selectedCurrency");
    setSelectedCurrency(currency || "TON");
  }, []);

  const closeDrawer = () => {
    onClose();
  };

  const totalPriceInSelectedCurrency =
    selectedCurrency === "TON"
      ? totalPrice.toFixed(3)
      : (totalPrice * 2).toFixed(3);

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
          Total Price: {parseFloat(totalPriceInSelectedCurrency)}{" "}
          {selectedCurrency}
        </h2>
        <div style={{ marginTop: "20px", marginBottom: "20px" }}>
          <BuyWithTon
            amount={totalPriceInSelectedCurrency}
            onClick={closeDrawer}
            currency={selectedCurrency}
          />
        </div>
      </div>
    </SwipeableDrawer>
  );
}

export default CheckoutPage;
