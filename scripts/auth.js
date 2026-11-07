#!/usr/bin/env bun
// One time oauth, saves the token to .env

const PORT = 8788

const providers = {
  foursquare: {
    key: 'FOURSQUARE_TOKEN',
    needs: ['FOURSQUARE_CLIENT_ID', 'FOURSQUARE_CLIENT_SECRET'],
    redirect: `http://localhost:${PORT}/foursquare`,
    authorize() {
      return 'https://foursquare.com/oauth2/authenticate?' + new URLSearchParams({
        client_id: process.env.FOURSQUARE_CLIENT_ID,
        response_type: 'code',
        redirect_uri: this.redirect
      })
    },
    async exchange(code) {
      const res = await fetch('https://foursquare.com/oauth2/access_token?' + new URLSearchParams({
        client_id: process.env.FOURSQUARE_CLIENT_ID,
        client_secret: process.env.FOURSQUARE_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: this.redirect,
        code
      }))
      const body = await res.json()
      if (!body.access_token) throw new Error(`foursquare: ${JSON.stringify(body)}`)
      return body.access_token
    }
  }
}

const provider = providers[process.argv[2]]
if (!provider) {
  console.error(`usage: bun scripts/auth.js <${Object.keys(providers).join('|')}>`)
  process.exit(1)
}

const missing = provider.needs.filter(key => !process.env[key])
if (missing.length) {
  console.error(`set ${missing.join(' and ')} in .env first`)
  process.exit(1)
}

async function save(key, value) {
  const text = await Bun.file('.env').text()
  const line = `${key}=${value}`
  const pattern = new RegExp(`^${key}=.*$`, 'm')
  await Bun.write('.env', pattern.test(text) ? text.replace(pattern, () => line) : `${text.trimEnd()}\n${line}\n`)
}

const server = Bun.serve({
  port: PORT,
  async fetch(request) {
    const code = new URL(request.url).searchParams.get('code')
    if (!code) return new Response('no code in the url', { status: 400 })
    try {
      await save(provider.key, await provider.exchange(code))
    } catch (error) {
      console.error(error.message)
      return new Response(error.message, { status: 502 })
    }
    console.log(`${provider.key} saved to .env`)
    server.stop()
    return new Response(`${provider.key} saved to .env, you can close this tab`)
  }
})

console.log(`add ${provider.redirect} as a redirect uri on the app, then open:\n\n${provider.authorize()}\n`)
