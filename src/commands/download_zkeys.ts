import type { CommandModule } from "yargs";

import {
  getContractLogs,
  getContractSignerClient,
  downloadAndExtractZKeys,
  readAndParseJsonFile,
} from "../utils";

const commandModule: CommandModule = {
  command: "download-zkeys",

  describe: "Download zkeys",

  builder(yargs) {
    return yargs;
  },

  async handler() {
    const maci = await getContractSignerClient();
    await getContractLogs(maci.contractAddress);
    const path = process.cwd();

    const contractLogs = await readAndParseJsonFile(
      `${path}/build/contract-logs.json`
    );

    const circuitPower = contractLogs["circuitPower"];
    const certificationSystem = contractLogs["certificationSystem"];

    await downloadAndExtractZKeys(circuitPower, certificationSystem);
    process.exit(0);
  },
};

export default commandModule;
