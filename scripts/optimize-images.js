const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const refs = fs.readFileSync(path.join(root, 'image-refs.txt'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean);
const supported = new Set(['.png', '.jpg', '.jpeg']);
const output = [];

async function convertImage(ref) {
  const srcPath = path.resolve(root, ref);
  const ext = path.extname(srcPath).toLowerCase();
  if (!supported.has(ext)) {
    return { path: ref, skipped: true, reason: 'already optimized or unsupported format' };
  }
  const baseName = path.basename(srcPath).toLowerCase();
  if (/^favicon(?:-|\.|$)/.test(baseName)) {
    return { path: ref, skipped: true, reason: 'favicon preserved as PNG or special favicon file' };
  }
  if (!fs.existsSync(srcPath)) {
    return { path: ref, skipped: true, reason: 'missing file' };
  }
  const webpPath = srcPath.slice(0, -ext.length) + '.webp';
  if (fs.existsSync(webpPath)) {
    return { path: ref, skipped: true, reason: 'already has webp counterpart' };
  }
  try {
    const buffer = await sharp(srcPath)
      .webp({ quality: 82, effort: 6 })
      .toBuffer();
    fs.writeFileSync(webpPath, buffer);
    return { path: ref, converted: true, target: path.relative(root, webpPath) };
  } catch (err) {
    return { path: ref, skipped: true, reason: err.message };
  }
}

(async () => {
  for (const ref of refs) {
    output.push(await convertImage(ref));
  }
  fs.writeFileSync(path.join(root, 'image-conversion-report.json'), JSON.stringify(output, null, 2), 'utf8');
  console.log('WROTE', output.length, 'entries to image-conversion-report.json');
})();
