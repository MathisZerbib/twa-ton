import { Address, toNano } from "ton";
import { useTonConnect } from "../hooks/useTonConnect";
import { Button } from "./styled/styled";
import styled from "styled-components";
import { CenterDiv, ButtonBuyTonStyled } from "./styled/styled";

type BuyWithTonProps = {
  amount: number;
};

export function BuyWithTon({ amount }: BuyWithTonProps) {
  const { sender, connected } = useTonConnect();
  const tonRecipient = "kQCFEF5jY33lLFJugJmFuILYQcwg7ekHu8LVsBpV7JbIT_yE";

  // Hardcoded image source
  const tonLogoUrl = "ton.svg";

  return (
    <CenterDiv>
      <ButtonBuyTonStyled
        disabled={
          !connected ||
          !sender ||
          amount <= 0 ||
          amount == null ||
          isNaN(amount) ||
          !isFinite(amount) ||
          amount === Infinity ||
          amount === -Infinity ||
          amount === undefined ||
          amount === null
        }
        onClick={async () => {
          sender.send({
            to: Address.parse(tonRecipient),
            value: toNano(amount.toString()),
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
