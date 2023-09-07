import type { CommandModule } from "yargs";
import path from "path";
import { Uint256, ProofType } from "../../ts/Maci.types";
import {getContractSignerClient, readAndParseJsonFile} from "../utils";

const commandModule: CommandModule = {
  command: "stop-processing",

  describe: "Stop processing period",

  builder(yargs) {
    return yargs;
  },

  async handler() {
    console.log(`stop processing period`)
    const maci = await getContractSignerClient();
    const res = await maci.stopProcessingPeriod( {
      amount: [{ denom: "uDORA", amount: "10000000" }],
      gas: "40000000",
    });
    console.log(res)
    process.exit(0);
  },
};

export default commandModule;
