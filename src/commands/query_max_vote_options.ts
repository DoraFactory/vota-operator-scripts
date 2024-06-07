import * as fs from "fs";

import type { CommandModule } from "yargs";

import { getContractSignerClient } from "../utils";

const commandModule: CommandModule = {
  command: "query-max-vote-options",

  describe: "Query the number of max vote options",

  builder(yargs) {
    return yargs;
  },

  async handler() {
    const maci = await getContractSignerClient();
    const res = await maci.maxVoteOptions();
    const path = process.cwd();
    const max_vote_env = {
      max_vote_options: Number(res),
    };
    fs.writeFileSync(
      `${path}/build/max-vote-options.json`,
      JSON.stringify(max_vote_env)
    );
    console.log(`max_vote_options: ${res}`);
    process.exit(0);
  },
};

export default commandModule;
