"""Décalque les 16 gants des planches de l'auteur (images 46 à 49) : silhouette blanche et traits, sans le bras."""
import json
import numpy as np
from PIL import Image
from scipy import ndimage as nd
import potrace

K = 4
NOMS = ['poing-cote', 'poing-leve', 'poing-bas', 'pendante', 'index-leve', 'victoire', 'index-oblique', 'coucou-dos',
        'ouverte-cote', 'presente', 'paume', 'index-pointe', 'coucou', 'ok', 'shaka', 'pouce-index']
mains = json.load(open('scratchpad/mains.json'))

def tracer(masque, ox, oy):
    chemins = potrace.Bitmap(~masque).trace(turdsize=6, alphamax=1.1, opticurve=True, opttolerance=0.3)
    f = lambda p: f'{p.x / K + ox:.1f} {p.y / K + oy:.1f}'
    d = []
    for c in chemins:
        d.append('M' + f(c.start_point))
        for s in c.segments:
            d.append(('L' + f(s.c) + 'L' + f(s.end_point)) if s.is_corner else ('C' + f(s.c1) + ' ' + f(s.c2) + ' ' + f(s.end_point)))
        d.append('Z')
    return ''.join(d)

sortie = {}
cache = {}
for i, r in enumerate(mains):
    num = r['planche']
    if num not in cache:
        a = np.asarray(Image.open(f'images/{num}.png').convert('RGBA')).astype(float)
        alpha = a[..., 3] > 128
        sombre = alpha & (a[..., :3].mean(axis=2) < 110)
        bras = nd.binary_opening(sombre, structure=np.ones((3, 3)), iterations=4)
        bras = nd.binary_dilation(bras, iterations=1) & sombre
        main = nd.binary_fill_holes(alpha & ~nd.binary_dilation(bras, iterations=1))
        cache[num] = (Image.open(f'images/{num}.png').convert('RGBA'), nd.label(main)[0])
    im, lab = cache[num]
    x0, y0, x1, y1 = r['x0'] - 3, r['y0'] - 3, r['x1'] + 3, r['y1'] + 3
    cy, cx = int((r['y0'] + r['y1']) / 2), int((r['x0'] + r['x1']) / 2)
    comp = lab[y0:y1, x0:x1]
    ids = np.bincount(comp[comp > 0].ravel()); k = ids.argmax()
    m = Image.fromarray(((comp == k) * 255).astype(np.uint8)).resize(((x1 - x0) * K, (y1 - y0) * K), Image.BILINEAR)
    m = np.asarray(m) > 127
    c = np.asarray(im.crop((x0, y0, x1, y1)).resize(((x1 - x0) * K, (y1 - y0) * K), Image.BICUBIC)).astype(float)
    silhouette = nd.binary_fill_holes(m & (c[..., 3] > 140))
    traits = silhouette & (c[..., :3].mean(axis=2) < 120)
    cote = 'G' if r['epaule'][0] > r['poignet'][0] else 'D'  # l'épaule à droite : la main est à gauche du corps
    sortie[NOMS[i]] = {'fond': tracer(silhouette, x0, y0), 'traits': tracer(traits, x0, y0), 'poignet': r['poignet'], 'entree': r['entree'], 'cote': cote}
json.dump(sortie, open('scratchpad/gants16.json', 'w'))
print({k: (v['cote'], v['entree']) for k, v in sortie.items()})
