import type { CommandModule } from "yargs";

import { Uint256, ProofType } from "../../ts/Maci.types";
import {
  getContractSignerClient,
  readAndParseJsonFile,
  execGenInput,
  formatNumber,
  countMsgAndTally,
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
      const { start_time, end_time } = await maci.getVotingTime();
      const now = new Date().getTime() * 10 ** 6;
      if (period.status === "pending" || period.status === "voting") {
        if (Number(end_time) < now) {
          console.log("start processing");
          const start_process_res = await maci.startProcessPeriod();
          console.log(start_process_res);
          execGenInput();
          const commitments = await readAndParseJsonFile(
            `${path}/build/inputs/commitments.json`
          );
          const { msgCount, tallyCount } = countMsgAndTally(commitments);

          console.log("processMessage");

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
              console.log("Some thing is wrong");
            }
            console.log("");
          }
          console.log("stopProcessing");

          const stop_processing_res = await maci.stopProcessingPeriod();
          console.log(stop_processing_res);

          console.log("processTallying");

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
              console.log("Some thing is wrong");
            }
            console.log("");
          }

          console.log("stopTalling");

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
        } else {
          console.log("Did not voting end");
        }
      } else if (period.status === "processing") {
        execGenInput();
        const commitments = await readAndParseJsonFile(
          `${path}/build/inputs/commitments.json`
        );
        const { msgCount, tallyCount } = countMsgAndTally(commitments);

        console.log("processMessage");

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
            console.log("Some thing is wrong");
          }
          console.log("");
        }
        console.log("stopProcessing");

        const stop_processing_res = await maci.stopProcessingPeriod();
        console.log(stop_processing_res);

        console.log("processTallying");

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
            console.log("Some thing is wrong");
          }
          console.log("");
        }

        console.log("stopTalling");

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
      } else if (period.status === "tallying") {
        // execGenInput();
        const commitments = await readAndParseJsonFile(
          `${path}/build/inputs/commitments.json`
        );
        const { msgCount, tallyCount } = countMsgAndTally(commitments);

        console.log("processTallying");

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
            console.log("Some thing is wrong");
          }
          console.log("");
        }

        console.log("stopTalling");

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
      } else if (period.status === "ended") {
        console.log("This round is already ended");
      }
    } catch {
      console.log("Some thing is wrong.");
    }

    process.exit(0);
  },
};

export default commandModule;
