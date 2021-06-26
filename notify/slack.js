/**
 *
 *
 */
async function postSlack(data) {
  const response = await fetch(process.env.TWITCH_DOOM_SLACK_WEBHOOK, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  return response.json()
}

