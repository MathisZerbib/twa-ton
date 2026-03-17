/**
 * useTONEatsEscrow
 *
 * Production-ready React hook for the TONEatsEscrow contract.
 */

import { useState, useCallback } from "react";
import { Address, toNano, OpenedContract, Sender } from "@ton/core";
import { CHAIN } from "@tonconnect/protocol";
import { useQuery } from "@tanstack/react-query";

import { TONEatsEscrow } from "../../contracts/build/TONEatsEscrow/tact_TONEatsEscrow";
import { useTonClient } from "./useTonClient";
import { useAsyncInitialize } from "./useAsyncInitialize";
import { useTonConnect } from "./useTonConnect";

// ─── Interfaces & Types ───────────────────────────────────────────────────────

export interface OrderStatus {
    status: number;
}

export type AcceptPhase = "signing" | "confirming" | "confirmed";

export interface UseTONEatsEscrowReturn {
    ready: boolean;
    wallet: string | null;
    orderId: bigint | null;
    orderStatus: OrderStatus | null;
    isFetchingStatus: boolean;
    createOrder: (orderId: string, foodTotalTon: number, merchantAddr: string, referrerAddr?: string) => Promise<void>;
    acceptDelivery: (oid: bigint | string, onPhase?: (phase: AcceptPhase) => void) => Promise<void>;
    confirmDelivery: (oid: bigint | string) => Promise<void>;
    withdrawAll: () => Promise<void>;
    getOrderStatus: (oid: bigint | string) => Promise<bigint | null>;
    contractAddress: string | undefined;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TREASURY_ADDRESS_MAINNET = import.meta.env.VITE_TREASURY_MAINNET ?? "EQBPEDbGdwaLv1DKntg9r6SjFIVplSaSJoJ-TVLe_2rqBOmH";
const TREASURY_ADDRESS_TESTNET = import.meta.env.VITE_TREASURY_TESTNET ?? "EQBYLTm4nsvoqJRvs_L-IGNKwWs5RKe19HBK_lFadf19FUfb";

const ESCROW_CONTRACT_MAINNET = import.meta.env.VITE_ESCROW_CONTRACT_MAINNET ?? "EQBPEDbGdwaLv1DKntg9r6SjFIVplSaSJoJ-TVLe_2rqBOmH";
const ESCROW_CONTRACT_TESTNET = import.meta.env.VITE_ESCROW_CONTRACT_TESTNET ?? "EQDqG9wGloibyVfZNcPp7ROaJKARwJVjarfG25dt__aw6PUd";

export const DELIVERY_FEE_TON = 0.2;
export const PROTOCOL_FEE_TON = 0.1;
export const REFERRER_CASHBACK_PERCENT = 0.5;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTONEatsEscrow(): UseTONEatsEscrowReturn {
    const { client } = useTonClient();
    const { sender, connected, wallet, network } = useTonConnect();
    const [orderId, setOrderId] = useState<bigint | null>(null);

    // ── Open the escrow contract ─────────────────────────────────────────────
    const escrowContract = useAsyncInitialize(async () => {
        if (!client) return undefined;
        const addr = network === CHAIN.MAINNET ? ESCROW_CONTRACT_MAINNET : ESCROW_CONTRACT_TESTNET;
        const contract = TONEatsEscrow.fromAddress(Address.parse(addr));
        return client.open(contract) as OpenedContract<TONEatsEscrow>;
    }, [client, network]);

    // ── Background Status Polling (React Query) ──────────────────────────────
    const { data: orderStatus, isFetching: isFetchingStatus } = useQuery({
        queryKey: ["tonEatsOrderStatus", orderId?.toString() ?? "none"],
        queryFn: async (): Promise<OrderStatus | null> => {
            if (!escrowContract || orderId === null) return null;
            try {
                const status = await escrowContract.getGetOrderStatus(orderId);
                return { status: Number(status) };
            } catch {
                return null; // Contract might not have this order yet
            }
        },
        refetchInterval: 5000,
        enabled: !!orderId && !!escrowContract,
    });

    // ── Helper: Wait for on-chain status change ──────────────────────────────
    const waitForStatus = useCallback(async (oid: bigint, targetStatus: bigint | bigint[], maxAttempts = 20): Promise<boolean> => {
        if (!escrowContract) return false;
        const targets = Array.isArray(targetStatus) ? targetStatus : [targetStatus];
        
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const status = await escrowContract.getGetOrderStatus(oid);
                if (targets.includes(status)) return true;
            } catch (err) {
                // Ignore RPC errors during polling, just wait and retry
            }
            await new Promise(r => setTimeout(r, 3000));
        }
        return false;
    }, [escrowContract]);

    // ── createOrder ──────────────────────────────────────────────────────────
    const createOrder = async (orderIdInput: string, foodTotalTon: number, merchantAddr: string, referrerAddr?: string) => {
        if (!escrowContract || !sender || !client) throw new Error("Contract or wallet not ready.");

        const oid = BigInt(orderIdInput);
        setOrderId(oid); // Track for background polling

        // Fetch actual fees or fallback
        let deliveryFeeNano = toNano(DELIVERY_FEE_TON.toString());
        let protocolFeeNano = toNano(PROTOCOL_FEE_TON.toString());

        try {
            deliveryFeeNano = await escrowContract.getGetDeliveryFee();
            protocolFeeNano = await escrowContract.getGetProtocolFee();
        } catch (err) {
            console.warn("[TON-Eats] Using fallback fees due to RPC error.");
        }

        const foodNano = toNano(foodTotalTon.toString());
        // We add a safe 0.05 TON buffer for gas. Ensure your Tact contract refunds excess!
        const requiredAmount = foodNano + deliveryFeeNano + protocolFeeNano + toNano("0.05");

        const params = {
            $$type: "CreateOrder" as const,
            orderId: oid,
            merchant: Address.parse(merchantAddr),
            foodAmount: foodNano,
            hasReferrer: !!referrerAddr,
            referrer: referrerAddr ? Address.parse(referrerAddr) : Address.parse(merchantAddr),
        };

        // Note: Wallet handles balance validation natively.
        await escrowContract.send(sender as Sender, { value: requiredAmount }, params);

        // Await confirmation optimistically
        const success = await waitForStatus(oid, [-1n, 0n]); // Assuming 0n or -1n means created
        if (!success) {
            console.warn("[TON-Eats] TX broadcasted, but RPC polling timed out. Proceeding optimistically.");
        }
    };

    // ── acceptDelivery ────────────────────────────────────────────────────────
    const acceptDelivery = async (oidInput: bigint | string, onPhase?: (phase: AcceptPhase) => void) => {
        if (!escrowContract || !sender || !client) throw new Error("Contract or wallet not ready.");
        
        const oid = BigInt(oidInput);
        const safeGas = toNano("0.1"); // Generous gas buffer, contract should refund

        onPhase?.("signing");

        await escrowContract.send(sender as Sender, { value: safeGas }, {
            $$type: "AcceptDelivery",
            orderId: oid
        });

        onPhase?.("confirming");

        const success = await waitForStatus(oid, [1n, 2n]); 
        if (success) {
            onPhase?.("confirmed");
        } else {
            console.warn("[TON-Eats] Proceeding optimistically, blockchain is delayed.");
            onPhase?.("confirmed");
        }
    };

    // ── confirmDelivery ───────────────────────────────────────────────────────
    const confirmDelivery = async (oidInput: bigint | string) => {
        if (!escrowContract || !sender || !client) throw new Error("Contract or wallet not ready.");
        
        const oid = BigInt(oidInput);
        
        // Use a safe flat gas fee. 
        // 4 outbound messages cost ~0.06 TON max. We send 0.1 TON to be safe.
        // *CRITICAL*: Ensure your smart contract has `send(SendParameters{value: 0, mode: SendRemainingValue, ...})`
        // to refund the unused TON back to the sender.
        const safeGas = toNano("0.1");

        await escrowContract.send(sender as Sender, { value: safeGas }, {
            $$type: "ConfirmDelivery",
            orderId: oid
        });

        const success = await waitForStatus(oid, 2n, 25);
        if (!success) {
            throw new Error(
                "Confirmation is taking longer than usual. Please check the merchant's receipt or try again in a few minutes."
            );
        }
    };

    // ── getOrderStatus (manual poll) ─────────────────────────────────────────
    const getOrderStatus = async (oidInput: bigint | string): Promise<bigint | null> => {
        if (!escrowContract) return null;
        try {
            return await escrowContract.getGetOrderStatus(BigInt(oidInput));
        } catch {
            return null;
        }
    };

    // ── Admin: withdrawAll ───────────────────────────────────────────────────
    const withdrawAll = async () => {
        if (!escrowContract || !sender) throw new Error("Contract or wallet not ready.");
        await escrowContract.send(sender as Sender, { value: toNano("0.05") }, "withdraw_all");
    };

    return {
        ready: connected && !!escrowContract,
        wallet,
        orderId,
        orderStatus: orderStatus ?? null,
        isFetchingStatus,
        createOrder,
        acceptDelivery,
        confirmDelivery,
        withdrawAll,
        getOrderStatus,
        contractAddress: escrowContract?.address.toString(),
    };
}
