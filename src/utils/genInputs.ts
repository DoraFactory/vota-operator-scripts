// import * as fs from "fs";
// import * as path from "path";
// import { stringizing, genRandomKey } from "./keypair";
// import MACI from "./maci";

// function toBigInt(list: number[]): bigint[] {
//   return list.map((n) => BigInt(n));
// }

// console.log(process.argv);

// const coordinatorKey: bigint = BigInt(process.argv[2]);
// const dirname = process.cwd();
// const logsPath: string = "./build/contract-logs.json";
// const outputPath: string = "./build/inputs";
// const maxVoteOptionsPath: string = "./build/max-vote-options.json";

// const rawdata: Buffer = fs.readFileSync(logsPath);
// const logs: any = JSON.parse(rawdata);

// const maxVoteOptionsdata: Buffer = fs.readFileSync(maxVoteOptionsPath);
// const maxVoteOptionsJson: any = JSON.parse(maxVoteOptionsdata);
// let [stateTreeDepth, intStateTreeDepth, voteOptionTreeDepth, batchSize] =
//   logs.circuitPower.split("-");

// // * DEV *
// const maxVoteOptions: number = Number(maxVoteOptionsJson.max_vote_options);
// const main: MACI = new MACI(
//   Number(stateTreeDepth),
//   Number(intStateTreeDepth),
//   Number(voteOptionTreeDepth),
//   Number(batchSize), // tree config
//   coordinatorKey,
//   maxVoteOptions,
//   logs.states.length,
//   BigInt(logs.circuitType)
// );

// for (const state of logs.states) {
//   main.initStateTree(Number(state.idx), toBigInt(state.pubkey), state.balance);
// }

// for (const msg of logs.messages) {
//   main.pushMessage(toBigInt(msg.msg), toBigInt(msg.pubkey));
// }

// main.endVotePeriod();

// const commitments: { [key: string]: bigint } = {};

// // PROCESSING
// let i: number = 0;
// while (main.states === 1) {
//   const input: bigint[] = main.processMessage(genRandomKey());
//   // const input = main.processMessage(1234567890n)
//   // const input = main.processMessage(stateSalt)
//   commitments["msg_" + i.toString().padStart(4, "0")] = main.stateCommitment;

//   fs.writeFileSync(
//     path.join(outputPath, `msg-input_${i.toString().padStart(4, "0")}.json`),
//     JSON.stringify(stringizing(input), undefined, 2)
//   );
//   i++;
// }

// // TALLYING
// i = 0;
// while (main.states === 2) {
//   const input: bigint[] = main.processTally(genRandomKey());
//   // const input = main.processTally(1234567890n)
//   // const input = main.processTally(stateSalt)
//   commitments["tally_" + i.toString().padStart(4, "0")] = main.tallyCommitment;

//   fs.writeFileSync(
//     path.join(outputPath, `tally-input_${i.toString().padStart(4, "0")}.json`),
//     JSON.stringify(stringizing(input), undefined, 2)
//   );
//   i++;
// }

// fs.writeFileSync(
//   path.join(outputPath, "result.json"),
//   JSON.stringify(
//     stringizing(main.tallyResults.leaves().slice(0, maxVoteOptions)),
//     undefined,
//     2
//   )
// );

// fs.writeFileSync(
//   path.join(outputPath, "commitments.json"),
//   JSON.stringify(stringizing(commitments), undefined, 2)
// );
