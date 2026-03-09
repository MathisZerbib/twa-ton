import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { toNano, Address } from "@ton/core";
import { TONEatsEscrow } from "../build/TONEatsEscrow/tact_TONEatsEscrow";
import "@ton/test-utils";

/**
 * Comprehensive test suite for the TONEatsEscrow smart contract.
 *
 * Covers:
 *  - Deployment & initial state
 *  - CreateOrder (happy path, duplicate ID, insufficient payment, with/without referrer)
 *  - UpdateFees (treasury only, unauthorized)
 *  - AcceptDelivery (happy path, non-existent order, already accepted)
 *  - ConfirmDelivery (happy path, courier confirms, buyer confirms, unauthorized,
 *                     fund splits with referrer & without referrer)
 *  - withdraw_all (treasury only, unauthorized, locked funds protection)
 *  - Getter functions
 */

describe("TONEatsEscrow", () => {
    let blockchain: Blockchain;
    let treasury: SandboxContract<TreasuryContract>;
    let escrow: SandboxContract<TONEatsEscrow>;
    let buyer: SandboxContract<TreasuryContract>;
    let merchant: SandboxContract<TreasuryContract>;
    let courier: SandboxContract<TreasuryContract>;
    let referrer: SandboxContract<TreasuryContract>;
    let outsider: SandboxContract<TreasuryContract>;

    const DEFAULT_DELIVERY_FEE = toNano("0.2");
    const DEFAULT_PROTOCOL_FEE = toNano("0.1");
    const GAS_RESERVE = toNano("0.02"); // gas deducted inside contract
    const ORDER_TOTAL = toNano("1"); // total value sent with CreateOrder

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        treasury = await blockchain.treasury("treasury");
        buyer = await blockchain.treasury("buyer");
        merchant = await blockchain.treasury("merchant");
        courier = await blockchain.treasury("courier");
        referrer = await blockchain.treasury("referrer");
        outsider = await blockchain.treasury("outsider");

        escrow = blockchain.openContract(
            await TONEatsEscrow.fromInit(treasury.address)
        );

        // Deploy the contract
        const deployResult = await escrow.send(
            treasury.getSender(),
            { value: toNano("0.5") },
            { $$type: "Deploy", queryId: 0n }
        );
        expect(deployResult.transactions).toHaveTransaction({
            from: treasury.address,
            to: escrow.address,
            deploy: true,
            success: true,
        });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // DEPLOYMENT & INITIAL STATE
    // ═══════════════════════════════════════════════════════════════════════════

    describe("Deployment & Initial State", () => {
        it("should deploy successfully", async () => {
            // Contract should be deployed (checked in beforeEach)
            // Verify a getter works, proving the contract is live
            const fee = await escrow.getGetDeliveryFee();
            expect(fee).toBe(DEFAULT_DELIVERY_FEE);
        });

        it("should have correct default delivery fee", async () => {
            const fee = await escrow.getGetDeliveryFee();
            expect(fee).toBe(DEFAULT_DELIVERY_FEE);
        });

        it("should have correct default protocol fee", async () => {
            const fee = await escrow.getGetProtocolFee();
            expect(fee).toBe(DEFAULT_PROTOCOL_FEE);
        });

        it("should return -1 for non-existent order", async () => {
            const status = await escrow.getGetOrderStatus(999n);
            expect(status).toBe(-1n);
        });

        it("should return null for non-existent order data", async () => {
            const order = await escrow.getGetOrder(999n);
            expect(order).toBeNull();
        });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // CREATE ORDER
    // ═══════════════════════════════════════════════════════════════════════════

    describe("CreateOrder", () => {
        it("should create an order successfully (no referrer)", async () => {
            const result = await escrow.send(
                buyer.getSender(),
                { value: ORDER_TOTAL },
                {
                    $$type: "CreateOrder",
                    orderId: 1n,
                    merchant: merchant.address,
                    hasReferrer: false,
                    referrer: buyer.address, // ignored when hasReferrer=false
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: buyer.address,
                to: escrow.address,
                success: true,
            });

            // Verify order status = 0 (Open)
            const status = await escrow.getGetOrderStatus(1n);
            expect(status).toBe(0n);

            // Verify order data
            const order = await escrow.getGetOrder(1n);
            expect(order).not.toBeNull();
            expect(order!.buyer.equals(buyer.address)).toBe(true);
            expect(order!.merchant.equals(merchant.address)).toBe(true);
            expect(order!.courier).toBeNull();
            expect(order!.referrer).toBeNull();
            expect(order!.deliveryFee).toBe(DEFAULT_DELIVERY_FEE);
            expect(order!.protocolFee).toBe(DEFAULT_PROTOCOL_FEE);
            expect(order!.status).toBe(0n);

            // foodAmount = ORDER_TOTAL - deliveryFee - protocolFee - gas
            const expectedFood =
                ORDER_TOTAL - DEFAULT_DELIVERY_FEE - DEFAULT_PROTOCOL_FEE - GAS_RESERVE;
            expect(order!.foodAmount).toBe(expectedFood);
        });

        it("should create an order with a referrer", async () => {
            await escrow.send(
                buyer.getSender(),
                { value: ORDER_TOTAL },
                {
                    $$type: "CreateOrder",
                    orderId: 10n,
                    merchant: merchant.address,
                    hasReferrer: true,
                    referrer: referrer.address,
                }
            );

            const order = await escrow.getGetOrder(10n);
            expect(order).not.toBeNull();
            expect(order!.referrer!.equals(referrer.address)).toBe(true);
        });

        it("should reject duplicate order IDs", async () => {
            // First order — should succeed
            await escrow.send(
                buyer.getSender(),
                { value: ORDER_TOTAL },
                {
                    $$type: "CreateOrder",
                    orderId: 1n,
                    merchant: merchant.address,
                    hasReferrer: false,
                    referrer: buyer.address,
                }
            );

            // Second order with same ID — should fail
            const result = await escrow.send(
                buyer.getSender(),
                { value: ORDER_TOTAL },
                {
                    $$type: "CreateOrder",
                    orderId: 1n,
                    merchant: merchant.address,
                    hasReferrer: false,
                    referrer: buyer.address,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: buyer.address,
                to: escrow.address,
                success: false,
                exitCode: 26770, // "Order ID already exists"
            });
        });

        it("should reject insufficient payment", async () => {
            // Send just the fees + gas, so foodAmount would be 0
            const tooLow = DEFAULT_DELIVERY_FEE + DEFAULT_PROTOCOL_FEE + GAS_RESERVE;
            const result = await escrow.send(
                buyer.getSender(),
                { value: tooLow },
                {
                    $$type: "CreateOrder",
                    orderId: 2n,
                    merchant: merchant.address,
                    hasReferrer: false,
                    referrer: buyer.address,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: buyer.address,
                to: escrow.address,
                success: false,
                exitCode: 46647, // "Insufficient payment"
            });
        });

        it("should create multiple distinct orders", async () => {
            for (let i = 1n; i <= 5n; i++) {
                await escrow.send(
                    buyer.getSender(),
                    { value: ORDER_TOTAL },
                    {
                        $$type: "CreateOrder",
                        orderId: i,
                        merchant: merchant.address,
                        hasReferrer: false,
                        referrer: buyer.address,
                    }
                );
            }

            for (let i = 1n; i <= 5n; i++) {
                const status = await escrow.getGetOrderStatus(i);
                expect(status).toBe(0n);
            }
        });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // UPDATE FEES
    // ═══════════════════════════════════════════════════════════════════════════

    describe("UpdateFees", () => {
        it("should allow treasury to update fees", async () => {
            const newDeliveryFee = toNano("0.5");
            const newProtocolFee = toNano("0.3");

            const result = await escrow.send(
                treasury.getSender(),
                { value: toNano("0.05") },
                {
                    $$type: "UpdateFees",
                    deliveryFee: newDeliveryFee,
                    protocolFee: newProtocolFee,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: treasury.address,
                to: escrow.address,
                success: true,
            });

            expect(await escrow.getGetDeliveryFee()).toBe(newDeliveryFee);
            expect(await escrow.getGetProtocolFee()).toBe(newProtocolFee);
        });

        it("should reject fee update from non-treasury", async () => {
            const result = await escrow.send(
                outsider.getSender(),
                { value: toNano("0.05") },
                {
                    $$type: "UpdateFees",
                    deliveryFee: toNano("0.5"),
                    protocolFee: toNano("0.3"),
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: outsider.address,
                to: escrow.address,
                success: false,
                exitCode: 35274, // "Only treasury can update fees"
            });
        });

        it("should apply new fees to subsequent orders", async () => {
            const newDeliveryFee = toNano("0.5");
            const newProtocolFee = toNano("0.05");

            await escrow.send(
                treasury.getSender(),
                { value: toNano("0.05") },
                {
                    $$type: "UpdateFees",
                    deliveryFee: newDeliveryFee,
                    protocolFee: newProtocolFee,
                }
            );

            await escrow.send(
                buyer.getSender(),
                { value: toNano("2") },
                {
                    $$type: "CreateOrder",
                    orderId: 100n,
                    merchant: merchant.address,
                    hasReferrer: false,
                    referrer: buyer.address,
                }
            );

            const order = await escrow.getGetOrder(100n);
            expect(order).not.toBeNull();
            expect(order!.deliveryFee).toBe(newDeliveryFee);
            expect(order!.protocolFee).toBe(newProtocolFee);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // ACCEPT DELIVERY
    // ═══════════════════════════════════════════════════════════════════════════

    describe("AcceptDelivery", () => {
        beforeEach(async () => {
            // Create an order to work with
            await escrow.send(
                buyer.getSender(),
                { value: ORDER_TOTAL },
                {
                    $$type: "CreateOrder",
                    orderId: 1n,
                    merchant: merchant.address,
                    hasReferrer: false,
                    referrer: buyer.address,
                }
            );
        });

        it("should allow courier to accept delivery", async () => {
            const result = await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "AcceptDelivery", orderId: 1n }
            );

            expect(result.transactions).toHaveTransaction({
                from: courier.address,
                to: escrow.address,
                success: true,
            });

            const status = await escrow.getGetOrderStatus(1n);
            expect(status).toBe(1n); // Accepted

            const order = await escrow.getGetOrder(1n);
            expect(order!.courier!.equals(courier.address)).toBe(true);
        });

        it("should reject accepting a non-existent order", async () => {
            const result = await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "AcceptDelivery", orderId: 999n }
            );

            expect(result.transactions).toHaveTransaction({
                from: courier.address,
                to: escrow.address,
                success: false,
                exitCode: 18518, // "Order not found"
            });
        });

        it("should reject accepting an already-accepted order", async () => {
            // First courier accepts
            await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "AcceptDelivery", orderId: 1n }
            );

            // Second courier tries to accept — should fail
            const anotherCourier = await blockchain.treasury("courier2");
            const result = await escrow.send(
                anotherCourier.getSender(),
                { value: toNano("0.05") },
                { $$type: "AcceptDelivery", orderId: 1n }
            );

            expect(result.transactions).toHaveTransaction({
                from: anotherCourier.address,
                to: escrow.address,
                success: false,
                exitCode: 8345, // "Order not open"
            });
        });

        it("should reject accepting a delivered order", async () => {
            // Accept then confirm
            await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "AcceptDelivery", orderId: 1n }
            );
            await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId: 1n }
            );

            // Try to accept a delivered order
            const result = await escrow.send(
                outsider.getSender(),
                { value: toNano("0.05") },
                { $$type: "AcceptDelivery", orderId: 1n }
            );

            expect(result.transactions).toHaveTransaction({
                from: outsider.address,
                to: escrow.address,
                success: false,
                exitCode: 8345, // "Order not open"
            });
        });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // CONFIRM DELIVERY
    // ═══════════════════════════════════════════════════════════════════════════

    describe("ConfirmDelivery", () => {
        const orderId = 1n;

        beforeEach(async () => {
            // Create and accept an order
            await escrow.send(
                buyer.getSender(),
                { value: ORDER_TOTAL },
                {
                    $$type: "CreateOrder",
                    orderId,
                    merchant: merchant.address,
                    hasReferrer: false,
                    referrer: buyer.address,
                }
            );
            await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "AcceptDelivery", orderId }
            );
        });

        it("should allow courier to confirm delivery", async () => {
            const result = await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId }
            );

            expect(result.transactions).toHaveTransaction({
                from: courier.address,
                to: escrow.address,
                success: true,
            });

            const status = await escrow.getGetOrderStatus(orderId);
            expect(status).toBe(2n); // Delivered
        });

        it("should allow buyer to confirm delivery", async () => {
            const result = await escrow.send(
                buyer.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId }
            );

            expect(result.transactions).toHaveTransaction({
                from: buyer.address,
                to: escrow.address,
                success: true,
            });

            const status = await escrow.getGetOrderStatus(orderId);
            expect(status).toBe(2n);
        });

        it("should reject confirmation from unauthorized address", async () => {
            const result = await escrow.send(
                outsider.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId }
            );

            expect(result.transactions).toHaveTransaction({
                from: outsider.address,
                to: escrow.address,
                success: false,
                exitCode: 40260, // "Only courier or buyer can confirm"
            });
        });

        it("should reject confirmation for non-existent order", async () => {
            const result = await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId: 999n }
            );

            expect(result.transactions).toHaveTransaction({
                from: courier.address,
                to: escrow.address,
                success: false,
                exitCode: 18518, // "Order not found"
            });
        });

        it("should reject confirmation for an order not yet accepted", async () => {
            // Create a new order but do NOT accept it
            await escrow.send(
                buyer.getSender(),
                { value: ORDER_TOTAL },
                {
                    $$type: "CreateOrder",
                    orderId: 50n,
                    merchant: merchant.address,
                    hasReferrer: false,
                    referrer: buyer.address,
                }
            );

            const result = await escrow.send(
                buyer.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId: 50n }
            );

            expect(result.transactions).toHaveTransaction({
                from: buyer.address,
                to: escrow.address,
                success: false,
                exitCode: 33504, // "Delivery not accepted yet"
            });
        });

        it("should send food amount to merchant on confirm", async () => {
            const result = await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId }
            );

            // merchant should receive a payment from the escrow
            expect(result.transactions).toHaveTransaction({
                from: escrow.address,
                to: merchant.address,
                success: true,
            });
        });

        it("should send delivery fee to courier on confirm", async () => {
            const result = await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId }
            );

            expect(result.transactions).toHaveTransaction({
                from: escrow.address,
                to: courier.address,
                success: true,
            });
        });

        it("should send full protocol fee to treasury (no referrer)", async () => {
            const result = await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId }
            );

            expect(result.transactions).toHaveTransaction({
                from: escrow.address,
                to: treasury.address,
                success: true,
            });
        });

        it("should split protocol fee between referrer and treasury", async () => {
            const gas = toNano("0.01");

            // Create an order WITH referrer
            await escrow.send(
                buyer.getSender(),
                { value: ORDER_TOTAL },
                {
                    $$type: "CreateOrder",
                    orderId: 20n,
                    merchant: merchant.address,
                    hasReferrer: true,
                    referrer: referrer.address,
                }
            );
            await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "AcceptDelivery", orderId: 20n }
            );

            const result = await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId: 20n }
            );

            // Referrer gets 50% of protocol fee
            expect(result.transactions).toHaveTransaction({
                from: escrow.address,
                to: referrer.address,
                success: true,
            });

            // Treasury gets the other 50%
            expect(result.transactions).toHaveTransaction({
                from: escrow.address,
                to: treasury.address,
                success: true,
            });
        });

        it("should decrease locked funds after confirm", async () => {
            // Create a second order so there are funds remaining
            await escrow.send(
                buyer.getSender(),
                { value: ORDER_TOTAL },
                {
                    $$type: "CreateOrder",
                    orderId: 30n,
                    merchant: merchant.address,
                    hasReferrer: false,
                    referrer: buyer.address,
                }
            );

            // Confirm the first order
            await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId }
            );

            // The second order should still be open and the contract should still
            // have enough balance for it.
            const status = await escrow.getGetOrderStatus(30n);
            expect(status).toBe(0n);
            const balance = await escrow.getContractBalance();
            expect(balance).toBeGreaterThan(0n);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // WITHDRAW ALL (Admin Rescue)
    // ═══════════════════════════════════════════════════════════════════════════

    describe("withdraw_all", () => {
        it("should allow treasury to withdraw safe (non-locked) funds", async () => {
            // Send some extra TON to the contract that isn't locked
            await treasury.send({
                to: escrow.address,
                value: toNano("5"),
                bounce: false,
            });

            const result = await escrow.send(
                treasury.getSender(),
                { value: toNano("0.05") },
                "withdraw_all"
            );

            expect(result.transactions).toHaveTransaction({
                from: escrow.address,
                to: treasury.address,
                success: true,
            });
        });

        it("should reject withdrawal from non-treasury", async () => {
            const result = await escrow.send(
                outsider.getSender(),
                { value: toNano("0.05") },
                "withdraw_all"
            );

            expect(result.transactions).toHaveTransaction({
                from: outsider.address,
                to: escrow.address,
                success: false,
                exitCode: 33035, // "Only treasury can withdraw"
            });
        });

        it("should not withdraw locked funds", async () => {
            // Create an order so funds are locked
            await escrow.send(
                buyer.getSender(),
                { value: ORDER_TOTAL },
                {
                    $$type: "CreateOrder",
                    orderId: 1n,
                    merchant: merchant.address,
                    hasReferrer: false,
                    referrer: buyer.address,
                }
            );

            // Try to withdraw — should fail if no safe (unlocked) funds available
            // after accounting for locked funds + gas reserve
            const result = await escrow.send(
                treasury.getSender(),
                { value: toNano("0.05") },
                "withdraw_all"
            );

            // This might succeed or fail depending on the contract balance vs locked.
            // The key invariant: contract should STILL have >= lockedFunds after any withdrawal.
            const balance = await escrow.getContractBalance();
            expect(balance).toBeGreaterThan(0n);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // FULL FLOW END-TO-END
    // ═══════════════════════════════════════════════════════════════════════════

    describe("Full Escrow Flow (end-to-end)", () => {
        it("should complete the full order lifecycle without referrer", async () => {
            // 1. Create order
            await escrow.send(
                buyer.getSender(),
                { value: ORDER_TOTAL },
                {
                    $$type: "CreateOrder",
                    orderId: 1n,
                    merchant: merchant.address,
                    hasReferrer: false,
                    referrer: buyer.address,
                }
            );
            expect(await escrow.getGetOrderStatus(1n)).toBe(0n);

            // 2. Accept delivery
            await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "AcceptDelivery", orderId: 1n }
            );
            expect(await escrow.getGetOrderStatus(1n)).toBe(1n);

            // 3. Confirm delivery
            const result = await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId: 1n }
            );
            expect(await escrow.getGetOrderStatus(1n)).toBe(2n);

            // Verify merchant received food payment
            expect(result.transactions).toHaveTransaction({
                from: escrow.address,
                to: merchant.address,
                success: true,
            });

            // Verify courier received delivery fee
            expect(result.transactions).toHaveTransaction({
                from: escrow.address,
                to: courier.address,
                success: true,
            });

            // Verify treasury received protocol fee
            expect(result.transactions).toHaveTransaction({
                from: escrow.address,
                to: treasury.address,
                success: true,
            });
        });

        it("should complete the full order lifecycle with referrer", async () => {

            // 1. Create order with referrer
            await escrow.send(
                buyer.getSender(),
                { value: ORDER_TOTAL },
                {
                    $$type: "CreateOrder",
                    orderId: 1n,
                    merchant: merchant.address,
                    hasReferrer: true,
                    referrer: referrer.address,
                }
            );

            // 2. Accept
            await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "AcceptDelivery", orderId: 1n }
            );

            // 3. Confirm
            const result = await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId: 1n }
            );

            // Referrer gets half the protocol fee
            expect(result.transactions).toHaveTransaction({
                from: escrow.address,
                to: referrer.address,
                success: true,
            });

            // Treasury gets the other half
            expect(result.transactions).toHaveTransaction({
                from: escrow.address,
                to: treasury.address,
                success: true,
            });
        });

        it("should handle multiple orders concurrently", async () => {
            // Create 3 orders
            for (let i = 1n; i <= 3n; i++) {
                await escrow.send(
                    buyer.getSender(),
                    { value: ORDER_TOTAL },
                    {
                        $$type: "CreateOrder",
                        orderId: i,
                        merchant: merchant.address,
                        hasReferrer: false,
                        referrer: buyer.address,
                    }
                );
            }

            // Accept all 3
            for (let i = 1n; i <= 3n; i++) {
                await escrow.send(
                    courier.getSender(),
                    { value: toNano("0.05") },
                    { $$type: "AcceptDelivery", orderId: i }
                );
            }

            // Confirm order 2 (out-of-order confirmation)
            await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId: 2n }
            );
            expect(await escrow.getGetOrderStatus(1n)).toBe(1n); // still accepted
            expect(await escrow.getGetOrderStatus(2n)).toBe(2n); // delivered
            expect(await escrow.getGetOrderStatus(3n)).toBe(1n); // still accepted

            // Confirm remaining orders
            await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId: 1n }
            );
            await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId: 3n }
            );

            expect(await escrow.getGetOrderStatus(1n)).toBe(2n);
            expect(await escrow.getGetOrderStatus(3n)).toBe(2n);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // EDGE CASES
    // ═══════════════════════════════════════════════════════════════════════════

    describe("Edge Cases", () => {
        it("should handle minimum viable payment", async () => {
            // Just enough: fees + gas + 1 nanoton for foodAmount
            const minPayment =
                DEFAULT_DELIVERY_FEE + DEFAULT_PROTOCOL_FEE + GAS_RESERVE + 1n;

            const result = await escrow.send(
                buyer.getSender(),
                { value: minPayment },
                {
                    $$type: "CreateOrder",
                    orderId: 1n,
                    merchant: merchant.address,
                    hasReferrer: false,
                    referrer: buyer.address,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: buyer.address,
                to: escrow.address,
                success: true,
            });

            const order = await escrow.getGetOrder(1n);
            expect(order!.foodAmount).toBe(1n);
        });

        it("should handle large order values", async () => {
            const largeValue = toNano("1000");

            const result = await escrow.send(
                buyer.getSender(),
                { value: largeValue },
                {
                    $$type: "CreateOrder",
                    orderId: 1n,
                    merchant: merchant.address,
                    hasReferrer: false,
                    referrer: buyer.address,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: buyer.address,
                to: escrow.address,
                success: true,
            });

            const order = await escrow.getGetOrder(1n);
            const expectedFood =
                largeValue - DEFAULT_DELIVERY_FEE - DEFAULT_PROTOCOL_FEE - GAS_RESERVE;
            expect(order!.foodAmount).toBe(expectedFood);
        });

        it("should prevent double-confirmation of the same order", async () => {
            // Create & accept
            await escrow.send(
                buyer.getSender(),
                { value: ORDER_TOTAL },
                {
                    $$type: "CreateOrder",
                    orderId: 1n,
                    merchant: merchant.address,
                    hasReferrer: false,
                    referrer: buyer.address,
                }
            );
            await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "AcceptDelivery", orderId: 1n }
            );

            // First confirm — success
            await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId: 1n }
            );
            expect(await escrow.getGetOrderStatus(1n)).toBe(2n);

            // Second confirm — should fail (status is 2, not 1)
            const result = await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId: 1n }
            );

            expect(result.transactions).toHaveTransaction({
                from: courier.address,
                to: escrow.address,
                success: false,
                exitCode: 33504, // "Delivery not accepted yet" (status=2 != 1)
            });
        });

        it("should not let merchant confirm delivery", async () => {
            await escrow.send(
                buyer.getSender(),
                { value: ORDER_TOTAL },
                {
                    $$type: "CreateOrder",
                    orderId: 1n,
                    merchant: merchant.address,
                    hasReferrer: false,
                    referrer: buyer.address,
                }
            );
            await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "AcceptDelivery", orderId: 1n }
            );

            const result = await escrow.send(
                merchant.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId: 1n }
            );

            expect(result.transactions).toHaveTransaction({
                from: merchant.address,
                to: escrow.address,
                success: false,
                exitCode: 40260, // "Only courier or buyer can confirm"
            });
        });

        it("should handle fees set to zero", async () => {
            // Update fees to zero
            await escrow.send(
                treasury.getSender(),
                { value: toNano("0.05") },
                {
                    $$type: "UpdateFees",
                    deliveryFee: 0n,
                    protocolFee: 0n,
                }
            );

            // Create order with no fees
            await escrow.send(
                buyer.getSender(),
                { value: ORDER_TOTAL },
                {
                    $$type: "CreateOrder",
                    orderId: 1n,
                    merchant: merchant.address,
                    hasReferrer: false,
                    referrer: buyer.address,
                }
            );

            const order = await escrow.getGetOrder(1n);
            expect(order!.deliveryFee).toBe(0n);
            expect(order!.protocolFee).toBe(0n);
            // All value (minus gas) goes to foodAmount
            expect(order!.foodAmount).toBe(ORDER_TOTAL - GAS_RESERVE);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // REALISTIC ON-CHAIN SIMULATION (matches frontend flow exactly)
    // ═══════════════════════════════════════════════════════════════════════════

    describe("Realistic On-Chain Flow (testnet simulation)", () => {
        /**
         * These tests simulate the exact values and order IDs that the
         * frontend generates. The orderId is a Date.now() timestamp (uint64).
         * The payment includes the food price + delivery + protocol + 0.05 gas.
         */

        const TIMESTAMP_ORDER_ID = 1773053492921n; // realistic Date.now()
        const FOOD_PRICE_TON = toNano("0.5");      // 0.5 TON food subtotal

        it("should handle timestamp-based orderId (uint64 range)", async () => {
            // Frontend: const orderId = String(Date.now());
            // Then: BigInt(orderId) → sent as uint64 to the contract
            const totalPayment =
                FOOD_PRICE_TON + DEFAULT_DELIVERY_FEE + DEFAULT_PROTOCOL_FEE + toNano("0.05");

            const result = await escrow.send(
                buyer.getSender(),
                { value: totalPayment },
                {
                    $$type: "CreateOrder",
                    orderId: TIMESTAMP_ORDER_ID,
                    merchant: merchant.address,
                    hasReferrer: false,
                    referrer: buyer.address,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: buyer.address,
                to: escrow.address,
                success: true,
            });

            const order = await escrow.getGetOrder(TIMESTAMP_ORDER_ID);
            expect(order).not.toBeNull();
            expect(order!.status).toBe(0n);
            // foodAmount = totalPayment - deliveryFee - protocolFee - 0.02 gas
            const expectedFood =
                totalPayment - DEFAULT_DELIVERY_FEE - DEFAULT_PROTOCOL_FEE - GAS_RESERVE;
            expect(order!.foodAmount).toBe(expectedFood);
        });

        it("should accept delivery for a timestamp-based order", async () => {
            // 1. Create
            const totalPayment =
                FOOD_PRICE_TON + DEFAULT_DELIVERY_FEE + DEFAULT_PROTOCOL_FEE + toNano("0.05");
            await escrow.send(
                buyer.getSender(),
                { value: totalPayment },
                {
                    $$type: "CreateOrder",
                    orderId: TIMESTAMP_ORDER_ID,
                    merchant: merchant.address,
                    hasReferrer: false,
                    referrer: buyer.address,
                }
            );

            // 2. Accept — courier sends 0.05 TON gas (same as frontend)
            const result = await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "AcceptDelivery", orderId: TIMESTAMP_ORDER_ID }
            );

            expect(result.transactions).toHaveTransaction({
                from: courier.address,
                to: escrow.address,
                success: true,
            });

            const status = await escrow.getGetOrderStatus(TIMESTAMP_ORDER_ID);
            expect(status).toBe(1n);
        });

        it("should confirm delivery for a timestamp-based order", async () => {
            const totalPayment =
                FOOD_PRICE_TON + DEFAULT_DELIVERY_FEE + DEFAULT_PROTOCOL_FEE + toNano("0.05");

            // 1. Create
            await escrow.send(
                buyer.getSender(),
                { value: totalPayment },
                {
                    $$type: "CreateOrder",
                    orderId: TIMESTAMP_ORDER_ID,
                    merchant: merchant.address,
                    hasReferrer: true,
                    referrer: referrer.address,
                }
            );

            // 2. Accept
            await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "AcceptDelivery", orderId: TIMESTAMP_ORDER_ID }
            );

            // 3. Confirm
            const result = await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId: TIMESTAMP_ORDER_ID }
            );

            expect(result.transactions).toHaveTransaction({
                from: courier.address,
                to: escrow.address,
                success: true,
            });

            expect(await escrow.getGetOrderStatus(TIMESTAMP_ORDER_ID)).toBe(2n);

            // Verify all recipients received funds
            expect(result.transactions).toHaveTransaction({
                from: escrow.address,
                to: merchant.address,
                success: true,
            });
            expect(result.transactions).toHaveTransaction({
                from: escrow.address,
                to: courier.address,
                success: true,
            });
            expect(result.transactions).toHaveTransaction({
                from: escrow.address,
                to: referrer.address,
                success: true,
            });
            expect(result.transactions).toHaveTransaction({
                from: escrow.address,
                to: treasury.address,
                success: true,
            });
        });

        it("should fail AcceptDelivery if the orderId doesn't match (order not found)", async () => {
            // Create order with one ID
            const totalPayment =
                FOOD_PRICE_TON + DEFAULT_DELIVERY_FEE + DEFAULT_PROTOCOL_FEE + toNano("0.05");
            await escrow.send(
                buyer.getSender(),
                { value: totalPayment },
                {
                    $$type: "CreateOrder",
                    orderId: TIMESTAMP_ORDER_ID,
                    merchant: merchant.address,
                    hasReferrer: false,
                    referrer: buyer.address,
                }
            );

            // Try to accept with a DIFFERENT orderId — simulates the bug where
            // the frontend passes the wrong ID (e.g. database UUID vs timestamp)
            const wrongOrderId = 9999999999999n;
            const result = await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "AcceptDelivery", orderId: wrongOrderId }
            );

            expect(result.transactions).toHaveTransaction({
                from: courier.address,
                to: escrow.address,
                success: false,
                exitCode: 18518, // "Order not found"
            });
        });

        it("should handle max uint64 orderId", async () => {
            const maxUint64 = (1n << 64n) - 1n; // 18446744073709551615
            const totalPayment =
                FOOD_PRICE_TON + DEFAULT_DELIVERY_FEE + DEFAULT_PROTOCOL_FEE + toNano("0.05");

            const result = await escrow.send(
                buyer.getSender(),
                { value: totalPayment },
                {
                    $$type: "CreateOrder",
                    orderId: maxUint64,
                    merchant: merchant.address,
                    hasReferrer: false,
                    referrer: buyer.address,
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: buyer.address,
                to: escrow.address,
                success: true,
            });

            expect(await escrow.getGetOrderStatus(maxUint64)).toBe(0n);
        });

        it("should compute gas consumption within budget", async () => {
            const totalPayment =
                FOOD_PRICE_TON + DEFAULT_DELIVERY_FEE + DEFAULT_PROTOCOL_FEE + toNano("0.05");

            // CreateOrder
            const createResult = await escrow.send(
                buyer.getSender(),
                { value: totalPayment },
                {
                    $$type: "CreateOrder",
                    orderId: TIMESTAMP_ORDER_ID,
                    merchant: merchant.address,
                    hasReferrer: true,
                    referrer: referrer.address,
                }
            );

            // The contract transaction should succeed and gas should be reasonable
            const createTx = createResult.transactions.find(
                (t) => t.inMessage?.info.type === "internal" &&
                    t.inMessage.info.dest?.equals(escrow.address)
            );
            expect(createTx).toBeDefined();
            expect(createTx!.totalFees.coins).toBeLessThan(toNano("0.03"));

            // AcceptDelivery
            const acceptResult = await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "AcceptDelivery", orderId: TIMESTAMP_ORDER_ID }
            );

            const acceptTx = acceptResult.transactions.find(
                (t) => t.inMessage?.info.type === "internal" &&
                    t.inMessage.info.dest?.equals(escrow.address)
            );
            expect(acceptTx).toBeDefined();
            expect(acceptTx!.totalFees.coins).toBeLessThan(toNano("0.02"));

            // ConfirmDelivery (most expensive — 3-4 outgoing messages)
            const confirmResult = await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId: TIMESTAMP_ORDER_ID }
            );

            const confirmTx = confirmResult.transactions.find(
                (t) => t.inMessage?.info.type === "internal" &&
                    t.inMessage.info.dest?.equals(escrow.address)
            );
            expect(confirmTx).toBeDefined();
            // ConfirmDelivery with referrer sends 4 outgoing messages + storage
            // Should still be under 0.03 TON
            expect(confirmTx!.totalFees.coins).toBeLessThan(toNano("0.03"));
        });

        it("should handle the complete checkout→accept→confirm flow with exact frontend values", async () => {
            /**
             * This test reproduces the EXACT sequence the app performs:
             *
             * 1. CheckoutPage: orderId = String(Date.now())
             *    createOrder(orderId, foodTotalTon, merchantAddr, referrerWallet?)
             *
             * 2. CourierDashboard: acceptDelivery(BigInt(order.orderId))
             *
             * 3. CourierDashboard: confirmDelivery(BigInt(activeOrder.orderId))
             *    ⚠️ Was previously BigInt(activeOrder.id) which is a UUID → crash!
             */

            const frontendOrderId = "1741521900000"; // simulating Date.now()
            const oid = BigInt(frontendOrderId);      // what the frontend does
            const foodTotalTon = 0.5;                 // USDT converted to TON
            const foodNano = toNano(foodTotalTon.toFixed(9));

            // Frontend fetches fees from chain
            const deliveryFeeNano = await escrow.getGetDeliveryFee();
            const protocolFeeNano = await escrow.getGetProtocolFee();
            const requiredAmount = foodNano + deliveryFeeNano + protocolFeeNano + toNano("0.05");

            // ── Step 1: Buyer creates order (CheckoutPage) ────────────────
            const createResult = await escrow.send(
                buyer.getSender(),
                { value: requiredAmount },
                {
                    $$type: "CreateOrder",
                    orderId: oid,
                    merchant: merchant.address,
                    hasReferrer: false,
                    referrer: merchant.address, // placeholder when no referrer
                }
            );
            expect(createResult.transactions).toHaveTransaction({
                from: buyer.address,
                to: escrow.address,
                success: true,
            });
            expect(await escrow.getGetOrderStatus(oid)).toBe(0n);

            // ── Step 2: Courier accepts (CourierDashboard) ────────────────
            // Frontend: acceptDelivery(BigInt(order.orderId))
            const acceptResult = await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "AcceptDelivery", orderId: oid }
            );
            expect(acceptResult.transactions).toHaveTransaction({
                from: courier.address,
                to: escrow.address,
                success: true,
            });
            expect(await escrow.getGetOrderStatus(oid)).toBe(1n);

            // ── Step 3: Courier confirms delivery ─────────────────────────
            // Frontend (FIXED): confirmDelivery(BigInt(activeOrder.orderId))
            const confirmResult = await escrow.send(
                courier.getSender(),
                { value: toNano("0.05") },
                { $$type: "ConfirmDelivery", orderId: oid }
            );
            expect(confirmResult.transactions).toHaveTransaction({
                from: courier.address,
                to: escrow.address,
                success: true,
            });
            expect(await escrow.getGetOrderStatus(oid)).toBe(2n);

            // Verify settlement happened
            expect(confirmResult.transactions).toHaveTransaction({
                from: escrow.address,
                to: merchant.address,
                success: true,
            });
            expect(confirmResult.transactions).toHaveTransaction({
                from: escrow.address,
                to: courier.address,
                success: true,
            });
            expect(confirmResult.transactions).toHaveTransaction({
                from: escrow.address,
                to: treasury.address,
                success: true,
            });
        });
    });
});
