# hermes-frontend

The operator console for [Hermes](https://github.com/Janne6565/hermes-backend). React 19 + Vite +
Bun, TanStack Router/Query, Tailwind 4.

Implements the *Mail Triage UI* design: a near-monochrome instrument where priority is carried by
weight and one amber accent, never by a rainbow of labels — and **red is reserved exclusively for
a broken system**. If something is red on this screen, mail is not being read. That rule is
encoded in `src/index.css`: `--color-broken` is the only red token, and nothing in the priority
scale uses it.

## Screens

| Route | |
|---|---|
| `/` | Inbox + reader — high items with reasons, normal as one-liners, noise as a count. `?view=` filters to one tier |
| `/message/$id` | One message full-screen — where the single-column layout drills into |
| `/digest` | The day, grouped by priority, with the delivery and degradation panel |
| `/alerts` | Grafana / SigNoz alerts, grouped by the app that paged |
| `/rules` | The rule table and the new-rule form |
| `/health` | Per-service state and the classification mix |
| `/search` | Local-index search with `key:value` filters — works while sync is down |
| `/settings` | Google account, a test push, and a read-only mirror of the server config |
| `/onboarding` | First run, driven by real state rather than a stored wizard step |

Everything collapses to a single column with a bottom tab bar under `md`. Below that breakpoint
there is no reader pane, so selecting a message navigates to `/message/$id` rather than selecting
something with nowhere to show it.

## Search syntax

`from:`, `priority:`, `after:`, `before:` and `classified_by:` parse into real API filters and
appear as removable chips; anything else is free text. A token with a *known* key and an invalid
value is struck through rather than silently dropped — the query you typed and the query that ran
are always the same query. `⌘K` focuses the box from anywhere, `esc` clears it.

## Connecting a mailbox

`/settings` → **Sign in with Google**. The browser goes to Google's consent screen and comes back
to a backend callback; the code is exchanged server-side and the refresh token is stored
encrypted. **The token never reaches the browser** — the API only ever returns a connected flag
and the address.

Read-only scope. Hermes can never send, delete or modify mail.

## The access token

Hermes reads your mail, so the API is not public. On first load the app asks for the admin token
from the `hermes-app-key` secret and keeps it in `localStorage`; it is sent as `X-Hermes-Token`.
A 401 clears it and returns you to the unlock screen.

This is deliberately the smallest thing that closes the hole. Putting the app behind Authentik
like the other house apps is the better long-term answer.

## Conventions

- **Component / logic-hook split.** JSX files render; state, effects and mutations live in
  `use<Name>Logic.ts`. `useTranslation()` stays in the component.
- **Typed i18n.** `src/i18n/resources.ts` — plain TypeScript, no JSON. `en` is the schema; every
  other language is typed against it, so a missing key fails the build. A test asserts the key
  sets match at runtime too.
- **Buttons gate on completeness.** Disabled while a required field is empty; format errors are
  surfaced on submit, never as a silently dead button.
- **Biome** is the linter and formatter (`bun run lint`, `bun run lint:fix`). It replaced
  ESLint + Prettier, which had drifted into an unusable state — ESLint 9 wants a flat
  `eslint.config.js` the repo never had, so `bun run lint` had been failing outright.
- **Icons are `lucide-react`**, never text glyphs — except where the mockup's terminal aesthetic
  is the point (the `·` separators, the square logo mark).

## Development

```sh
bun install
bun dev          # proxies /api to localhost:8080
bun run typecheck
bun run test
bun run build
bun gen:api      # regenerate the Orval client (backend must be running)
```

`bun run typecheck` runs `tsc -b`, not `tsc --noEmit` — the root tsconfig is `files: []` with
project references, so `--noEmit` alone checks nothing and passes on a broken build.

## API client

`src/api/hermes.ts` is a hand-written typed client mirroring the backend DTOs, with
`src/api/queries.ts` wrapping it in TanStack Query. Once `bun gen:api` can reach a running backend,
Orval writes the same shapes into `src/api/generated/` and swapping over is an import change.
