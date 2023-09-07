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
import * as fs from 'fs';
import { VotaOperatorCliError } from "./errors";

export const rpcEndpoint = "https://vota-testnet-rpc.dorafactory.org";
export const restEndpoint = "https://vota-testnet-rest.dorafactory.org";
export const chainId = "doravota-devnet";
export const prefix = "dora";


// export const mnemonic = // dora1t58t7azqzq26406uwehgnfekal5kzym3m9lz4k
//   "ride woman device foam siren cruel dove island expand fiber tail exit dynamic alien crouch fish crime story keep law joke sunny they sock";
  
// export const contractAddress = "dora14dky5amkrl4nc0t47pcdth8fjh940mkyfcdup55medx5rj8gsxaqrst236"


export async function getContractSignerClient() {
  const contractAddress = process.env.CONTRACT_ADDRESS
  const mnemonic = process.env.MNEMONIC
  if (contractAddress === undefined) {
    console.log("Missing CONTRACT_ADDRESS in .env")
    process.exit(0);
  }

  if (mnemonic === undefined) {
    console.log("Missing MNEMONIC in .env")
    process.exit(0);
  }
    const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix,
        });
  const signingCosmWasmClient = await SigningCosmWasmClient.connectWithSigner(
    rpcEndpoint,
    wallet
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
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    return jsonData;
  } catch (error) {
    throw error;
  }
}


export function countMsgAndTally(jsonData: any): { msgCount: number; tallyCount: number } {
  let msgCount = 0;
  let tallyCount = 0;
  for (const key in jsonData) {
    if (key.startsWith('msg_')) {
      msgCount++;
    } else if (key.startsWith('tally_')) {
      tallyCount++;
    }
  }
  
  return { msgCount, tallyCount };
}

export function formatNumber(number: number): string {
  const formattedNumber = number.toString().padStart(4, '0');
  return formattedNumber;
}