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
/// use react dom router to navigate to cart
import { useState } from "react";
import CheckoutPage from "./pages/CheckoutPage";

function App() {
  const { network } = useTonConnect();
  const { cartItems } = useCart();

  const [openCheckout, setOpenCheckout] = useState(false);

  function showCheckout() {
    setOpenCheckout(true);
  }

  function closeCheckout() {
    setOpenCheckout(false);
  }

  return (
    <StyledApp>
      <ToastContainer /> {/* Place ToastContainer at the root level */}
      <AppContainer>
        <FlexBoxCol>
          <FlexBoxRowSpaceBetween>
            <StoreLogo src="logo.png" alt="Store Logo" />
            <Fab
              color="primary"
              aria-label="shopping-cart"
              style={{
                position: "fixed",
                bottom: 20,
                right: 20,
                display: "flex",
                flexDirection: "row",
                gap: "10px",
                alignItems: "center",
              }}
              size="large"
              onClick={() => {
                showCheckout();
              }}
            >
              <FontAwesomeIcon icon={faShoppingCart} />{" "}
              {/* Shopping cart icon */}
              <span>{cartItems.length}</span> {/* Counter */}
            </Fab>{" "}
            {/* Updated FAB */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "10px",
                alignItems: "center",
              }}
            >
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
      </AppContainer>
    </StyledApp>
  );
}

export default App;
