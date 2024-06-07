#!/bin/sh

format_zkeys() {
  mkdir -p zkeys/final_verification_key/msg
  node ./prove/src/adapt_vkey.js msg

  mkdir -p zkeys/final_verification_key/tally
  node ./prove/src/adapt_vkey.js tally

 echo "everything is ok"
}


format_zkeys