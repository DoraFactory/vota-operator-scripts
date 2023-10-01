import * as fs from "fs";

import type { CommandModule } from "yargs";

import { getContractSignerClient } from "../utils";

type Options = {
  optionIndex: string;
};

const commandModule: CommandModule<Options, Options> = {
  command: "get-result <optionIndex>",

  describe: "Get round result by option index",

  builder(yargs) {
    return yargs;
  },

  async handler({ optionIndex }) {
    const maci = await getContractSignerClient();
    const res = await maci.getResult({ index: optionIndex.toString() });
    console.log(res);
    process.exit(0);
  },
};

export default commandModule;
