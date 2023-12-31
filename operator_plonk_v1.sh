#!/bin/sh
env_file=".env"

compile_and_ts_and_witness() {
  CONTRACT_ADDRESS=$1
  COORDINATOR_KEY=$2

  rm -r build/

  mkdir -p build/inputs

  echo -e "\033[32mGet MACI messages from the smart contract: \033[0m"
  node dist/operator.mjs query-max-vote-options
  node js/getContractLogs.js $CONTRACT_ADDRESS
  CIRCUIT_POWER=$(jq -r '.circuitPower' build/contract-logs.json)
  echo -e "\033[32mOperator downloading zkey: \033[0m"

  if [ ! -d "zkeys" ]; then
    curl -O https://vota-zkey.s3.ap-southeast-1.amazonaws.com/plonk_qv1p1v_"$CIRCUIT_POWER"_zkeys.tar.gz
    tar -zxf plonk_qv1p1v_"$CIRCUIT_POWER"_zkeys.tar.gz zkeys
    rm -f plonk_qv1p1v_"$CIRCUIT_POWER"_zkeys.tar.gz
  else
    read -p "Zkey folder already exists, do you want to override? (y/n): " choice
    if [ "$choice" == "y" ]; then
      rm -rf zkeys
      curl -O https://vota-zkey.s3.ap-southeast-1.amazonaws.com/plonk_qv1p1v_"$CIRCUIT_POWER"_zkeys.tar.gz
      tar -zxf plonk_qv1p1v_"$CIRCUIT_POWER"_zkeys.tar.gz zkeys
      rm -f plonk_qv1p1v_"$CIRCUIT_POWER"_zkeys.tar.gz
    fi
  fi
  # get inputs by js
  echo -e "\033[32mGenerate input: \033[0m"
  node js/genInputs.js $COORDINATOR_KEY
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
    if [ -z "$CONTRACT_ADDRESS" ]; then
        echo "Error: CONTRACT_ADDRESS is empty."
        exit 1
    fi

    if [ -z "$COORDINATOR_KEY" ]; then
        echo "Error: COORDINATOR_KEY is empty."
        exit 1
    fi

    compile_and_ts_and_witness "$CONTRACT_ADDRESS" "$COORDINATOR_KEY"

else
    echo ".env does not exist or is unreadable."
fi
