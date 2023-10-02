import * as fs from "fs";
import { spawnSync } from "child_process";
import chalk from "chalk";

import { Secp256k1HdWallet } from "@cosmjs/launchpad";
import { GasPrice, SigningStargateClient } from "@cosmjs/stargate";
import {
  SigningCosmWasmClient,
  SigningCosmWasmClientOptions,
} from "@cosmjs/cosmwasm-stargate";

import { MaciClient } from "../../ts/Maci.client";

export const rpcEndpoint = "https://vota-rpc.dorafactory.org";
export const restEndpoint = "https://vota-rest.dorafactory.org";
export const chainId = "vota-ash";
export const prefix = "dora";

// export const mnemonic = // dora1t58t7azqzq26406uwehgnfekal5kzym3m9lz4k
//   "ride woman device foam siren cruel dove island expand fiber tail exit dynamic alien crouch fish crime story keep law joke sunny they sock";

// export const contractAddress = "dora14dky5amkrl4nc0t47pcdth8fjh940mkyfcdup55medx5rj8gsxaqrst236"

/** Setting to speed up testing */
const defaultSigningClientOptions: SigningCosmWasmClientOptions = {
  broadcastPollIntervalMs: 8_000,
  broadcastTimeoutMs: 16_000,
  gasPrice: GasPrice.fromString("100000000000peaka"),
};

export async function getContractSignerClient() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const mnemonic = process.env.MNEMONIC;
  if (contractAddress === undefined) {
    console.log("Missing CONTRACT_ADDRESS in .env");
    process.exit(0);
  }

  if (mnemonic === undefined) {
    console.log("Missing MNEMONIC in .env");
    process.exit(0);
  }
  const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix,
  });
  const signingCosmWasmClient = await SigningCosmWasmClient.connectWithSigner(
    rpcEndpoint,
    wallet,
    {
      ...defaultSigningClientOptions,
    }
  );

  const [{ address }] = await wallet.getAccounts();
  return new MaciClient(
    signingCosmWasmClient,
    address, // "dora1t58t7azqzq26406uwehgnfekal5kzym3m9lz4k"
    contractAddress
  );
}

export async function readAndParseJsonFile(filePath: string): Promise<any> {
  try {
    const fileContent = await fs.promises.readFile(filePath, "utf-8");
    const jsonData = JSON.parse(fileContent);
    return jsonData;
  } catch (error) {
    throw error;
  }
}

export function countMsgAndTally(jsonData: any): {
  msgCount: number;
  tallyCount: number;
} {
  let msgCount = 0;
  let tallyCount = 0;
  for (const key in jsonData) {
    if (key.startsWith("msg_")) {
      msgCount++;
    } else if (key.startsWith("tally_")) {
      tallyCount++;
    }
  }

  return { msgCount, tallyCount };
}

export function formatNumber(number: number): string {
  const formattedNumber = number.toString().padStart(4, "0");
  return formattedNumber;
}

const exeNumber = (inputString: string) => {
  const match = inputString.match(/0+\d+$/); // 匹配末尾的数字
  if (match) {
    return Number(match[0]);
  }
  return "";
};

export function formatResults(all_result: string, results: string[]) {
  let all_vote = exeNumber(all_result);
  // console.log(`All vote power: ${all_vote}`);
  let all_votes = ``;
  let index = 0;
  for (let result of results) {
    let vote = exeNumber(result);
    let vote_data = ((Number(vote) / Number(all_vote)) * 100).toFixed(4);
    let vote_string_return = `Option ${
      index + 1
    }, Vote Percentage: ${vote_data}%\n`;
    all_votes += vote_string_return;
    index += 1;
  }
  return all_votes;
}

export function execGenInput() {
  console.log(chalk.green("genInput (download zkey and MACI messages):"));

  const scriptPath = "./operator.sh";

  const result = spawnSync("bash", [scriptPath], {
    stdio: "inherit",
  });

  if (result.error) {
    console.error(`Tally script execution failed: ${result.error.message}`);
  } else if (result.status !== 0) {
    console.error(
      `Tally script execution failed, error code: ${result.status}`
    );
  } else {
    console.log("Tally script successfully executed.\n");
  }
}
