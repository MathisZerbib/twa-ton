/**
 * TON-Eats Escrow Smart Contract Interface
 *
 * This class models the on-chain TON-Eats escrow contract.
 * When a user places an order, the full payment is locked in this contract.
 * Upon confirmed delivery, the balance is split between:
 *   - Merchant (food price)
 *   - Courier  (delivery fee)
 *   - Protocol Treasury (service fee for MRR)
 *   - Referrer (optional micro-cashback deducted from the treasury share)
 *
 * Op-codes:
 *   1 = create_order
 *   2 = accept_delivery   (called by courier)
 *   3 = confirm_delivery  (called by buyer – triggers settlement)
 *
 * NOTE: This is the frontend ABI wrapper. The actual FunC/Tact contract
 * must be deployed separately and its address provided in useTONEatsEscrow.ts.
 * Uses ton-core (legacy) to stay consistent with the existing codebase.
 */

import {
    Contract,
    ContractProvider,
    Sender,
    Address,
    Cell,
    contractAddress,
    beginCell,
    toNano,
} from "ton-core";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateOrderParams {
    /** Unique order ID (uint64) */
    orderId: bigint;
    /** Restaurant/merchant wallet address */
    merchantAddress: Address;
    /** Delivery fee in nano-TON sent to the courier */
    deliveryFeeNano: bigint;
    /** Protocol service fee in nano-TON sent to the treasury */
    protocolFeeNano: bigint;
    /**
     * Optional referrer wallet address for the viral share loop.
     * If provided, 50% of the protocol fee goes to the referrer
     * (deducted from the treasury share).
     */
    referrerAddress?: Address;
}

export interface OrderStatus {
    orderId: bigint;
    /** 0=Open, 1=Accepted, 2=Delivered */
    status: number;
    merchantAddress: string;
    courierAddress: string | null;
}

// ─── Contract ABI ─────────────────────────────────────────────────────────────

export default class TONEatsEscrow implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) { }

    /**
     * Factory for local deploy (dev/testnet).
     * In production the contract is pre-deployed and accessed by address directly.
     */
    static createForDeploy(
        code: Cell,
        treasuryAddress: Address
    ): TONEatsEscrow {
        const data = beginCell()
            .storeAddress(treasuryAddress)
            .storeUint(0, 64) // nextOrderId counter
            .endCell();
        const workchain = 0;
        const address = contractAddress(workchain, { code, data });
        return new TONEatsEscrow(address, { code, data });
    }

    /** Deploy the contract – send a small amount to initialise storage */
    async sendDeploy(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: toNano("0.05"),
            bounce: false,
        });
    }

    /**
     * Op 1 – create_order
     *
     * The caller must send: foodTotal + deliveryFee + protocolFee (in nano-TON)
     * plus a small gas surplus (0.02 TON).
     * The contract records all parties and locks the value.
     */
    async sendCreateOrder(
        provider: ContractProvider,
        via: Sender,
        params: CreateOrderParams,
        /** Total food+fees value in nano-TON (gas is added internally) */
        totalValueNano: bigint
    ) {
        const hasReferrer = !!params.referrerAddress;

        const body = beginCell()
            .storeUint(1, 32)           // op: create_order
            .storeUint(0, 64)           // query_id
            .storeUint(params.orderId, 64)
            .storeAddress(params.merchantAddress)
            .storeCoins(params.deliveryFeeNano)
            .storeCoins(params.protocolFeeNano)
            .storeBit(hasReferrer)
            // Store referrer OR merchant as placeholder when no referrer
            .storeAddress(hasReferrer ? params.referrerAddress! : params.merchantAddress)
            .endCell();

        await provider.internal(via, {
            value: totalValueNano + toNano("0.02"), // +gas
            body,
        });
    }

    /**
     * Op 2 – accept_delivery
     *
     * Called by the courier to self-assign to an open order.
     * Caller's address is read from msg.sender on-chain.
     * Attach ~0.01 TON gas.
     */
    async sendAcceptDelivery(
        provider: ContractProvider,
        via: Sender,
        orderId: bigint
    ) {
        const body = beginCell()
            .storeUint(2, 32)   // op: accept_delivery
            .storeUint(0, 64)   // query_id
            .storeUint(orderId, 64)
            .endCell();

        await provider.internal(via, {
            value: toNano("0.01"),
            body,
        });
    }

    /**
     * Op 3 – confirm_delivery
     *
     * Called by the buyer to confirm the order was received.
     * The contract automatically splits the locked funds:
     *   1. foodAmount    → merchantAddress
     *   2. deliveryFee   → courierAddress
     *   3. protocolFee×0.5 → referrerAddress (if set)
     *   4. remaining protocolFee → treasuryAddress
     *
     * Attach ~0.01 TON gas.
     */
    async sendConfirmDelivery(
        provider: ContractProvider,
        via: Sender,
        orderId: bigint
    ) {
        const body = beginCell()
            .storeUint(3, 32)   // op: confirm_delivery
            .storeUint(0, 64)   // query_id
            .storeUint(orderId, 64)
            .endCell();

        await provider.internal(via, {
            value: toNano("0.01"),
            body,
        });
    }

    /**
     * Getter – get_order_status(orderId)
     * Expected returns from the FunC contract:
     *   status (int)  ·  merchant (MsgAddress)  ·  courier (MsgAddress | null)
     */
    async getOrderStatus(
        provider: ContractProvider,
        orderId: bigint
    ): Promise<OrderStatus> {
        const { stack } = await provider.get("get_order_status", [
            { type: "int", value: orderId },
        ]);
        const status = Number(stack.readBigNumber());
        const merchantAddress = stack.readAddress().toString();
        // Courier address may be null if not yet assigned
        let courierAddress: string | null = null;
        try {
            courierAddress = stack.readAddress().toString();
        } catch {
            courierAddress = null;
        }
        return { orderId, status, merchantAddress, courierAddress };
    }
}
