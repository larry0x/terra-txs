import { LCDClient, Wallet, MsgExecuteContract } from "@terra-money/terra.js";
import { sendTransaction } from "./helpers";

const ASTRO_LOCKDROP = "terra1627ldjvxatt54ydd3ns6xaxtd68a2vtyu7kakj";
const TERRASWAP_BLUNA_LUNA_LP_TOKEN = "terra1nuy34nwnsh53ygpc4xprlj263cztw7vc99leh2";
const LOCKUP_DURATION = 52; // 52 weeks

export interface UserInfoResponse {
  claimable_generator_astro_debt: string;
}

export async function queryClaimableReward(terra: LCDClient, userAddr: string) {
  const response: UserInfoResponse = await terra.wasm.contractQuery(ASTRO_LOCKDROP, {
    user_info: {
      address: userAddr,
    },
  });
  const claimableAstro = parseInt(response.claimable_generator_astro_debt) / 1e6;
  console.log("Your claimable ASTRO amount is:", claimableAstro);
}

export async function claimReward(terra: LCDClient, sender: Wallet) {
  const { txhash } = await sendTransaction(terra, sender, [
    new MsgExecuteContract(sender.key.accAddress, ASTRO_LOCKDROP, {
      claim_rewards_and_optionally_unlock: {
        terraswap_lp_token: TERRASWAP_BLUNA_LUNA_LP_TOKEN,
        duration: LOCKUP_DURATION,
        withdraw_lp_stake: false,
      },
    }),
  ]);
  console.log("success! txhash:", txhash);
}
