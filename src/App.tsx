import "./App.css";
import { TonConnectButton } from "@tonconnect/ui-react";
import styled from "styled-components";
import { Fab } from "@mui/material";

import {
  Button,
  FlexBoxCol,
  FlexBoxRowSpaceBetween,
} from "./components/styled/styled";
import { useTonConnect } from "./hooks/useTonConnect";
import { CHAIN } from "@tonconnect/protocol";
import "@twa-dev/sdk";
import ProductsList from "./components/ProductsList";
import WelcomeStore from "./components/WelcomeStore";
import products from "./shop/Products";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCart } from "./providers/CartProvider";
import {
  StyledApp,
  AppContainer,
  NetworkBadge,
  StoreLogo,
} from "./components/styled/styled";
import { useState } from "react";
import CheckoutPage from "./pages/CheckoutPage";
import { OrderProps } from "./components/types";
import OrdersDrawer from "./components/OrderDrawer";
import PriceConverter from "./components/PriceConverter";
import CurrencySwitcher from "./components/CurrencySwitcher";

function App() {
  const { network } = useTonConnect();
  const { totalPrice } = useCart();

  const [openCheckout, setOpenCheckout] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false); // State to control the drawer
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    localStorage.getItem("selectedCurrency") || "USDT"
  );

  // Mock orders array for demonstration purposes
  const mockOrders: OrderProps[] = [
    {
      id: "1",
      recipient: "Alice",
      price: 100,
      status: "Pending",
      dateCreated: "2021-10-01",
    },
    {
      id: "2",
      recipient: "Bob",
      price: 200,
      status: "Delivered",
      dateCreated: "2021-10-02",
    },
    // Add more mock orders as needed
  ];

  function showCheckout() {
    setOpenCheckout(true);
  }

  function closeCheckout() {
    setOpenCheckout(false);
  }

  function toggleDrawer(open: boolean) {
    setDrawerOpen(open);
  }

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
  };

  return (
    <StyledApp>
      <ToastContainer /> {/* Place ToastContainer at the root level */}
      <AppContainer>
        <FlexBoxCol>
          <FlexBoxRowSpaceBetween>
            <StoreLogo src="logo.png" alt="Store Logo" />
            <Fab
              color={selectedCurrency === "USDT" ? "primary" : "secondary"}
              aria-label="shopping-cart"
              style={{
                position: "fixed",
                bottom: 50,
                right: 20,
                display: "flex",
                flexDirection: "row",
                gap: "10px",
                alignItems: "center",
                minWidth: "120px",
                borderRadius: "10px",
              }}
              size="large"
              onClick={() => {
                showCheckout();
              }}
            >
              <FontAwesomeIcon icon={faShoppingCart} />
              <span>
                {totalPrice.toFixed(2)}{" "}
                <img
                  src={selectedCurrency.toLowerCase() + ".svg"}
                  alt={selectedCurrency + " icon"}
                  style={{
                    width: 20,
                    height: 20,
                  }}
                />
              </span>
            </Fab>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "10px",
                alignItems: "center",
              }}
            >
              <CurrencySwitcher
                selectedCurrency={selectedCurrency}
                onCurrencyChange={handleCurrencyChange}
              />

              <TonConnectButton />
              <NetworkBadge
                network={
                  network === CHAIN.MAINNET
                    ? "mainnet"
                    : network === CHAIN.TESTNET
                    ? "testnet"
                    : ""
                }
              ></NetworkBadge>
            </div>
          </FlexBoxRowSpaceBetween>
          <WelcomeStore />
          <br />
          <ProductsList products={products} />
        </FlexBoxCol>
        <CheckoutPage open={openCheckout} onClose={closeCheckout} />
        <OrdersDrawer
          orders={mockOrders}
          open={drawerOpen}
          onClose={toggleDrawer}
        />
        <br />
        <PriceConverter />
      </AppContainer>
    </StyledApp>
  );
}

export default App;
