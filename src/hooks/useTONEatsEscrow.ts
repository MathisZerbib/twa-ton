/**
 * useTONEatsEscrow
 *
 * React hook that wraps the TONEatsEscrow contract and exposes
 * high-level functions for the buyer and courier UIs.
 *
 * All imports use `ton-core` (not `@ton/core`) to stay consistent with
 * the existing codebase's useTonConnect / Sender type.
 *
 * Usage (Buyer):
 *   const { createOrder, confirmDelivery, orderId } = useTONEatsEscrow();
 *
 * Usage (Courier):
 *   const { acceptDelivery } = useTONEatsEscrow();
 */

import { useState } from "react";
import { Address, toNano, OpenedContract } from "@ton/core";
import { CHAIN } from "@tonconnect/protocol";
import { useQuery } from "@tanstack/react-query";

import { TONEatsEscrow } from "../../contracts/build/TONEatsEscrow/tact_TONEatsEscrow";

export interface OrderStatus {
    status: number;
}
import { useTonClient } from "./useTonClient";
import { useAsyncInitialize } from "./useAsyncInitialize";
import { useTonConnect } from "./useTonConnect";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Protocol Treasury address – receives the service fee for MRR.
 * Replace with your real treasury wallet before mainnet launch.
 */
const TREASURY_ADDRESS_MAINNET = import.meta.env.VITE_TREASURY_MAINNET ?? "EQBPEDbGdwaLv1DKntg9r6SjFIVplSaSJoJ-TVLe_2rqBOmH";
const TREASURY_ADDRESS_TESTNET = import.meta.env.VITE_TREASURY_TESTNET ?? "EQBYLTm4nsvoqJRvs_L-IGNKwWs5RKe19HBK_lFadf19FUfb";

/**
 * Deployed TON-Eats Escrow contract address.
 * Replace with your actual deployed contract address post-deployment.
 */
const ESCROW_CONTRACT_MAINNET = import.meta.env.VITE_ESCROW_CONTRACT_MAINNET ?? "EQBPEDbGdwaLv1DKntg9r6SjFIVplSaSJoJ-TVLe_2rqBOmH";
const ESCROW_CONTRACT_TESTNET = import.meta.env.VITE_ESCROW_CONTRACT_TESTNET ?? "EQDqG9wGloibyVfZNcPp7ROaJKARwJVjarfG25dt__aw6PUd";

// ─── Fee Constants ─────────────────────────────────────────────────────────────

/** Fixed delivery fee in TON (shown in checkout breakdown) */
export const DELIVERY_FEE_TON = 0.2;

/** Protocol service fee in TON (goes to treasury / MRR) */
export const PROTOCOL_FEE_TON = 0.1;

/** Percentage of protocol fee given as referrer cashback (0.5 = 50%) */
export const REFERRER_CASHBACK_PERCENT = 0.5;

// ─── Accept Phase Type ────────────────────────────────────────────────────────

export type AcceptPhase = "signing" | "confirming" | "confirmed";

// ─── Return Type ──────────────────────────────────────────────────────────────

export interface UseTONEatsEscrowReturn {
    /** True when the contract is initialised and wallet is connected */
    ready: boolean;
    /** The connected wallet address string */
    wallet: string | null;
    /** Currently tracked order ID (set after createOrder is called) */
    orderId: bigint | null;
    /** Current order status fetched from chain (null while loading) */
    orderStatus: OrderStatus | null;
    isFetchingStatus: boolean;
    /**
     * Create a new order and lock funds in escrow.
     * @param foodTotalTon  Food subtotal in TON (e.g. 12.5)
     * @param merchantAddr  Restaurant wallet address string
     * @param referrerAddr  Optional referrer wallet address from the deep link
     */
    createOrder: (
        orderId: string,
        foodTotalTon: number,
        merchantAddr: string,
        referrerAddr?: string
    ) => Promise<void>;
    /**
     * Called by the courier to accept and assign themselves to the delivery.
     * @param oid  Order ID (bigint)
     * @param onPhase  Optional callback to receive phase updates: 'signing' | 'confirming' | 'confirmed'
     */
    acceptDelivery: (oid: bigint | string, onPhase?: (phase: AcceptPhase) => void) => Promise<void>;
    /**
     * Poll the on-chain status of an order. Returns the raw bigint status.
     */
    getOrderStatus: (oid: bigint | string) => Promise<bigint | null>;
    /**
     * Called by the buyer/courier to confirm they received the delivery.
     * This triggers the 4-way payment split on-chain.
     * @param oid  Order ID (bigint)
     */
    confirmDelivery: (oid: bigint | string) => Promise<void>;
    /** Admin: withdraw safe unallocated funds */
    withdrawAll: () => Promise<void>;
    /** String address of the contract for display */
    contractAddress: string | undefined;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTONEatsEscrow(): UseTONEatsEscrowReturn {
    const { client } = useTonClient();
    const { sender, connected, wallet, network } = useTonConnect();
    const [orderId, setOrderId] = useState<bigint | null>(null);

    // ── Open the escrow contract ─────────────────────────────────────────────
    const escrowContract = useAsyncInitialize(async () => {
        if (!client) return undefined;
        const addr =
            network === CHAIN.MAINNET
                ? ESCROW_CONTRACT_MAINNET
                : ESCROW_CONTRACT_TESTNET;
        const contract = TONEatsEscrow.fromAddress(Address.parse(addr));
        return client.open(contract) as OpenedContract<TONEatsEscrow>;
    }, [client, network]);

    // ── Poll order status every 5 s once we have an orderId ────────────────
    const { data: orderStatus, isFetching: isFetchingStatus } = useQuery({
        queryKey: ["tonEatsOrderStatus", orderId?.toString() ?? "none"],
        queryFn: async (): Promise<OrderStatus | null> => {
            if (!escrowContract || orderId === null) return null;
            try {
                const status = await escrowContract.getGetOrderStatus(orderId);
                return { status: Number(status) };
            } catch {
                return null;
            }
        },
        refetchInterval: 5000,
        enabled: !!orderId && !!escrowContract,
    });

    // ── Treasury address helper ──────────────────────────────────────────────
    const getTreasuryAddress = () =>
        Address.parse(
            network === CHAIN.MAINNET
                ? TREASURY_ADDRESS_MAINNET
                : TREASURY_ADDRESS_TESTNET
        );

    // ── createOrder ──────────────────────────────────────────────────────────
    const createOrder = async (
        orderIdInput: string,
        foodTotalTon: number,
        merchantAddr: string,
        referrerAddr?: string
    ) => {
        if (!escrowContract || !sender || !client) {
            console.error("[TON-Eats] Escrow contract, sender or client not ready");
            throw new Error("Contract not ready");
        }

        const oid = BigInt(orderIdInput);
        setOrderId(oid);

        // Fetch actual fees from the on-chain state
        let deliveryFeeNano = toNano(DELIVERY_FEE_TON.toFixed(9));
        let protocolFeeNano = toNano(PROTOCOL_FEE_TON.toFixed(9));

        try {
            deliveryFeeNano = await escrowContract.getGetDeliveryFee();
            protocolFeeNano = await escrowContract.getGetProtocolFee();
        } catch (err) {
            console.warn("[TON-Eats] Could not fetch on-chain fees, using fallback constants", err);
        }

        const foodNano = toNano(foodTotalTon.toFixed(9));
        const totalValueNano = foodNano + deliveryFeeNano + protocolFeeNano;
        const requiredAmount = totalValueNano + toNano("0.05"); // + 0.05 TON for gas

        // 1. Verify user's balance
        if (wallet) {
            try {
                const balanceNano = await client.getBalance(Address.parse(wallet));
                if (balanceNano < requiredAmount) {
                    throw new Error(`Insufficient funds: needed ${(Number(requiredAmount) / 1e9).toFixed(2)} TON but only have ${(Number(balanceNano) / 1e9).toFixed(2)} TON.`);
                }
            } catch (err: any) {
                if (err.message.includes("Insufficient funds")) throw err;
                console.warn("[TON-Eats] Could not fetch balance (RPC network error), proceeding anyway...", err);
            }
        }

        const params = {
            $$type: "CreateOrder" as const,
            orderId: oid,
            merchant: Address.parse(merchantAddr),
            hasReferrer: !!referrerAddr,
            referrer: referrerAddr ? Address.parse(referrerAddr) : Address.parse(merchantAddr),
        };

        console.log("[TON-Eats] Creating order →", { oid: oid.toString(), requiredAmount });

        // 2. Transact
        await escrowContract.send(sender as any, { value: requiredAmount }, params);

        // 3. Poll for on-chain state change
        console.log("[TON-Eats] Waiting for order to be released on-chain...");
        let attempts = 0;
        while (attempts < 20) {
            await new Promise(r => setTimeout(r, 3500));
            const status = await escrowContract.getGetOrderStatus(oid).catch(() => -1n);
            if (status !== -1n) {
                console.log("[TON-Eats] Order created successfully on-chain!");
                return;
            }
            attempts++;
        }
        throw new Error("Order confirmation timeout. Transaction may have failed or network is extremely congested.");
    };

    // ── acceptDelivery ────────────────────────────────────────────────────────
    const acceptDelivery = async (oidInput: bigint | string, onPhase?: (phase: AcceptPhase) => void) => {
        if (!escrowContract || !sender || !client) return;
        const oid = BigInt(oidInput);
        const requiredGas = toNano("0.08"); // 0.08 TON gas for accept (single state write)

        if (wallet) {
            try {
                const balanceNano = await client.getBalance(Address.parse(wallet));
                if (balanceNano < requiredGas) throw new Error("Insufficient funds to pay for gas fees (0.08 TON).");
            } catch (err: any) {
                if (err.message.includes("Insufficient funds")) throw err;
                console.warn("[TON-Eats] Could not fetch balance (RPC network error), proceeding anyway...", err);
            }
        }

        console.log("[TON-Eats] Courier accepting delivery →", oid.toString());
        onPhase?.("signing");

        await escrowContract.send(sender as any, { value: requiredGas }, {
            $$type: "AcceptDelivery",
            orderId: oid
        });

        console.log("[TON-Eats] TX sent, waiting for on-chain confirmation...");
        onPhase?.("confirming");

        let attempts = 0;
        while (attempts < 20) {
            await new Promise(r => setTimeout(r, 3000));
            try {
                const status = await escrowContract.getGetOrderStatus(oid);
                if (status === 1n || status === 2n) {
                    console.log("[TON-Eats] Accept confirmed on-chain!");
                    onPhase?.("confirmed");
                    return;
                }
            } catch {}
            attempts++;
        }
        // Don't throw — the tx was sent and may confirm later.
        // Caller should handle gracefully.
        console.warn("[TON-Eats] Polling timed out, but TX was sent successfully.");
        onPhase?.("confirmed"); // optimistic: tx was sent to the network
    };

    // ── getOrderStatus (manual poll) ─────────────────────────────────────────
    const getOrderStatus = async (oidInput: bigint | string): Promise<bigint | null> => {
        if (!escrowContract) return null;
        const oid = BigInt(oidInput);
        try {
            return await escrowContract.getGetOrderStatus(oid);
        } catch {
            return null;
        }
    };

    // ── confirmDelivery ───────────────────────────────────────────────────────
    const confirmDelivery = async (oidInput: bigint | string) => {
        if (!escrowContract || !sender || !client) return;
        const oid = BigInt(oidInput);

        // ── Dynamically compute gas based on the order's on-chain state ──────
        // The contract dispatches:
        //   • 1 send  → merchant  (food)
        //   • 1 send  → courier   (deliveryFee)
        //   • 1 send  → treasury  (protocolFee)          — no referrer
        //   • 2 sends → treasury + referrer (protocolFee) — with referrer
        // Each outbound message costs ~0.015 TON in forwarding fees.
        // Contract execution itself costs ~0.02–0.03 TON.
        const BASE_EXECUTION_GAS = toNano("0.03");
        const PER_SEND_FWD_FEE   = toNano("0.02");  // conservative per-message overhead
        const SAFETY_MARGIN       = toNano("0.02");

        let numSends = 3; // minimum: merchant + courier + treasury
        try {
            const orderData = await escrowContract.getGetOrder(oid);
            if (orderData && orderData.referrer) {
                numSends = 4; // extra send for referrer split
            }
        } catch {
            numSends = 4; // assume worst case on error
        }

        const requiredGas =
            BASE_EXECUTION_GAS +
            PER_SEND_FWD_FEE * BigInt(numSends) +
            SAFETY_MARGIN;

        const gasDisplay = (Number(requiredGas) / 1e9).toFixed(3);
        console.log(
            `[TON-Eats] confirmDelivery gas: ${gasDisplay} TON (${numSends} outbound sends)`
        );

        if (wallet) {
            try {
                const balanceNano = await client.getBalance(Address.parse(wallet));
                if (balanceNano < requiredGas) {
                    throw new Error(
                        `Insufficient funds to pay for gas fees (${gasDisplay} TON).`
                    );
                }
            } catch (err: any) {
                if (err.message.includes("Insufficient funds")) throw err;
                console.warn("[TON-Eats] Could not fetch balance (RPC network error), proceeding anyway...", err);
            }
        }

        console.log("[TON-Eats] Confirming delivery (Settlement) →", oid.toString());
        await escrowContract.send(sender as any, { value: requiredGas }, {
            $$type: "ConfirmDelivery",
            orderId: oid
        });

        console.log("[TON-Eats] Waiting for settlement confirm to be recorded on-chain...");
        let attempts = 0;
        while (attempts < 15) {
            await new Promise(r => setTimeout(r, 3500));
            const status = await escrowContract.getGetOrderStatus(oid).catch(() => -1n);
            if (status === 2n) return;
            attempts++;
        }
        throw new Error("On-chain confirmation timeout.");
    };

    // ── Admin: withdrawAll ───────────────────────────────────────────────────
    const withdrawAll = async () => {
        if (!escrowContract || !sender) return;
        console.log("[TON-Eats] Admin rescuing safe funds...");
        await escrowContract.send(sender as any, { value: toNano("0.05") }, "withdraw_all");
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
