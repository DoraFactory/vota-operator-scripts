#!/bin/sh
env_file=".env"

compile_and_ts_and_witness() {
  COORDINATOR_KEY=$1

  # get inputs by js
  echo -e "\033[32mGenerate input: \033[0m"
  node js/genInputs.js $COORDINATOR_KEY

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
 echo -e "\033[34mSuccessfully generated proof \033[0m"
}

if [ -f "$env_file" ]; then
    source "$env_file"

    if [ -z "$COORDINATOR_KEY" ]; then
        echo "Error: COORDINATOR_KEY is empty."
        exit 1
    fi

    compile_and_ts_and_witness "$COORDINATOR_KEY"

else
    echo ".env does not exist or is unreadable."
fi
