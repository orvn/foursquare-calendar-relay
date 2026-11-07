import { fetchCheckins } from './foursquare.js'
import { toEvent } from './event.js'

export default {
  async scheduled(event, env, ctx) {
    // fixed one day window, replaced by the stored cursor later
    const after = Math.floor(Date.now() / 1000) - 86400
    for (const checkin of await fetchCheckins(env, after)) {
      if (checkin.venue) console.log(JSON.stringify(toEvent(checkin, env.EVENT_MINUTES)))
    }
  },

  async fetch(request, env, ctx) {
    return new Response('not found', { status: 404 })
  }
}
