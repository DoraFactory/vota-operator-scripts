import type { CommandModule } from "yargs";
import path from "path";
import { Uint256, ProofType } from "../../ts/Maci.types";
import {getContractSignerClient, readAndParseJsonFile} from "../utils";

type Options = {
  configPath?: string;
};

const commandModule: CommandModule<Options, Options> = {
  command: "process-message",

  describe: "After voting period, operator need process message",

  builder(yargs) {
    return yargs.options();
  },

  async handler() {
    console.log(`your config is`)

    let commitments = await readAndParseJsonFile(`${path}/build/inputs/commitments.json`);
    console.log(commitments['msg_0000'])
    let newStateCommitment = commitments['msg_0000'];

    let msg_input = await readAndParseJsonFile(`${path}/build/final_proof/msg/proof_hex.json`);
    console.log(msg_input)
    let proof: ProofType = {
      a: msg_input['pi_a'],
      b: msg_input['pi_b'],
      c: msg_input['pi_c']
    }

    const maci = await getContractSignerClient();
    const res = await maci.processMessage({        
      newStateCommitment,
      proof,
    }, {
      amount: [{ denom: "uDORA", amount: "20" }],
      gas: "200000",
    });
    console.log(res)
    process.exit(0);
  },
};

export default commandModule;