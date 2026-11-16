"""Décalque les deux gants du dessin de Pom' (images/44.png) en tracés vectoriels : la silhouette blanche et les traits."""
import sys, json
import numpy as np
from PIL import Image
import potrace

im = Image.open(sys.argv[1]).convert('RGBA')
K = 4  # on agrandit avant de décalquer, pour des courbes douces

def tracer(masque, ox, oy):
    bm = potrace.Bitmap(~masque)  # potracer décalque les pixels « faux »
    chemins = bm.trace(turdsize=6, alphamax=1.1, opticurve=True, opttolerance=0.3)
    f = lambda p: f'{p.x / K + ox:.1f} {p.y / K + oy:.1f}'
    d = []
    for c in chemins:
        d.append('M' + f(c.start_point))
        for s in c.segments:
            if s.is_corner: d.append('L' + f(s.c) + 'L' + f(s.end_point))
            else: d.append('C' + f(s.c1) + ' ' + f(s.c2) + ' ' + f(s.end_point))
        d.append('Z')
    return ''.join(d)

res = {}
# boîte, et zone du bras à retirer (le bras entre dans le poignet)
for nom, (x0, y0, x1, y1), coupe in [
    ('pouce', (188, 508, 300, 632), lambda X, Y: X > 284.5),
    ('ouverte', (650, 388, 790, 506), lambda X, Y: Y > 496.5),
]:
    c = im.crop((x0, y0, x1, y1)).resize(((x1 - x0) * K, (y1 - y0) * K), Image.BICUBIC)
    a = np.asarray(c).astype(float)
    alpha = a[..., 3]
    lum = a[..., :3].mean(axis=2)
    Y, X = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    X = X / K + x0; Y = Y / K + y0
    garde = ~coupe(X, Y)
    silhouette = (alpha > 140) & garde
    traits = silhouette & (lum < 120)
    res[nom] = {'fond': tracer(silhouette, x0, y0), 'traits': tracer(traits, x0, y0)}
json.dump(res, open(sys.argv[2], 'w'))
print({k: (len(v['fond']), len(v['traits'])) for k, v in res.items()})
