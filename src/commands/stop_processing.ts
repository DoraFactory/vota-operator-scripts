import type { CommandModule } from 'yargs';

import { getContractSignerClient } from '../utils';

const commandModule: CommandModule = {
	command: 'stop-processing',

	describe: 'Stop processing period',

	builder(yargs) {
		return yargs;
	},

	async handler() {
		console.log(`stop processing period`);
		const maci = await getContractSignerClient();
		const res = await maci.stopProcessingPeriod();
		console.log(res);

		process.exit(0);
	},
};

export default commandModule;
