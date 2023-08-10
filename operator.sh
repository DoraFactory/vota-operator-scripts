#!/bin/sh

compile_and_ts_and_witness() {
  CONTRACT_ADDRESS=$1
  COORDINATOR_KEY=$2
  STATE_SALT=$3

  # get inputs by js
  mkdir -p build/inputs
  npm install
  node js/getContractLogs.js $CONTRACT_ADDRESS
  node js/genInputs.js $COORDINATOR_KEY $STATE_SALT

  #compile circuits
  mkdir -p build/r1cs

  echo $(date +"%T") "compile the circuit into r1cs, wasm and sym"
  itime="$(date -u +%s)"
  circom circuits/prod/msg.circom --r1cs --wasm --sym -o build/r1cs
  circom circuits/prod/tally.circom --r1cs --wasm --sym -o build/r1cs
  ftime="$(date -u +%s)"
  echo "	($(($(date -u +%s)-$itime))s)"

  # generate witness
  echo $(date +"%T") "start generate witness"
  mkdir -p build/wtns

  node "build/r1cs/msg_js/generate_witness.js" "build/r1cs/msg_js/msg.wasm" "build/inputs/msg-input_0000.json" "./build/wtns/msg.wtns"
  node "build/r1cs/tally_js/generate_witness.js" "build/r1cs/tally_js/tally.wasm" "build/inputs/tally-input_0000.json" "./build/wtns/tally.wtns"

 # generate public and proof
 echo $(date +"%T") "start generate proof"
 mkdir -p build/proof/msg
 mkdir -p build/proof/tally
 mkdir -p build/public
 snarkjs g16p "keys/zkey/msg_1.zkey" "build/wtns/msg.wtns" "build/proof/msg/proof.json" build/public/msg-public.json
 snarkjs g16p "keys/zkey/tally_1.zkey" "build/wtns/tally.wtns" "build/proof/tally/proof.json" build/public/tally-public.json

 # verify proof by snarkjs
 echo $(date +"%T") "start verify the msg proof"
 snarkjs groth16 verify keys/verification_key/msg/verification_key.json build/public/msg-public.json build/proof/msg/proof.json
 echo $(date +"%T") "start verify the tally proof"
 snarkjs groth16 verify keys/verification_key/tally/verification_key.json build/public/tally-public.json build/proof/tally/proof.json

 # start generate final proof
 echo $(date +"%T") "start transform the proof data format"
 mkdir -p build/final_proof/msg
 mkdir -p build/final_proof/tally
 mkdir -p build/final_verification_key/msg
 mkdir -p build/final_verification_key/tally
 cd prove/ && npm install && cd src && node adapt_maci.js msg && node adapt_maci.js tally
 echo "everything is ok"
}

echo "compile & trustesetup for circuit"

CONTRACT_ADDRESS=$1
COORDINATOR_KEY=$2
STATE_SALT=$3
compile_and_ts_and_witness "$CONTRACT_ADDRESS" "$COORDINATOR_KEY" "$STATE_SALT"
