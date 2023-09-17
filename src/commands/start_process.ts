import type { CommandModule } from 'yargs';

import { getContractSignerClient } from '../utils';

const commandModule: CommandModule = {
	command: 'start-process',

	describe: 'start process period after voting end',

	builder(yargs) {
		return yargs;
	},

	async handler() {
		const maci = await getContractSignerClient();
		const res = await maci.startProcessPeriod();
		console.log(res);

		// let msg_proof = await readAndParseJsonFile(`${path}/build/final_proof/msg/proof_hex.json`);
		// console.log(msg_proof)

		// let tally_input = await readAndParseJsonFile(`${path}/build/inputs/tally-input_0000.json`);
		// console.log(tally_input)

		// let tally_proof = await readAndParseJsonFile(`${path}/build/final_proof/tally/proof_hex.json`);
		// console.log(tally_proof)

		// let result = await readAndParseJsonFile(`${path}/build/inputs/result.json`);
		// console.log(result)

		process.exit(0);
	},
};

export default commandModule;
