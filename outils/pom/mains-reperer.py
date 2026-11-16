"""Découpe les mains des planches de l'auteur : chaque gant, son poignet, la direction du bras qui y entre."""
import sys, json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd

res = []
for num in (46, 47, 48, 49):
    a = np.asarray(Image.open(f'images/{num}.png').convert('RGBA')).astype(float)
    alpha = a[..., 3] > 128
    lum = a[..., :3].mean(axis=2)
    sombre = alpha & (lum < 110)
    # le bras : un trait épais ; on enlève les traits fins (contours des gants) par ouverture
    bras = nd.binary_opening(sombre, structure=np.ones((3, 3)), iterations=4)
    bras = nd.binary_dilation(bras, iterations=1) & sombre
    # la main : tout ce qui est opaque, moins le bras
    main = alpha & ~nd.binary_dilation(bras, iterations=1)
    main = nd.binary_fill_holes(main)
    lab, n = nd.label(main)
    labb, nb = nd.label(nd.binary_dilation(bras, iterations=2))
    for k in range(1, n + 1):
        m = lab == k
        if m.sum() < 1500: continue
        ys, xs = np.nonzero(m)
        # le poignet : là où le bras touche la main
        contact = nd.binary_dilation(m, iterations=4) & bras
        if contact.sum() == 0: continue
        cy, cx = np.argwhere(contact).mean(axis=0)
        # le bras qui touche : la direction de son trait près du poignet
        idb = np.bincount(labb[contact].ravel()).argmax() if (labb[contact] > 0).any() else 0
        bm = (labb == idb) & bras
        py, px = np.nonzero(bm)
        d = np.hypot(px - cx, py - cy)
        sel = (d > 25) & (d < 70)
        if sel.sum() == 0: continue
        ax, ay = px[sel].mean(), py[sel].mean()
        ang = float(np.degrees(np.arctan2(cy - ay, cx - ax)))  # direction du bras qui entre dans le gant
        # l'épaule : le bout du bras le plus loin du poignet
        far = d.argmax(); ex, ey = px[far], py[far]
        res.append({'planche': num, 'x0': int(xs.min()), 'y0': int(ys.min()), 'x1': int(xs.max()) + 1, 'y1': int(ys.max()) + 1,
                    'poignet': [round(float(cx), 1), round(float(cy), 1)], 'entree': round(ang, 1), 'epaule': [int(ex), int(ey)]})
json.dump(res, open('scratchpad/mains.json', 'w'), indent=1)
print(len(res), 'mains')
# planche de contrôle
for num in (46, 47, 48, 49):
    im = Image.open(f'images/{num}.png').convert('RGBA'); fond = Image.new('RGBA', im.size, 'white'); fond.alpha_composite(im)
    dr = ImageDraw.Draw(fond)
    for i, r in enumerate(res):
        if r['planche'] != num: continue
        dr.rectangle([r['x0'], r['y0'], r['x1'], r['y1']], outline=(0, 120, 255), width=2)
        x, y = r['poignet']; dr.ellipse([x - 6, y - 6, x + 6, y + 6], fill=(255, 0, 0))
        import math
        t = math.radians(r['entree']); dr.line([x - 60 * math.cos(t), y - 60 * math.sin(t), x, y], fill=(255, 0, 0), width=3)
        dr.text((r['x0'], r['y0'] - 12), f'#{i}', fill=(200, 0, 0))
    fond.convert('RGB').resize((500, 500)).save(f'scratchpad/controle-{num}.png')
