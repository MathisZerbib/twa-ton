import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { toNano } from "@ton/core";
import { TONEatsEscrow } from "../build/TONEatsEscrow/tact_TONEatsEscrow";
import "@ton/test-utils";

describe("TONEatsEscrow", () => {
    let blockchain: Blockchain;
    let treasuryDeployer: SandboxContract<TreasuryContract>;
    let buyer: SandboxContract<TreasuryContract>;
    let merchant: SandboxContract<TreasuryContract>;
    let courier: SandboxContract<TreasuryContract>;
    let referrer: SandboxContract<TreasuryContract>;
    let escrowContract: SandboxContract<TONEatsEscrow>;

    const ORDER_ID = 1001n;
    const FOOD_AMOUNT = toNano("12.5");
    const DELIVERY_FEE = toNano("0.2");
    const PROTOCOL_FEE = toNano("0.1");
    const TOTAL_LOCKED = FOOD_AMOUNT + DELIVERY_FEE + PROTOCOL_FEE;

    beforeAll(async () => {
        blockchain = await Blockchain.create();

        treasuryDeployer = await blockchain.treasury("treasuryDeployer");
        buyer = await blockchain.treasury("buyer");
        merchant = await blockchain.treasury("merchant");
        courier = await blockchain.treasury("courier");
        referrer = await blockchain.treasury("referrer");

        escrowContract = blockchain.openContract(
            await TONEatsEscrow.fromInit(treasuryDeployer.address)
        );

        const deployResult = await escrowContract.send(
            treasuryDeployer.getSender(),
            { value: toNano("0.05") },
            { $$type: "Deploy", queryId: 0n }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: treasuryDeployer.address,
            to: escrowContract.address,
            deploy: true,
            success: true,
        });
    });

    it("should create an order and lock funds exactly", async () => {
        const valueToSend = TOTAL_LOCKED + toNano("1");

        const result = await escrowContract.send(
            buyer.getSender(),
            { value: valueToSend },
            {
                $$type: "CreateOrder",
                orderId: ORDER_ID,
                merchant: merchant.address,
                foodAmount: FOOD_AMOUNT,
                hasReferrer: true,
                referrer: referrer.address,
            }
        );

        expect(result.transactions).toHaveTransaction({
            from: buyer.address,
            to: escrowContract.address,
            success: true,
        });

        const order = await escrowContract.getGetOrder(ORDER_ID);
        expect(order).not.toBeNull();
        expect(order?.status).toEqual(0n);

        const locked = await escrowContract.getLockedFunds();
        expect(locked).toEqual(TOTAL_LOCKED);
    });

    it("should allow courier to accept delivery and refund gas", async () => {
        const result = await escrowContract.send(
            courier.getSender(),
            { value: toNano("0.1") },
            {
                $$type: "AcceptDelivery",
                orderId: ORDER_ID,
            }
        );

        expect(result.transactions).toHaveTransaction({
            from: courier.address,
            to: escrowContract.address,
            success: true,
        });

        expect(result.transactions).toHaveTransaction({
            from: escrowContract.address,
            to: courier.address,
            success: true,
        });

        const status = await escrowContract.getGetOrderStatus(ORDER_ID);
        expect(status).toEqual(1n);
    });

    it("should confirm delivery and split exact amounts correctly", async () => {
        const result = await escrowContract.send(
            courier.getSender(),
            { value: toNano("0.2") },
            {
                $$type: "ConfirmDelivery",
                orderId: ORDER_ID,
            }
        );

        expect(result.transactions).toHaveTransaction({
            from: escrowContract.address,
            to: merchant.address,
            value: FOOD_AMOUNT,
        });

        expect(result.transactions).toHaveTransaction({
            from: escrowContract.address,
            to: courier.address,
            value: DELIVERY_FEE,
        });

        expect(result.transactions).toHaveTransaction({
            from: escrowContract.address,
            to: referrer.address,
            value: PROTOCOL_FEE / 2n,
        });

        expect(result.transactions).toHaveTransaction({
            from: escrowContract.address,
            to: treasuryDeployer.address,
            value: PROTOCOL_FEE / 2n,
        });

        expect(result.transactions).toHaveTransaction({
            from: escrowContract.address,
            to: courier.address,
            success: true,
        });

        const locked = await escrowContract.getLockedFunds();
        expect(locked).toEqual(0n);

        const status = await escrowContract.getGetOrderStatus(ORDER_ID);
        expect(status).toEqual(2n);
    });
});
