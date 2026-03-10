#!/usr/bin/env node
/**
 * Testnet diagnostic script for TON-Eats Escrow contract.
 *
 * Tests the full flow:
 *   1. Connect to testnet RPC
 *   2. Query contract balance
 *   3. Query on-chain fee constants
 *   4. Check if specific orders exist and their status
 *   5. Validate orderId format assumptions
 *
 * Usage: node scripts/testnet-diag.mjs
 */

import { TonClient } from "@ton/ton";
import { Address, TupleBuilder } from "@ton/core";

// ─── Configuration ──────────────────────────────────────────────────────────

const TESTNET_RPC = "https://testnet.toncenter.com/api/v2/jsonRPC";
const ESCROW_CONTRACT = "EQDqG9wGloibyVfZNcPp7ROaJKARwJVjarfG25dt__aw6PUd";
const COURIER_WALLET = "0QCFEF5jY33lLFJugJmFuILYQcwg7ekHu8LVsBpV7JbIT6FB";

const DELAY_MS = 2000; // delay between RPC calls to avoid 429
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// From the user's last test — Order #646097 should be orderId ending in 646097
// Date.now() returns something like 1741646097123 — but checkout uses String(Date.now())
// The contract stores orderId as uint64.

const client = new TonClient({
  endpoint: TESTNET_RPC,
});

const contractAddr = Address.parse(ESCROW_CONTRACT);
const courierAddr = Address.parse(COURIER_WALLET);

// ─── Helpers ────────────────────────────────────────────────────────────────

async function callGetter(method, args = []) {
  const builder = new TupleBuilder();
  for (const a of args) builder.writeNumber(a);
  try {
    const result = await client.runMethod(contractAddr, method, builder.build());
    return result;
  } catch (e) {
    return { error: e.message };
  }
}

function formatTon(nano) {
  return (Number(nano) / 1e9).toFixed(4) + " TON";
}

// ─── Tests ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  TON-Eats Escrow — Testnet Diagnostics");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`Contract:  ${ESCROW_CONTRACT}`);
  console.log(`Courier:   ${COURIER_WALLET}`);
  console.log();

  // ── 1. Contract balance ──────────────────────────────────────────────────
  console.log("── 1. Contract Balance ──────────────────────────────");
  try {
    const balance = await client.getBalance(contractAddr);
    console.log(`  Balance: ${formatTon(balance)}`);
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
  }

  // ── 2. Courier wallet balance ────────────────────────────────────────────
  console.log("\n── 2. Courier Wallet Balance ────────────────────────");
  await delay(DELAY_MS);
  try {
    const balance = await client.getBalance(courierAddr);
    console.log(`  Balance: ${formatTon(balance)}`);
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
  }

  // ── 3. On-chain fee constants ────────────────────────────────────────────
  console.log("\n── 3. On-Chain Fee Constants ────────────────────────");
  await delay(DELAY_MS);
  try {
    const delivFee = await callGetter("get_delivery_fee");
    if (delivFee.error) throw new Error(delivFee.error);
    const fee = delivFee.stack.readBigNumber();
    console.log(`  Delivery Fee:  ${formatTon(fee)}`);
  } catch (e) {
    console.log(`  Delivery Fee ERROR: ${e.message}`);
  }
  await delay(DELAY_MS);
  try {
    const protFee = await callGetter("get_protocol_fee");
    if (protFee.error) throw new Error(protFee.error);
    const fee = protFee.stack.readBigNumber();
    console.log(`  Protocol Fee:  ${formatTon(fee)}`);
  } catch (e) {
    console.log(`  Protocol Fee ERROR: ${e.message}`);
  }

  // ── 4. Contract balance getter ───────────────────────────────────────────
  console.log("\n── 4. Contract Balance (via getter) ────────────────");
  await delay(DELAY_MS);
  try {
    const result = await callGetter("contract_balance");
    if (result.error) throw new Error(result.error);
    const bal = result.stack.readBigNumber();
    console.log(`  contract_balance(): ${formatTon(bal)}`);
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
  }

  // ── 5. Scan recent transactions for orderId values ───────────────────────
  console.log("\n── 5. Recent Transactions ──────────────────────────");
  await delay(DELAY_MS);
  try {
    const txs = await client.getTransactions(contractAddr, { limit: 15 });
    console.log(`  Found ${txs.length} recent transactions`);
    for (let i = 0; i < Math.min(txs.length, 10); i++) {
      const tx = txs[i];
      const inMsg = tx.inMessage;
      const time = new Date(Number(tx.now) * 1000).toISOString();
      let info = `  [${i}] ${time}`;
      if (inMsg?.info?.type === "internal") {
        info += ` | from: ${inMsg.info.src?.toString().slice(0, 12)}... | value: ${formatTon(inMsg.info.value.coins)}`;
        // Try to parse the body
        const body = inMsg.body;
        if (body) {
          try {
            const slice = body.beginParse();
            const op = slice.loadUint(32);
            if (op === 0x01) {
              const orderId = slice.loadUintBig(64);
              info += ` | OP=CreateOrder | orderId=${orderId.toString()}`;
            } else if (op === 0x02) {
              const orderId = slice.loadUintBig(64);
              info += ` | OP=AcceptDelivery | orderId=${orderId.toString()}`;
            } else if (op === 0x03) {
              const orderId = slice.loadUintBig(64);
              info += ` | OP=ConfirmDelivery | orderId=${orderId.toString()}`;
            } else if (op === 0x04) {
              info += ` | OP=UpdateFees`;
            } else if (op === 0) {
              // Comment
              const text = slice.loadStringTail();
              info += ` | Comment: "${text}"`;
            } else {
              info += ` | OP=0x${op.toString(16)}`;
            }
          } catch {
            info += ` | (body parse failed)`;
          }
        }
      } else if (inMsg?.info?.type === "external-in") {
        info += ` | external-in (deploy?)`;
      }
      // Check if TX was successful (look for compute phase)
      const compute = tx.description?.type === "generic" ? tx.description.computePhase : null;
      if (compute && compute.type === "vm") {
        info += ` | exit=${compute.exitCode}`;
        if (compute.exitCode !== 0) {
          info += ` ⚠️ FAILED`;
        }
      }
      console.log(info);
    }
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
  }

  // ── 6. Check specific orderIds ───────────────────────────────────────────
  console.log("\n── 6. Order Status Checks ─────────────────────────");

  // Try to find orders from recent transactions
  const orderIdsToCheck = [];
  try {
    const txs = await client.getTransactions(contractAddr, { limit: 20 });
    for (const tx of txs) {
      const body = tx.inMessage?.body;
      if (!body) continue;
      try {
        const slice = body.beginParse();
        const op = slice.loadUint(32);
        if (op === 0x01 || op === 0x02 || op === 0x03) {
          const orderId = slice.loadUintBig(64);
          if (!orderIdsToCheck.find((o) => o.id === orderId.toString())) {
            orderIdsToCheck.push({
              id: orderId.toString(),
              op: op === 0x01 ? "CreateOrder" : op === 0x02 ? "AcceptDelivery" : "ConfirmDelivery",
            });
          }
        }
      } catch {}
    }
  } catch {}

  if (orderIdsToCheck.length === 0) {
    // Fallback: try some likely values
    console.log("  No orderIds found in transactions, trying last-6-digit match for #646097");
    // Date.now() around when test was performed could be ~1741600000000+
    // The # shows last 6 digits: 646097
    // But orderId = String(Date.now()) which is 13 digits like 1741646097123
    // Problem: slice(-6) of "1741646097123" = "097123" not "646097"
    // So the orderId might be different from what we think
  }

  for (const { id, op } of orderIdsToCheck) {
    console.log(`\n  Order ${id} (found via ${op}):`);
    await delay(DELAY_MS);
    try {
      const result = await callGetter("get_order_status", [BigInt(id)]);
      if (result.error) {
        console.log(`    Status: ERROR - ${result.error}`);
        continue;
      }
      const status = result.stack.readBigNumber();
      const statusLabels = { "-1": "NOT FOUND", "0": "Open", "1": "Accepted", "2": "Delivered" };
      console.log(`    Status: ${status.toString()} (${statusLabels[status.toString()] ?? "unknown"})`);
    } catch (e) {
      console.log(`    Status ERROR: ${e.message}`);
    }

    try {
      await delay(DELAY_MS);
      const result = await callGetter("get_order", [BigInt(id)]);
      if (result.error) {
        console.log(`    Order data: ERROR - ${result.error}`);
        continue;
      }
      const tuple = result.stack.readTupleOpt();
      if (!tuple) {
        console.log(`    Order data: null (order does not exist on-chain)`);
        continue;
      }
      const buyer = tuple.readAddress();
      const merchant = tuple.readAddress();
      const courier = tuple.readAddressOpt();
      const referrer = tuple.readAddressOpt();
      const deliveryFee = tuple.readBigNumber();
      const protocolFee = tuple.readBigNumber();
      const foodAmount = tuple.readBigNumber();
      const orderStatus = tuple.readBigNumber();

      console.log(`    Buyer:      ${buyer.toString()}`);
      console.log(`    Merchant:   ${merchant.toString()}`);
      console.log(`    Courier:    ${courier?.toString() ?? "null"}`);
      console.log(`    Referrer:   ${referrer?.toString() ?? "null"}`);
      console.log(`    FoodAmount: ${formatTon(foodAmount)}`);
      console.log(`    DelivFee:   ${formatTon(deliveryFee)}`);
      console.log(`    ProtoFee:   ${formatTon(protocolFee)}`);
      console.log(`    Status:     ${orderStatus.toString()}`);
    } catch (e) {
      console.log(`    Order data ERROR: ${e.message}`);
    }
  }

  // ── 7. Validate orderId format ───────────────────────────────────────────
  console.log("\n── 7. OrderId Format Analysis ──────────────────────");
  console.log("  Frontend generates: String(Date.now())");
  console.log(`  Example: "${Date.now()}" (${Date.now().toString().length} chars)`);
  console.log(`  As BigInt: ${BigInt(Date.now())}n`);
  console.log(`  uint64 max: ${BigInt("18446744073709551615")}n`);
  console.log(`  Fits in uint64: ${BigInt(Date.now()) < BigInt("18446744073709551615")}`);

  // Check: order.orderId.slice(-6) for "646097"
  // If orderId = "1741646097123", slice(-6) = "097123"
  // If orderId = "1741646097", slice(-6) = "646097" ✓
  // Date.now() in milliseconds is 13 digits. In seconds it's 10 digits.
  // So the user's orderId is 10 digits? That would mean it was Unix timestamp in SECONDS, not ms.
  // OR it was 13 digits and the display truncation is different.
  console.log(`\n  Checking #646097 display:`);
  console.log(`    If orderId = "1741646097" → slice(-6) = "${"1741646097".slice(-6)}" ← likely this was seconds`);
  console.log(`    If orderId = "1741646097000" → slice(-6) = "${"1741646097000".slice(-6)}" ← this would be ms`);
  console.log(`    String(Date.now()) returns milliseconds → 13 digits`);
  console.log(`    BUT order.orderId.slice(-6) in the UI shows last 6 chars`);

  // ── 8. Summary ───────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  DIAGNOSTIC COMPLETE");
  console.log("═══════════════════════════════════════════════════════════════");
}

main().catch(console.error);
