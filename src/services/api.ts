/**
 * TON-Eats Backend API client
 *
 * All calls go to VITE_BACKEND_URL (default: http://localhost:3001)
 */

// If running locally in Vite dev mode, backend is at 3001.
// Otherwise (Docker / Tunnel / Prod), Nginx proxies /api and /socket.io from the same origin!
const isLocalDev = window.location.port === "5173" || window.location.port === "4173";
const BASE = import.meta.env.VITE_BACKEND_URL || (isLocalDev ? "http://localhost:3001" : window.location.origin);


export interface OrderItem {
    name: string;
    qty: number;
    priceTon: number;
}

export interface BackendOrder {
    id: string;
    storeId: string;
    orderId: string;
    buyerWallet: string;
    merchantWallet: string;
    deliveryAddress: string;
    deliveryLat: number | null;
    deliveryLng: number | null;
    storeLat: number | null;
    storeLng: number | null;
    items: OrderItem[];
    foodTotalTon: number;
    deliveryFeeTon: number;
    protocolFeeTon: number;
    referrerWallet: string | null;
    confirmCode: string;
    status: "pending" | "accepted" | "picked_up" | "delivered";
    courierWallet: string | null;
    courierLocation: { lat: number; lng: number } | null;
    createdAt: number;
    updatedAt: number;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...init,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
    }
    return res.json();
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export const api = {
    /** Get all available (pending) orders — for the courier feed */
    getAvailableOrders: () => req<BackendOrder[]>("/api/orders/available"),

    /** Get a single order by ID */
    getOrder: (id: string) => req<BackendOrder>(`/api/orders/${id}`),

    /**
     * Create a new order in the backend after initiating the on-chain TX.
     * Call this AFTER the TonConnect transaction is signed.
     */
    createOrder: (body: {
        storeId: string;
        orderId: string;
        buyerWallet: string;
        merchantWallet: string;
        deliveryAddress: string;
        deliveryLat?: number | null;
        deliveryLng?: number | null;
        storeLat?: number | null;
        storeLng?: number | null;
        items: OrderItem[];
        foodTotalTon: number;
        deliveryFeeTon: number;
        protocolFeeTon: number;
        referrerWallet?: string | null;
    }) =>
        req<BackendOrder>("/api/orders", {
            method: "POST",
            body: JSON.stringify(body),
        }),

    /** Courier accepts an order */
    acceptOrder: (orderId: string, courierWallet: string) =>
        req<BackendOrder>(`/api/orders/${orderId}/accept`, {
            method: "PATCH",
            body: JSON.stringify({ courierWallet }),
        }),

    /** Courier marks food as picked up */
    pickupOrder: (orderId: string, courierWallet: string) =>
        req<BackendOrder>(`/api/orders/${orderId}/pickup`, {
            method: "PATCH",
            body: JSON.stringify({ courierWallet }),
        }),

    /**
     * Courier enters the 4-digit code from the customer to confirm delivery.
     * Server validates and emits order:delivered → triggers on-chain confirmDelivery()
     */
    confirmDelivery: (orderId: string, courierWallet: string, code: string) =>
        req<BackendOrder>(`/api/orders/${orderId}/confirm`, {
            method: "POST",
            body: JSON.stringify({ courierWallet, code }),
        }),

    // ─── Merchants & Prices ──────────────────────────────────────────────────────

    getTonUsdRate: () => req<{ priceUsd: number }>("/api/prices/ton-usdt"),

    getMerchants: () => req<any[]>("/api/merchants"),

    getMerchant: (id: string) => req<any>(`/api/merchants/${id}`),

    onboardMerchant: (data: any) =>
        req<any>("/api/merchants", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    /** Get all orders for a specific buyer wallet */
    getOrdersByWallet: (address: string) =>
        req<BackendOrder[]>(`/api/orders/wallet/${address}`),
};
