const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = [];

function walk(dir) {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) {
      if (p.includes(path.join('images', 'news', 'vanhdai3_files'))) continue;
      walk(p);
    } else if (['.html', '.css'].includes(path.extname(d.name).toLowerCase())) {
      files.push(p);
    }
  }
}

walk(root);
const refs = [];
const seen = new Set();
const re = /(?:src|href|poster)=['"]([^'"\)]+\.(?:png|jpe?g|webp|svg))|url\(\s*['"]?([^'"\)]+\.(?:png|jpe?g|webp|svg))\s*['"]?\)/ig;

for (const sourceFile of files) {
  const text = fs.readFileSync(sourceFile, 'utf8');
  let m;
  while ((m = re.exec(text)) !== null) {
    const ref = (m[1] || m[2] || '').trim();
    if (!ref) continue;
    if (/^(?:https?:|\/\/|data:)/i.test(ref)) continue;
    const resolved = path.isAbsolute(ref)
      ? path.resolve(root, '.' + ref)
      : path.resolve(path.dirname(sourceFile), ref);
    if (resolved.includes(path.join('images', 'news', 'vanhdai3_files'))) continue;
    const normalizedResolved = path.relative(root, resolved).replace(/\\/g, '/');
    const entryKey = `${path.relative(root, sourceFile).replace(/\\/g, '/')}	${ref}`;
    if (seen.has(entryKey)) continue;
    seen.add(entryKey);
    refs.push({
      sourceFile: path.relative(root, sourceFile).replace(/\\/g, '/'),
      ref,
      resolvedPath: normalizedResolved,
      ext: path.extname(ref).toLowerCase(),
    });
  }
}
refs.sort((a, b) => {
  if (a.resolvedPath === b.resolvedPath) return a.sourceFile.localeCompare(b.sourceFile);
  return a.resolvedPath.localeCompare(b.resolvedPath);
});
fs.writeFileSync(path.join(root, 'image-refs.json'), JSON.stringify(refs, null, 2), 'utf8');
fs.writeFileSync(path.join(root, 'image-refs.txt'), refs.map(r => r.resolvedPath).sort().join('\n') + '\n', 'utf8');
console.log('WROTE', refs.length, 'entries to image-refs.json and image-refs.txt');
