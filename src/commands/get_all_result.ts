import * as fs from "fs";

import type { CommandModule } from "yargs";

import { getContractSignerClient } from "../utils";

const commandModule: CommandModule = {
  command: "get-all-result",

  describe: "Get round results",

  builder(yargs) {
    return yargs;
  },

  async handler() {
    const maci = await getContractSignerClient();
    const res = await maci.getAllResult();
    console.log(res);
    process.exit(0);
  },
};

export default commandModule;
