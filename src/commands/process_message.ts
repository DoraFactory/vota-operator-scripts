import type { CommandModule } from 'yargs';

import { ProofType } from '../../ts/Maci.types';
import {
	getContractSignerClient,
	readAndParseJsonFile,
	countMsgAndTally,
	formatNumber,
} from '../utils';

const commandModule: CommandModule = {
	command: 'process-message',

	describe: 'After voting period, operator need process message',

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

			const res = await maci.processMessage({
				newStateCommitment,
				proof,
			});
			console.log(res);
			console.log('');
		}

		process.exit(0);
	},
};

export default commandModule;
