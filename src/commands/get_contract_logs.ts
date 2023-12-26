import type { CommandModule } from "yargs";

import { getContractLogs, getContractSignerClient } from "../utils";

const commandModule: CommandModule = {
  command: "get-contract-logs",

  describe: "Get contract logs",

  builder(yargs) {
    return yargs;
  },

  async handler() {
    const maci = await getContractSignerClient();
    await getContractLogs(maci.contractAddress);
    process.exit(0);
  },
};

export default commandModule;
