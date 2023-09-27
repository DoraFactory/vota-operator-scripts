import type { CommandModule } from "yargs";

import { getContractSignerClient } from "../utils";

const commandModule: CommandModule = {
  command: "start-process",

  describe: "start process period after voting end",

  builder(yargs) {
    return yargs;
  },

  async handler() {
    const maci = await getContractSignerClient();
    const res = await maci.startProcessPeriod();
    console.log(res);
    process.exit(0);
  },
};

export default commandModule;
