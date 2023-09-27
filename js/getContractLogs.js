// import * as fs from "fs"
// import path from "path"
// import { stringizing } from './keypair'
const fs = require('fs')
const path = require('path')
const { stringizing } = require('./keypair')

// * DEV *
// const contract = 'dora1uv4dz7ngaqwymvxggrjp3rnz3gs33szwjsnrxqg0ylkykqf8r7nskff7m8'
const provider = 'https://vota-api.dorafactory.org/'

  ; (async () => {
    const messages = []
    const states = []
    const contract = process.argv[2]

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

    const SIGN_UP_EVENTS_QUERY = `query {
    signUpEvents(orderBy: [STATE_IDX_ASC],
      filter: {
        contractAddress: { 
          equalTo: "${contract}" 
        },
      }) {
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

    // 调用模板字符串定义的schema
    let sign_up_events = await fetch(provider, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query: SIGN_UP_EVENTS_QUERY }),
    })
      .then((res) => res.json())
      .then((data) => {
        return data.data.signUpEvents.nodes
      });
    for (const event of sign_up_events) {
      handleSignup(event)
    }
    // console.log(states)

    const PUBLISH_MESSAGE_EVENTS_QUERY = `query {
    publishMessageEvents(orderBy: [MSG_CHAIN_LENGTH_ASC],
      filter: {
        contractAddress: { 
          equalTo: "${contract}" 
        },
      }) {
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
      totalCount
    }
  }`

    let publish_message_events = await fetch(provider, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query: PUBLISH_MESSAGE_EVENTS_QUERY }),
    })
      .then((res) => res.json())
      .then((data) => {
        return data.data.publishMessageEvents.nodes
      });
    for (const event of publish_message_events) {
      handleMessage(event)
    }
    console.log(states)
    console.log(messages)
    fs.writeFileSync(
      path.join(__dirname, '../build/contract-logs.json'),
      JSON.stringify(
        stringizing({ messages, states }),
        undefined,
        2
      )
    )
  })()
