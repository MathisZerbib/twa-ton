import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "./styled/styled";
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";

interface Props {
  productsCount: number;
}

export const CartWidget: React.FC<Props> = ({ productsCount }) => {
  const navigateToCart = () => {
    console.log("Navigating to cart");
  };

  return (
    <Button
      style={{ display: "flex", gap: "10px" }}
      onClick={
        productsCount > 0 ? navigateToCart : () => console.log("Cart is empty")
      }
    >
      <FontAwesomeIcon icon={faShoppingCart} />
      <span>{productsCount}</span>
    </Button>
  );
};
