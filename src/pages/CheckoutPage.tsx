import React, { useState, useEffect } from "react";
import { useCart } from "../providers/CartProvider";
import { BuyWithCrypto } from "../components/PayWithCrypto";
import {
  SwipeableDrawer,
  AppBar,
  Toolbar,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAddressCard,
  faCartArrowDown,
  faClose,
} from "@fortawesome/free-solid-svg-icons";
import CartItem from "../components/CartItem";
import { useCurrency } from "../providers/useCurrency";
import AutoFetchGeolocation from "../components/AutoFetchGeolocation";
import Divider from "@mui/material/Divider";

const EmptyCart = () => <p>Your cart is empty</p>;

const style = {
  py: 0,
  width: "100%",
  maxWidth: 360,
  borderRadius: 2,
  border: "1px solid",
  borderColor: "divider",
  backgroundColor: "background.paper",
};

function CheckoutPage({ open, onClose }: any) {
  const { cartItems, totalPrice, removeItem } = useCart();
  const { selectedCurrency, updateSelectedCurrency } = useCurrency();
  const [selectedAddress, setSelectedAddress] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false); // State for the new drawer
  const [fees, setFees] = useState(0);

  useEffect(() => {
    const currency = localStorage.getItem("selectedCurrency");
    if (currency) {
      updateSelectedCurrency(currency);
    }
  }, []);

  const closeDrawer = () => {
    onClose();
  };

  const handleAddressClick = (address: string) => {
    setSelectedAddress(address);
    setOpenModal(true);
  };

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleOpenDrawer = () => {
    setOpenDrawer(true);
  };

  const handleCloseDrawer = () => {
    setOpenDrawer(false);
  };

  const totalPriceFixed = parseFloat(totalPrice.toFixed(4));
  const totalPriceFeesIncluded = (
    Math.ceil((totalPriceFixed + fees) * 100) / 100
  ).toFixed(2);

  useEffect(() => {
    setFees(totalPriceFixed * 0.02);
  }, [totalPriceFixed]);

  return (
    <>
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
          <Toolbar
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              onClick={closeDrawer}
              aria-label="close"
              style={{
                width: "50px",
              }}
            >
              <FontAwesomeIcon icon={faClose} />
            </IconButton>
            <h1
              style={{
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Panier
            </h1>

            <FontAwesomeIcon
              icon={faCartArrowDown}
              style={{
                width: "50px",
              }}
            />
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
            cartItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <CartItem item={item} onRemoveItem={removeItem} />

                <Divider
                  style={{
                    width: "100%",
                  }}
                ></Divider>
              </React.Fragment>
            ))
          ) : (
            <EmptyCart />
          )}
          {/* fees for the overall process of delivery */}
          <p
            style={{
              alignSelf: "flex-end",
            }}
          >
            Frais de gestion: {fees.toFixed(4)} {selectedCurrency}
          </p>
          <h2
            style={{
              alignSelf: "flex-end",
            }}
          >
            Total Price: {totalPriceFeesIncluded} {selectedCurrency}
          </h2>
          <div style={{ marginTop: "20px", marginBottom: "20px" }}>
            <BuyWithCrypto
              amount={totalPriceFeesIncluded}
              onClick={closeDrawer}
              currency={selectedCurrency}
            />
          </div>
        </div>
        {/* Button to open the modal */}
        <Button variant="contained" onClick={handleOpenModal}>
          {selectedAddress ? "Changer l'adresse" : "Selectionner votre adresse"}
        </Button>
      </SwipeableDrawer>
      {/* New Drawer for selecting address */}
      <SwipeableDrawer
        anchor="bottom"
        open={openDrawer}
        onClose={handleCloseDrawer}
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
              onClick={handleCloseDrawer}
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
              Select Your Address
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
          {/* Address selection swipeable drawer */}
          <SwipeableDrawer
            anchor="bottom"
            open={openModal}
            onClose={handleCloseModal}
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
                  onClick={handleCloseModal}
                  aria-label="close"
                >
                  <FontAwesomeIcon icon={faClose} />
                </IconButton>
                <p
                  style={{
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                >
                  {selectedAddress
                    ? selectedAddress
                    : "Selectionner votre adresse"}
                </p>
              </Toolbar>
            </AppBar>
            <AutoFetchGeolocation onAddressClick={handleAddressClick} />
          </SwipeableDrawer>
        </div>
      </SwipeableDrawer>
    </>
  );
}

export default CheckoutPage;
