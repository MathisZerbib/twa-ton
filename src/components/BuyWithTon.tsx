import React from "react";
import styled from "styled-components";
import { Address, toNano } from "ton";
import { useTonConnect } from "../hooks/useTonConnect";
import { Button } from "./styled/styled";

type BuyWithTonProps = {
  amount: string;
};

export function BuyWithTon({ amount }: BuyWithTonProps) {
  const { sender, connected } = useTonConnect();
  const tonRecipient = "kQCFEF5jY33lLFJugJmFuILYQcwg7ekHu8LVsBpV7JbIT_yE";

  return (
    <Button
      disabled={!connected}
      onClick={async () => {
        sender.send({
          to: Address.parse(tonRecipient),
          value: toNano(amount),
        });
      }}
    >
      Buy Now
    </Button>
  );
}
