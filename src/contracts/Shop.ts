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

interface Order {
    id: number;
    details: string;
    status: boolean;
}

export default class ShopContract implements Contract {
    async sendMessage(
        provider: ContractProvider,
        via: Sender,
        message: Cell
    ) {
        await provider.internal(via, {
            value: toNano("0.05"),
            body: message,
        });
    }

    async getWalletAddress(provider: ContractProvider, forAddress: Address) {
        const { stack } = await provider.get("get_wallet_address", [
            { type: "slice", cell: beginCell().storeAddress(forAddress).endCell() },
        ]);

        return stack.readAddress().toString();
    }

    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) { }
}
