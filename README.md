# vota-operator-scripts
Scripts for Dora Vota round operators.

### Get Start

```shell
git clone https://github.com/DoraFactory/vota-operator-scripts.git
cd vota-operator-scripts/ && yarn
mkdir -p build/inputs
export CONTRACT_ADDRESS=<YOUR_CONTRACT_ADDRESS>
```
### Step 1

**Close the Voting phase and get the data related to sign_up / publish_message in the contract. **

1. First you need to close the Voting phase

```bash
// stop voting period
dorad tx wasm execute \
  $CONTRACT_ADDRESS \
  '{ "stop_voting_period": { "max_vote_options": "5" } }' \
  --from wallet --gas-prices 0.01uDORA --gas auto --gas-adjustment 1.3 --chain-id "doravota-devnet" --node http://18.139.226.67:26657 -y
```

2. Secondly, our operator needs to synchronize the signUp and publishMessage data down for the specified contract via `getContractLogs.js`.

```shell
node js/getContractLogs.js YOUR_CONTRACT_ADDRESS
```


### Step2

**Calculate inputs & proof**

1. process `messages` and split into multiple `inputs.json`.

```shell
node js/genInputs.js YOUR_COORDINATOR_KEY
```

2. Generate each `proof` file and generate the `data` for calling the contract directly.

```shell
cd vota-operator-scripts/shell/s3
bash proof.sh
```


### Step3

Execute process_message and process_tally commands based on the computed `inputs` and `proof` for the proof phase.

1. Processing message phase

```shell
// process message
dorad tx wasm execute \
  $CONTRACT_ADDRESS \
  '{ "process_message": { "new_state_commitment": "17654741442751650166272042821626346746430532967551326165651697630044841584120", "proof": { "a": "2e2f3ec86864aaf9ff5936b7aa7c50797eb7b70d4d73fb2d97fdc8e9c0e03583149b169f45d10395042c3f7b44d3fbc4e997b0ac0549b474e19eadeca9a4f141",  "b": "213a21f9042d926a01116583e90a956264e368fabdc26e49638d7faaa09ee9f20ff0eb1a87dd3fc412cedb749823d2f97c0247ae4df89003e0dacd5bc195c990107b7a645d618143c91d78b6a456c71c690f469ea5b0b808e89a3228f92147b2108008e3de0fa8b1ff576cfc92047be60bd7a43e76d1e651bba1b494d58c6170", "c": "2385dc34f583a5d34bea5f9083e4788326b7b07054dc85a414fd07fba31c1e76068f86ff1d85f70c55bb4737d1f77744ee73c41d6d4cbc727b624e09ef5fffa0"} } }' \
  --from wallet  --gas-prices 0.01uDORA --gas auto --gas-adjustment 1.3 --chain-id "doravota-devnet" --node http://18.139.226.67:26657 -y
```

2. Stop processing period.

```shell
// stop processing period
dorad tx wasm execute \
  $CONTRACT_ADDRESS \
  '{ "stop_processing_period": { } }' \
  --from wallet  --gas-prices 0.01uDORA --gas auto --gas-adjustment 1.3 --chain-id "doravota-devnet" --node http://18.139.226.67:26657 -y
```

3. Proceed to the tallying proof stage.

```shell
// process tally
dorad tx wasm execute \
  dora17uh2wj875vt64x7pzzy08slsl5pqupfln0vw2k79knfshygy6aussrdx6r \
  '{ "process_tally": { "new_tally_commitment": "14599342870111422641177674128907878900190233253823117056579186130189049965778", "proof": { "a": "0bae3bc2485c2cd6a3bfdf16e7d8a5b93710c3bdcf9410d725aae938ccbebca12b1021be36b6c1d96db410d52369a0e51249da0a1b41497af53bb227ae1e674e",  "b": "1ff4ed89d5aefdca176419a76a82d2359f334d9bc479daa6ca11201076745749220fc921f3e77889779969467456beec42cdb5c874e3961a7a0f29b75899417929d1f4d3bb2ca8cfa15b1a1c893f0daa9304131f7512841174b2d2deeb30462e2f8eed8ab95da0c502c740216f89553f1b37ee2d34110c04363a34093337044b", "c": "0c054469563868b8878f72628cb3db437137e3d39fa8b74e344e573fedef8fcb1794cd30a661746438034f71e49349ac16357ebd8c1afc8be7585f4aa5366534"} } }' \
  --from wallet  --gas-prices 0.01uDORA --gas auto --gas-adjustment 1.3 --chain-id "doravota-devnet" --node http://18.139.226.67:26657 -y
```

### Step4

Ends the entire round process

```shell
// stop tallying period
dorad tx wasm execute \
  dora17uh2wj875vt64x7pzzy08slsl5pqupfln0vw2k79knfshygy6aussrdx6r \
  '{ "stop_tallying_period": { "results": ["0", "0", "0", "0", "0"], "salt": "1234567890" } }' \
  --from wallet  --gas-prices 0.01uDORA --gas auto --gas-adjustment 1.3 --chain-id "doravota-devnet" --node http://18.139.226.67:26657 -y
```
