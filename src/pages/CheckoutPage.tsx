import React, { useState, useEffect } from "react";
import { useCart } from "../providers/CartProvider";
import { BuyWithCrypto } from "../components/PayWithCrypto";
import {
  SwipeableDrawer,
  AppBar,
  Toolbar,
  IconButton,
  Button,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartArrowDown,
  faClose,
  faPersonBiking,
} from "@fortawesome/free-solid-svg-icons";
import CartItem from "../components/CartItem";
import { useCurrency } from "../providers/useCurrency";
import MapWithGeocoder from "../components/MapWithGeocoder";
import Divider from "@mui/material/Divider";
// import MapDelivery from "../components/MapDelivery";

const EmptyCart = () => <h2>Vous n'avez pas d'article dans votre panier</h2>;

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

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleCloseDrawerAddress = () => {
    setOpenDrawer(false);
  };

  const totalPriceFixed = parseFloat(totalPrice.toFixed(4));
  const totalPriceFeesIncluded = (
    Math.ceil((totalPriceFixed + fees) * 100) / 100
  ).toFixed(2);

  useEffect(() => {
    setFees(totalPriceFixed * 0.002);
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
          {/* <p
            style={{
              alignSelf: "flex-end",
            }}
          >
            {parseInt(totalPriceFeesIncluded) > 0
              ? `Frais de gestion: ${fees.toFixed(4)} ${selectedCurrency}`
              : ""}
          </p> */}

          <div style={{ marginTop: "20px", marginBottom: "20px" }}>
            {selectedAddress && (
              <BuyWithCrypto
                enabled={
                  parseInt(totalPriceFeesIncluded) > 0 &&
                  selectedAddress.length > 0
                }
                amount={totalPriceFeesIncluded}
                onClick={closeDrawer}
                currency={selectedCurrency}
              />
            )}
          </div>
        </div>
        {/* Button to open the modal */}
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            if (parseInt(totalPriceFeesIncluded) > 0) {
              handleOpenModal();
            }
          }}
          disabled={parseInt(totalPriceFeesIncluded) === 0} // Disable the button if the total is 0
        >
          {selectedAddress
            ? selectedAddress
            : "Faites vous livrer en moins de 2H"}
          <FontAwesomeIcon
            icon={faPersonBiking}
            style={{
              marginLeft: "10px",
            }}
          />
        </Button>
      </SwipeableDrawer>
      {/* New Drawer for selecting address */}
      <SwipeableDrawer
        anchor="bottom"
        open={openDrawer}
        onClose={handleCloseDrawerAddress}
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
              onClick={handleCloseDrawerAddress}
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
                  {selectedAddress ? selectedAddress : "Adresse de livraison"}
                </p>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCloseModal}
                >
                  Valider
                </Button>
              </Toolbar>
            </AppBar>
            <MapWithGeocoder onSelectedAddress={setSelectedAddress} />
            {/* <MapDelivery
              onLocationSelect={(location) => {
                console.log("Location selected" + location);
              }}
              startPoint={{ lat: 43.650769, lng: 3.876716 }}
              endPoint={{ lat: 43.611, lng: 3.876 }}
            /> */}
          </SwipeableDrawer>
        </div>
      </SwipeableDrawer>
    </>
  );
}

export default CheckoutPage;
