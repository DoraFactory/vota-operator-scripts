import type { CommandModule } from "yargs";
import { Uint256, ProofType } from "../../ts/Maci.types";
import {getContractSignerClient, readAndParseJsonFile, countMsgAndTally, formatNumber} from "../utils";


const commandModule: CommandModule = {
  command: "process-message",

  describe: "After voting period, operator need process message",

  builder(yargs) {
    return yargs;
  },

  async handler() {
    const maci = await getContractSignerClient();
    const path = process.cwd()
    let commitments = await readAndParseJsonFile(`${path}/build/inputs/commitments.json`);
    const { msgCount, tallyCount } = countMsgAndTally(commitments);
    for (let i = 0; i < msgCount; i += 1) {
      const tailNum = formatNumber(i)
      console.log(`msg_${tailNum}`)
      console.log(commitments[`msg_${tailNum}`])
      const newStateCommitment = commitments[`msg_${tailNum}`];
      const msg_input = await readAndParseJsonFile(`${path}/build/final_proof/msg_${tailNum}/proof_hex.json`);
      const proof: ProofType = {
        a: msg_input['pi_a'],
        b: msg_input['pi_b'],
        c: msg_input['pi_c']
      }

      const res = await maci.processMessage({        
        newStateCommitment,
        proof,
      }, {
        amount: [{ denom: "uDORA", amount: "20" }],
        gas: "200000",
      });
      console.log(res)
      console.log("")
    }

    // for (let i = 0; i < tallyCount; i += 1) {
    //   console.log(`tally_${formatNumber(i)}`)
    //   console.log(commitments[`tally_${formatNumber(i)}`])

    // }


    process.exit(0);
  },
};

export default commandModule;
