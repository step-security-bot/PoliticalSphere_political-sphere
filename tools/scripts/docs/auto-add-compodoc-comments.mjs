#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

// Recursively collect .ts files under a directory
async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      files.push(...(await collectFiles(full)));
    } else if (ent.isFile() && full.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

function hasJSDocBefore(content, index) {
  // Look backwards for '/**' before the index up to a few lines
  const snippet = content.slice(Math.max(0, index - 200), index);
  return /\/\*\*[\s\S]*?\*\//.test(snippet);
}

async function processFile(file) {
  let content = await fs.readFile(file, 'utf8');
  const original = content;

  // Patterns to add comments for
  const patterns = [
    /(^|\n)export\s+default\s+([a-zA-Z0-9_]+)\s*;/g,
    /(^|\n)export\s+(function|const|let|class)\s+([a-zA-Z0-9_]+)/g,
    /(^|\n)export\s+(interface|type)\s+([a-zA-Z0-9_]+)/g,
  ];

  for (const pat of patterns) {
    let m;
    // Reset lastIndex in case
    pat.lastIndex = 0;
    const inserts = [];
    while ((m = pat.exec(content)) !== null) {
      const fullMatch = m[0];
      const name = m[2] || m[3];
      const idx = m.index + (m[1] ? m[1].length : 0);
      if (!hasJSDocBefore(content, idx)) {
        inserts.push({ idx, name });
      }
    }

    // Apply inserts in reverse order to preserve indices
    for (let i = inserts.length - 1; i >= 0; --i) {
      const { idx, name } = inserts[i];
      const comment = `/** Auto-generated doc: ${name} */\n`;
      content = content.slice(0, idx) + comment + content.slice(idx);
    }
  }

  if (content !== original) {
    await fs.writeFile(file, content, 'utf8');
    console.log('Updated', file);
  }
}

async function main() {
  const root = path.join(process.cwd(), 'apps', 'api', 'src');
  const files = await collectFiles(root);
  for (const f of files) {
    try {
      await processFile(f);
    } catch (err) {
      console.error('Failed to process', f, err);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
