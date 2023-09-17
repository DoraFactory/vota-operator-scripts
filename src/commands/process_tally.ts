import type { CommandModule } from 'yargs';

import { ProofType } from '../../ts/Maci.types';
import {
	getContractSignerClient,
	readAndParseJsonFile,
	countMsgAndTally,
	formatNumber,
} from '../utils';

const commandModule: CommandModule = {
	command: 'process-tally',

	describe: 'After processing period, operator need process tally',

	builder(yargs) {
		return yargs;
	},

	async handler() {
		const maci = await getContractSignerClient();
		const path = process.cwd();
		const commitments = await readAndParseJsonFile(
			`${path}/build/inputs/commitments.json`
		);
		const { msgCount, tallyCount } = countMsgAndTally(commitments);
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

			const res = await maci.processTally({
				newTallyCommitment,
				proof,
			});
			console.log(res);
			console.log('');
		}
		process.exit(0);
	},
};

export default commandModule;
