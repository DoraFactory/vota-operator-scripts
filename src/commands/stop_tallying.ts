import type { CommandModule } from "yargs";
import { Uint256, ProofType } from "../../ts/Maci.types";
import {getContractSignerClient, readAndParseJsonFile, countMsgAndTally, formatNumber} from "../utils";

const commandModule: CommandModule = {
  command: "stop-tallying",

  describe: "Stop tallying period",

  builder(yargs) {
    return yargs;
  },

  async handler() {
    console.log(`stop tallying period`)
    const maci = await getContractSignerClient();
    const path = process.cwd()
    let results:Uint256[] = await readAndParseJsonFile(`${path}/build/inputs/result.json`);
    let commitments = await readAndParseJsonFile(`${path}/build/inputs/commitments.json`);
    const { msgCount, tallyCount } = countMsgAndTally(commitments);
    let tally_final_input = await readAndParseJsonFile(`${path}/build/inputs/tally-input_${formatNumber(tallyCount-1)}.json`);
    let salt: Uint256 = tally_final_input["newResultsRootSalt"]

    const res = await maci.stopTallyingPeriod({results, salt}, {
      amount: [{ denom: "uDORA", amount: "10000000" }],
      gas: "10000000",
    });
    console.log(res)
    process.exit(0);
  },
};

export default commandModule;
