import { useCart } from "../providers/CartProvider";
import { CartItemStyled, CheckoutContainer } from "../components/styled/styled";
import { BuyWithTon } from "../components/BuyWithTon";
import products from "../shop/Products";
import {
  SwipeableDrawer,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Paper,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { CartItemProps } from "../components/types";
import CartItem from "../components/CartItem";

const EmptyCart = () => <p>Your cart is empty</p>;

function CheckoutPage({ open, onClose }: any) {
  const { cartItems, totalPrice, removeItem } = useCart();

  const closeDrawer = () => {
    onClose();
  };

  const totalPriceInTon = totalPrice.toFixed(3);
  return (
    <Paper>
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
        <CheckoutContainer>
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
            Total Price: {parseFloat(totalPriceInTon)} TON
          </h2>
          <div style={{ marginTop: "20px", marginBottom: "20px" }}>
            <BuyWithTon amount={totalPriceInTon} onClick={closeDrawer} />
          </div>
        </CheckoutContainer>
      </SwipeableDrawer>
    </Paper>
  );
}

export default CheckoutPage;
