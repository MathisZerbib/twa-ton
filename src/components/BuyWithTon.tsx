import { Address, toNano } from "ton";
import { useTonConnect } from "../hooks/useTonConnect";
import { CenterDiv, ButtonBuyTonStyled } from "./styled/styled";
import { useCart } from "../providers/CartProvider";

type BuyWithTonProps = {
  amount: string;
  onClick: () => void;
};

export function BuyWithTon({ amount, onClick }: BuyWithTonProps) {
  const { sender, connected } = useTonConnect();
  const tonRecipient = "kQCFEF5jY33lLFJugJmFuILYQcwg7ekHu8LVsBpV7JbIT_yE";
  const { cartItems } = useCart();

  // Hardcoded image source
  const tonLogoUrl = "ton.svg";

  return (
    <CenterDiv>
      <ButtonBuyTonStyled
        disabled={
          !connected ||
          !sender ||
          amount === undefined ||
          amount === null ||
          amount === "" ||
          cartItems.length === 0 ||
          isNaN(parseFloat(amount)) ||
          parseFloat(amount) <= 0
        }
        onClick={async () => {
          onClick();
          sender.send({
            to: Address.parse(tonRecipient),
            value: toNano(amount),
          });
        }}
      >
        <img
          src={tonLogoUrl}
          alt="Buy with TON"
          style={{
            width: "20px",
            height: "20px",
          }}
        />
        Pay {amount} TON
      </ButtonBuyTonStyled>
    </CenterDiv>
  );
}
