import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as promptly from "promptly";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { LCDClient, LocalTerra } from "@terra-money/terra.js";
import * as keystore from "./keystore";
import * as reward from "./reward";
import * as swap from "./swap";

const CONFIG_DIR = ".claim-astro-generator-reward";

function getConfigDir() {
  return path.join(os.homedir(), CONFIG_DIR);
}

function makeConfigDir() {
  const configDir = getConfigDir();
  if (!fs.existsSync(configDir)) {
    console.log(`Config directory ${configDir} does not exist! creating...`);
    fs.mkdirSync(configDir, { recursive: true });
  }
}

async function addKey(name: string, coinType: number) {
  const mnemonic = await promptly.prompt("Enter your BIP-39 mnemonic phrase:");

  const password = await promptly.password("Enter a password to encrypt your key:");
  const repeat = await promptly.password("Repeat the password:");
  if (password != repeat) {
    throw new Error("Passwords don't match!");
  }

  const accAddress = await keystore.save(name, mnemonic, coinType, password);
  console.log("Successfully added key! Address:", accAddress);
}

async function loadKey(terra: LCDClient, keyName: string) {
  const password = await promptly.password("Enter the password used to encrypt the key:");
  const rawKey = keystore.load(keyName, password);
  const signer = terra.wallet(rawKey);

  console.log("Loaded signing key! Address:", signer.key.accAddress);
  return signer;
}

// Read keys from all files under the config dir that match filename pattern `key_*.json`
function listKeys() {
  const configDir = getConfigDir();
  const fns = fs.readdirSync(configDir).filter((fn) => {
    return fn.startsWith("key_") && fn.endsWith(".json");
  });
  console.log(`Listing ${fns.length} keys...`);
  fns.forEach((fn) => {
    const entity: keystore.Entity = JSON.parse(fs.readFileSync(path.join(configDir, fn), "utf8"));
    console.log(`- name: ${entity.name}`);
    console.log(`  address: ${entity.address}`);
    // console.log(`  - cipherText: ${entity.cipherText}`);
  });
}

function removeKey(name: string) {
  keystore.remove(name);
  console.log("Successfully removed key!");
}

function makeLcdClient(network: string, lcd?: string) {
  if (!["mainnet", "testnet", "localterra"].includes(network)) {
    throw new Error(`network must be mainnet|testnet|localterra. your input: ${network}`);
  }
  return network === "mainnet"
    ? new LCDClient({
        URL: lcd ? lcd : "https://lcd.terra.dev",
        chainID: "columbus-5",
        gasPrices: "0.15uusd",
        gasAdjustment: 1.4,
      })
    : network === "testnet"
    ? new LCDClient({
        URL: lcd ? lcd : "https://bombay-lcd.terra.dev",
        chainID: "bombay-12",
        gasPrices: "0.15uusd",
        gasAdjustment: 1.4,
      })
    : new LocalTerra();
}

async function executeClaimReward(keyName: string, network: string, lcd?: string) {
  const terra = makeLcdClient(network, lcd);
  const signer = await loadKey(terra, keyName);

  await reward.queryClaimableReward(terra, signer.key.accAddress);
  await reward.claimReward(terra, signer);
}

async function executeSwapAstro(keyName: string, network: string, lcd?: string) {
  const terra = makeLcdClient(network, lcd);
  const signer = await loadKey(terra, keyName);

  await swap.swapAstroToUst(terra, signer);
}

(async () => {
  makeConfigDir();
  await yargs(hideBin(process.argv))
    .command(
      "add-key [key-name]",
      "Add a key with the given name",
      (yargs) => {
        return yargs
          .positional("key-name", {
            type: "string",
            describe: "name of the key",
            demandOption: true,
          })
          .option("coin-type", {
            type: "number",
            describe: "SLIP-0044 coin type for use in derivation of the private key",
            demandOption: false,
            default: 330, // terra = 330, cosmos = 118
          });
      },
      (argv) => addKey(argv["key-name"], argv["coin-type"]).catch((e) => console.log(e)),
    )
    .command(
      "remove-key [key-name]",
      "Remove a key of the given name",
      (yargs) => {
        return yargs.positional("key-name", {
          type: "string",
          describe: "name of the key",
          demandOption: true,
        });
      },
      (argv) => removeKey(argv["key-name"]),
    )
    .command(
      "list-keys",
      "List all keys",
      (yargs) => yargs,
      () => listKeys(),
    )
    .command(
      "claim-reward [key-name] [--network [network]] [--lcd [url]]",
      "Claim Astro generator reward from the lockdrop contract",
      (yargs) => {
        return yargs
          .positional("key-name", {
            type: "string",
            describe: "name of the account whose coins are to be swapped",
            demandOption: true,
          })
          .option("network", {
            type: "string",
            describe: "network to broadcast the tx",
            default: "mainnet",
            demandOption: false,
          })
          .option("lcd", {
            type: "string",
            describe: "URL of a Terra LCD node for broadcasting the tx",
            demandOption: false,
          });
      },
      (argv) => {
        executeClaimReward(argv["key-name"], argv.network, argv.lcd).catch((e) => console.log(e));
      },
    )
    .command(
      "swap-astro [key-name] [--network [network]] [--lcd [url]]",
      "Swap the user's ASTRO tokens to UST",
      (yargs) => {
        return yargs
          .positional("key-name", {
            type: "string",
            describe: "name of the account whose coins are to be swapped",
            demandOption: true,
          })
          .option("network", {
            type: "string",
            describe: "network to broadcast the tx",
            default: "mainnet",
            demandOption: false,
          })
          .option("lcd", {
            type: "string",
            describe: "URL of a Terra LCD node for broadcasting the tx",
            demandOption: false,
          });
      },
      (argv) => {
        executeSwapAstro(argv["key-name"], argv.network, argv.lcd).catch((e) => console.log(e));
      },
    )
    .wrap(100)
    .parse();
})();
