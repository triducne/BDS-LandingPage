const sharp = require('sharp');
const files = [
 'images/avatar.webp',
 'images/thewincity/wincity.webp',
 'images/arcadia/arcadia-at-lavila.webp',
 'images/vlasta/vlasta.webp',
 'images/peakgarden/peakgarden.webp',
 'images/news/vo-van-kiet-noi-dai.webp',
 'images/news/cau-phuoc-khanh.webp',
 'images/news/metro-so-4.webp',
 'images/news/vanh-dai-4.webp',
 'images/news/vanh-dai-3.webp'
];
(async () => {
  for (const file of files) {
    try {
      const meta = await sharp(file).metadata();
      console.log(`${file} ${meta.width} ${meta.height} ${meta.format}`);
    } catch (e) {
      console.error('ERR', file, e.message);
    }
  }
})();
