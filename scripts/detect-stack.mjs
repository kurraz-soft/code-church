#!/usr/bin/env node
// Usage: node detect-stack.mjs [root]  → prints JSON describing the project's stack and available tools.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { listFiles, langOf, isGitRepo } from './lib/files.mjs';

const root = process.argv[2] || process.cwd();
const files = listFiles(root);
const has = (p) => existsSync(join(root, p));
const read = (p) => { try { return readFileSync(join(root, p), 'utf8'); } catch { return ''; } };
const first = (...ps) => ps.find(has) ?? null;

// Languages by file count
const languages = {};
for (const f of files) { const l = langOf(f); if (l) languages[l] = (languages[l] || 0) + 1; }

// Manifests (ignore nested node_modules/vendor — already filtered by listFiles)
const manifests = files.filter((f) => /(^|\/)(composer\.json|package\.json|pyproject\.toml|requirements[^/]*\.txt|Pipfile|setup\.py|go\.mod|Cargo\.toml|pom\.xml|build\.gradle(\.kts)?)$/.test(f));
const blob = manifests.map(read).join('\n');

const FRAMEWORKS = {
  laravel: /"laravel\/framework"/, symfony: /"symfony\/(framework-bundle|http-kernel)"/, wordpress: null,
  react: /"react"\s*:/, next: /"next"\s*:/, vue: /"vue"\s*:/, nuxt: /"nuxt"\s*:/, svelte: /"svelte"\s*:/,
  angular: /"@angular\/core"/, express: /"express"\s*:/, nestjs: /"@nestjs\/core"/,
  django: /\bdjango\b/i, flask: /\bflask\b/i, fastapi: /\bfastapi\b/i,
};
const frameworks = Object.entries(FRAMEWORKS).filter(([, re]) => re && re.test(blob)).map(([k]) => k);
if (has('wp-config.php') || has('wp-content') || files.some((f) => /(^|\/)style\.css$/.test(f) && /Theme Name:/.test(read(f)))) frameworks.push('wordpress');

const lockfiles = ['composer.lock', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lock', 'bun.lockb', 'poetry.lock', 'uv.lock', 'Pipfile.lock'].filter(has);

const pyproject = read('pyproject.toml');
const configs = {
  phpstan: first('phpstan.neon', 'phpstan.neon.dist', 'phpstan.dist.neon'), psalm: first('psalm.xml', 'psalm.xml.dist'),
  phpCsFixer: first('.php-cs-fixer.php', '.php-cs-fixer.dist.php'), pint: first('pint.json'), rector: first('rector.php'),
  phpunit: first('phpunit.xml', 'phpunit.xml.dist'), pest: first('tests/Pest.php'),
  eslint: first('eslint.config.js', 'eslint.config.mjs', 'eslint.config.ts', '.eslintrc', '.eslintrc.js', '.eslintrc.json', '.eslintrc.cjs'),
  biome: first('biome.json', 'biome.jsonc'), tsconfig: first('tsconfig.json'), knip: first('knip.json', 'knip.jsonc', 'knip.config.ts'),
  vitest: first('vitest.config.ts', 'vitest.config.js', 'vitest.config.mts'), jest: first('jest.config.js', 'jest.config.ts'),
  ruff: first('ruff.toml', '.ruff.toml') ?? (/\[tool\.ruff/.test(pyproject) ? 'pyproject.toml' : null),
  mypy: first('mypy.ini') ?? (/\[tool\.mypy/.test(pyproject) ? 'pyproject.toml' : null),
  pyright: first('pyrightconfig.json') ?? (/\[tool\.pyright/.test(pyproject) ? 'pyproject.toml' : null),
  pytest: first('pytest.ini') ?? (/\[tool\.pytest/.test(pyproject) ? 'pyproject.toml' : null),
  preCommit: first('.pre-commit-config.yaml'), gitleaks: first('.gitleaks.toml'), ci: first('.github/workflows', '.gitlab-ci.yml'),
};
for (const k of Object.keys(configs)) if (!configs[k]) delete configs[k];

// Project-local binaries
const local = [
  ...['phpstan', 'psalm', 'phpunit', 'pest', 'pint', 'php-cs-fixer', 'rector'].map((b) => `vendor/bin/${b}`),
  ...['eslint', 'biome', 'tsc', 'knip', 'vitest', 'jest', 'depcheck', 'madge', 'depcruise'].map((b) => `node_modules/.bin/${b}`),
  ...['ruff', 'mypy', 'pyright', 'pytest', 'vulture', 'pip-audit', 'deptry'].flatMap((b) => [`.venv/bin/${b}`, `.venv/Scripts/${b}.exe`]),
].filter(has);

// Global tools on PATH
const finder = process.platform === 'win32' ? 'where' : 'which';
const onPath = ['git', 'php', 'composer', 'node', 'npm', 'pnpm', 'yarn', 'bun', 'python', 'python3', 'uv', 'ruff', 'pip-audit', 'gitleaks', 'trufflehog', 'semgrep', 'osv-scanner']
  .filter((t) => { try { execFileSync(finder, [t], { stdio: 'ignore' }); return true; } catch { return false; } });

let config = null;
if (has('.code-church.json')) { try { config = JSON.parse(read('.code-church.json')); } catch { config = 'INVALID JSON'; } }

const stacks = [];
if (languages.php || languages.blade) stacks.push('php');
if (languages.js || languages.ts || languages.vue || languages.svelte) stacks.push('js-ts');
if (languages.python) stacks.push('python');

console.log(JSON.stringify({
  root, git: isGitRepo(root), fileCount: files.length, stacks, languages, frameworks, manifests, lockfiles,
  configs, localTools: local, pathTools: onPath,
  contextDocs: ['CLAUDE.md', 'AGENTS.md', 'CONTRIBUTING.md', '.editorconfig'].filter(has),
  churchConfig: config,
}, null, 2));
