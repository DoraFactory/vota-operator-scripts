import type { CommandModule } from 'yargs';

import { getContractSignerClient } from '../utils';

const commandModule: CommandModule = {
	command: 'stop-voting',

	describe: 'Stop voting period',

	builder(yargs) {
		return yargs;
	},

	async handler() {
		console.log(`stop voting period`);
		const maci = await getContractSignerClient();
		const res = await maci.stopVotingPeriod();
		console.log(res);
		process.exit(0);
	},
};

export default commandModule;
