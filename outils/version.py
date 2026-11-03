# Met un numéro de version (?v=AAAAMMJJHHMM) sur tous les fichiers CSS et JS du site appelés par les pages
# françaises, pour que les navigateurs rechargent les fichiers modifiés (sinon ils gardent l'ancien en cache).
#   python3 outils/version.py        (puis python3 outils/anglais/generer.py pour les pages anglaises)
import glob, os, re, time
RACINE = os.path.normpath(os.path.join(os.path.dirname(__file__), '..'))
V = time.strftime('%Y%m%d%H%M')
for page in ['index.html'] + sorted(glob.glob(os.path.join(RACINE, 'jeux', '*', 'index.html'))):
    f = os.path.join(RACINE, page)
    s = open(f, encoding='utf-8').read()
    n = re.sub(r'(<(?:script|link)\b[^>]*?(?:src|href)=")(?!https?:|//)([^"?#]+\.(?:js|css))(?:\?v=\d+)?(")', rf'\g<1>\g<2>?v={V}\g<3>', s)
    if n != s:
        open(f, 'w', encoding='utf-8').write(n)
        print(os.path.relpath(f, RACINE))
print('version', V)
