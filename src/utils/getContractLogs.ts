import fs from 'fs';
import chalk from 'chalk';
import { apiEndpoint } from './config';
import { InitFolder } from './utils';

interface SignUpEvent {
	id: string;
	blockHeight: string;
	timestamp: string;
	txHash: string;
	stateIdx: number;
	pubKey: string;
	balance: string;
	contractAddress: string;
}

interface PublishMessageEvent {
	id: string;
	blockHeight: string;
	timestamp: string;
	txHash: string;
	msgChainLength: number;
	message: string;
	encPubKey: string;
	contractAddress: string;
}

interface RoundData {
	id: string;
	blockHeight: string;
	txHash: string;
	operator: string;
	contractAddress: string;
	circuitName: string;
	timestamp: string;
	votingStart: string;
	votingEnd: string;
	status: string;
	period: string;
	actionType: string;
	roundId: string;
	roundTitle: string;
	roundDescription: string;
	roundLink: string;
	coordinatorPubkeyX: string;
	coordinatorPubkeyY: string;
	voteOptionMap: string;
	results: string;
	allResult: string;
	maciDenom: string;
	gasStationEnable: boolean;
	totalGrant: string;
	baseGrant: string;
	totalBond: string;
	circuitType: string;
	circuitPower: string;
	certificationSystem: string;
}

async function fetchAllPages<T>(query: string, variables: any): Promise<T[]> {
	let hasNextPage = true;
	let offset = 0;
	const limit = 100; // Adjust the limit as needed
	const allData: T[] = [];

	while (hasNextPage) {
		const response = await fetch(apiEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				query,
				variables: { ...variables, limit, offset },
			}),
		}).then(res => res.json());

		const { nodes, pageInfo } =
			response.data.signUpEvents || response.data.publishMessageEvents;
		allData.push(...nodes);
		hasNextPage = pageInfo.hasNextPage;
		offset += limit;
	}

	return allData;
}

export async function getContractLogs(contractAddress: string) {
	console.log(chalk.blue('Get MACI messages from the smart contract: '));
	let messages: { idx: number; msg: string[]; pubkey: string[] }[] = [];
	let states: { idx: number; balance: string; pubkey: string[] }[] = [];
	const contract = contractAddress;

	function handleMessage(event: PublishMessageEvent) {
		const idx = Number(event.msgChainLength);
		const pubkey = event.encPubKey
			.split(',')
			.map(n => n.slice(1, n.length - 1));
		const msg = event.message
			.split('[')[1]
			.split(']')[0]
			.split(', ')
			.map(n => n.slice(8, n.length - 1));
		messages.push({ idx, msg, pubkey });
	}

	function handleSignup(event: SignUpEvent) {
		const idx = Number(event.stateIdx);
		const balance = event.balance;
		const pubkey = event.pubKey
			.split(',')
			.map(n => n.slice(1, n.length - 1));
		states.push({ idx, balance, pubkey });
	}

	const ROUND_QUERY = `query {
    round(id: "${contract}") {
      id
      blockHeight
      txHash
      operator
      contractAddress
      circuitName
      timestamp
      votingStart
      votingEnd
      status
      period
      actionType
      roundId
      roundTitle
      roundDescription
      roundLink
      maciDenom
      gasStationEnable
      totalGrant
      baseGrant
      totalBond
      circuitType
      circuitPower
      certificationSystem
    }
  }`;

	let round_data: RoundData = await fetch(apiEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: JSON.stringify({ query: ROUND_QUERY }),
	})
		.then(res => res.json())
		.then(data => data.data.round);

	console.log(round_data);

	const SIGN_UP_EVENTS_QUERY = `query ($limit: Int, $offset: Int) {
    signUpEvents(first: $limit, offset: $offset, orderBy: [STATE_IDX_ASC],
      filter: {
        contractAddress: { 
          equalTo: "${contract}" 
        },
      }) {
      totalCount
      pageInfo {
        endCursor
        hasNextPage
      }
      nodes {       
        id
        blockHeight
        timestamp
        txHash
        stateIdx
        pubKey
        balance
        contractAddress
      }
    }
  }`;

	const signUpEvents = await fetchAllPages<SignUpEvent>(
		SIGN_UP_EVENTS_QUERY,
		{}
	);
	for (const event of signUpEvents) {
		handleSignup(event);
	}

	const PUBLISH_MESSAGE_EVENTS_QUERY = `query ($limit: Int, $offset: Int) {
    publishMessageEvents(first: $limit, offset: $offset, orderBy: [MSG_CHAIN_LENGTH_ASC],
      filter: {
        contractAddress: { 
          equalTo: "${contract}" 
        },
      }) {
      totalCount
      pageInfo {
        endCursor
        hasNextPage
      }
      nodes {
        id
        blockHeight
        timestamp
        txHash
        msgChainLength
        message
        encPubKey
        contractAddress
      }
    }
  }`;

	const publishMessageEvents = await fetchAllPages<PublishMessageEvent>(
		PUBLISH_MESSAGE_EVENTS_QUERY,
		{}
	);
	for (const event of publishMessageEvents) {
		handleMessage(event);
	}

	console.log(states);
	console.log(messages);
	console.log(`signup state length: ${states.length}`);
	console.log(`publish message length: ${messages.length}`);

	await InitFolder();
	fs.writeFileSync(
		'./build/contract-logs.json',
		JSON.stringify(
			{
				messages,
				states,
				circuitType: round_data.circuitType,
				circuitPower: round_data.circuitPower,
				certificationSystem: round_data.certificationSystem,
			},
			undefined,
			2
		)
	);
}
