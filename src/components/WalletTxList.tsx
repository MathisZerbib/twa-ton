import React, { useEffect, useState } from "react";
import { TonClient, Transaction } from "ton";
import { Address } from "@ton/core";
import { useTonConnect } from "../hooks/useTonConnect";
import { CHAIN } from "@tonconnect/protocol";

interface WalletTxListProps {
  walletAddress: string;
}

const WalletTxList: React.FC<WalletTxListProps> = ({ walletAddress }) => {
  const { network } = useTonConnect();
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchTxList = async () => {
      try {
        const client = new TonClient({
          endpoint:
            network === CHAIN.MAINNET
              ? "https://toncenter.com/api/v2/jsonRPC"
              : "https://testnet.toncenter.com/api/v2/jsonRPC",
        });
        const url = network === CHAIN.MAINNET ? "" : "testnet.";
        //testnet.tonapi.io/v2/blockchain/accounts/0%3A85105e63637de52c526e809985b882d841cc20ede907bbc2d5b01a55ec96c84f/transactions?limit=100&sort_order=desc

        const address = Address.parse(walletAddress);
        const myPrivateWallet =
          "0:85105e63637de52c526e809985b882d841cc20ede907bbc2d5b01a55ec96c84f";
        const queryToGetTransactions = `https://${url}tonapi.io/v2/blockchain/accounts/${address.toString()}/transactions?limit=100&sort_order=desc`;
        const response = await fetch(queryToGetTransactions);
        const { transactions } = await response.json();

        console.log("transactions", transactions);
        setTransactions(transactions);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        setTransactions([]);
      }
    };

    fetchTxList();
  }, [walletAddress, network]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        marginTop: "10px",
      }}
    >
      {transactions.map((tx, index) => {
        return (
          <div key={index}>
            <ul
              style={{
                color: tx.success === true ? "green" : "red",
              }}
            >
              <li>Hash: {tx.hash}</li>
              <li>Success: {tx.success ? "Yes" : "No"}</li>
              <li>Destination: {tx.in_msg.destination.address.toString()}</li>
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export default WalletTxList;
