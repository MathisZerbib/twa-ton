import { Address, Cell, toNano } from "@ton/core";
import { useTonConnect } from "../hooks/useTonConnect";
import { CenterDiv, ButtonBuyTonStyled } from "./styled/styled";
import { useCart } from "../providers/CartProvider";

type PayWithCryptoProps = {
  amount: string;
  onClick: () => void;
  currency: string;
  enabled: boolean;
};
import { CHAIN } from "@tonconnect/protocol";

export function BuyWithCrypto({
  amount,
  onClick,
  currency,
  enabled,
}: PayWithCryptoProps) {
  const { sender, connected, network } = useTonConnect();
  const tonRecipient =
    network === CHAIN.MAINNET
      ? "kQCFEF5jY33lLFJugJmFuILYQcwg7ekHu8LVsBpV7JbIT_yE"
      : network === CHAIN.TESTNET
        ? "kQCFEF5jY33lLFJugJmFuILYQcwg7ekHu8LVsBpV7JbIT_yE"
        : "";
  const { cartItems } = useCart();
  const isDisabled =
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
    tonRecipient === null ||
    currency === "" ||
    currency === undefined ||
    currency === null ||
    !enabled;

  const disabledReason = !connected || !sender
    ? "Connect your wallet to continue"
    : cartItems.length === 0
      ? "Add items to your cart to continue"
      : !enabled
        ? "Select your delivery address to continue"
        : "Check payment details and try again";

  // Hardcoded image sources
  const tonLogoUrl = "ton.svg";
  const usdtLogoUrl = "usdt.svg";


  return (
    <CenterDiv>
      <ButtonBuyTonStyled
        disabled={isDisabled}
        title={isDisabled ? disabledReason : undefined}
        onClick={async () => {
          onClick();
          if (currency === "TON") {
            /// TODO If ok then empty the cart and send the payment snackbar
            try {
              const amountNano = toNano(amount);
              await sender.send({
                to: Address.parse(tonRecipient),
                value: amountNano,
              });
            } catch (error) {
              console.error("Transaction failed", error);
            }

            // show snackbar

            // empty the cart
          } else if (currency === "USDT") {
            // Handle USDT payment
            // Add your logic for USDT payment here
            // show snackbar
            // empty the cart
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
        Pay {parseFloat(amount).toFixed(2)} {currency}
      </ButtonBuyTonStyled>
    </CenterDiv>
  );
}
