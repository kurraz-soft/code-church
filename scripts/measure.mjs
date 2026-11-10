#!/usr/bin/env node
// Usage: node measure.mjs [root] [--since <git-ref>] [--top N]
// Prints JSON: source files sorted by line count, with language, test flag and generated flag.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { listFiles, langOf, isTestFile } from './lib/files.mjs';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
const since = opt('--since');
const top = Number(opt('--top') ?? 50);
const root = args[0] || process.cwd();

const rows = [];
for (const f of listFiles(root, { since })) {
  const lang = langOf(f);
  if (!lang || /\.min\.(js|css)$/.test(f) || /\.d\.ts$/.test(f)) continue;
  let text;
  try { text = readFileSync(join(root, f), 'utf8'); } catch { continue; }
  const lines = text.split('\n');
  const generated = /@generated|auto-?generated|do not edit/i.test(lines.slice(0, 10).join('\n'));
  const exempt = /church:\s*ignore\s+size/i.test(lines.slice(0, 10).join('\n'));
  rows.push({ file: f, lang, lines: lines.length, code: lines.filter((l) => l.trim()).length, test: isTestFile(f), generated, exempt });
}
rows.sort((a, b) => b.code - a.code);
const totals = { files: rows.length, code: rows.reduce((s, r) => s + r.code, 0) };
console.log(JSON.stringify({ root, since: since ?? null, totals, files: rows.slice(0, top) }, null, 2));
