import type { CommandModule } from "yargs";
import { GasPrice, StdFee, calculateFee } from "@cosmjs/stargate";

import { Uint256 } from "../../ts/Maci.types";
import {
  getContractSignerClient,
  readAndParseJsonFile,
  countMsgAndTally,
  formatNumber,
} from "../utils";

const commandModule: CommandModule = {
  command: "stop-tallying",

  describe: "Stop tallying period",

  builder(yargs) {
    return yargs;
  },

  async handler() {
    console.log(`stop tallying period`);
    const maci = await getContractSignerClient();
    const path = process.cwd();
    const results: Uint256[] = await readAndParseJsonFile(
      `${path}/build/inputs/result.json`
    );
    const commitments = await readAndParseJsonFile(
      `${path}/build/inputs/commitments.json`
    );
    const { msgCount, tallyCount } = countMsgAndTally(commitments);
    const tally_final_input = await readAndParseJsonFile(
      `${path}/build/inputs/tally-input_${formatNumber(tallyCount - 1)}.json`
    );
    const salt: Uint256 = tally_final_input.newResultsRootSalt;

    const gasPrice = GasPrice.fromString("100000000000" + "peaka");
    const fee = calculateFee(100000000, gasPrice);

    const res = await maci.stopTallyingPeriod({ results, salt }, fee);
    console.log(res);
    console.log(res.transactionHash);
    process.exit(0);
  },
};

export default commandModule;
