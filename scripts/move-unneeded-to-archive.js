const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const archiveDir = path.join(root, 'archive', 'unneeded');
const toMove = [
  path.join(root, 'images', 'favicon-backup-auto'),
  path.join(root, 'images', 'favicon-backup'),
  path.join(root, 'css', 'backup'),
  path.join(root, 'tmp', 'unneeded')
];

function ensureDir(dir){ if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

(async()=>{
  try{
    ensureDir(archiveDir);
    for(const src of toMove){
      if(!fs.existsSync(src)){
        console.log('Not found, skipping', src);
        continue;
      }
      const name = path.basename(src);
      const dest = path.join(archiveDir, name);
      if(fs.existsSync(dest)){
        const ts = new Date().toISOString().replace(/[:.]/g,'-');
        const destBak = dest + '.bak-' + ts;
        fs.renameSync(dest, destBak);
        console.log('Existing archive moved to', destBak);
      }
      fs.renameSync(src, dest);
      console.log('Moved', src, '→', dest);
    }
    console.log('Done');
  }catch(err){
    console.error('ERROR', err);
    process.exit(1);
  }
})();
