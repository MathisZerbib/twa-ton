import {
    Contract,
    ContractProvider,
    Sender,
    Address,
    Cell,
    contractAddress,
    beginCell,
} from "ton-core";

export default class CBDShopDelivery implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) { }

    static createForDeploy(code: Cell, initialData: { orderId: number, amount: number }): CBDShopDelivery {
        const data = beginCell()
            .storeUint(initialData.orderId, 64)
            .storeUint(initialData.amount, 64)
            .endCell();
        const workchain = 0;
        const address = contractAddress(workchain, { code, data });
        return new CBDShopDelivery(address, { code, data });
    }

    async sendDeploy(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: "0.01",
            bounce: false,
        });
    }

    async initializeDelivery(provider: ContractProvider, via: Sender, orderId: number, amount: number) {
        const messageBody = beginCell()
            .storeUint(1, 32)
            .storeUint(0, 64)
            .storeUint(orderId, 64)
            .storeUint(amount, 64)
            .endCell();
        await provider.internal(via, {
            value: "0.002",
            body: messageBody,
        });
    }

    async confirmDelivery(provider: ContractProvider, via: Sender, orderId: number) {
        const messageBody = beginCell()
            .storeUint(2, 32)
            .storeUint(0, 64)
            .storeUint(orderId, 64)
            .endCell();
        await provider.internal(via, {
            value: "0.002",
            body: messageBody,
        });
    }

    async getDeliveryStatus(provider: ContractProvider, orderId: number) {
        const { stack } = await provider.get("get_delivery_status", [
            { type: "int", value: BigInt(orderId) }
        ]);
        return stack.readBigNumber();
    }
}