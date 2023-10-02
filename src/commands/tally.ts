import type { CommandModule } from "yargs";
import chalk from "chalk";

import { Uint256, ProofType } from "../../ts/Maci.types";
import {
  getContractSignerClient,
  readAndParseJsonFile,
  execGenInput,
  formatNumber,
  countMsgAndTally,
  formatResults,
} from "../utils";

const commandModule: CommandModule = {
  command: "tally",

  describe: "all tally func",

  builder(yargs) {
    return yargs;
  },

  async handler() {
    const maci = await getContractSignerClient();
    const path = process.cwd();

    try {
      const period = await maci.getPeriod();
      console.log(chalk.blue(`The current MACI round is ${period.status}`));
      const { start_time, end_time } = await maci.getVotingTime();
      const now = new Date().getTime() * 10 ** 6;
      if (period.status === "pending" || period.status === "voting") {
        if (Number(end_time) < now) {
          console.log(chalk.green("startProcessing"));
          const start_process_res = await maci.startProcessPeriod();
          console.log(start_process_res);
          execGenInput();
          const commitments = await readAndParseJsonFile(
            `${path}/build/inputs/commitments.json`
          );
          const { msgCount, tallyCount } = countMsgAndTally(commitments);

          console.log(
            "Submitting on-chain transactions to verify zero-knowledge proofs."
          );
          console.log(chalk.green("processMessage"));

          for (let i = 0; i < msgCount; i += 1) {
            const tailNum = formatNumber(i);
            console.log(`msg_${tailNum}`);
            console.log(commitments[`msg_${tailNum}`]);
            const newStateCommitment = commitments[`msg_${tailNum}`];
            const msg_input = await readAndParseJsonFile(
              `${path}/build/final_proof/msg_${tailNum}/proof_hex.json`
            );
            const proof: ProofType = {
              a: msg_input.pi_a.substring(2),
              b: msg_input.pi_b.substring(2),
              c: msg_input.pi_c.substring(2),
            };

            try {
              const process_message_res = await maci.processMessage({
                newStateCommitment,
                proof,
              });
              console.log(process_message_res);
            } catch {
              console.log(
                "Zero-knowledge proof verification failed. (processMessage)"
              );
            }
            console.log("");
          }
          console.log(chalk.green("stopProcessing"));

          const stop_processing_res = await maci.stopProcessingPeriod();
          console.log(stop_processing_res);
          console.log("");

          console.log(chalk.green("processTallying"));

          for (let i = 0; i < tallyCount; i += 1) {
            const tailNum = formatNumber(i);
            console.log(`tally_${tailNum}`);
            const newTallyCommitment = commitments[`tally_${tailNum}`];
            console.log(newTallyCommitment);
            const tally_proof = await readAndParseJsonFile(
              `${path}/build/final_proof/tally_${tailNum}/proof_hex.json`
            );
            const proof: ProofType = {
              a: tally_proof.pi_a.substring(2),
              b: tally_proof.pi_b.substring(2),
              c: tally_proof.pi_c.substring(2),
            };

            try {
              const process_tally_res = await maci.processTally({
                newTallyCommitment,
                proof,
              });
              console.log(process_tally_res);
            } catch {
              console.log(
                "Zero-knowledge proof verification failed. (processTally)"
              );
            }
            console.log("");
          }

          console.log(chalk.green("stopTallying"));

          const results: Uint256[] = await readAndParseJsonFile(
            `${path}/build/inputs/result.json`
          );
          const tally_final_input = await readAndParseJsonFile(
            `${path}/build/inputs/tally-input_${formatNumber(
              tallyCount - 1
            )}.json`
          );
          const salt: Uint256 = tally_final_input.newResultsRootSalt;
          const stop_tallying_res = await maci.stopTallyingPeriod({
            results,
            salt,
          });
          console.log(stop_tallying_res);

          let max_vote_options = Number(await maci.maxVoteOptions());
          let all_result = await maci.getAllResult();
          let all_votes = [];
          let index = 0;

          while (index < max_vote_options) {
            let vote = await maci.getResult({ index: index.toString() });
            all_votes.push(vote);
            index += 1;
          }
          let results_data = formatResults(all_result, all_votes);
          console.log(results_data);

          console.log(
            chalk.blue(
              "All zero-knowledge proofs are successfully verified on-chain."
            )
          );
        } else {
          console.log("Did not voting end");
        }
      } else if (period.status === "processing") {
        execGenInput();
        const commitments = await readAndParseJsonFile(
          `${path}/build/inputs/commitments.json`
        );
        const { msgCount, tallyCount } = countMsgAndTally(commitments);

        console.log(
          "Submitting on-chain transactions to verify zero-knowledge proofs."
        );
        console.log(chalk.green("processMessage"));
        for (let i = 0; i < msgCount; i += 1) {
          const tailNum = formatNumber(i);
          console.log(`msg_${tailNum}`);
          console.log(commitments[`msg_${tailNum}`]);
          const newStateCommitment = commitments[`msg_${tailNum}`];
          const msg_input = await readAndParseJsonFile(
            `${path}/build/final_proof/msg_${tailNum}/proof_hex.json`
          );
          const proof: ProofType = {
            a: msg_input.pi_a.substring(2),
            b: msg_input.pi_b.substring(2),
            c: msg_input.pi_c.substring(2),
          };

          try {
            const process_message_res = await maci.processMessage({
              newStateCommitment,
              proof,
            });
            console.log(process_message_res);
          } catch {
            console.log(
              "Zero-knowledge proof verification failed. (processMessage)"
            );
          }
          console.log("");
        }

        console.log(chalk.green("stopProcessing"));
        const stop_processing_res = await maci.stopProcessingPeriod();
        console.log(stop_processing_res);
        console.log("");

        console.log(chalk.green("processTallying"));
        for (let i = 0; i < tallyCount; i += 1) {
          const tailNum = formatNumber(i);
          console.log(`tally_${tailNum}`);
          const newTallyCommitment = commitments[`tally_${tailNum}`];
          console.log(newTallyCommitment);
          const tally_proof = await readAndParseJsonFile(
            `${path}/build/final_proof/tally_${tailNum}/proof_hex.json`
          );
          const proof: ProofType = {
            a: tally_proof.pi_a.substring(2),
            b: tally_proof.pi_b.substring(2),
            c: tally_proof.pi_c.substring(2),
          };

          try {
            const process_tally_res = await maci.processTally({
              newTallyCommitment,
              proof,
            });
            console.log(process_tally_res);
          } catch {
            console.log(
              "Zero-knowledge proof verification failed. (processTally)"
            );
          }
          console.log("");
        }

        console.log(chalk.green("stopTallying"));
        const results: Uint256[] = await readAndParseJsonFile(
          `${path}/build/inputs/result.json`
        );
        const tally_final_input = await readAndParseJsonFile(
          `${path}/build/inputs/tally-input_${formatNumber(
            tallyCount - 1
          )}.json`
        );
        const salt: Uint256 = tally_final_input.newResultsRootSalt;
        const stop_tallying_res = await maci.stopTallyingPeriod({
          results,
          salt,
        });
        console.log(stop_tallying_res);

        let max_vote_options = Number(await maci.maxVoteOptions());
        let all_result = await maci.getAllResult();
        let all_votes = [];
        let index = 0;

        while (index < max_vote_options) {
          let vote = await maci.getResult({ index: index.toString() });
          all_votes.push(vote);
          index += 1;
        }
        let results_data = formatResults(all_result, all_votes);
        console.log(results_data);

        console.log(
          chalk.blue(
            "All zero-knowledge proofs are successfully verified on-chain."
          )
        );
      } else if (period.status === "tallying") {
        const commitments = await readAndParseJsonFile(
          `${path}/build/inputs/commitments.json`
        );
        const { msgCount, tallyCount } = countMsgAndTally(commitments);

        console.log(
          "Submitting on-chain transactions to verify zero-knowledge proofs."
        );

        console.log(chalk.green("processTallying"));
        for (let i = 0; i < tallyCount; i += 1) {
          const tailNum = formatNumber(i);
          console.log(`tally_${tailNum}`);
          const newTallyCommitment = commitments[`tally_${tailNum}`];
          const tally_proof = await readAndParseJsonFile(
            `${path}/build/final_proof/tally_${tailNum}/proof_hex.json`
          );
          const proof: ProofType = {
            a: tally_proof.pi_a.substring(2),
            b: tally_proof.pi_b.substring(2),
            c: tally_proof.pi_c.substring(2),
          };

          try {
            const process_tally_res = await maci.processTally({
              newTallyCommitment,
              proof,
            });
            console.log(process_tally_res);
          } catch {
            console.log(
              "Zero-knowledge proof verification failed. (processTally)"
            );
          }
          console.log("");
        }

        console.log(chalk.green("stopTallying"));
        const results: Uint256[] = await readAndParseJsonFile(
          `${path}/build/inputs/result.json`
        );
        const tally_final_input = await readAndParseJsonFile(
          `${path}/build/inputs/tally-input_${formatNumber(
            tallyCount - 1
          )}.json`
        );
        const salt: Uint256 = tally_final_input.newResultsRootSalt;
        const stop_tallying_res = await maci.stopTallyingPeriod({
          results,
          salt,
        });
        console.log(stop_tallying_res);

        let max_vote_options = Number(await maci.maxVoteOptions());
        let all_result = await maci.getAllResult();
        let all_votes = [];
        let index = 0;

        while (index < max_vote_options) {
          let vote = await maci.getResult({ index: index.toString() });
          all_votes.push(vote);
          index += 1;
        }
        let results_data = formatResults(all_result, all_votes);
        console.log(results_data);

        console.log(
          chalk.blue(
            "All zero-knowledge proofs are successfully verified on-chain."
          )
        );
      } else if (period.status === "ended") {
        let max_vote_options = Number(await maci.maxVoteOptions());
        let all_result = await maci.getAllResult();
        let all_votes = [];
        let index = 0;

        while (index < max_vote_options) {
          let vote = await maci.getResult({ index: index.toString() });
          all_votes.push(vote);
          index += 1;
        }
        let results_data = formatResults(all_result, all_votes);
        console.log("This round has already ended.\n");
        console.log(results_data);
        console.log(
          chalk.blue(
            "All zero-knowledge proofs are successfully verified on-chain."
          )
        );
      }
    } catch {
      console.log(chalk.red("Tally failed."));
    }

    process.exit(0);
  },
};

export default commandModule;
