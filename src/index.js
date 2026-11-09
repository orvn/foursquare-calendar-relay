import { fetchCheckins } from './foursquare.js'
import { accessToken, insertEvent } from './google.js'
import { toEvent } from './event.js'

// free plan allows 50 subrequests per run
const BATCH = 40

async function sync(env, token, checkin) {
  if (!checkin?.venue) return
  const event = toEvent(checkin, env.EVENT_MINUTES)
  if (env.DRY_RUN) return console.log('dry run', JSON.stringify(event))
  const result = await insertEvent(env, token, event)
  console.log(result, event.summary, event.start.dateTime)
}

async function poll(env) {
  const cursor = Number(await env.STATE.get('cursor'))
  if (!cursor) return env.STATE.put('cursor', String(Math.floor(Date.now() / 1000)))

  // token refreshed on every run (a clean run proves both credentials)
  const [pending, token] = await Promise.all([fetchCheckins(env, cursor), env.DRY_RUN ? null : accessToken(env)])

  let done = 0
  try {
    for (; done < Math.min(pending.length, BATCH); done++) await sync(env, token, pending[done])
  } finally {
    const last = done ? pending[done - 1].createdAt : cursor // stay 1s ahead of the first unsynced checkin
    const next = pending[done] ? Math.min(last, pending[done].createdAt - 1) : last
    if (next > cursor && !env.DRY_RUN) await env.STATE.put('cursor', String(next))
  }
}

async function heartbeat(env) {
  if (!env.HEARTBEAT_URL || env.DRY_RUN) return
  const res = await fetch(env.HEARTBEAT_URL)
  await res.body?.cancel()
}

export default {
  async scheduled(event, env, ctx) {
    await poll(env)
    await heartbeat(env)
  },

  async fetch(request, env, ctx) {
    return new Response('not found', { status: 404 })
  }
}
