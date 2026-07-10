const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

(async function(){
  try{
    const root = path.resolve(__dirname, '..');
    const imgsDir = path.join(root, 'images');
    const backupDir = path.join(imgsDir, 'favicon-backup-auto');
    if(!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const sizes = [16,32,48,180,192,512];
    const src = path.join(imgsDir, 'favicon-512x512.png');
    if(!fs.existsSync(src)){
      console.error('Source 512 not found:', src);
      process.exit(1);
    }

    const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    for(let y=0;y<height;y++){
      for(let x=0;x<width;x++){
        const idx = (y*width + x)*channels;
        const alpha = channels===4 ? data[idx+3] : 255;
        if(alpha > 16){ if(x<minX) minX=x; if(y<minY) minY=y; if(x>maxX) maxX=x; if(y>maxY) maxY=y; }
      }
    }

    if(maxX < minX){
      console.error('No visible content found in', src);
      process.exit(1);
    }

    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    console.log('Detected bbox on 512:', w+'x'+h, 'at', minX+','+minY);

    const cropBuf = await sharp(src).extract({ left: minX, top: minY, width: w, height: h }).png().toBuffer();

    // backup existing
    for(const s of sizes){
      const dest = path.join(imgsDir, `favicon-${s}x${s}.png`);
      if(fs.existsSync(dest)){
        const ts = new Date().toISOString().replace(/[:.]/g,'-');
        fs.copyFileSync(dest, path.join(backupDir, `favicon-${s}x${s}.png.bak-${ts}`));
      }
    }

    // generate new favicons
    for(const s of sizes){
      const inner = Math.round(s * 0.78);
      const resized = await sharp(cropBuf).resize({ width: inner, height: inner, fit: 'inside', withoutEnlargement: false }).png().toBuffer();
      const meta = await sharp(resized).metadata();
      const left = Math.floor((s - meta.width) / 2);
      const top = Math.floor((s - meta.height) / 2);
      const canvas = sharp({ create: { width: s, height: s, channels: 4, background: { r:0,g:0,b:0,alpha:0 } } });
      const out = await canvas.composite([{ input: resized, left, top }]).png().toBuffer();
      await sharp(out).toFile(path.join(imgsDir, `favicon-${s}x${s}.png`));
      console.log('Wrote', `images/favicon-${s}x${s}.png`);
    }

    console.log('Backup saved to', backupDir);
    console.log('Done');
  }catch(e){
    console.error(e);
    process.exit(1);
  }
})();
