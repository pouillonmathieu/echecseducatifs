#!/usr/bin/env python3
"""Fabrique js/pom-moteur.js (le dessin de Pom' et son moteur d'animations) à partir de l'atelier
outils/pom/animations-pom.html, qui reste la seule source : on règle les animations dans l'atelier, puis on relance
ce script (python3 outils/pom/construire.py).

- le dessin : le <svg class="pom-svg"> de l'atelier, sans les commentaires, et sans les gants qu'aucune animation
  n'utilise ; les gants décalqués sont allégés (les petites courbes du décalque deviennent des lignes, en ne gardant
  que les points utiles : l'écart reste sous 0,3 unité du dessin, invisible à l'écran) ;
- le moteur : le bloc <script id="moteur-pom"> de l'atelier, repris tel quel (window.creerPom).
"""
import json
import math
import os
import re

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(os.path.dirname(ICI))
ATELIER = os.path.join(ICI, 'animations-pom.html')
SORTIE = os.path.join(RACINE, 'js', 'pom-moteur.js')
TOLERANCE = 0.3


def points_du_trace(d):
    """Les sous-chemins d'un tracé (M, L, C, Z absolus), en listes de points (courbes échantillonnées)."""
    jetons = re.findall(r'[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?', d)
    sous, courant, pos, i, cmd = [], None, (0.0, 0.0), 0, None
    while i < len(jetons):
        j = jetons[i]
        if j in 'MLCZ':
            cmd = j
            i += 1
            if cmd == 'Z':
                if courant:
                    sous.append(courant)
                courant = None
            continue
        if cmd == 'M':
            pos = (float(jetons[i]), float(jetons[i + 1]))
            i += 2
            if courant:
                sous.append(courant)
            courant = [pos]
            cmd = 'L'
        elif cmd == 'L':
            pos = (float(jetons[i]), float(jetons[i + 1]))
            i += 2
            courant.append(pos)
        elif cmd == 'C':
            x1, y1, x2, y2, x, y = (float(v) for v in jetons[i:i + 6])
            i += 6
            x0, y0 = pos
            for k in (0.25, 0.5, 0.75, 1.0):
                u = 1 - k
                courant.append((u ** 3 * x0 + 3 * u * u * k * x1 + 3 * u * k * k * x2 + k ** 3 * x,
                                u ** 3 * y0 + 3 * u * u * k * y1 + 3 * u * k * k * y2 + k ** 3 * y))
            pos = (x, y)
        else:
            raise ValueError('commande inattendue : ' + str(cmd))
    if courant:
        sous.append(courant)
    return sous


def distance(p, a, b):
    (x, y), (x1, y1), (x2, y2) = p, a, b
    dx, dy = x2 - x1, y2 - y1
    n = math.hypot(dx, dy)
    if n == 0:
        return math.hypot(x - x1, y - y1)
    return abs(dy * x - dx * y + x2 * y1 - y2 * x1) / n


def alleger(pts):
    """Ramer-Douglas-Peucker, sans récursion."""
    garder = [False] * len(pts)
    garder[0] = garder[-1] = True
    pile = [(0, len(pts) - 1)]
    while pile:
        a, b = pile.pop()
        loin, k = 0, None
        for i in range(a + 1, b):
            dd = distance(pts[i], pts[a], pts[b])
            if dd > loin:
                loin, k = dd, i
        if k is not None and loin > TOLERANCE:
            garder[k] = True
            pile += [(a, k), (k, b)]
    return [p for p, g in zip(pts, garder) if g]


def nombre(v):
    s = f'{v:.1f}'.rstrip('0').rstrip('.')
    s = '0' if s == '-0' else s
    return s.replace('0.', '.', 1) if s.startswith('0.') else s.replace('-0.', '-.', 1)


def trace_allege(d):
    morceaux = []
    for pts in points_du_trace(d):
        # un sous-chemin fermé : on coupe au point le plus éloigné du départ, pour bien garder les deux moitiés
        loin = max(range(len(pts)), key=lambda i: math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]))
        pts = alleger(pts[:loin + 1])[:-1] + alleger(pts[loin:])
        coords = ' '.join(f'{nombre(x)} {nombre(y)}' for x, y in pts)
        morceaux.append('M' + re.sub(r' (-)', r'\1', coords) + 'Z')
    return ''.join(morceaux)


def main():
    html = open(ATELIER, encoding='utf-8').read()
    moteur = re.search(r'<script id="moteur-pom">\n(.*?)</script>', html, re.S).group(1)
    dessin = re.search(r'(<svg class="pom-svg".*?</svg>)', html, re.S).group(1)

    # les gants utilisés : ceux qu'une animation nomme
    noms = set(re.findall(r"'([a-z-]+)'", moteur))  # (les clés de MAINS, entre guillemets doubles, ne comptent pas)
    gants = re.findall(r'<g id="pom-main-([a-z-]+)">', dessin)
    inutiles = [g for g in gants if g not in noms]
    for g in inutiles:
        debut = dessin.index(f'<g id="pom-main-{g}">')
        # le gant finit au </g></g> de même niveau (un gant décalqué tient sur une ligne)
        fin = dessin.index('\n', debut)
        assert dessin[debut:fin].rstrip().endswith('</g></g>'), g
        dessin = dessin[:debut] + dessin[fin + 1:]

    # les gants décalqués, allégés
    avant = len(dessin)
    dessin = re.sub(r'(<path class="gant-(?:fond|traits)" d=")([^"]+)(")',
                    lambda m: m.group(1) + trace_allege(m.group(2)) + m.group(3), dessin)

    # sans commentaires ni blancs entre les balises ; décoratif pour les lecteurs d'écran
    dessin = re.sub(r'<!--.*?-->', '', dessin, flags=re.S)
    dessin = re.sub(r'>\s+<', '><', dessin)
    dessin = re.sub(r'\s+', ' ', dessin)
    dessin = re.sub(r' role="img" aria-label="[^"]*"', ' aria-hidden="true" focusable="false"', dessin, count=1)

    entete = ('/* Le dessin de Pom\' et son moteur d\'animations. FICHIER FABRIQUÉ par outils/pom/construire.py à partir de\n'
              '   l\'atelier outils/pom/animations-pom.html : ne pas le modifier à la main. Il est chargé par js/pom.js. */\n')
    js = entete + 'window.POM_DESSIN = ' + json.dumps(dessin, ensure_ascii=False) + ';\n' + moteur
    open(SORTIE, 'w', encoding='utf-8').write(js)
    print(f'{os.path.relpath(SORTIE, RACINE)} : {len(js) // 1024} Ko (dessin {avant // 1024} Ko avant allègement des gants ; '
          f'gants retirés : {", ".join(inutiles) or "aucun"})')


if __name__ == '__main__':
    main()
