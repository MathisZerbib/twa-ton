import { Button } from "@mui/material";
import { CartItemStyled } from "../components/styled/styled";
import products from "../shop/Products";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { useCurrency } from "../providers/useCurrency";
interface CartItemProps {
  item: any;
  onRemoveItem: (item: any) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onRemoveItem }) => {
  const product = products.find((product) => product.id === item.id);
  const selectedCurrency = useCurrency().selectedCurrency;

  return (
    <CartItemStyled
      key={
        item.id +
        item.quantity +
        item.price +
        Math.random() +
        Date.now() +
        Math.random()
      }
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
      <p
        style={{
          textAlign: "center",
        }}
      >
        {product?.name} -{" "}
        <span style={{ color: "grey" }}>{item.quantity}G</span>
      </p>
      <p>
        {parseFloat(item.price).toFixed(3)} {selectedCurrency}
      </p>
      <Button onClick={() => onRemoveItem(item)}>
        <FontAwesomeIcon
          icon={faCircleXmark}
          style={{
            color: "grey",
            fontSize: "1.5rem",
          }}
        />
      </Button>
    </CartItemStyled>
  );
};

export default CartItem;
