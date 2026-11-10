// Shared file listing: git-aware, falls back to a filtered directory walk.
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export const IGNORED_DIRS = new Set([
  '.git', 'node_modules', 'vendor', 'dist', 'build', 'out', 'coverage', '.next', '.nuxt',
  '.svelte-kit', '.turbo', '.cache', '.venv', 'venv', 'env', '__pycache__', '.mypy_cache',
  '.pytest_cache', '.ruff_cache', '.tox', 'target', 'storage', '.idea', '.vscode', '.code-church',
]);

const git = (root, args) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 });

export function isGitRepo(root) {
  try { return git(root, ['rev-parse', '--is-inside-work-tree']).trim() === 'true'; } catch { return false; }
}

function walk(root, dir = root, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) { if (!IGNORED_DIRS.has(name)) walk(root, full, acc); }
    else acc.push(relative(root, full).split(sep).join('/'));
  }
  return acc;
}

const notIgnored = (f) => !f.split('/').some((p) => IGNORED_DIRS.has(p));

/** All project files (relative, forward slashes). `since` = git ref → only files changed since it. */
export function listFiles(root, { since } = {}) {
  if (isGitRepo(root)) {
    try {
      const out = since
        ? git(root, ['diff', '--name-only', '--diff-filter=ACMR', since]) + git(root, ['ls-files', '-o', '--exclude-standard'])
        : git(root, ['ls-files', '-co', '--exclude-standard']);
      return [...new Set(out.split('\n').map((s) => s.trim()).filter(Boolean))].filter(notIgnored);
    } catch { /* fall through */ }
  }
  return walk(root);
}

export const LANG_BY_EXT = {
  php: 'php', js: 'js', jsx: 'js', mjs: 'js', cjs: 'js', ts: 'ts', tsx: 'ts', mts: 'ts', cts: 'ts',
  vue: 'vue', svelte: 'svelte', py: 'python', go: 'go', rs: 'rust', java: 'java', kt: 'kotlin',
  rb: 'ruby', cs: 'csharp', twig: 'twig', css: 'css', scss: 'css',
};

export function langOf(file) {
  if (file.endsWith('.blade.php')) return 'blade';
  const ext = file.slice(file.lastIndexOf('.') + 1).toLowerCase();
  return LANG_BY_EXT[ext] ?? null;
}

export const isTestFile = (f) =>
  /(^|\/)(tests?|__tests__|spec)\//i.test(f) || /[._-](test|spec)\.[a-z]+$/i.test(f) || /(^|\/)test_[^/]+\.py$/.test(f) || /Test\.php$/.test(f);
