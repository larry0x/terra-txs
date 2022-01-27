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

/**
 * Find CW20 token balance of the specified account
 */
export async function queryCw20Balance(terra: LCDClient, user: string, token: string) {
  const balanceResponse: { balance: string } = await terra.wasm.contractQuery(token, {
    balance: {
      address: user,
    },
  });
  return parseInt(balanceResponse.balance);
}

/**
 * Encode a JSON object to base64 string
 */
export function encodeBase64(obj: object | string | number | null | undefined) {
  return Buffer.from(JSON.stringify(obj)).toString("base64");
}
