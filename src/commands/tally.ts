import { exit, type CommandModule } from "yargs";
import chalk from "chalk";
import * as fs from "fs";
import { GasPrice, StdFee, calculateFee } from "@cosmjs/stargate";

import { Uint256, Groth16ProofType, PlonkProofType } from "../../ts/Maci.types";
import {
  getContractSignerClient,
  readAndParseJsonFile,
  execGenInput,
  formatNumber,
  countMsgAndTally,
  formatResults,
  caculateResult,
  downloadAndExtractZKeys,
  withdrawBalance,
  getContractLogs,
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

          await getContractLogs(maci.contractAddress);
          const voteOption = await maci.maxVoteOptions();
          const max_vote_env = {
            max_vote_options: Number(voteOption),
          };
          fs.writeFileSync(
            `${path}/build/max-vote-options.json`,
            JSON.stringify(max_vote_env)
          );
          console.log(`max_vote_options: ${voteOption}`);

          const contractInfo = await readAndParseJsonFile(
            `${path}/build/contract-logs.json`
          );
          const circuitPower = contractInfo["circuitPower"];
          const certificationSystem = contractInfo["certificationSystem"];

          await downloadAndExtractZKeys(circuitPower, certificationSystem);

          console.log(`Certification system: ${certificationSystem}`);
          execGenInput(certificationSystem);
          const commitments = await readAndParseJsonFile(
            `${path}/build/inputs/commitments.json`
          );
          const { msgCount, tallyCount } = countMsgAndTally(commitments);

          console.log(
            "Submitting on-chain transactions to verify zero-knowledge proofs."
          );
          console.log(chalk.green("processMessage"));

          if (certificationSystem === "groth16") {
            for (let i = 0; i < msgCount; i += 1) {
              const tailNum = formatNumber(i);
              console.log(`msg_${tailNum}`);
              console.log(commitments[`msg_${tailNum}`]);
              const newStateCommitment = commitments[`msg_${tailNum}`];
              const msg_input = await readAndParseJsonFile(
                `${path}/build/final_proof/msg_${tailNum}/proof_hex.json`
              );
              const groth16Proof: Groth16ProofType = {
                a: msg_input.pi_a.substring(2),
                b: msg_input.pi_b.substring(2),
                c: msg_input.pi_c.substring(2),
              };

              const process_message_res = await maci.processMessage({
                newStateCommitment,
                groth16Proof,
              });
              console.log(process_message_res);
              console.log("");
            }
          } else {
            for (let i = 0; i < msgCount; i += 1) {
              const tailNum = formatNumber(i);
              console.log(`msg_${tailNum}`);
              console.log(commitments[`msg_${tailNum}`]);
              const newStateCommitment = commitments[`msg_${tailNum}`];
              const msg_input = await readAndParseJsonFile(
                `${path}/build/proof/msg_${tailNum}/proof.json`
              );
              const plonkProof: PlonkProofType = {
                grand_product_at_z_omega: msg_input.grand_product_at_z_omega,
                grand_product_commitment: msg_input.grand_product_commitment,
                input_values: msg_input.input_values,
                linearization_polynomial_at_z:
                  msg_input.linearization_polynomial_at_z,
                n: msg_input.n,
                num_inputs: msg_input.num_inputs,
                opening_at_z_omega_proof: msg_input.opening_at_z_omega_proof,
                opening_at_z_proof: msg_input.opening_at_z_proof,
                permutation_polynomials_at_z:
                  msg_input.permutation_polynomials_at_z,
                quotient_poly_commitments: msg_input.quotient_poly_commitments,
                quotient_polynomial_at_z: msg_input.quotient_polynomial_at_z,
                wire_commitments: msg_input.wire_commitments,
                wire_values_at_z: msg_input.wire_values_at_z,
                wire_values_at_z_omega: msg_input.wire_values_at_z_omega,
              };

              const process_message_res = await maci.processMessage({
                newStateCommitment,
                plonkProof,
              });
              console.log(process_message_res);
              console.log("");
            }
          }

          console.log(chalk.green("stopProcessing"));
          const stop_processing_res = await maci.stopProcessingPeriod();
          console.log(stop_processing_res);
          console.log("");

          console.log(chalk.green("processTallying"));
          if (certificationSystem === "groth16") {
            for (let i = 0; i < tallyCount; i += 1) {
              const tailNum = formatNumber(i);
              console.log(`tally_${tailNum}`);
              const newTallyCommitment = commitments[`tally_${tailNum}`];
              console.log(newTallyCommitment);
              const tally_proof = await readAndParseJsonFile(
                `${path}/build/final_proof/tally_${tailNum}/proof_hex.json`
              );
              const groth16Proof: Groth16ProofType = {
                a: tally_proof.pi_a.substring(2),
                b: tally_proof.pi_b.substring(2),
                c: tally_proof.pi_c.substring(2),
              };

              // try {
              const process_tally_res = await maci.processTally({
                newTallyCommitment,
                groth16Proof,
              });
              console.log(process_tally_res);
              // } catch (error: any) {
              //   console.log(
              //     chalk.red(
              //       "Zero-knowledge proof verification failed. (processTally)"
              //     )
              //   );
              //   console.error(error.message);
              //   process.exit(0);
              // }
              console.log("");
            }
          } else {
            for (let i = 0; i < tallyCount; i += 1) {
              const tailNum = formatNumber(i);
              console.log(`tally_${tailNum}`);
              const newTallyCommitment = commitments[`tally_${tailNum}`];
              console.log(newTallyCommitment);
              const tally_proof = await readAndParseJsonFile(
                `${path}/build/proof/tally_${tailNum}/proof.json`
              );
              const plonkProof: PlonkProofType = {
                grand_product_at_z_omega: tally_proof.grand_product_at_z_omega,
                grand_product_commitment: tally_proof.grand_product_commitment,
                input_values: tally_proof.input_values,
                linearization_polynomial_at_z:
                  tally_proof.linearization_polynomial_at_z,
                n: tally_proof.n,
                num_inputs: tally_proof.num_inputs,
                opening_at_z_omega_proof: tally_proof.opening_at_z_omega_proof,
                opening_at_z_proof: tally_proof.opening_at_z_proof,
                permutation_polynomials_at_z:
                  tally_proof.permutation_polynomials_at_z,
                quotient_poly_commitments:
                  tally_proof.quotient_poly_commitments,
                quotient_polynomial_at_z: tally_proof.quotient_polynomial_at_z,
                wire_commitments: tally_proof.wire_commitments,
                wire_values_at_z: tally_proof.wire_values_at_z,
                wire_values_at_z_omega: tally_proof.wire_values_at_z_omega,
              };

              const process_tally_res = await maci.processTally({
                newTallyCommitment,
                plonkProof,
              });
              console.log(process_tally_res);
              console.log("");
            }
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

          let circuit_type = await maci.queryCircuitType();
          console.log("This round has already ended.\n");

          caculateResult(all_votes, circuit_type);

          console.log(
            chalk.blue(
              "All zero-knowledge proofs are successfully verified on-chain."
            )
          );

          await withdrawBalance();
        } else {
          console.log("Did not voting end");
        }
      } else if (period.status === "processing") {
        await getContractLogs(maci.contractAddress);
        const voteOption = await maci.maxVoteOptions();
        const max_vote_env = {
          max_vote_options: Number(voteOption),
        };
        fs.writeFileSync(
          `${path}/build/max-vote-options.json`,
          JSON.stringify(max_vote_env)
        );
        console.log(`max_vote_options: ${voteOption}`);

        const contractInfo = await readAndParseJsonFile(
          `${path}/build/contract-logs.json`
        );
        const circuitPower = contractInfo["circuitPower"];
        const certificationSystem = contractInfo["certificationSystem"];

        let fee = undefined;
        if (circuitPower === "6-3-3-125") {
          const gasPrice = GasPrice.fromString("100000000000" + "peaka");
          fee = calculateFee(100000000, gasPrice);
        }

        await downloadAndExtractZKeys(circuitPower, certificationSystem);

        console.log(`Certification system: ${certificationSystem}`);
        execGenInput(certificationSystem);
        const commitments = await readAndParseJsonFile(
          `${path}/build/inputs/commitments.json`
        );
        const { msgCount, tallyCount } = countMsgAndTally(commitments);

        console.log(
          "Submitting on-chain transactions to verify zero-knowledge proofs."
        );
        console.log(chalk.green("processMessage"));

        if (certificationSystem === "groth16") {
          for (let i = 0; i < msgCount; i += 1) {
            const tailNum = formatNumber(i);
            console.log(`msg_${tailNum}`);
            console.log(commitments[`msg_${tailNum}`]);
            const newStateCommitment = commitments[`msg_${tailNum}`];
            const msg_input = await readAndParseJsonFile(
              `${path}/build/final_proof/msg_${tailNum}/proof_hex.json`
            );
            const groth16Proof: Groth16ProofType = {
              a: msg_input.pi_a.substring(2),
              b: msg_input.pi_b.substring(2),
              c: msg_input.pi_c.substring(2),
            };

            const process_message_res = await maci.processMessage(
              {
                newStateCommitment,
                groth16Proof,
              },
              fee
            );
            console.log(process_message_res);
            console.log("");
          }
        } else {
          for (let i = 0; i < msgCount; i += 1) {
            const tailNum = formatNumber(i);
            console.log(`msg_${tailNum}`);
            console.log(commitments[`msg_${tailNum}`]);
            const newStateCommitment = commitments[`msg_${tailNum}`];
            const msg_input = await readAndParseJsonFile(
              `${path}/build/proof/msg_${tailNum}/proof.json`
            );
            const plonkProof: PlonkProofType = {
              grand_product_at_z_omega: msg_input.grand_product_at_z_omega,
              grand_product_commitment: msg_input.grand_product_commitment,
              input_values: msg_input.input_values,
              linearization_polynomial_at_z:
                msg_input.linearization_polynomial_at_z,
              n: msg_input.n,
              num_inputs: msg_input.num_inputs,
              opening_at_z_omega_proof: msg_input.opening_at_z_omega_proof,
              opening_at_z_proof: msg_input.opening_at_z_proof,
              permutation_polynomials_at_z:
                msg_input.permutation_polynomials_at_z,
              quotient_poly_commitments: msg_input.quotient_poly_commitments,
              quotient_polynomial_at_z: msg_input.quotient_polynomial_at_z,
              wire_commitments: msg_input.wire_commitments,
              wire_values_at_z: msg_input.wire_values_at_z,
              wire_values_at_z_omega: msg_input.wire_values_at_z_omega,
            };

            const process_message_res = await maci.processMessage(
              {
                newStateCommitment,
                plonkProof,
              },
              fee
            );
            console.log(process_message_res);
            console.log("");
          }
        }

        console.log(chalk.green("stopProcessing"));
        const stop_processing_res = await maci.stopProcessingPeriod();
        console.log(stop_processing_res);
        console.log("");

        console.log(chalk.green("processTallying"));
        if (certificationSystem === "groth16") {
          for (let i = 0; i < tallyCount; i += 1) {
            const tailNum = formatNumber(i);
            console.log(`tally_${tailNum}`);
            const newTallyCommitment = commitments[`tally_${tailNum}`];
            console.log(newTallyCommitment);
            const tally_proof = await readAndParseJsonFile(
              `${path}/build/final_proof/tally_${tailNum}/proof_hex.json`
            );
            const groth16Proof: Groth16ProofType = {
              a: tally_proof.pi_a.substring(2),
              b: tally_proof.pi_b.substring(2),
              c: tally_proof.pi_c.substring(2),
            };

            // try {
            const process_tally_res = await maci.processTally(
              {
                newTallyCommitment,
                groth16Proof,
              },
              fee
            );
            console.log(process_tally_res);
            // } catch (error: any) {
            //   console.log(
            //     chalk.red(
            //       "Zero-knowledge proof verification failed. (processTally)"
            //     )
            //   );
            //   console.error(error.message);
            //   process.exit(0);
            // }
            console.log("");
          }
        } else {
          for (let i = 0; i < tallyCount; i += 1) {
            const tailNum = formatNumber(i);
            console.log(`tally_${tailNum}`);
            const newTallyCommitment = commitments[`tally_${tailNum}`];
            console.log(newTallyCommitment);
            const tally_proof = await readAndParseJsonFile(
              `${path}/build/proof/tally_${tailNum}/proof.json`
            );
            const plonkProof: PlonkProofType = {
              grand_product_at_z_omega: tally_proof.grand_product_at_z_omega,
              grand_product_commitment: tally_proof.grand_product_commitment,
              input_values: tally_proof.input_values,
              linearization_polynomial_at_z:
                tally_proof.linearization_polynomial_at_z,
              n: tally_proof.n,
              num_inputs: tally_proof.num_inputs,
              opening_at_z_omega_proof: tally_proof.opening_at_z_omega_proof,
              opening_at_z_proof: tally_proof.opening_at_z_proof,
              permutation_polynomials_at_z:
                tally_proof.permutation_polynomials_at_z,
              quotient_poly_commitments: tally_proof.quotient_poly_commitments,
              quotient_polynomial_at_z: tally_proof.quotient_polynomial_at_z,
              wire_commitments: tally_proof.wire_commitments,
              wire_values_at_z: tally_proof.wire_values_at_z,
              wire_values_at_z_omega: tally_proof.wire_values_at_z_omega,
            };

            const process_tally_res = await maci.processTally(
              {
                newTallyCommitment,
                plonkProof,
              },
              fee
            );
            console.log(process_tally_res);
            console.log("");
          }
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
        const stop_tallying_res = await maci.stopTallyingPeriod(
          {
            results,
            salt,
          },
          fee
        );
        console.log(stop_tallying_res);

        let max_vote_options = Number(await maci.maxVoteOptions());
        let all_votes = [];
        let index = 0;

        while (index < max_vote_options) {
          let vote = await maci.getResult({ index: index.toString() });
          all_votes.push(vote);
          index += 1;
        }

        let circuit_type = await maci.queryCircuitType();
        caculateResult(all_votes, circuit_type);

        console.log(
          chalk.blue(
            "All zero-knowledge proofs are successfully verified on-chain."
          )
        );

        await withdrawBalance();
      } else if (period.status === "tallying") {
        // await getContractLogs(maci.contractAddress);
        const voteOption = await maci.maxVoteOptions();
        const max_vote_env = {
          max_vote_options: Number(voteOption),
        };
        fs.writeFileSync(
          `${path}/build/max-vote-options.json`,
          JSON.stringify(max_vote_env)
        );
        console.log(`max_vote_options: ${voteOption}`);

        const contractInfo = await readAndParseJsonFile(
          `${path}/build/contract-logs.json`
        );
        const certificationSystem = contractInfo["certificationSystem"];

        console.log(`Certification system: ${certificationSystem}`);
        console.log(
          "Submitting on-chain transactions to verify zero-knowledge proofs."
        );

        // execGenInput(certificationSystem);

        const commitments = await readAndParseJsonFile(
          `${path}/build/inputs/commitments.json`
        );
        const { msgCount, tallyCount } = countMsgAndTally(commitments);

        console.log(chalk.green("processTallying"));
        if (certificationSystem === "groth16") {
          for (let i = 0; i < tallyCount; i += 1) {
            const tailNum = formatNumber(i);
            console.log(`tally_${tailNum}`);
            const newTallyCommitment = commitments[`tally_${tailNum}`];
            console.log(newTallyCommitment);
            const tally_proof = await readAndParseJsonFile(
              `${path}/build/final_proof/tally_${tailNum}/proof_hex.json`
            );
            const groth16Proof: Groth16ProofType = {
              a: tally_proof.pi_a.substring(2),
              b: tally_proof.pi_b.substring(2),
              c: tally_proof.pi_c.substring(2),
            };

            // try {
            const process_tally_res = await maci.processTally({
              newTallyCommitment,
              groth16Proof,
            });
            console.log(process_tally_res);
            // } catch (error: any) {
            //   console.log(
            //     chalk.red(
            //       "Zero-knowledge proof verification failed. (processTally)"
            //     )
            //   );
            //   console.error(error.message);
            //   process.exit(0);
            // }
            console.log("");
          }
        } else {
          for (let i = 0; i < tallyCount; i += 1) {
            const tailNum = formatNumber(i);
            console.log(`tally_${tailNum}`);
            const newTallyCommitment = commitments[`tally_${tailNum}`];
            console.log(newTallyCommitment);
            const tally_proof = await readAndParseJsonFile(
              `${path}/build/proof/tally_${tailNum}/proof.json`
            );
            const plonkProof: PlonkProofType = {
              grand_product_at_z_omega: tally_proof.grand_product_at_z_omega,
              grand_product_commitment: tally_proof.grand_product_commitment,
              input_values: tally_proof.input_values,
              linearization_polynomial_at_z:
                tally_proof.linearization_polynomial_at_z,
              n: tally_proof.n,
              num_inputs: tally_proof.num_inputs,
              opening_at_z_omega_proof: tally_proof.opening_at_z_omega_proof,
              opening_at_z_proof: tally_proof.opening_at_z_proof,
              permutation_polynomials_at_z:
                tally_proof.permutation_polynomials_at_z,
              quotient_poly_commitments: tally_proof.quotient_poly_commitments,
              quotient_polynomial_at_z: tally_proof.quotient_polynomial_at_z,
              wire_commitments: tally_proof.wire_commitments,
              wire_values_at_z: tally_proof.wire_values_at_z,
              wire_values_at_z_omega: tally_proof.wire_values_at_z_omega,
            };

            const process_tally_res = await maci.processTally({
              newTallyCommitment,
              plonkProof,
            });
            console.log(process_tally_res);
            console.log("");
          }
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
        let all_votes = [];
        let index = 0;

        while (index < max_vote_options) {
          let vote = await maci.getResult({ index: index.toString() });
          all_votes.push(vote);
          index += 1;
        }

        let circuit_type = await maci.queryCircuitType();
        caculateResult(all_votes, circuit_type);

        console.log(
          chalk.blue(
            "All zero-knowledge proofs are successfully verified on-chain."
          )
        );

        await withdrawBalance();
      } else if (period.status === "ended") {
        let max_vote_options = Number(await maci.maxVoteOptions());
        let all_votes = [];
        let index = 0;

        while (index < max_vote_options) {
          let vote = await maci.getResult({ index: index.toString() });
          all_votes.push(vote);
          index += 1;
        }
        let circuit_type = await maci.queryCircuitType();

        // let results_data = formatResults(all_result, all_votes);
        // console.log(results_data);
        console.log("This round has already ended.\n");

        caculateResult(all_votes, circuit_type);

        console.log(
          chalk.blue(
            "All zero-knowledge proofs are successfully verified on-chain."
          )
        );

        await withdrawBalance();
      }
    } catch (error: any) {
      console.log(chalk.red("Tally failed."));
      console.error(error.message);
    }

    process.exit(0);
  },
};

export default commandModule;
