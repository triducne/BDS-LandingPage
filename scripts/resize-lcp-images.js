const sharp = require('sharp');
const path = require('path');
const files = [
  { file: 'images/hero-banner.webp', width: 1600 },
  { file: 'images/peakgarden/peakgarden.webp', width: 2000 },
  { file: 'images/thewincity/wincity.webp', width: 1600 },
  { file: 'images/arcadia/arcadia-at-lavila.webp', width: 1600 },
  { file: 'images/vlasta/vlasta.webp', width: 1600 },
  { file: 'images/destino/destino.webp', width: 1600 },
  { file: 'images/news/cau-phuoc-khanh.webp', width: 1200 },
  { file: 'images/news/vo-van-kiet-noi-dai.webp', width: 1024 },
  { file: 'images/news/vanh-dai-4.webp', width: 1200 },
  { file: 'images/news/vanh-dai-3.webp', width: 900 },
  { file: 'images/news/metro-so-4.webp', width: 850 },
  { file: 'images/avatar.webp', width: 320 }
];
(async () => {
  for (const item of files) {
    const input = path.resolve(__dirname, '..', item.file);
    const output = path.resolve(path.dirname(input), `${path.basename(input)}.tmp.webp`);
    try {
      const fs = require('fs');
      if (!fs.existsSync(input)) {
        console.warn(`SKIP ${item.file}: not found`);
        continue;
      }
      const inputBuffer = fs.readFileSync(input);
      const resizedBuffer = await sharp(inputBuffer)
        .resize({ width: item.width, withoutEnlargement: true })
        .webp({ quality: 80, effort: 6 })
        .toBuffer();
      fs.writeFileSync(input, resizedBuffer);
      const meta = await sharp(resizedBuffer).metadata();
      console.log(`${item.file} => ${meta.width}x${meta.height} ${meta.format}`);
    } catch (error) {
      console.error(`ERR ${item.file}:`, error.message);
    }
  }
})();
