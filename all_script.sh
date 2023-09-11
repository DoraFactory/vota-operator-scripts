#!/bin/sh

compile_and_ts_and_witness() {
  echo "compile & trustesetup for circuit"
  CONTRACT_ADDRESS=$1
  COORDINATOR_KEY=$2
  STATE_SALT=$3

  # get inputs by js
  echo "get contract logs and gen input"
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

  # create zkey
  echo $(date +"%T") "start create zkey"
  mkdir -p build/zkey
  snarkjs g16s build/r1cs/msg.r1cs ptau/powersOfTau28_hez_final_22.ptau build/zkey/msg_0.zkey
  snarkjs g16s build/r1cs/tally.r1cs ptau/powersOfTau28_hez_final_22.ptau build/zkey/tally_0.zkey

  # output verification key
  echo $(date +"%T") "output verification key"
  mkdir -p build/verification_key/msg
  mkdir -p build/verification_key/tally
  snarkjs zkc build/zkey/msg_0.zkey build/zkey/msg_1.zkey --name="DoraHacks" -v
  snarkjs zkev build/zkey/msg_1.zkey build/verification_key/msg/verification_key.json

  snarkjs zkc build/zkey/tally_0.zkey build/zkey/tally_1.zkey --name="DoraHacks" -v
  snarkjs zkev build/zkey/tally_1.zkey build/verification_key/tally/verification_key.json

  # generate witness
  echo $(date +"%T") "start generate witness"
  mkdir -p build/wtns

  folder_path="./build/inputs"
  mkdir -p build/public
  for file in "$folder_path"/msg-input_*.json; do
      if [ -f "$file" ]; then
        filename=$(basename "$file") 
        number=$(echo "$filename" | cut -d '_' -f 2 | cut -d '.' -f 1)
        node "build/r1cs/msg_js/generate_witness.js" "build/r1cs/msg_js/msg.wasm" $file "./build/wtns/msg-$number.wtns"

        # generate public and proof
        echo $(date +"%T") "start generate proof"
        mkdir -p build/proof/msg-$number
        snarkjs g16p "zkeys/zkey/msg_1.zkey" "build/wtns/msg-$number.wtns" "build/proof/msg-$number/proof.json" build/public/msg-public-$number.json

        # verify proof by snarkjs
        echo $(date +"%T") "start verify the msg proof"
        snarkjs groth16 verify zkeys/verification_key/msg/verification_key.json build/public/msg-public-$number.json build/proof/msg-$number/proof.json

        # start generate final proof
        echo $(date +"%T") "start transform the proof data format"
        mkdir -p build/final_proof/msg-$number
        mkdir -p build/final_verification_key/msg-$number
        node ./prove/src/adapt_maci.js msg $number
      fi
  done

  for file in "$folder_path"/tally-input_*.json; do
      if [ -f "$file" ]; then
        filename=$(basename "$file") 
        number=$(echo "$filename" | cut -d '_' -f 2 | cut -d '.' -f 1)
        node "build/r1cs/tally_js/generate_witness.js" "build/r1cs/tally_js/tally.wasm" $file "./build/wtns/tally-$number.wtns"

        # generate public and proof
        echo $(date +"%T") "start generate proof"
        mkdir -p build/proof/tally-$number
        snarkjs g16p "zkeys/zkey/tally_1.zkey" "build/wtns/tally-$number.wtns" "build/proof/tally-$number/proof.json" build/public/tally-public-$number.json

        # verify proof by snarkjs
        echo $(date +"%T") "start verify the tally proof"
        snarkjs groth16 verify zkeys/verification_key/tally/verification_key.json build/public/tally-public-$number.json build/proof/tally-$number/proof.json

        # start generate final proof
        echo $(date +"%T") "start transform the proof data format"
        mkdir -p build/final_proof/tally-$number
        mkdir -p build/final_verification_key/tally-$number
        node ./prove/src/adapt_maci.js tally $number
      fi
  done
 echo "everything is ok"
}


if [ -f "$env_file" ]; then
    source "$env_file"
       # 检查CONTRACT_ADDRESS是否为空
    if [ -z "$CONTRACT_ADDRESS" ]; then
        echo "Error: CONTRACT_ADDRESS为空。"
        exit 1
    fi

    # 检查COORDINATOR_KEY是否为空
    if [ -z "$COORDINATOR_KEY" ]; then
        echo "Error: COORDINATOR_KEY为空。"
        exit 1
    fi

    # 检查STATE_SALT是否为空
    if [ -z "$STATE_SALT" ]; then
        echo "Error: STATE_SALT为空。"
        exit 1
    fi

    compile_and_ts_and_witness "$CONTRACT_ADDRESS" "$COORDINATOR_KEY" "$STATE_SALT"
else
    echo ".env 文件不存在或不可读取。"
fi
