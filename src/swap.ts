import deepEqual from "deep-equal";
import { LCDClient, Wallet, MsgExecuteContract } from "@terra-money/terra.js";
import { queryCw20Balance, encodeBase64, sendTransaction } from "./helpers";

const ASTRO_TOKEN = "terra1xj49zyqrwpv5k928jwfpfy2ha668nwdgkwlrg3";
const ASTRO_UST_PAIR = "terra1l7xu2rl3c7qmtx3r5sd2tz25glf6jh8ul7aag7";
const MAX_SPREAD = 0.005; // 0.5%

export type LegacyAssetInfo =
  | { token: { contract_addr: string } }
  | { native_token: { denom: string } };

export type LegacyAsset = {
  info: LegacyAssetInfo;
  amount: string;
};

export type PoolResponse = {
  assets: LegacyAsset[];
  total_share: string;
};

const ASTRO_ASSET_INFO: LegacyAssetInfo = {
  token: {
    contract_addr: ASTRO_TOKEN,
  },
};

const UST_ASSET_INFO: LegacyAssetInfo = {
  native_token: {
    denom: "uusd",
  },
};

export async function queryBeliefPrice(terra: LCDClient) {
  const response: PoolResponse = await terra.wasm.contractQuery(ASTRO_UST_PAIR, {
    pool: {},
  });

  const astroDepth = response.assets.find((a) => deepEqual(a.info, ASTRO_ASSET_INFO))?.amount;
  if (!astroDepth) {
    throw new Error("astro depth is undefined");
  }
  const ustDepth = response.assets.find((a) => deepEqual(a.info, UST_ASSET_INFO))?.amount;
  if (!ustDepth) {
    throw new Error("ust depth is undefined");
  }

  const astroPerUst = parseInt(astroDepth) / parseInt(ustDepth);
  const ustPerAstro = parseInt(ustDepth) / parseInt(astroDepth);
  return { astroPerUst, ustPerAstro };
}

export async function swapAstroToUst(terra: LCDClient, sender: Wallet) {
  const userAstroBalance = await queryCw20Balance(terra, sender.key.accAddress, ASTRO_TOKEN);
  console.log("User's ASTRO balance", userAstroBalance / 1e6);

  const { astroPerUst, ustPerAstro } = await queryBeliefPrice(terra);
  console.log("ASTRO spot price is", ustPerAstro, "UST");

  // NOTE: Which price do we use for `belief_price` here, astroPerUst or ustPerAstro?
  //
  // The `assert_max_spread` method used by Astro pair contract:
  // expected_return = offer_amount / belief_price;
  // spread_amount = expected_return - actual_return;
  // assert(spread_amount / expected_return) <= max_spread;
  //
  // Therefore, `belief_price` is supposed to be astroPerUst
  const { txhash } = await sendTransaction(terra, sender, [
    new MsgExecuteContract(sender.key.accAddress, ASTRO_TOKEN, {
      send: {
        contract: ASTRO_UST_PAIR,
        amount: userAstroBalance.toString(),
        msg: encodeBase64({
          swap: {
            belief_price: astroPerUst.toString(),
            max_spread: MAX_SPREAD.toString(),
            to: undefined,
          },
        }),
      },
    }),
  ]);
  console.log("success! txhash:", txhash);
}
