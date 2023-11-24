#!/bin/sh
env_file=".env"

compile_and_ts_and_witness() {
  echo "operator get proof"
  COORDINATOR_KEY=$1
  rm -r build/

  if [ ! -d "zkeys" ]; then
    curl -O https://vota-zkey.s3.ap-southeast-1.amazonaws.com/2115_all_zkeys.tar.gz
    tar -zxf 2115_all_zkeys.tar.gz zkeys
    rm -f 2115_all_zkeys.tar.gz
  else
    read -p "The keys folder already exists, need re-download it? (y/n): " choice
    if [ "$choice" == "y" ]; then
      rm -rf zkeys
      curl -O https://vota-zkey.s3.ap-southeast-1.amazonaws.com/2115_all_zkeys.tar.gz
      tar -zxf 2115_all_zkeys.tar.gz zkeys
      rm -f 2115_all_zkeys.tar.gz
    fi
  fi
  # get inputs by js
  mkdir -p build/inputs

  echo "get contract logs and gen input"
  # node dist/operator.mjs query-max-vote-options
  # node js/getContractLogs.js $CONTRACT_ADDRESS
  # node js/genInputs.js $COORDINATOR_KEY
  node js/maci.test.js build/inputs
  #compile circuits
#   mkdir -p build/r1cs

#   echo $(date +"%T") "compile the circuit into r1cs, wasm and sym"
#   itime="$(date -u +%s)"
#   circom circuits/prod/msg.circom --r1cs --wasm --sym -o build/r1cs
#   circom circuits/prod/tally.circom --r1cs --wasm --sym -o build/r1cs
#   ftime="$(date -u +%s)"
#   echo "	($(($(date -u +%s)-$itime))s)"

  # generate witness
  echo $(date +"%T") "start generate witness"
  mkdir -p build/wtns

  folder_path="./build/inputs"
  mkdir -p build/public

  for file in "$folder_path"/msg-input_*.json; do
      if [ -f "$file" ]; then
        filename=$(basename "$file") 
        number=$(echo "$filename" | cut -d '_' -f 2 | cut -d '.' -f 1)
        node "zkeys/r1cs/msg_js/generate_witness.js" "zkeys/r1cs/msg_js/msg.wasm" $file "./build/wtns/msg_$number.wtns"

        # generate public and proof
        echo $(date +"%T") "start generate proof"
        mkdir -p build/proof/msg_$number
        node node_modules/snarkjs/cli.js g16p "zkeys/zkey/msg_1.zkey" "build/wtns/msg_$number.wtns" "build/proof/msg_$number/proof.json" build/public/msg-public_$number.json

        # verify proof by snarkjs
        echo $(date +"%T") "start verify the msg proof"
        node node_modules/snarkjs/cli.js groth16 verify zkeys/verification_key/msg/verification_key.json build/public/msg-public_$number.json build/proof/msg_$number/proof.json

        # start generate final proof
        echo $(date +"%T") "start transform the proof data format"
        mkdir -p build/final_proof/msg_$number
        mkdir -p build/final_verification_key/msg_$number
        node ./prove/src/adapt_maci.js msg $number
      fi
  done

  for file in "$folder_path"/tally-input_*.json; do
      if [ -f "$file" ]; then
        filename=$(basename "$file") 
        number=$(echo "$filename" | cut -d '_' -f 2 | cut -d '.' -f 1)
        node "zkeys/r1cs/tally_js/generate_witness.js" "zkeys/r1cs/tally_js/tally.wasm" $file "./build/wtns/tally_$number.wtns"

        # generate public and proof
        echo $(date +"%T") "start generate proof"
        mkdir -p build/proof/tally_$number
        node node_modules/snarkjs/cli.js g16p "zkeys/zkey/tally_1.zkey" "build/wtns/tally_$number.wtns" "build/proof/tally_$number/proof.json" build/public/tally-public_$number.json

        # verify proof by snarkjs
        echo $(date +"%T") "start verify the tally proof"
        node node_modules/snarkjs/cli.js groth16 verify zkeys/verification_key/tally/verification_key.json build/public/tally-public_$number.json build/proof/tally_$number/proof.json

        # start generate final proof
        echo $(date +"%T") "start transform the proof data format"
        mkdir -p build/final_proof/tally_$number
        mkdir -p build/final_verification_key/tally_$number
        node ./prove/src/adapt_maci.js tally $number
      fi
  done
 echo "everything is ok"
}


if [ -f "$env_file" ]; then
    source "$env_file"

    if [ -z "$COORDINATOR_KEY" ]; then
        echo "Error: COORDINATOR_KEY is empty。"
        exit 1
    fi

    compile_and_ts_and_witness "$COORDINATOR_KEY"
else
    echo ".env isn't exist."
fi
