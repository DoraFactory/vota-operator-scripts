import { RoundInfo } from './../../ts/Maci.types';
import type { CommandModule } from "yargs";
import { Uint256, ProofType } from "../../ts/Maci.types";
import {getContractSignerClient, readAndParseJsonFile, countMsgAndTally, formatNumber} from "../utils";

type Options = {
  title: string,
  description?: string
  link?: string
}

const commandModule: CommandModule<Options, Options> = {
  command: "set-round-info <title>",

  describe: "Set round info(title, description, link)",

  builder(yargs) {
    return yargs.options({
      description: { type: 'string', desc: "Description of this round" },
      link: { type: 'string', desc: "Link of this round" }
    });
  },

  async handler({title, description, link}) {
    const maci = await getContractSignerClient();
    let descriptionData = ""
    if (description !== undefined) {
      descriptionData = description
    }

    let linkData = ""
    if (link !== undefined) {
      linkData = link
    }

    let roundInfo: RoundInfo = {
      title,
      description: descriptionData,
      link: linkData
    }
    console.log(roundInfo)
    const res = await maci.setRoundInfo({roundInfo}, {
      amount: [{ denom: "uDORA", amount: "600000" }],
      gas: "400000",
    });
    console.log(res)
    process.exit(0);
  },
};

export default commandModule;
