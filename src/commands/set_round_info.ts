import type { CommandModule } from 'yargs';

import { RoundInfo } from '../../ts/Maci.types';
import { getContractSignerClient } from '../utils';

type Options = {
	title: string;
	description?: string;
	link?: string;
};

const commandModule: CommandModule<Options, Options> = {
	command: 'set-round-info <title>',

	describe: 'Set round info(title, description, link)',

	builder(yargs) {
		return yargs.options({
			description: { type: 'string', desc: 'Description of this round' },
			link: { type: 'string', desc: 'Link of this round' },
		});
	},

	async handler({ title, description, link }) {
		const maci = await getContractSignerClient();
		let descriptionData = '';
		if (description !== undefined) {
			descriptionData = description;
		}

		let linkData = '';
		if (link !== undefined) {
			linkData = link;
		}

		const roundInfo: RoundInfo = {
			title,
			description: descriptionData,
			link: linkData,
		};
		console.log(roundInfo);
		const res = await maci.setRoundInfo({ roundInfo });
		console.log(res);
		process.exit(0);
	},
};

export default commandModule;
