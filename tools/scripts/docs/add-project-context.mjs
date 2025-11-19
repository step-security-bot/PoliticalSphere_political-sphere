#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import fg from 'fast-glob';

const ROOT = process.cwd();
const DOCS = path.join(ROOT, 'docs');
const PATTERN = '**/*.md';
const NOTE =
  '\n> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.\n';

async function main() {
  const files = await fg(PATTERN, { cwd: DOCS, ignore: ['archive/**', '**/node_modules/**'] });
  for (const f of files) {
    const filePath = path.join(DOCS, f);
    const content = await fs.readFile(filePath, 'utf8');
    if (content.includes('docs/00-foundation/project-context.md')) continue;
    // Add NOTE after the first H1 and metadata block '---' if present
    const lines = content.split(/\r?\n/);
    let insertIndex = 0;
    // find first horizontal rule '---'
    const hr = lines.findIndex(l => l.trim() === '---');
    if (hr >= 0) insertIndex = hr + 1;
    else {
      // find first blank line after header
      const headerEnd = lines.findIndex((l, idx) => idx > 0 && l.trim() === '');
      insertIndex = headerEnd > -1 ? headerEnd + 1 : 1;
    }
    const newContent = [...lines.slice(0, insertIndex), NOTE, ...lines.slice(insertIndex)].join(
      '\n'
    );
    await fs.writeFile(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
