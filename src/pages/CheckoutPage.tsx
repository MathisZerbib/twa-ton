import { useCart } from "../providers/CartProvider";
import { CartItem, CheckoutContainer } from "../components/styled/styled";
import { BuyWithTon } from "../components/BuyWithTon";
import products from "../shop/Products";
import { SwipeableDrawer, AppBar, Toolbar, IconButton } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";

const EmptyCart = () => <p>Your cart is empty</p>;

function CheckoutPage({ open, onClose }: any) {
  const { cartItems, totalPrice } = useCart();

  const closeDrawer = () => {
    onClose();
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
    >
      <AppBar position="static">
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
      <CheckoutContainer
        style={{
          minHeight: "100vh",
        }}
      >
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
                <p>{item.price} TON</p>
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
        </h2>
        <BuyWithTon amount={totalPrice} />
        <br />
      </CheckoutContainer>
    </SwipeableDrawer>
  );
}

export default CheckoutPage;
