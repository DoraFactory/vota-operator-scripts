import type { CommandModule } from "yargs";

import { RoundInfo } from "../../ts/Maci.types";
import { getContractSignerClient, balanceOf } from "../utils";

type Options = {
  amount?: string;
};

const commandModule: CommandModule<Options, Options> = {
  command: "withdraw",

  describe: "Withdraw (only operator)",

  builder(yargs) {
    return yargs.options({
      amount: { type: "string", desc: "set withdraw amout" },
    });
  },

  async handler({ amount }) {
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (contractAddress === undefined) {
      console.log("Missing CONTRACT_ADDRESS in .env");
      process.exit(0);
    }

    const roundBalance = await balanceOf(contractAddress);
    console.log(contractAddress);
    console.log(`Balance is ${roundBalance}peaka`);
    if (roundBalance !== "0" && roundBalance !== undefined) {
      const maci = await getContractSignerClient();

      const res = await maci.withdraw({
        amount,
      });

      console.log(res);
    } else {
      console.log("Balance is 0, no need to do withdraw anymore.");
    }
    process.exit(0);
  },
};

export default commandModule;
