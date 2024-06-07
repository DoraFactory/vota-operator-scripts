import type { CommandModule } from 'yargs';
import { GasPrice, StdFee, calculateFee } from '@cosmjs/stargate';

import { getContractSignerClient } from '../utils';

const commandModule: CommandModule = {
	command: 'start-process',

	describe: 'start process period after voting end',

	builder(yargs) {
		return yargs;
	},

	async handler() {
		const maci = await getContractSignerClient();

		const gasPrice = GasPrice.fromString('100000000000peaka');
		const fee = calculateFee(100000000, gasPrice);

		const res = await maci.startProcessPeriod(fee);
		console.log(res);
		process.exit(0);
	},
};

export default commandModule;
