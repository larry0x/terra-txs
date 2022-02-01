import { LCDClient, Wallet, Msg, MsgSwap } from "@terra-money/terra.js";
import { sendTransaction } from "./helpers";

const denoms = [
  "usdr",
  "ukrw",
  "umnt",
  "ueur",
  "ucny",
  "ujpy",
  "ugbp",
  "uinr",
  "ucad",
  "uchf",
  "uaud",
  "usgd",
  "uthb",
  "usek",
  "unok",
  "udkk",
  "uidr",
  "uphp",
  "uhkd",
  "umyr",
  "utwd",
];

/**
 * @notice Swaps all coins (except for UST and LUNA) into UST
 */
export async function swapTerraToUst(terra: LCDClient, signer: Wallet) {
  const [coins] = await terra.bank.balance(signer.key.accAddress);
  const msgs: Msg[] = [];
  coins.toArray().forEach((coin) => {
    if (denoms.includes(coin.denom)) {
      msgs.push(new MsgSwap(signer.key.accAddress, coin, "uusd"));
    }
  });
  const { txhash } = await sendTransaction(terra, signer, msgs);
  console.log("success! txhash:", txhash);
}
