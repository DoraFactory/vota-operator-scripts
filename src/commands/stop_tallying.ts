import type { CommandModule } from "yargs";
import path from "path";
import { Uint256, ProofType,  } from "../../ts/Maci.types";
import {getContractSignerClient, readAndParseJsonFile} from "../utils";

const commandModule: CommandModule = {
  command: "stop-tallying",

  describe: "Stop tallying period",

  builder(yargs) {
    return yargs;
  },

  async handler() {
    console.log(`stop tallying period`)
    const maci = await getContractSignerClient();
    let tally_final_input = await readAndParseJsonFile(`${path}/build/inputs/tally-input_0000.json`);
    console.log(tally_final_input)
    let results: Uint256[] = tally_final_input["currentResults"]
    let salt: Uint256 = tally_final_input["newResultsRootSalt"]

    const res = await maci.stopTallyingPeriod( {results, salt}, {
        amount: [{ denom: "uDORA", amount: "20" }],
        gas: "200000",
    });
    console.log(res)
    process.exit(0);
  },
};

export default commandModule;
