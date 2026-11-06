![Conventional Commits](https://img.shields.io/badge/Conventional_Commits-FE5196?style=flat&logo=conventionalcommits&logoColor=white)

# Foursquare Calendar Relay

A project that runs a persistent Cloudflate worker that fetches Foursquare (Swarm) checkins as posts them as calendar events.
 
Each checkin is written as a 30 minute event in the format _`I was at {place}_`, at checkin time.

### Status

WIP

### Setup

Fill in environment variables by copying `cp .env.example .env`

### Development

```sh
bun run dev
```

Trigger cron handler manually:

```sh
curl "http://localhost:8787/__scheduled?cron=*/15+*+*+*+*"
```

### Commit messages

Commits must use a conventional prefix, `.githooks/` rejects anything else.

Allowed types: `feat`, `fix`, `hotfix`, `refactor`, `style`, `chore`, `cleanup`, `perf`, `test`, `docs`, `content`

`changelog.md` tracks these changes, generate commits with [git-cliff](https://git-cliff.org):

```sh
git cliff -o changelog.md
```

Commit types map to sections: `feat` to _Added_, `refactor` / `cleanup` / `style` to _Changed_, `fix` / `hotfix` to _Fixed_, `perf` to _Performance_, `docs` / `content` to _Documentation_, `test` to _Tests_. `chore` commits are left out.
