import type { CommandModule } from "yargs";
import { Uint256, ProofType } from "../../ts/Maci.types";
import {getContractSignerClient, readAndParseJsonFile, countMsgAndTally, formatNumber} from "../utils";


const commandModule: CommandModule = {
  command: "process-tally",

  describe: "After processing period, operator need process tally",

  builder(yargs) {
    return yargs;
  },

  async handler() {
    const maci = await getContractSignerClient();
    const path = process.cwd()
    let commitments = await readAndParseJsonFile(`${path}/build/inputs/commitments.json`);
    const { msgCount, tallyCount } = countMsgAndTally(commitments);
    for (let i = 0; i < tallyCount; i += 1) {
      const tailNum = formatNumber(i)
      console.log(`tally_${tailNum}`)
      const newTallyCommitment = commitments[`tally_${tailNum}`];
      const tally_proof = await readAndParseJsonFile(`${path}/build/final_proof/tally_${tailNum}/proof_hex.json`);
      const proof: ProofType = {
        a: tally_proof['pi_a'],
        b: tally_proof['pi_b'],
        c: tally_proof['pi_c']
      }

      const res = await maci.processTally({        
        newTallyCommitment,
        proof,
      }, {
        amount: [{ denom: "uDORA", amount: "20" }],
        gas: "200000",
      });
      console.log(res)
      console.log("")
    }
    process.exit(0);
  },
};

export default commandModule;
