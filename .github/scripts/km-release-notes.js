// Splits CHANGELOG-km.md into one notes file per version:
//   node .github/scripts/km-release-notes.js <outDir>
// Every "## <x.y.z-km.N>" section becomes <outDir>/<version>.md
const fs = require('fs');
const path = require('path');

const outDir = process.argv[2] || 'notes';
fs.mkdirSync(outDir, { recursive: true });
if (!fs.existsSync('CHANGELOG-km.md')) process.exit(0);

const parts = fs.readFileSync('CHANGELOG-km.md', 'utf8').split(/^## /m).slice(1);
for (const part of parts) {
    const nl = part.indexOf('\n');
    const version = part.slice(0, nl).trim();
    if (!/^\d+\.\d+\.\d+-km\.\d+$/.test(version)) continue;
    fs.writeFileSync(path.join(outDir, `${version}.md`), part.slice(nl + 1).trim() + '\n');
}
