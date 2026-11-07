import { fetchCheckins } from './foursquare.js'
import { accessToken, insertEvent } from './google.js'
import { toEvent } from './event.js'

async function sync(env, token, checkin) {
  if (!checkin?.venue) return
  const event = toEvent(checkin, env.EVENT_MINUTES)
  if (env.DRY_RUN) return console.log('dry run', JSON.stringify(event))
  const result = await insertEvent(env, token, event)
  console.log(result, event.summary, event.start.dateTime)
}

export default {
  async scheduled(event, env, ctx) {
    // fixed one day window, replaced by the stored cursor later
    const after = Math.floor(Date.now() / 1000) - 86400
    const [checkins, token] = await Promise.all([fetchCheckins(env, after), env.DRY_RUN ? null : accessToken(env)])
    for (const checkin of checkins) await sync(env, token, checkin)
  },

  async fetch(request, env, ctx) {
    return new Response('not found', { status: 404 })
  }
}
