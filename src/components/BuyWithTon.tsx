import { Address, toNano } from "ton";
import { useTonConnect } from "../hooks/useTonConnect";
import { Button } from "./styled/styled";
import styled from "styled-components";

type BuyWithTonProps = {
  amount: number;
};

export function BuyWithTon({ amount }: BuyWithTonProps) {
  const { sender, connected } = useTonConnect();
  const tonRecipient = "kQCFEF5jY33lLFJugJmFuILYQcwg7ekHu8LVsBpV7JbIT_yE";

  // Hardcoded image source
  const tonLogoUrl = "ton.svg";

  const CenterDiv = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  const ButtonBuyTon = styled(Button)`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 10px 20px;
    background-color: #000;
    color: #fff;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-size: 16px;
    /// animation and hover effect
    transition: all 0.3s;
    &:hover {
      background-color: #333;
    }

    &:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    animation: fadeIn 0.5s;
  `;

  return (
    <CenterDiv>
      <ButtonBuyTon
        disabled={!connected}
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
        {amount} TON
      </ButtonBuyTon>
    </CenterDiv>
  );
}
