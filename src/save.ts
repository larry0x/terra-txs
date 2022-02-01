import { LCDClient, Wallet, MsgExecuteContract } from "@terra-money/terra.js";
import { sendTransaction } from "./helpers";

const ANCHOR_MARKET_ADDR = "terra1sepfj7s0aeg5967uxnfk4thzlerrsktkpelm5s";

/**
 * @notice Deposit specified amount of uusd to Anchor protocol
 */
export async function depositUusdToAnchor(terra: LCDClient, signer: Wallet, amount: number) {
  const { txhash } = await sendTransaction(terra, signer, [
    new MsgExecuteContract(
      signer.key.accAddress,
      ANCHOR_MARKET_ADDR,
      {
        deposit_stable: {},
      },
      {
        uusd: amount,
      },
    ),
  ]);
  console.log("success! txhash:", txhash);
}
