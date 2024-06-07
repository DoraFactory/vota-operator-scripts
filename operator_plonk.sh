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

        # generate public and proof
        echo $(date +"%T") "start generate proof"
        mkdir -p build/proof/msg_$number

        node "zkeys/r1cs/msg_js/generate_witness.js" "zkeys/r1cs/msg_js/msg.wasm" $file "build/wtns/msg_$number.wtns"
        plonkit prove --srs_monomial_form "./zkeys/zkey/plonk.key"  --circuit "zkeys/r1cs/msg.r1cs" --witness "build/wtns/msg_$number.wtns" --publicjson "build/public/msg-public_$number.json" --proofjson "build/proof/msg_$number/proof.json" --proof "build/proof/msg_$number/proof.bin"
      fi
  done

  for file in "$folder_path"/tally-input_*.json; do
      if [ -f "$file" ]; then
        filename=$(basename "$file") 
        number=$(echo "$filename" | cut -d '_' -f 2 | cut -d '.' -f 1)

        # generate public and proof
        echo $(date +"%T") "start generate proof"
        mkdir -p build/proof/tally_$number

        node "zkeys/r1cs/tally_js/generate_witness.js" "zkeys/r1cs/tally_js/tally.wasm" $file "build/wtns/tally_$number.wtns"
        plonkit prove --srs_monomial_form "./zkeys/zkey/plonk.key" --circuit "zkeys/r1cs/tally.r1cs" --witness "build/wtns/tally_$number.wtns" --publicjson "build/public/tally-public_$number.json" --proofjson "build/proof/tally_$number/proof.json" --proof "build/proof/tally_$number/proof.bin"
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
