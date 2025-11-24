import { describe, expect, it } from 'vitest';

import { filterChangedFiles, isValidGitRef, parseDiffNumstat } from './guard-change-budget.mjs';

describe('guard-change-budget helpers', () => {
  it('validates git refs safely', () => {
    expect(isValidGitRef('origin/main')).toBe(true);
    expect(isValidGitRef('feature/foo-123')).toBe(true);
    expect(isValidGitRef('main; rm -rf /')).toBe(false);
    expect(isValidGitRef('bad ref with space')).toBe(false);
  });

  it('filters changed files with exclusions', () => {
    const files = ['src/app.ts', 'package-lock.json', 'docs/readme.md'];
    const excluded = ['package-lock.json'];
    expect(filterChangedFiles(files, excluded)).toEqual(['src/app.ts', 'docs/readme.md']);
  });

  it('parses numstat output and ignores excluded files', () => {
    const numstat = ['10\t2\tsrc/app.ts', '5\t1\tpackage-lock.json', '-\t-\tREADME.md'].join('\n');
    const result = parseDiffNumstat(numstat, ['package-lock.json']);
    expect(result).toEqual({ added: 10, deleted: 2 });
  });
});
