from pathlib import Path
from datetime import datetime

root = Path(r'C:\BDS-LandingPage')
files = [root / 'index.html'] + sorted([p for p in root.glob('*.html') if p.name != 'index.html']) + [root / 'blog' / 'victory-hermes.html']
files = [p for p in files if p.exists()]

updated = []
for path in files:
    text = path.read_text(encoding='utf-8')
    changed = False

    if '</title>' in text and 'rel="canonical"' not in text:
        rel_path = path.relative_to(root).as_posix()
        canonical = 'https://triducrealty.com/' if rel_path == 'index.html' else 'https://triducrealty.com/' + rel_path
        text = text.replace('</title>', '</title>\n<link rel="canonical" href="' + canonical + '">\n', 1)
        changed = True

    if '<meta name="robots"' not in text:
        if '<meta name="description"' in text:
            desc_pos = text.find('<meta name="description"')
            if desc_pos != -1:
                end_pos = text.find('>', desc_pos)
                if end_pos != -1:
                    text = text[:end_pos + 1] + '\n<meta name="robots" content="index,follow">' + text[end_pos + 1:]
                    changed = True
        elif '</title>' in text:
            title_end = text.find('</title>')
            if title_end != -1:
                text = text[:title_end + 8] + '\n<meta name="robots" content="index,follow">' + text[title_end + 8:]
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
