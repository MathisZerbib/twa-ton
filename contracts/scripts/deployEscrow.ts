/**
 * Deploy TON-Eats Escrow to Testnet
 *
 * Usage:
 *   cd contracts
 *   npx blueprint run deployEscrow --testnet
 *
 * The script will:
 *  1. Load the compiled contract bytecode from build/
 *  2. Prompt for a treasury address (or use the env default)
 *  3. Deploy via your connected wallet (QR code / deeplink)
 *  4. Print the deployed contract address
 *  5. Print the VITE_ESCROW_CONTRACT_TESTNET line to paste into .env
 */

import { toNano, Address } from "@ton/core";
import { NetworkProvider } from "@ton/blueprint";
import { TONEatsEscrow } from "../build/TONEatsEscrow/tact_TONEatsEscrow";

// ── Update this with your treasury / personal wallet on testnet ────────────────
const TREASURY_TESTNET =
    process.env.VITE_TREASURY_TESTNET ||
    "0QCFEF5jY33lLFJugJmFuILYQcwg7ekHu8LVsBpV7JbIT6FB";

export async function run(provider: NetworkProvider) {
    console.log("\n🚀 Deploying TON-Eats Escrow contract...");
    console.log(`   Network : ${provider.network()}`);
    console.log(`   Treasury: ${TREASURY_TESTNET}\n`);

    const treasury = Address.parse(TREASURY_TESTNET);

    const escrow = provider.open(
        await TONEatsEscrow.fromInit(treasury)
    );

    // If already deployed just print the address again and exit
    if (await provider.isContractDeployed(escrow.address)) {
        console.log("⚠️  Contract already deployed at:");
        console.log(`   ${escrow.address.toString()}\n`);
    } else {
        await escrow.send(
            provider.sender(),
            { value: toNano("0.05") },
            { $$type: "Deploy", queryId: 0n }
        );
        await provider.waitForDeploy(escrow.address, 20);
        console.log("\n✅ Deployed successfully!\n");
    }

    const addr = escrow.address.toString();
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Contract address (testnet):\n  ${addr}`);
    console.log("\nAdd this line to your .env file:");
    console.log(`  VITE_ESCROW_CONTRACT_TESTNET=${addr}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Verify the contract is alive
    try {
        const balance = await escrow.getContractBalance();
        console.log(`Contract balance: ${Number(balance) / 1e9} TON`);
    } catch {
        console.log("(Balance check skipped)");
    }
}
