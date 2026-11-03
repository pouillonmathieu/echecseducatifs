# Liste les textes à traduire d'une page HTML (texte entre balises + attributs lisibles).
import re, sys, json
MASQUE = re.compile(r'<script\b.*?</script>|<style\b.*?</style>|<!--.*?-->', re.S)
TEXTE = re.compile(r'>([^<]*[A-Za-zÀ-ÿ][^<]*)<')
ATTR = re.compile(r'\b(title|aria-label|alt|placeholder|content|data-titre|data-texte)="([^"]*[A-Za-zÀ-ÿ][^"]*)"')
def norm(s): return re.sub(r'\s+', ' ', s).strip()
def textes(html):
    h = MASQUE.sub(lambda m: ' ' * len(m.group(0)), html)
    out = []
    for m in TEXTE.finditer(h): out.append(norm(m.group(1)))
    for m in ATTR.finditer(h): out.append(norm(m.group(2)))
    return [t for t in out if t]
if __name__ == '__main__':
    vus = []
    for f in sys.argv[1:]:
        for t in textes(open(f).read()):
            if t not in vus: vus.append(t)
    print(json.dumps(vus, ensure_ascii=False, indent=0))
