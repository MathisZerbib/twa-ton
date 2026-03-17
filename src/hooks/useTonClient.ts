import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient } from "@ton/ton";
import { useAsyncInitialize } from "./useAsyncInitialize";
import { useTonConnect } from "./useTonConnect";
import { CHAIN } from "@tonconnect/protocol";

const TESTNET_ENDPOINTS = [
  "https://testnet.toncenter.com/api/v2/jsonRPC",
  "https://testnet.ton.run/jsonRPC",
];

async function getWorkingEndpoint(network: CHAIN) {
  if (network === CHAIN.MAINNET) {
    return await getHttpEndpoint({ network: "mainnet" });
  }

  // If user provided a specific one, try it first
  const envRpc = import.meta.env.VITE_TON_RPC_URL;
  const candidates = envRpc ? [envRpc, ...TESTNET_ENDPOINTS] : TESTNET_ENDPOINTS;

  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "jsonrpc": "2.0", "id": 1, "method": "getConsensusBlock" }),
      });
      if (response.ok) return url;
    } catch (e) {
      console.warn(`[TON-Eats] RPC ${url} failed, trying next...`);
    }
  }
  return candidates[0]; // Fallback to first if all fail
}

export function useTonClient() {
  const { network } = useTonConnect();

  return {
    client: useAsyncInitialize(async () => {
      if (network === null || network === undefined) return;
      const endpoint = await getWorkingEndpoint(network);
      return new TonClient({ endpoint });
    }, [network]),
  };
}
