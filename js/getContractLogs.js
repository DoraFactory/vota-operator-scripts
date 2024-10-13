const fs = require('fs')
const path = require('path')
const { stringizing } = require('./keypair')

const provider = 'https://vota-api.dorafactory.org/'
// const provider = 'https://vota-testnet-api.dorafactory.org/'
// const provider = 'http://localhost:8000'

async function fetchAllPages(query, variables) {
  let hasNextPage = true
  let offset = 0
  const limit = 100 // Adjust the limit as needed
  const allData = []

  while (hasNextPage) {
    const response = await fetch(provider, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables: { ...variables, limit, offset } }),
    }).then((res) => res.json())

    const { nodes, pageInfo } = response.data.signUpEvents || response.data.publishMessageEvents
    allData.push(...nodes)
    hasNextPage = pageInfo.hasNextPage
    offset += limit
  }

  return allData
}

function handleMessage(event) {
  const idx = Number(event.msgChainLength)
  const pubkey = event.encPubKey.split(",").map(n => BigInt(n.slice(1, n.length - 1)))
  const msg = event.message.split("[")[1].split("]")[0].split(", ").map(n => BigInt(n.slice(8, n.length - 1)))
  messages.push({ idx, msg, pubkey })
}

function handleSignup(event) {
  const idx = Number(event.stateIdx)
  const balance = BigInt(event.balance)
  const pubkey = event.pubKey.split(",").map(n => BigInt(n.slice(1, n.length - 1)))
  states.push({ idx, balance, pubkey })
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
      roundTitle
      roundDescription
      roundLink
      gasStationEnable
      totalGrant
      baseGrant
      totalBond
      circuitType
      circuitPower
      certificationSystem
  }
}`

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
}`

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
}`

(async () => {
  const messages = []
  const states = []
  const contract = process.argv[2]

  let round_data = await fetch(provider, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query: ROUND_QUERY }),
  })
    .then((res) => res.json())
    .then((data) => data.data.round)

  console.log(round_data)

  const signUpEvents = await fetchAllPages(SIGN_UP_EVENTS_QUERY, {})
  for (const event of signUpEvents) {
    handleSignup(event)
  }

  const publishMessageEvents = await fetchAllPages(PUBLISH_MESSAGE_EVENTS_QUERY, {})
  for (const event of publishMessageEvents) {
    handleMessage(event)
  }

  console.log(states)
  console.log(messages)

  fs.writeFileSync(
    path.join(__dirname, '../build/contract-logs.json'),
    JSON.stringify(
      stringizing({ messages, states, circuitType: round_data.circuitType, circuitPower: round_data.circuitPower, certificationSystem: round_data.certificationSystem }),
      undefined,
      2
    )
  )
})()
