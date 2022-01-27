import * as promptly from "promptly";
import { LCDClient, Wallet, Msg, isTxError } from "@terra-money/terra.js";

/**
 * Send a transaction. Return result if successful, throw error if failed
 *
 * Use uusd for gas payment and mainnet gas prices for default. We could customize it to make the
 * function more flexible, but I'm too lazy for that
 */
export async function sendTransaction(terra: LCDClient, signer: Wallet, msgs: Msg[]) {
  const tx = await signer.createAndSignTx({ msgs });
  console.log("\n" + JSON.stringify(tx).replace(/\\/g, "") + "\n");

  await promptly.confirm("Confirm transaction before signing and broadcasting [y/N]:");
  const result = await terra.tx.broadcast(tx);

  if (isTxError(result)) {
    throw new Error(`tx failed! raw log: ${result.raw_log}`);
  }
  return result;
}
