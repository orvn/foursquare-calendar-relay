![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=flat&logo=cloudflareworkers&logoColor=white)
![Conventional Commits](https://img.shields.io/badge/Conventional_Commits-FE5196?style=flat&logo=conventionalcommits&logoColor=white)

# Foursquare Calendar Relay

Sync Foursquare (Swarm) checkins to Google Calendar. 

This runs as a recurring service using Cloudflare Workers, and fits entirely in their free tier.

Each checkin is written as a 30 minute event titled _`I was at {place}`_ starting from your checkin time, with the address as the location and the venue link in the notes.

(originally created to replace a similar IFTTT applet that relayed calendar events from Foursquare)

## Services used
- Foursquare Developer API
- Google Calendar
- Cloudflare Workers
- Cloudflare KV
- [Bun](https://bun.sh) installed locally (just for setup)

## Workflow
- A cron runs every 15 mins and gets Foursquare checkins since the last one synced
- The calendar event ID used is copied from the Foursquare checkin ID
- The position (epoch of the last synced checkin) is stored in Cloudflare KV
- Optional additional feature: after an update the service can call an uptime monitoring URL (the service used is Uptime Robot)
- Optional additional feature: Foursquare can push each checkin to `/push` as it happens, the cron still catches anything a push misses


## Setup

This setup guide assumes macOS or Linux (or any unix-flavor operating system). After cloning this repo and installing `bun`:

### 1. Install

```sh
bun install
cp .env.example .env
```

The `.env` will be partially be populated by running auth scripts in the following steps, and will be uploaded to Cloudflare at the end of this setup process.

### 2. Foursquare

1. Go to the [Foursquare developer console](https://foursquare.com/developers/home) and create a project
2. Set the Redirect URL to `http://localhost:8788/foursquare` (the project and privacy urls can be anything)
3. Copy the values of _client id_ and _client secret_ into `.env` under `FOURSQUARE_CLIENT_ID` and `FOURSQUARE_CLIENT_SECRET`
4. Run the one time auth script:

```sh
bun run auth:foursquare
```

Open the shown url, log in, and approve. The `FOURSQUARE_TOKEN` is automatically written to `.env`. Foursquare tokens don't expire.

### 3. Google

1. Log into [Google Cloud](https://console.cloud.google.com), create a project, and enable the **Google Calendar API**
2. Configure the OAuth consent screen
  - Pick **Internal** if you are on Google Workspace
  - Otherwise pick **External**
  - Then **Publish app** (if there's a verification notice, you can ignore it, because you're the only user)
  - Don't leave it in _Testing_, as this will allow the token to expire every 7 days
3. Create credentials: **OAuth client ID**, application type **Desktop app**
4. Copy the values of _client id_ and _secret_ into `.env` under `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
5. Set the `GOOGLE_CALENDAR_ID`
  - Find it in Google Calendar under the calendar's settings, section _Integrate calendar_
  - You may wish to create a new calendar
  - For your main calendar use `primary`, although this is not recommended
6. Run the one time auth:

```sh
bun run auth:google
```

Open the shown url and approve. A `GOOGLE_REFRESH_TOKEN` is written to `.env`.

### 4. Uptime Monitoring (optional)

Create a heartbeat (dead man's switch) monitor on [UptimeRobot](https://uptimerobot.com), [Healthchecks.io](https://healthchecks.io), [Cronitor](https://cronitor.io) or similar, and put its url in `.env` as `HEARTBEAT_URL`. The Worker fetches it after every clean run. An interval of 1 hour works well, it takes four failed runs in a row to alert. Leave it empty to skip.

#### 5. Local test

Create a `.env.local` file with `DRY_RUN=1` uncommented, then run:

```sh
bun run dev
curl "http://localhost:8787/__scheduled?cron=*/15+*+*+*+*"
```

This first run just records the current time as the starting point.

Now run:

```sh
bunx wrangler kv key put cursor 1700000000 --binding STATE --local
```

Remove `DRY_RUN` from .`env` and restart `bun run dev` to write to the calendar.

#### 6. Deploy

```sh
bunx wrangler login
bun run deploy
bun run secrets
```

- `deploy` creates the KV namespace on first run
- `secrets` uploads `.env` to the Worker
  - Run it again if `.env` ever needs to change
- If your Cloudflare login has more than one account, put `CLOUDFLARE_ACCOUNT_ID=...` in `.env.local` first

The Worker starts syncing from the moment of its first run. 

Older checkins can be backfilled by set the starting point to an epoch timestamp in seconds `bunx wrangler kv key put cursor 1700000000 --binding STATE --remote`

Watch it live with `bunx wrangler tail`

#### 7. Push (optional)

The cron can lag a checkin by up to 15 minutes. Foursquare can also POST each checkin to the Worker the moment it happens:

1. In the Foursquare app settings, set the Push URL to `https://<your worker>.workers.dev/push`
2. Copy the Push Secret into `.env` as `FOURSQUARE_PUSH_SECRET`, then `bun run secrets`

Push never moves the starting point, so the cron still backstops every checkin. Leave the secret empty and `/push` answers 404.

### Adjust Features

- event length: `EVENT_MINUTES` in `wrangler.jsonc`
- how often it runs: `triggers.crons` in `wrangler.jsonc`
- title, location, notes: `src/event.js`
- if Google revokes the token, run `bun run auth:google` then `bun run secrets`

### Development

```sh
bun run dev
```

Trigger cron handler manually:

```sh
curl "http://localhost:8787/__scheduled?cron=*/15+*+*+*+*"
```

### Commit messages

Commits in this repo must use a conventional prefix, `.githooks/` rejects anything else. Run `scripts/setup.sh` once to enable the hook.

Allowed types: `feat`, `fix`, `hotfix`, `refactor`, `style`, `chore`, `cleanup`, `perf`, `test`, `docs`, `content`

`changelog.md` tracks these changes, generate commits with [git-cliff](https://git-cliff.org):

```sh
git cliff -o changelog.md
```

Commit types map to sections: `feat` to _Added_, `refactor` / `cleanup` / `style` to _Changed_, `fix` / `hotfix` to _Fixed_, `perf` to _Performance_, `docs` / `content` to _Documentation_, `test` to _Tests_. `chore` commits are left out.
