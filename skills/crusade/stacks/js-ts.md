# Stack profile: JS / TS (React, Vue, Svelte, Angular, Node)

Use the project's package manager (lockfile tells: npm / pnpm / yarn / bun) and local bins (`npx --no-install`, `pnpm exec`). Don't install new tools without asking.

Excluded: `node_modules/`, `dist/`, `build/`, `.next/`, `.nuxt/`, `.svelte-kit/`, `coverage/`, `*.min.js`, `*.d.ts`, generated clients.

| Domain | Tools (prefer what exists) | Notes |
|---|---|---|
| types | `tsc --noEmit`, `eslint` (typescript-eslint) | `any`, `as` casts, `!` non-null, `@ts-ignore`/`@ts-expect-error` without reason, `strict` off in tsconfig, unvalidated `JSON.parse`/`fetch` results (use zod/valibot at boundaries), non-exhaustive unions |
| dead | `knip --reporter json` (best), `eslint` no-unused-vars, Grep | Unused exports/files/deps, `console.log`, `debugger` |
| deps | `<pm> audit --json`, `<pm> outdated --json`, knip (unused/unlisted) | Duplicate versions in lockfile, heavy libs with light alternatives (moment→date-fns/Temporal, lodash→native) |
| tests | `vitest run --coverage` / `jest --coverage`, Playwright | `.skip`/`.only`, `toBeTruthy` as only check, snapshot abuse, real timers/network |
| secrets | `gitleaks`, Grep | `NEXT_PUBLIC_`/`VITE_`/`PUBLIC_` vars holding secrets — they ship to the browser |
| arch | `madge --circular --json`, `depcruise` if configured | Cycles, UI importing data layer directly, cross-feature deep imports |
| naming | eslint naming rules, project file pattern | Follow the repo's existing pattern (kebab-case, PascalCase components, `*.service.ts`, etc.) — detect, don't impose |
| size | `scripts/measure.mjs` | `.tsx/.vue/.svelte` components count as UI templates |

Framework notes: React (no data fetching in raw `useEffect` when a query lib exists, effects need cleanup, no derived state in `useState`), Vue (composables for logic, no prop mutation), Svelte (runes in v5), Node (no sync fs in request paths, validate input at the edge).

Verify after fixes: `tsc --noEmit` → `eslint`/`biome check` → tests.
