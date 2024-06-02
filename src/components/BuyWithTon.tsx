import { Address, toNano } from "ton";
import { useTonConnect } from "../hooks/useTonConnect";
import { CenterDiv, ButtonBuyTonStyled } from "./styled/styled";
import { useCart } from "../providers/CartProvider";

type BuyWithTonProps = {
  amount: string;
  onClick: () => void;
  currency: string;
};
import { CHAIN } from "@tonconnect/protocol";

export function BuyWithTon({ amount, onClick, currency }: BuyWithTonProps) {
  const { sender, connected, network } = useTonConnect();
  const tonRecipient =
    network === CHAIN.MAINNET
      ? "kQCFEF5jY33lLFJugJmFuILYQcwg7ekHu8LVsBpV7JbIT_yE"
      : network === CHAIN.TESTNET
      ? "kQCFEF5jY33lLFJugJmFuILYQcwg7ekHu8LVsBpV7JbIT_yE"
      : "";
  const { cartItems } = useCart();

  // Hardcoded image sources
  const tonLogoUrl = "ton.svg";
  const usdtLogoUrl = "usdt.svg";

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
          parseFloat(amount) <= 0 ||
          tonRecipient === "" ||
          tonRecipient === undefined ||
          tonRecipient === null
        }
        onClick={async () => {
          onClick();
          if (currency === "TON") {
            sender.send({
              to: Address.parse(tonRecipient),
              value: toNano(amount),
            });
          } else if (currency === "USDT") {
            // Handle USDT payment
            // Add your logic for USDT payment here
          }
        }}
      >
        <img
          src={currency === "TON" ? tonLogoUrl : usdtLogoUrl}
          alt={currency === "TON" ? "Buy with TON" : "Buy with USDT"}
          style={{
            width: "20px",
            height: "20px",
          }}
        />
        Pay {parseInt(amount).toFixed(2)} {currency}
      </ButtonBuyTonStyled>
    </CenterDiv>
  );
}
