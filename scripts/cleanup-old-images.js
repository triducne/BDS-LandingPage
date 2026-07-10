const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const skipDir = path.join('images', 'news', 'vanhdai3_files');
const supportedExtensions = new Set(['.png', '.jpg', '.jpeg']);
const references = new Set();
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (absPath.includes(path.join(root, skipDir))) continue;
      walk(absPath);
    } else {
      files.push(absPath);
    }
  }
}

walk(root);

const refRegex = /(?:src|href|poster)=['"]([^'"\)]+\.(?:png|jpe?g|webp|svg))|url\(\s*['"]?([^'"\)]+\.(?:png|jpe?g|webp|svg))['"]?\s*\)/ig;

for (const filePath of files) {
  if (!filePath.match(/\.(html|css|js)$/i)) continue;
  const text = fs.readFileSync(filePath, 'utf8');
  let match;
  while ((match = refRegex.exec(text)) !== null) {
    const ref = (match[1] || match[2] || '').trim();
    if (!ref) continue;
    if (/^(?:https?:|\/\/|data:)/i.test(ref)) continue;
    const resolved = path.isAbsolute(ref)
      ? path.resolve(root, '.' + ref)
      : path.resolve(path.dirname(filePath), ref);
    if (resolved.includes(path.join(root, skipDir))) continue;
    references.add(path.relative(root, resolved).replace(/\\/g, '/'));
  }
}

const staleImages = [];
for (const filePath of files) {
  if (!filePath.startsWith(path.join(root, 'images') + path.sep)) continue;
  const ext = path.extname(filePath).toLowerCase();
  if (!supportedExtensions.has(ext)) continue;
  const relativePath = path.relative(root, filePath).replace(/\\/g, '/');
  const basename = path.basename(relativePath).toLowerCase();
  if (/^favicon(?:-|\.|$)/i.test(basename)) continue;
  if (relativePath.startsWith('images/news/vanhdai3_files/')) continue;
  const webpPath = relativePath.slice(0, -ext.length) + '.webp';
  if (!fs.existsSync(path.join(root, webpPath))) continue;
  if (references.has(relativePath)) continue;
  staleImages.push({ path: relativePath, webp: webpPath });
}

const deleteMode = process.argv.includes('--delete');
const report = {
  timestamp: new Date().toISOString(),
  root,
  deleteMode,
  skipped: {
    favicon: 'images/favicon-32x32.png',
    preservedDir: skipDir,
  },
  staleImages,
};

if (deleteMode) {
  for (const item of staleImages) {
    fs.unlinkSync(path.join(root, item.path));
  }
}

fs.writeFileSync(path.join(root, 'image-cleanup-report.json'), JSON.stringify(report, null, 2), 'utf8');
console.log(`Found ${staleImages.length} stale image(s). deleteMode=${deleteMode}`);
for (const item of staleImages) {
  console.log(item.path);
}
console.log(`Wrote image-cleanup-report.json`);
