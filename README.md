# Code Church

Stack-aware code-quality crusades for Claude Code. A modern, language-agnostic take on the original *church* plugin. The persona style stays, the bloat goes.

## Install (local)

```
/plugin marketplace add E:/OpenServer/OSPanel/external_projects/code-church
/plugin install code-church@code-church
```

## Use

```
/code-church:crusade size                 # report only
/code-church:crusade dead src --since main
/code-church:crusade types --fix          # asks before editing
/code-church:crusade all                  # 8 purists in parallel (expensive)
```

Domains: `arch` `size` `dead` `deps` `secrets` `tests` `naming` `types`.
Each purist can also be called directly, e.g. *"ask the dead-purist to check app/Services"*.

## How it works

1. **Recon:** `scripts/detect-stack.mjs` detects languages, frameworks, lockfiles, linters and local tools. The project's CLAUDE.md, linter configs and `.code-church.json` override the defaults.
2. **Squads:** the orchestrator runs parallel purist agents, split by concern.
3. **Real tools first:** phpstan, composer audit, eslint, knip, tsc, ruff, mypy, pip-audit, gitleaks, and so on. Grep is the fallback.
4. **Judgment:** one report, every finding as `file:line` + rule id + fix. `--fix` edits only after confirmation, then runs the project's verifiers.

Full profiles: PHP (Laravel/Symfony/WordPress), JS/TS (React/Vue/Svelte/Node), Python (Django/Flask/FastAPI). Other languages run in generic mode.

## Layout

```
skills/crusade/SKILL.md        orchestrator (/code-church:crusade)
skills/crusade/purist-rules.md shared rules + report format
skills/crusade/stacks/*.md     per-stack tools and conventions
agents/*-purist.md             8 purists: persona + doctrine
scripts/                       detect-stack.mjs, measure.mjs (no deps)
```

## Config (optional) — `.code-church.json`

```json
{ "exclude": ["legacy/**"], "disable": ["naming"], "size": { "file": [300, 500, 800] }, "conventions": "Laravel, Actions in app/Actions" }
```

Suppress one finding inline with `church: ignore <rule-id>`.

## Adding a domain

Add `agents/<domain>-purist.md` (persona, concerns, severity, fix rules), add the domain to `skills/crusade/SKILL.md`, and add a row to each stack profile.
