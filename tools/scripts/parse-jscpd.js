#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const reportPath = path.resolve(__dirname, '../../../reports/duplicates/html/jscpd-report.json');
if (!fs.existsSync(reportPath)) {
  console.error('jscpd report not found at', reportPath);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
// const duplicates = report.duplicates || report.clones || report.items || []; // unused

// The structure may vary; jscpd v3 uses 'duplicates' or 'clones' with file A & file B
// But there's a 'statistics' and 'clones' structure; fallback parse methods.
if (report.clones && Array.isArray(report.clones)) {
  parseClones(report.clones);
} else if (report.duplicates && Array.isArray(report.duplicates)) {
  parseClones(report.duplicates);
} else if (report.items && Array.isArray(report.items)) {
  parseClones(report.items);
} else if (report.statistics?.formats) {
  // fallback - iterate through files in statistics and see duplicates per file
  // Not ideal, but try to find in-repo files listed in statistics
  const files = Object.keys(report.statistics.formats.javascript.sources || {});
  console.log(`Found ${files.length} js/ts sources in stats`);
  const inRepo = files.filter(
    f => (f.includes('/apps/') || f.includes('/libs/')) && !f.includes('/node_modules/')
  );
  console.log('inRepo files detected (not node_modules):', inRepo.length);
  console.log(inRepo.slice(0, 200).join('\n'));
  process.exit(0);
} else {
  console.error('No clone groups found in jscpd report.');
  process.exit(1);
}

function parseClones(clones) {
  // Each clone group may have files array or sourceA/sourceB etc.
  const filtered = [];
  clones.forEach((c, i) => {
    // Find all file paths in the clone object
    const files = [];
    if (Array.isArray(c.files)) {
      c.files.forEach(f => {
        files.push(f.name || f.path || f);
      });
    } else if (c.sourceA && c.sourceB) {
      files.push(c.sourceA.filename || c.sourceA.name || c.sourceA);
      files.push(c.sourceB.filename || c.sourceB.name || c.sourceB);
    }

    // Filter to in-repo: apps/ or libs/ and ensure not node_modules
    const inRepoFiles = files.filter(
      f =>
        typeof f === 'string' &&
        (f.includes('/apps/') || f.includes('/libs/')) &&
        !f.includes('/node_modules/')
    );
    if (inRepoFiles.length >= 2) {
      // compute a simple score: total duplicated lines
      const lines =
        c.lines ||
        c.duplicatedLines ||
        (c.sourceA?.start && c.sourceA?.end ? c.sourceA.end - c.sourceA.start + 1 : 0);
      filtered.push({
        index: i,
        files: inRepoFiles,
        lines: lines || c.lines || c.duplicatedLines || 0,
        raw: c,
      });
    }
  });
  // Sort by lines descending
  filtered.sort((a, b) => b.lines - a.lines);
  // print top 50
  console.log(JSON.stringify(filtered.slice(0, 50), null, 2));
}
