import fetch from 'node-fetch'

/**
 * Sends a notification using Slack's Incoming Webhooks.
 * @param {*} data
 * @returns {Promise<Response|Error>}
 */
export function notify(data) {
  return fetch(process.env.TWITCH_DOOM_SLACK_WEBHOOK, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
}

export default {
  notify
}
