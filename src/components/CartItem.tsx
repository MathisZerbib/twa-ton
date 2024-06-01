import { Button } from "@mui/material";
import { CartItemStyled } from "../components/styled/styled";
import products from "../shop/Products";

interface CartItemProps {
  item: any;
  removeItem: (item: any) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, removeItem }) => {
  const product = products.find((product) => product.id === item.id);

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
      <p>
        {product?.name} - {item.quantity}g
      </p>
      <p>{item.price} TON</p>
      <Button onClick={() => removeItem(item)}>Remove</Button>
    </CartItemStyled>
  );
};

export default CartItem;
