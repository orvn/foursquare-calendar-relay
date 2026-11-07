const CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

export async function accessToken(env) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`google token ${res.status}: ${body.error_description ?? body.error ?? 'no json body'}`)
  return body.access_token
}

// If 409, the checkin was already synced (an event w the id exists)
export async function insertEvent(env, token, event) {
  const res = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(env.GOOGLE_CALENDAR_ID)}/events`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(event)
  })
  if (res.ok || res.status === 409) {
    await res.body?.cancel()
    return res.status === 409 ? 'exists' : 'added'
  }
  const body = await res.json().catch(() => ({}))
  throw new Error(`google insert ${res.status}: ${body.error?.message ?? 'no json body'}`)
}
