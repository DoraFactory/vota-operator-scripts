import type { CommandModule } from "yargs";
import {getContractSignerClient} from "../utils";

const commandModule: CommandModule = {
  command: "start-voting",

  describe: "Start voting period",

  builder(yargs) {
    return yargs;
  },

  async handler() {
    console.log(`start voting period`)
    const maci = await getContractSignerClient();
    const res = await maci.startVotingPeriod({
        amount: [{ denom: "uDORA", amount: "20" }],
        gas: "200000",
    });
    console.log(res)
    process.exit(0);
  },
};

export default commandModule;
