from pathlib import Path
import os

root = Path(r'C:\BDS-LandingPage')
files = sorted(list(root.rglob('*.html')))
updated = []
for path in files:
    text = path.read_text(encoding='utf-8')
    if 'rel="canonical"' in text or '</title>' not in text:
        continue
    rel_path = path.relative_to(root).as_posix()
    canonical = 'https://triducrealty.com/' if rel_path == 'index.html' else 'https://triducrealty.com/' + rel_path
    text = text.replace('</title>', '</title>\n<link rel="canonical" href="' + canonical + '">\n', 1)
    path.write_text(text, encoding='utf-8')
    updated.append(rel_path)
print('updated', len(updated))
for item in updated:
    print(item)
