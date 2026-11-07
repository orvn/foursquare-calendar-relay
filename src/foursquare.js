const API = 'https://api.foursquare.com/v2'

// Checkins made after the given epoch seconds (oldest first)
export async function fetchCheckins(env, after) {
  const params = new URLSearchParams({
    oauth_token: env.FOURSQUARE_TOKEN,
    v: '20261101',
    afterTimestamp: after,
    sort: 'oldestfirst',
    limit: 250
  })
  const res = await fetch(`${API}/users/self/checkins?${params}`)
  const body = await res.json().catch(() => null)
  if (!res.ok || !body) throw new Error(`foursquare ${res.status}: ${body?.meta?.errorDetail ?? 'no json body'}`)

  // filtered and sorted here as well to match
  return body.response.checkins.items
    .filter(checkin => checkin.createdAt > after)
    .sort((a, b) => a.createdAt - b.createdAt)
}
