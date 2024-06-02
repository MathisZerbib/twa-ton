import React, { useEffect, useState } from "react";
import { TonClient } from "ton";
import { Address } from "@ton/core";
import { useTonConnect } from "../hooks/useTonConnect";
import { CHAIN } from "@tonconnect/protocol";

interface WalletBalanceTonProps {
  walletAddress: string;
}

const WalletBalanceTon: React.FC<WalletBalanceTonProps> = ({
  walletAddress,
}) => {
  const { network } = useTonConnect();
  const [balance, setBalance] = useState<string>("Loading...");
  console.log("walletAddress", walletAddress);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const client = new TonClient({
          endpoint:
            network === CHAIN.MAINNET
              ? "https://toncenter.com/api/v2/jsonRPC"
              : "https://testnet.toncenter.com/api/v2/jsonRPC",
        });

        const address = Address.parse(walletAddress);
        const balance = await client.getBalance(address);
        const finalbalance = parseFloat(balance.toString()) / 1e9;
        setBalance(`${finalbalance.toFixed(3)}`);
      } catch (error) {
        console.error("Failed to fetch balance:", error);
        setBalance("Error fetching balance");
      }
    };

    fetchBalance();
  }, [walletAddress]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "10px",
        marginTop: "10px",
      }}
    >
      <img
        src="ton.svg"
        alt="TON"
        style={{ width: "20px", height: "20px", marginRight: "10px" }}
      />
      <p
        style={{
          margin: "0",
        }}
      >
        {balance}
      </p>
    </div>
  );
};

export default WalletBalanceTon;
