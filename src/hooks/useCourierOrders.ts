/**
 * useCourierOrders
 *
 * Fetches REAL open orders from the TON-Eats escrow contract by:
 *  1. Scanning inbound messages to the escrow contract address via TON API v2
 *  2. Decoding "create_order" (op=1) messages to extract order ID, addresses, fees
 *  3. Checking each order's status (0 = Open, 1 = Accepted, 2 = Delivered)
 *     → only Open orders are shown to the courier
 *
 * Also computes real earnings by scanning the courier's own wallet for inbound
 * transfers that originate from the escrow contract address.
 */

import { useEffect, useState, useCallback } from "react";
import { Address, Cell, Slice, toNano } from "ton-core";
import { CHAIN } from "@tonconnect/protocol";
import { DELIVERY_FEE_TON, PROTOCOL_FEE_TON } from "./useTONEatsEscrow";

// ─── Constants ────────────────────────────────────────────────────────────────

const ESCROW_MAINNET = import.meta.env.VITE_ESCROW_CONTRACT_MAINNET ?? "EQBPEDbGdwaLv1DKntg9r6SjFIVplSaSJoJ-TVLe_2rqBOmH";
const ESCROW_TESTNET = import.meta.env.VITE_ESCROW_CONTRACT_TESTNET ?? "EQDqG9wGloibyVfZNcPp7ROaJKARwJVjarfG25dt__aw6PUd";

const TONAPI_BASE_MAINNET = "https://tonapi.io";
const TONAPI_BASE_TESTNET = "https://testnet.tonapi.io";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnChainOrder {
    orderId: bigint;
    /** Encoded as "0xRaw" from TON API */
    merchantAddress: string;
    deliveryFeeNano: bigint;
    protocolFeeNano: bigint;
    hasReferrer: boolean;
    referrerAddress: string | null;
    /** Estimated total locked = food + deliveryFee + protocolFee (in nano-TON) */
    totalValueNano: bigint;
    /** Unix timestamp of the original tx */
    timestamp: number;
}

export interface CourierEarnings {
    todayTON: number;
    weekTON: number;
    totalTON: number;
    deliveryCount: number;
}

export interface UseCourierOrdersReturn {
    orders: OnChainOrder[];
    earnings: CourierEarnings;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function apiBase(network: CHAIN | null) {
    return network === CHAIN.MAINNET ? TONAPI_BASE_MAINNET : TONAPI_BASE_TESTNET;
}

function escrowAddress(network: CHAIN | null) {
    return network === CHAIN.MAINNET ? ESCROW_MAINNET : ESCROW_TESTNET;
}

/**
 * Decode a create_order body cell (op=1).
 * Layout: op(32) query_id(64) orderId(64) merchant(addr)
 *         hasReferrer(1bit) referrer(addr)
 */
function decodeCreateOrder(bodyBase64: string): Omit<
    OnChainOrder,
    "timestamp" | "totalValueNano"
> | null {
    try {
        const cell = Cell.fromBase64(bodyBase64);
        const s: Slice = cell.beginParse();
        const op = s.loadUint(32);
        if (op !== 1) return null;           // not create_order
        s.loadUint(64);                      // query_id
        const orderId = s.loadUintBig(64);
        const merchantAddress = s.loadAddress().toString();
        const hasReferrer = s.loadBit();
        const deliveryFeeNano = toNano(DELIVERY_FEE_TON.toFixed(9));
        const protocolFeeNano = toNano(PROTOCOL_FEE_TON.toFixed(9));
        let referrerAddress: string | null = null;
        if (hasReferrer) {
            referrerAddress = s.loadAddress().toString();
        }
        return {
            orderId,
            merchantAddress,
            deliveryFeeNano,
            protocolFeeNano,
            hasReferrer,
            referrerAddress,
        };
    } catch {
        return null;
    }
}

/** Convert nano-TON to TON */
const fromNano = (n: bigint) => Number(n) / 1e9;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCourierOrders(
    network: CHAIN | null,
    courierWallet: string | null
): UseCourierOrdersReturn {
    const [orders, setOrders] = useState<OnChainOrder[]>([]);
    const [earnings, setEarnings] = useState<CourierEarnings>({
        todayTON: 0,
        weekTON: 0,
        totalTON: 0,
        deliveryCount: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (!network) return;
        setLoading(true);
        setError(null);

        const base = apiBase(network);
        const escrow = escrowAddress(network);

        try {
            // ── 1. Fetch last 100 inbound messages to the escrow contract ──────────
            const txRes = await window.fetch(
                `${base}/v2/blockchain/accounts/${encodeURIComponent(escrow)}/transactions?limit=100&sort_order=desc`
            );

            if (!txRes.ok) {
                throw new Error(`TonAPI error: ${txRes.status} ${txRes.statusText}`);
            }

            const txJson = await txRes.json();
            const transactions: any[] = txJson.transactions ?? [];

            // ── 2. Decode create_order messages ────────────────────────────────────
            const openOrders: OnChainOrder[] = [];

            for (const tx of transactions) {
                const inMsg = tx.in_msg;
                if (!inMsg?.raw_body) continue;

                const decoded = decodeCreateOrder(inMsg.raw_body);
                if (!decoded) continue;

                // value = amount sent in nano-TON (includes food + fees)
                const totalValueNano = BigInt(inMsg.value ?? "0");

                openOrders.push({
                    ...decoded,
                    totalValueNano,
                    timestamp: tx.utime ?? Math.floor(Date.now() / 1000),
                });
            }

            // De-duplicate by orderId (keep latest)
            const seen = new Set<string>();
            const unique = openOrders.filter((o) => {
                const key = o.orderId.toString();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            // ── 3. Filter to only Open orders (status == 0) ───────────────────────
            // We query each order status in parallel, best-effort.
            const withStatus = await Promise.allSettled(
                unique.map(async (order) => {
                    try {
                        // Call get_order_status via TON API v2 run_get_method
                        const res = await window.fetch(
                            `${base}/v2/blockchain/accounts/${encodeURIComponent(escrow)}/methods/get_order_status`,
                            {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    stack: [{ type: "num", value: order.orderId.toString() }],
                                }),
                            }
                        );
                        if (!res.ok) return { order, status: 0 }; // assume open on error
                        const json = await res.json();
                        const status = Number(json.stack?.[0]?.num ?? 0);
                        return { order, status };
                    } catch {
                        return { order, status: 0 };
                    }
                })
            );

            const openOnly = withStatus
                .filter(
                    (r): r is PromiseFulfilledResult<{ order: OnChainOrder; status: number }> =>
                        r.status === "fulfilled"
                )
                .filter((r) => r.value.status === 0)   // 0 = Open
                .map((r) => r.value.order);

            setOrders(openOnly);

            // ── 4. Compute real earnings from courier wallet ───────────────────────
            if (courierWallet) {
                const earningsRes = await window.fetch(
                    `${base}/v2/blockchain/accounts/${encodeURIComponent(courierWallet)}/transactions?limit=200&sort_order=desc`
                );
                const earningsJson = await earningsRes.json();
                const walletTxs: any[] = earningsJson.transactions ?? [];

                const now = Math.floor(Date.now() / 1000);
                const dayAgo = now - 86400;
                const weekAgo = now - 7 * 86400;

                let todayTON = 0;
                let weekTON = 0;
                let totalTON = 0;
                let deliveryCount = 0;

                for (const tx of walletTxs) {
                    const inMsg = tx.in_msg;
                    if (!inMsg) continue;

                    // Only count inbound transfers from the escrow contract
                    const srcAddr: string = inMsg.source?.address ?? "";
                    if (!srcAddr) continue;

                    let isFromEscrow = false;
                    try {
                        const parsed = Address.parse(srcAddr).toString();
                        const escrowParsed = Address.parse(escrow).toString();
                        isFromEscrow = parsed === escrowParsed;
                    } catch {
                        isFromEscrow = false;
                    }

                    if (!isFromEscrow) continue;

                    const amountNano = BigInt(inMsg.value ?? "0");
                    const amountTON = fromNano(amountNano);
                    const utime: number = tx.utime ?? 0;

                    totalTON += amountTON;
                    deliveryCount++;
                    if (utime >= weekAgo) weekTON += amountTON;
                    if (utime >= dayAgo) todayTON += amountTON;
                }

                setEarnings({
                    todayTON: parseFloat(todayTON.toFixed(2)),
                    weekTON: parseFloat(weekTON.toFixed(2)),
                    totalTON: parseFloat(totalTON.toFixed(2)),
                    deliveryCount,
                });
            }
        } catch (e: any) {
            setError(e?.message ?? "Failed to fetch orders");
        } finally {
            setLoading(false);
        }
    }, [network, courierWallet]);

    useEffect(() => {
        if (network) fetch();
        // Refresh every 30 seconds
        const interval = setInterval(() => {
            if (network) fetch();
        }, 30_000);
        return () => clearInterval(interval);
    }, [fetch, network]);

    return { orders, earnings, loading, error, refetch: fetch };
}
