#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import ts from 'typescript';

// Simple script: walk `apps/api` and add richer JSDoc comments above exported
// declarations when no JSDoc is present. It emits a short description,
// `@param` tags for parameters (with inferred types where available), and
// `@returns` when a non-void return type is detected. The script is
// conservative: it will not overwrite existing /** ... */ blocks.

const ROOT = path.resolve(process.cwd(), 'apps', 'api');
const IGNORES = ['node_modules', 'dist', 'build', '.d.ts', '.spec.ts', '.test.ts'];

function shouldIgnore(filePath) {
  return IGNORES.some(i => filePath.includes(i));
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (shouldIgnore(full)) continue;
    if (e.isDirectory()) walk(full);
    else if (e.isFile() && (full.endsWith('.ts') || full.endsWith('.tsx'))) {
      processFile(full);
    }
  }
}

function processFile(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, src, ts.ScriptTarget.Latest, true);
  const inserts = [];

  function hasJsDoc(node) {
    const comments = ts.getLeadingCommentRanges(src, node.getFullStart());
    if (!comments) return false;
    for (const c of comments) {
      const text = src.slice(c.pos, c.end);
      if (text.startsWith('/**')) return true;
    }
    return false;
  }

  function typeToString(typeNode) {
    if (!typeNode) return 'any';
    try {
      return src.slice(typeNode.pos, typeNode.end).trim();
    } catch (e) {
      return 'any';
    }
  }

  function paramToTag(param) {
    const name = param.name ? param.name.getText(sourceFile) : 'param';
    const type = param.type ? typeToString(param.type) : 'any';
    return ` * @param {${type}} ${name} - `;
  }

  function returnsTag(node) {
    const type = node.type ? typeToString(node.type) : null;
    if (!type) return null;
    // treat explicit void / Promise<void> as no returns
    const t = type.replace(/\s+/g, '');
    if (t === 'void' || t === 'Promise<void>') return null;
    return ` * @returns {${type}} `;
  }

  function visit(node) {
    // Skip explicit export declarations (re-exports)
    if (ts.isExportDeclaration(node)) return;

    const modifiers = node.modifiers;
    const isExported = modifiers && modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) {
      ts.forEachChild(node, visit);
      return;
    }

    if (hasJsDoc(node)) {
      ts.forEachChild(node, visit);
      return;
    }

    // Compute insertion position: start of the line where the node begins
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const lineStartPos = sourceFile.getPositionOfLineAndCharacter(line, 0);

    // Derive a friendly name
    let name = 'exported';
    try {
      if (node.name && node.name.escapedText) name = String(node.name.escapedText);
      else if (node.symbol && node.symbol.name) name = node.symbol.name;
      else if (node.kind === ts.SyntaxKind.FunctionDeclaration) {
        const fd = node;
        if (fd.name) name = fd.name.getText(sourceFile);
      } else if (ts.isVariableStatement(node)) {
        const decl = node.declarationList && node.declarationList.declarations && node.declarationList.declarations[0];
        if (decl && decl.name) name = decl.name.getText(sourceFile);
      } else if (ts.isClassDeclaration(node) && node.name) {
        name = node.name.getText(sourceFile);
      }
    } catch (e) {
      // fallback to generic
    }

    // Build the JSDoc stub
    const lines = [];
    lines.push('/**');
    lines.push(` * Auto-generated doc: ${name} — replace with meaningful description.`);

    // Parameters for functions / methods / arrow functions assigned to exported const
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isFunctionExpression(node)) {
      const params = node.parameters || [];
      for (const p of params) lines.push(paramToTag(p));
      const ret = returnsTag(node);
      if (ret) lines.push(ret);
    } else if (ts.isVariableStatement(node)) {
      // check for exported const foo = (a,b) => { }
      const decl = node.declarationList && node.declarationList.declarations && node.declarationList.declarations[0];
      if (decl && decl.initializer) {
        const init = decl.initializer;
        if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
          const params = init.parameters || [];
          for (const p of params) lines.push(paramToTag(p));
          const ret = returnsTag(init);
          if (ret) lines.push(ret);
        }
      }
    } else if (ts.isClassDeclaration(node)) {
      // Place a short class description only
    }

    lines.push(' */\n');
    const stub = lines.join('\n');
    inserts.push({ pos: lineStartPos, stub });
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (inserts.length > 0) {
    // apply inserts in reverse order
    inserts.sort((a, b) => b.pos - a.pos);
    let out = src;
    for (const it of inserts) out = out.slice(0, it.pos) + it.stub + out.slice(it.pos);
    fs.writeFileSync(filePath, out, 'utf8');
    console.log(`Patched ${filePath}: inserted ${inserts.length} stub(s)`);
  }
}

function main() {
  if (!fs.existsSync(ROOT)) {
    console.error('apps/api not found — adjust ROOT in script.');
    process.exitCode = 2;
    return;
  }
  walk(ROOT);
  console.log('Done: JSDoc stubs insertion complete.');
}

main();
