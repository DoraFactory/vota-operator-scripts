import * as fs from "fs";
import type { CommandModule } from "yargs";

import {
  getContractLogs,
  getContractSignerClient,
  readAndParseJsonFile,
  execGenEstimated,
  caculateResult,
} from "../utils";

const commandModule: CommandModule = {
  command: "estimated-result",

  describe: "Estimated result",

  builder(yargs) {
    return yargs;
  },

  async handler() {
    const maci = await getContractSignerClient();
    const path = process.cwd();

    await getContractLogs(maci.contractAddress);

    const res = await maci.maxVoteOptions();
    const max_vote_env = {
      max_vote_options: Number(res),
    };
    fs.writeFileSync(
      `${path}/build/max-vote-options.json`,
      JSON.stringify(max_vote_env)
    );
    console.log(`max_vote_options: ${res}`);

    const contractLogs = await readAndParseJsonFile(
      `${path}/build/contract-logs.json`
    );

    const circuitPower = contractLogs["circuitPower"];

    // node js/genInputs.js $COORDINATOR_KEY
    await execGenEstimated();

    let circuitType = contractLogs["circuitType"];
    let allVotes = await readAndParseJsonFile(
      `${path}/build/inputs/result.json`
    );
    caculateResult(allVotes, circuitType);
    process.exit(0);
  },
};

export default commandModule;
