# vota-operator-scripts
Scripts for Dora Vota round operators.

### Get Start

```shell
git clone https://github.com/DoraFactory/vota-operator-scripts.git
cd vota-operator-scripts/
mkdir -p build/inputs
export CONTRACT_ADDRESS=<YOUR_CONTRACT_ADDRESS>
export COORDINATOR_KEY=<YOUR_COORDINATOR_KEY>
export STATE_SALT=<YOUR_STATE_SALT>
```
**About `COORDINATOR_KEY`**

> We provide methods for locally generating Operator public and private keys, by which you can randomly generate a key.

```bash
yarn genOperatorKey
```

### Step 1

**Close the Voting phase.**

Close the Voting phase

```bash
// stop voting period
dorad tx wasm execute \
  $CONTRACT_ADDRESS \
  '{ "stop_voting_period": { "max_vote_options": "5" } }' \
  --from wallet --gas-prices 0.01uDORA --gas auto --gas-adjustment 1.3 --chain-id "doravota-devnet" --node https://vota-rpc.dorafactory.org:443 -y
```

### Step2

**Calculate inputs & proof**

1. download the ptau file.
   You can see all the ptau in [this](https://github.com/iden3/snarkjs#7-prepare-phase-2), we use `powersOfTau28_hez_final_22.ptau`(Also, if your circuit is relatively large in scale, you can choose to use the other ptau file that supports larger circuits). We need to put the ptau file in dir `ptau`.

2. The operator command will help us to compile the circuit as well as generate the final proof and commitment based on the data from the Round contract and **COORDINATOR_KEY**.

```bash
./operator.sh $CONTRACT_ADDRESS $COORDINATOR_KEY $STATE_SALT
```

It will eventually generate the data we need.

- **build/inputs/commitments.json**

```json
{
  "msg_0000": "17654741442751650166272042821626346746430532967551326165651697630044841584120",
  "tally_0000": "14599342870111422641177674128907878900190233253823117056579186130189049965778"
}
```

- **build/final_proof/msg/proof_hex.json**

```json
{
  "pi_a": "0x23230ea6a7d53e91f97894613d2f09f427ec1e4f2dbc4c3bb18687d8945386831fd6e3894bc1beedf257d2bff9bd870dfcc4390948e2dd447c32b40dcf2fe1e6",
  "pi_b": "0x10ba6410358899da5ba743dcf2dba099edcf9ff9da8f0760d1afca40456e0bc82c921070ba643014a13e1e6a605144a2bf1f0de99e014ec582934dc1485e4e66002ecd017e904b88c12e5e589970688b272db39baeeaa85e06ef37101d9688600cc0c5188caf298fad69004e2ba1ef4f798098d80b4c19b1339cd123aaee2fa6",
  "pi_c": "0x1e1522dc4222f36be0627a27d9b4e23298655e617f473a6d0d54603b714c11680a94a5fcfb7583f01f91e5be50c73a622a0476f9f67667e508827e0d58493c8d"
}
```

- **build/final_proof/tally/proof_hex.json**

```json
{
  "pi_a": "0x2cd5abfe35d03e843a8584a99420a59ad9af7ea2171437f4e7c97f266996d55d024e7aaa4f0897cbe4021444acf3fcccfb35e568156d75724372b858c1b1e175",
  "pi_b": "0x02b161a19aeb398b15a646ce4e84129e383f7203b278863f98697acafcd72a6505e88e4d0a8671ad78e0a941ed7996b0022fa8845151eec471231b9429095e6e276041f7d810598438e4384b241ef46a84ddb1dc07f070c9ece908c4d13a53970f28cfa1812316671825f4d3621d794cbe6f7483a0d87b7f131e0279d45b7d6d",
  "pi_c": "0x158cae01958a36d7f76dd0b1c0e4b8bbc36c754bdda92dad47c91832db4033280d7b1600c117ed6a76974cee8e080c63dc675213defc820cf3e2419c2158d830"
}
```

- **build/inputs/result.json**

```json
[
  "0",
  "0",
  "0",
  "0",
  "0"
]
```

### Step3

Execute process_message and process_tally commands based on the computed `inputs` and `proof` for the proof phase.

1. Processing message phase.

The value of `new_state_commitment` comes from the **msg** of `commitments.json`, and the **msg proof** data from `build/final_proof/msg/proof_hex.json`.

```shell
// process message
dorad tx wasm execute \
  $CONTRACT_ADDRESS \
  '{ "process_message": { "new_state_commitment": <commitments.json:msg_0000>, "proof": { "a": <msg/proof_hex.json:pi_a>,  "b": <msg/proof_hex.json:pi_b>, "c": <msg/proof_hex.json:pi_c>} } }' \
  --from wallet --gas-prices 0.01uDORA --gas auto --gas-adjustment 1.3 --chain-id "doravota-devnet" --node https://vota-rpc.dorafactory.org:443 -y
```

2. Stop processing period.

```shell
// stop processing period
dorad tx wasm execute \
  $CONTRACT_ADDRESS \
  '{ "stop_processing_period": { } }' \
  --from wallet --gas-prices 0.01uDORA --gas auto --gas-adjustment 1.3 --chain-id "doravota-devnet" --node https://vota-rpc.dorafactory.org:443 -y
```

3. Proceed to the tallying proof stage.

The value of `new_state_commitment` comes from the **tally** of `commitments.json`, and the **tally proof** data from `build/final_proof/tally/proof_hex.json`.

```shell
// process tally
dorad tx wasm execute \
  $CONTRACT_ADDRESS \
  '{ "process_tally": { "new_tally_commitment": <commitments.json:tally_0000>, "proof": { "a": <tally/proof_hex.json:pi_a>,  "b": <tally/proof_hex.json:pi_b>, "c": <tally/proof_hex.json:pi_c>} } }' \
  --from wallet --gas-prices 0.01uDORA --gas auto --gas-adjustment 1.3 --chain-id "doravota-devnet" --node https://vota-rpc.dorafactory.org:443 -y
```

### Step4

Ends the entire round process.

The value of `results` comes from the **tally** of `result.json`

```shell
// stop tallying period
dorad tx wasm execute \
  $CONTRACT_ADDRESS \
  '{ "stop_tallying_period": { "results": <RESULT_DATA>, "salt": <STATE_SALT> } }' \
  --from wallet --gas-prices 0.01uDORA --gas auto --gas-adjustment 1.3 --chain-id "doravota-devnet" --node https://vota-rpc.dorafactory.org:443 -y
```
