// Shop.tsx

import React, { useState } from "react";
import styled from "styled-components";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  StyledApp,
  AppContainer,
  FlexBoxCol,
} from "../components/styled/styled";
import ProductsList from "../components/ProductsList";
import WelcomeStore from "../components/WelcomeStore";
import Header from "../components/Header";
import CheckoutPage from "./CheckoutPage";
import OrdersDrawer from "../components/OrderDrawer";
import PriceConverter from "../components/PriceConverter";
import { OrderProps } from "../components/types";
import { useCart } from "../providers/CartProvider";
import StickyBottomBar from "../components/StickyBottomBar/StickyBottomBar";

import products from "../shop/Products";

const Shop = () => {
  const { totalPrice } = useCart();
  const [openCheckout, setOpenCheckout] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false); // State to control the drawer
  const selectedCurrency = "USDT"; // Example currency; replace with actual logic

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
    // updateSelectedCurrency(currency); // You can implement this as per your application logic
    console.log(`Selected currency changed to ${currency}`);
  };

  const handleHomeClick = () => {
    console.log("Home clicked");
  };

  return (
    <>
      <Header
        totalPrice={totalPrice}
        selectedCurrency={selectedCurrency}
        onCurrencyChange={handleCurrencyChange}
        showCheckout={showCheckout}
        showConnectButton={true}
        showHome={handleHomeClick}
      />

      <StyledApp
        style={{
          background: "#f0f0f0",
        }}
      >
        <ToastContainer /> {/* Place ToastContainer at the root level */}
        <AppContainer>
          <FlexBoxCol>
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

          <PriceConverter />
          <StickyBottomBar
            totalPrice={totalPrice}
            selectedCurrency={selectedCurrency}
            showCheckout={showCheckout}
          />
        </AppContainer>
      </StyledApp>
    </>
  );
};

export default Shop;
