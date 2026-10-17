// Write THIRD-PARTY-NOTICES.md for the packages that end up in canvas-commons-bundle.js.
// Usage: node scripts/notices.mjs [--check]
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const player = path.join(repo, 'player');
const out = path.join(repo, '_extensions/andrie/canvas-commons/THIRD-PARTY-NOTICES.md');

const dirs = execFileSync('npm', ['ls', '--omit=dev', '--all', '--parseable'], {cwd: player, encoding: 'utf8'}).split('\n').filter(Boolean).slice(1).sort();
let text = `# Third-party notices

\`canvas-commons-bundle.js\` is built from the packages below, which are bundled into it. The extension itself is MIT licensed (see the LICENSE file in the repository).
`;
for (const dir of dirs) {
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const licenceFile = fs.readdirSync(dir).find((f) => /^(licen[sc]e|copying)(\.|$)/i.test(f));
  text += `\n## ${pkg.name} ${pkg.version}\n\nLicence: ${pkg.license}\n`;
  if (licenceFile) text += `\n\`\`\`text\n${fs.readFileSync(path.join(dir, licenceFile), 'utf8').trim()}\n\`\`\`\n`;
}
if (process.argv.includes('--check')) {
  if (!fs.existsSync(out) || fs.readFileSync(out, 'utf8') !== text) { console.error('error: THIRD-PARTY-NOTICES.md is stale; run scripts/build-player.sh'); process.exit(1); }
  console.log('ok: third-party notices are current');
} else {
  fs.writeFileSync(out, text);
  console.log(`wrote ${path.relative(repo, out)} (${dirs.length} packages)`);
}
