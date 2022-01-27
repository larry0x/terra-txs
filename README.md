# claim-astro-generator-reward

Noooo! [Terra Station wallet removed support for the Cosmos Ledger app.](https://twitter.com/larry0x/status/1484348753351884803) Now I'm locked out of any dapp frontend that only supports the latest Station Chrome extension.

So, I created this tool which lets me claim my ASTRO staking rewards.

## Usage

Clone this repository and install dependencies:

```bash
git clone https://github.com/larry0x/claim-astro-generator-reward
cd claim-astro-generator-reward
npm install
```

Add wallet key. Remember to specify `--coin-type 118` which is the [SLIP-0044](https://github.com/satoshilabs/slips/blob/master/slip-0044.md) coin type used by the Cosmos Ledger app.

```bash
npm start -- add-key yourname --coin-type 118
```

The private key will be saved as an encrypted JSON file under the `$HOME/.claim-astro-generator-reward` directory. 

To list all available keys:

```bash
npm start -- list-keys
```

To remove a key, simply delete the corresponding file or:

```bash
npm start -- remove-key yourname
```

To claim ASTRO staking reward:

```bash
npm start -- claim-reward yourname
```

The following command will sell all ASTRO in your wallet to UST using [the Astroport ASTRO-UST pool](https://finder.extraterrestrial.money/mainnet/address/terra1l7xu2rl3c7qmtx3r5sd2tz25glf6jh8ul7aag7).

## License

TBD