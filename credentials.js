#!/usr/bin/env node
const fetch = require('node-fetch')
const dotenv = require('dotenv')

dotenv.config()

async function getCredentials() {
  const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_APP_CLIENT_ID}&client_secret=${process.env.TWITCH_APP_SECRET}&grant_type=client_credentials&scope=${process.env.TWITCH_APP_SCOPE}`, {
    method: 'POST'
  })
  const data = await response.json()
  console.log(data)
  return data
}

getCredentials()
