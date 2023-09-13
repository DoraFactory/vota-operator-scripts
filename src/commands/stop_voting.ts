import { Secp256k1HdWallet, SigningCosmosClient } from "@cosmjs/launchpad";
import {
  DirectSecp256k1HdWallet,
  OfflineDirectSigner,
} from "@cosmjs/proto-signing";
import {
  StargateClient,
  SigningStargateClient,
  IndexedTx,
} from "@cosmjs/stargate";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { Tx } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import {
  MaciClient,
  MaciQueryClient,
} from "../../ts/Maci.client";
import {
  CosmWasmClient,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";

import type { CommandModule } from "yargs";
import path from "path";
import {getContractSignerClient} from "../utils";

const commandModule: CommandModule = {
  command: "stop-voting",

  describe: "Stop voting period",

  builder(yargs) {
    return yargs;
  },

  async handler() {
    console.log(`stop voting period`)
    const maci = await getContractSignerClient();
    const res = await maci.stopVotingPeriod();
    console.log(res)
    process.exit(0);
  },
};

export default commandModule;
