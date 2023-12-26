#!/bin/sh
env_file=".env"

compile_and_ts_and_witness() {
  COORDINATOR_KEY=$1

  # get inputs by js
  echo -e "\033[32mGenerate input: \033[0m"
  node js/genInputs.js $COORDINATOR_KEY
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
