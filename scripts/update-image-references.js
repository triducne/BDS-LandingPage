const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const refs = JSON.parse(fs.readFileSync(path.join(root, 'image-refs.json'), 'utf8'));
const supported = new Set(['.png', '.jpg', '.jpeg']);
const changedFiles = new Set();
const files = new Map();
const report = [];

for (const entry of refs) {
  if (!supported.has(entry.ext)) {
    report.push({ sourceFile: entry.sourceFile, ref: entry.ref, skipped: true, reason: 'unsupported extension' });
    continue;
  }

  const sourceFilePath = path.resolve(root, entry.sourceFile);
  if (!fs.existsSync(sourceFilePath)) {
    report.push({ sourceFile: entry.sourceFile, ref: entry.ref, skipped: true, reason: 'source file missing' });
    continue;
  }

  const originalContent = files.has(sourceFilePath)
    ? files.get(sourceFilePath)
    : fs.readFileSync(sourceFilePath, 'utf8');

  const targetRef = entry.ref.replace(/\.[^./\\]+$/, '.webp');
  const targetFilePath = path.resolve(path.dirname(sourceFilePath), targetRef);

  if (!fs.existsSync(targetFilePath)) {
    report.push({ sourceFile: entry.sourceFile, ref: entry.ref, skipped: true, reason: 'target WebP missing', target: path.relative(root, targetFilePath).replace(/\\/g, '/') });
    files.set(sourceFilePath, originalContent);
    continue;
  }

  if (!originalContent.includes(entry.ref)) {
    report.push({ sourceFile: entry.sourceFile, ref: entry.ref, skipped: true, reason: 'reference not found' });
    files.set(sourceFilePath, originalContent);
    continue;
  }

  const updatedContent = originalContent.split(entry.ref).join(targetRef);
  files.set(sourceFilePath, updatedContent);
  changedFiles.add(sourceFilePath);
  report.push({ sourceFile: entry.sourceFile, ref: entry.ref, updated: true, target: targetRef });
}

for (const [filePath, content] of files.entries()) {
  if (!changedFiles.has(filePath)) continue;
  fs.writeFileSync(filePath, content, 'utf8');
}

fs.writeFileSync(path.join(root, 'image-update-report.json'), JSON.stringify(report, null, 2), 'utf8');
console.log('WROTE', report.length, 'entries to image-update-report.json');
console.log('UPDATED', changedFiles.size, 'files');
