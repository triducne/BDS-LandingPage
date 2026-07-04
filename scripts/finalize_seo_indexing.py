from pathlib import Path
from datetime import datetime

root = Path(r'C:\BDS-LandingPage')
html_files = sorted([p for p in root.rglob('*.html') if 'node_modules' not in p.parts and '.git' not in p.parts])
updated = []
for path in html_files:
    text = path.read_text(encoding='utf-8')
    changed = False

    if '</title>' in text and 'rel="canonical"' not in text:
        rel_path = path.relative_to(root).as_posix()
        canonical = 'https://triducrealty.com/' if rel_path == 'index.html' else 'https://triducrealty.com/' + rel_path
        text = text.replace('</title>', '</title>\n<link rel="canonical" href="' + canonical + '">\n', 1)
        changed = True

    if '<meta name="robots"' not in text:
        if '<meta name="description"' in text:
            marker = '<meta name="description"'
            insert = '<meta name="robots" content="index,follow">\n'
            if insert not in text:
                text = text.replace(marker, marker, 1)
                # insert after the first description tag block line if possible
                desc_pos = text.find('<meta name="description"')
                if desc_pos != -1:
                    end_of_desc = text.find('>', desc_pos)
                    if end_of_desc != -1:
                        text = text[:end_of_desc + 1] + '\n' + insert + text[end_of_desc + 1:]
                        changed = True

    if changed:
        path.write_text(text, encoding='utf-8')
        updated.append(path.relative_to(root).as_posix())

sitemap_path = root / 'sitemap.xml'
if sitemap_path.exists():
    text = sitemap_path.read_text(encoding='utf-8')
    today = datetime.now().strftime('%Y-%m-%d')
    text = text.replace('<lastmod>2026-06-11</lastmod>', f'<lastmod>{today}</lastmod>')
    text = text.replace('<lastmod>2026-06-19</lastmod>', f'<lastmod>{today}</lastmod>')
    text = text.replace('<lastmod>2026-06-30</lastmod>', f'<lastmod>{today}</lastmod>')
    sitemap_path.write_text(text, encoding='utf-8')

print('updated_pages', len(updated))
for item in updated:
    print(item)
print('sitemap_updated', sitemap_path.exists())
