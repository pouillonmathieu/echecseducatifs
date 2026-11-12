# Illustrations des cartes de l'accueil : des pièces d'échecs avec des yeux et des expressions (SVG dessiné à la main).
#   python3 outils/illustrations-accueil.py           -> remplace les icônes dans index.html (entre les marqueurs)
#   python3 outils/illustrations-accueil.py apercu F  -> écrit une page d'aperçu F (grandes et petites tailles)
# Chaque illustration tient dans un carré de 120 × 120. Les couleurs sont fixes (dessin clair, même en mode sombre).
import re, sys

O = '#1A1E27'          # contour
W = '#FFFFFF'          # pièce blanche
OMBRE = '#DCE1E8'      # ombre douce sur la pièce
JOUE = '#F4A3A0'       # joues roses
EP = 2.4               # épaisseur du contour


def fmt(x):
    return ('%.2f' % x).rstrip('0').rstrip('.')


# ---------- pièces (dans une boîte de 60 × 88, origine en haut à gauche) ----------
def socle():
    return (f'<path d="M14 82C14 72 20 67 22 64H38C40 67 46 72 46 82Z" fill="{W}"/>'
            f'<rect x="7" y="80" width="46" height="7" rx="3.5" fill="{W}"/>'
            f'<rect x="16" y="57" width="28" height="8" rx="4" fill="{W}"/>')


CORPS = {
    'fou': lambda: (f'<circle cx="30" cy="7" r="5" fill="{W}"/>'
                    f'<path d="M30 12C17 22 11 35 14 46C16 54 23 58 30 58C37 58 44 54 46 46C49 35 43 22 30 12Z" fill="{W}"/>'
                    f'<path d="M34 18 28 26" fill="none"/>' + socle()),
    'roi': lambda: (f'<path d="M27 1h6v6h6v6h-6v9h-6v-9h-6v-6h6Z" fill="{W}"/>'
                    f'<path d="M7 58C4 38 14 22 30 22C46 22 56 38 53 58Z" fill="{W}"/>' + socle()),
    'dame': lambda: (f'<path d="M10 38 5 15 16 28 18 8 26 26 30 5 34 26 42 8 44 28 55 15 50 38Z" fill="{W}"/>'
                     + ''.join(f'<circle cx="{x}" cy="{y}" r="3.6" fill="{W}"/>' for x, y in ((5, 13), (18, 6), (30, 3), (42, 6), (55, 13)))
                     + f'<path d="M10 37C8 47 11 54 16 59H44C49 54 52 47 50 37Z" fill="{W}"/>' + socle()),
    'tour': lambda: (f'<path d="M9 4h9v6h6V4h12v6h6V4h9v17H9Z" fill="{W}"/>'
                     f'<path d="M12 21h36l-3 38H15Z" fill="{W}"/>' + socle()),
}


def piece(nom, x, y, k=1.0, visage='', bras_avant='', bras_arriere=''):
    """La pièce posée en (x, y) à l'échelle k ; visage et bras dans les coordonnées de la pièce."""
    return (f'<g transform="translate({fmt(x)} {fmt(y)}) scale({fmt(k)})" stroke="{O}" stroke-width="{EP}" '
            f'stroke-linejoin="round" stroke-linecap="round">{bras_arriere}{CORPS[nom]()}{visage}{bras_avant}</g>')


def oeil(x, y, r=5.2, regard=(0, 0), ferme=False):
    if ferme:
        return f'<path d="M{fmt(x - r)} {fmt(y)}Q{fmt(x)} {fmt(y + r * .8)} {fmt(x + r)} {fmt(y)}" fill="none" stroke-width="2"/>'
    dx, dy = regard
    return (f'<ellipse cx="{fmt(x)}" cy="{fmt(y)}" rx="{fmt(r)}" ry="{fmt(r * 1.18)}" fill="{W}" stroke-width="1.8"/>'
            f'<circle cx="{fmt(x + dx * r * .45)}" cy="{fmt(y + dy * r * .45)}" r="{fmt(r * .55)}" fill="{O}" stroke="none"/>'
            f'<circle cx="{fmt(x + dx * r * .45 + r * .2)}" cy="{fmt(y + dy * r * .45 - r * .22)}" r="{fmt(r * .18)}" fill="{W}" stroke="none"/>')


def joues(x1, x2, y, r=3.4):
    return ''.join(f'<ellipse cx="{fmt(x)}" cy="{fmt(y)}" rx="{fmt(r)}" ry="{fmt(r * .62)}" fill="{JOUE}" stroke="none" opacity=".75"/>' for x in (x1, x2))


def bras(d, epais=6.5):
    """Un bras : un trait épais blanc cerné de noir, qui suit le chemin d."""
    return (f'<path d="{d}" fill="none" stroke="{O}" stroke-width="{fmt(epais + 2 * 1.9)}"/>'
            f'<path d="{d}" fill="none" stroke="{W}" stroke-width="{fmt(epais)}"/>')


def main(x, y, r=4.4):
    return f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r="{fmt(r)}" fill="{W}" stroke-width="1.9"/>'


# ---------- les illustrations (120 × 120) ----------
def haie(x, y, w, h, fonce=False):
    """Un bloc de haie : rectangle arrondi vert avec des touffes sur le dessus."""
    c1, c2 = ('#2E7A40', '#1F5E33') if fonce else ('#3C9450', '#1F5E33')
    s = f'<rect x="{fmt(x)}" y="{fmt(y)}" width="{fmt(w)}" height="{fmt(h)}" rx="6" fill="{c1}" stroke="{c2}" stroke-width="1.6"/>'
    n = max(2, int(w // 9))
    for i in range(n):
        cx = x + (i + .5) * w / n
        s += f'<circle cx="{fmt(cx)}" cy="{fmt(y + 2)}" r="{fmt(w / n * .62)}" fill="{c1}" stroke="{c2}" stroke-width="1.6"/>'
    s += f'<rect x="{fmt(x + 1.6)}" y="{fmt(y + 2)}" width="{fmt(w - 3.2)}" height="5" fill="{c1}"/>'
    for i in range(n):  # petits reflets
        s += f'<circle cx="{fmt(x + (i + .5) * w / n - 2)}" cy="{fmt(y + 1)}" r="1.6" fill="#6CC17E"/>'
    return s


def labyrinthe():
    s = '<rect x="4" y="66" width="112" height="50" rx="8" fill="#E8D9B0"/>'          # le sol du chemin
    s += '<path d="M44 66 52 30H68L76 66Z" fill="#DCC994"/>'                          # le chemin qui part au fond
    s += haie(6, 26, 44, 40, True) + haie(70, 26, 44, 40, True)                       # haies du fond
    s += haie(2, 52, 30, 64) + haie(88, 52, 30, 64)                                   # haies de devant
    s += '<path d="M60 12v12M60 12l7 4-7 4" fill="#F2B827" stroke="#B07C10" stroke-width="1.6" stroke-linejoin="round"/>'  # un fanion au loin
    visage = (oeil(23, 37, 4.6, (-1, -.2)) + oeil(36, 37, 4.6, (-1, -.2)) + joues(19, 41, 46)
              + '<path d="M24 48Q30 51 35 47" fill="none" stroke-width="2"/>'
              + '<path d="M18 30 27 29M32 29 40 31" fill="none" stroke-width="2"/>')
    bd = bras('M45 66C55 66 60 58 62 50') + main(62, 49)                              # il montre le chemin
    s += piece('fou', 33, 34, .82, visage, bd, bras('M15 66C9 70 8 76 10 80') + main(10, 80, 4))
    s += '<text x="98" y="22" font-family="Lexend, sans-serif" font-size="20" font-weight="700" fill="#E2622A" stroke="none">?</text>'
    return s


def mat():
    visage = (oeil(23, 37, 5, (.3, -1)) + oeil(38, 36, 5, (.3, -1)) + joues(17, 44, 47)
              + '<path d="M16 28 28 31M33 27 44 24" fill="none" stroke-width="2.2"/>'          # sourcils : l'un monte, l'autre baisse
              + '<path d="M22 50q3-3 6 0t6 0t6 0" fill="none" stroke-width="2"/>')                  # bouche hésitante
    bd = bras('M50 46C60 42 62 30 54 20') + main(53, 19, 4.6)                                    # se gratte la tête
    s = piece('roi', 26, 24, 1.0, visage, bd, bras('M9 46C3 52 4 60 9 64') + main(9, 64))
    s += '<path d="M60 12l4-3M62 18l5 0M59 7l1-4" fill="none" stroke="#5A6474" stroke-width="2" stroke-linecap="round"/>'  # ça gratte
    s += ('<text x="96" y="46" font-family="Lexend, sans-serif" font-size="34" font-weight="700" fill="#E2622A" stroke="#FFFFFF" '
          'stroke-width="1" paint-order="stroke" text-anchor="middle">?</text>'
          '<text x="16" y="24" font-family="Lexend, sans-serif" font-size="18" font-weight="700" fill="#5A6474" text-anchor="middle">?</text>')
    return s


def cases():
    # le tableau sur son chevalet, avec un petit échiquier 4 × 4
    s = ('<path d="M74 72 68 112M102 72 108 112M88 72v40" stroke="#8B5A33" stroke-width="3.5" stroke-linecap="round"/>'
         '<rect x="62" y="14" width="54" height="58" rx="4" fill="#8B5A33" stroke="#4A2E18" stroke-width="2"/>'
         '<rect x="67" y="19" width="44" height="44" fill="#ECECD7"/>')
    for i in range(4):
        for j in range(4):
            if (i + j) % 2:
                s += f'<rect x="{67 + j * 11}" y="{19 + i * 11}" width="11" height="11" fill="#739A62"/>'
    s += '<rect x="78.5" y="41.5" width="10" height="10" fill="rgba(242,184,39,.55)" stroke="#E0A526" stroke-width="2"/>'
    s += '<text x="89" y="69.5" font-family="Lexend, sans-serif" font-size="6.5" font-weight="700" fill="#FFFFFF" text-anchor="middle">e4</text>'
    lunettes = ('<g fill="none" stroke-width="2"><circle cx="23" cy="45" r="6.6"/><circle cx="38" cy="45" r="6.6"/>'
                '<path d="M29.6 44.5h1.8M16.4 44 13 42M44.6 44 48 42"/></g>')
    visage = (oeil(23, 45, 4.2, (1, -.3)) + oeil(38, 45, 4.2, (1, -.3)) + lunettes + joues(17, 44, 53, 3)
              + '<path d="M25 53Q30 57 35 53" fill="#C8323C" stroke-width="1.8"/>')
    bd = (bras('M48 50C56 48 60 44 62 40') + main(62, 40)
          + '<path d="M61 41 86 46" fill="none" stroke="#5A3A1E" stroke-width="2.6" stroke-linecap="round"/>')  # la baguette
    s += piece('dame', 4, 30, .9, visage, bd, bras('M12 52C6 58 7 66 12 70') + main(12, 70))
    return s


def notation():
    # la tour derrière la table, la feuille et le crayon
    visage = (oeil(23, 33, 4.6, (.5, 1)) + oeil(37, 33, 4.6, (.5, 1)) + joues(17, 43, 42)
              + '<path d="M18 26 28 27M32 27 42 26" fill="none" stroke-width="2"/>'
              + '<path d="M24 44Q30 47 36 44" fill="none" stroke-width="2"/>'
              + '<path d="M34 45.5c1 4 4 4 4.5 1" fill="#F27C8A" stroke-width="1.6"/>')    # bout de langue : il s'applique
    s = piece('tour', 30, 14, 1.0, visage)
    s += ('<rect x="6" y="80" width="108" height="10" rx="3" fill="#A86E40" stroke="#4A2E18" stroke-width="2"/>'
          '<path d="M16 90v24M104 90v24" stroke="#8B5A33" stroke-width="5" stroke-linecap="round"/>'
          '<path d="M44 70 92 66 96 82 46 84Z" fill="#FFFFFF" stroke="#2A2E38" stroke-width="1.6" stroke-linejoin="round"/>'
          '<path d="M51 73l30-2.4M52 78l20-1.6" stroke="#2A2E38" stroke-opacity=".3" stroke-width="1.6" stroke-linecap="round"/>')
    # les bras : l'un tient la feuille, l'autre écrit avec le crayon
    s += f'<g stroke="{O}" stroke-linejoin="round" stroke-linecap="round">'
    s += bras('M40 62C40 70 44 74 50 76') + main(50, 76)
    s += bras('M80 62C84 66 84 70 80 73')
    s += ('<path d="M74 78 88 58" stroke="#E8913A" stroke-width="5" stroke-linecap="butt"/>'
          '<path d="M88 58 90.5 54.5" stroke="#F4A3A0" stroke-width="5" stroke-linecap="butt"/>'
          '<path d="M74 78 72.5 81.5 76.5 79.6Z" fill="#2A2E38" stroke-width="1.2"/>')
    s += main(80, 72) + '</g>'
    return s


def joue():
    # Magnus Carlsen, en dessin : cheveux châtain clair coiffés sur le côté, yeux bleu-gris, barbe de quelques jours,
    # costume sombre et chemise blanche ouverte ; il lève un cavalier au-dessus de l'échiquier
    peau, peau_ombre, cheveux, cheveux_clair = '#F2C9AD', '#D9A688', '#8A6A4A', '#B08D66'
    s = ''
    # l'échiquier en perspective, en bas
    s += '<path d="M0 98H120V120H0Z" fill="#ECECD7"/>'
    for i, (y1, y2) in enumerate(((98, 108), (108, 120))):
        for j in range(8):
            if (i + j) % 2:
                x1a, x1b = j * 15, (j + 1) * 15
                s += f'<path d="M{x1a} {y1}H{x1b}L{x1b + (j - 3.5) * 1.2} {y2}H{x1a + (j - 4.5) * 1.2}Z" fill="#739A62"/>'
    # le buste : costume, chemise
    s += ('<path d="M14 98C16 82 28 74 44 72L60 80L76 72C92 74 104 82 106 98Z" fill="#283044" stroke="#11151F" stroke-width="2"/>'
          '<path d="M48 72 60 92 72 72 66 69 60 78 54 69Z" fill="#FFFFFF" stroke="#11151F" stroke-width="1.6" stroke-linejoin="round"/>'
          f'<path d="M52 60V72Q60 79 68 72V60Z" fill="{peau_ombre}"/>')
    # la tête
    tete = 'M60 18C76 18 81 30 80 44C79 56 74 64 66 68C62 70 58 70 54 68C46 64 41 56 40 44C39 30 44 18 60 18Z'
    s += (f'<ellipse cx="40.5" cy="45" rx="3.6" ry="6" fill="{peau}" stroke="#11151F" stroke-width="1.5"/>'
          f'<ellipse cx="79.5" cy="45" rx="3.6" ry="6" fill="{peau}" stroke="#11151F" stroke-width="1.5"/>'
          f'<path d="{tete}" fill="{peau}" stroke="#11151F" stroke-width="1.8"/>'
          # barbe de quelques jours (mâchoire et menton)
          f'<path d="M42 50C44 60 51 66 60 68C69 66 76 60 78 50C74 58 68 62 60 62C52 62 46 58 42 50Z" fill="#8A6A4A" opacity=".28"/>'
          # cheveux : volume sur le dessus, raie à sa droite, mèche rabattue vers sa gauche
          f'<path d="M40 40C37 24 46 12 60 12C74 11 84 20 81 38C79 30 74 25 66 24C60 23 52 26 47 22C45 28 42 32 40 40Z" fill="{cheveux}" stroke="#4E3A26" stroke-width="1.6" stroke-linejoin="round"/>'
          f'<path d="M48 18C56 14 68 14 76 22M50 22C58 19 66 19 72 24" fill="none" stroke="{cheveux_clair}" stroke-width="1.8" stroke-linecap="round"/>'
          # sourcils, yeux bleu-gris, nez, sourire en coin
          '<path d="M46 35Q51 33 55 35M65 35Q70 33 74 35" fill="none" stroke="#5E4630" stroke-width="2.2" stroke-linecap="round"/>'
          '<ellipse cx="51" cy="41" rx="3.2" ry="2.4" fill="#FFFFFF"/><ellipse cx="69" cy="41" rx="3.2" ry="2.4" fill="#FFFFFF"/>'
          '<circle cx="52" cy="41" r="1.7" fill="#5D7186"/><circle cx="70" cy="41" r="1.7" fill="#5D7186"/>'
          '<circle cx="52" cy="41" r=".8" fill="#11151F"/><circle cx="70" cy="41" r=".8" fill="#11151F"/>'
          f'<path d="M60 43C59 48 57 51 58 53C59 54 62 54 63 53" fill="none" stroke="{peau_ombre}" stroke-width="1.6" stroke-linecap="round"/>'
          '<path d="M53 58Q60 61 67 57" fill="none" stroke="#9A4E44" stroke-width="1.8" stroke-linecap="round"/>'
          '<path d="M67 57l1.5-1.5" fill="none" stroke="#9A4E44" stroke-width="1.6" stroke-linecap="round"/>')
    # le bras droit (manche du costume) et la main qui tient un cavalier blanc
    s += ('<path d="M90 80L104 90L100 70" fill="none" stroke="#11151F" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>'
          '<path d="M90 80L104 90L100 70" fill="none" stroke="#283044" stroke-width="11.5" stroke-linecap="round" stroke-linejoin="round"/>'
          '<path d="M96 70.5h8" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>')
    s += piece('cavalier_mini', 0, 0) if False else ''
    s += ('<g transform="translate(83 22) scale(.62)" stroke="#1A1E27" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">'
          '<path d="M14 56C14 44 18 38 26 32C20 32 15 34 10 36C3 38 0 32 3 27L18 9C20 5 22 1 25-2L28-6L32 2C46 5 52 18 51 34C51 42 49 50 48 56Z" fill="#FFFFFF"/>'
          '<circle cx="20" cy="15" r="2.6" fill="#1A1E27" stroke="none"/>'
          '<rect x="9" y="55" width="44" height="8" rx="4" fill="#FFFFFF"/></g>')
    s += (f'<path d="M93 70C91 64 92 59 96 57L104 56C108 56 109 60 106 62L101 63C105 63 106 67 102 68L97 70C95 71 93 71 93 70Z" '
          f'fill="{peau}" stroke="#11151F" stroke-width="1.6" stroke-linejoin="round"/>'
          '<path d="M97 60l7-.6M97 64l6-.4" stroke="#11151F" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>')
    return s


ILLUSTRATIONS = {'labyrinthe': labyrinthe, 'mat': mat, 'cases': cases, 'notation': notation, 'joue': joue}


def svg(nom, classe='illustration'):
    return f'<svg viewBox="0 0 120 120" class="{classe}" aria-hidden="true">{ILLUSTRATIONS[nom]()}</svg>'


if __name__ == '__main__':
    if len(sys.argv) > 2 and sys.argv[1] == 'apercu':
        page = '<!doctype html><meta charset="utf-8"><body style="margin:0;padding:20px;background:#E8EBF0;font-family:sans-serif">'
        for n in ILLUSTRATIONS:
            page += (f'<div style="display:inline-flex;gap:16px;align-items:end;margin:0 24px 24px 0">'
                     f'<div style="width:300px;height:300px;background:#E8EBF0;border-radius:40px;outline:1px solid #ccc">{svg(n)}</div>'
                     f'<div style="width:120px;height:120px;background:#E8EBF0;border-radius:24px">{svg(n)}</div>'
                     f'<div style="width:56px;height:56px;background:#E8EBF0;border-radius:14px">{svg(n)}</div></div>')
        open(sys.argv[2], 'w').write(page + '</body>')
    else:
        f = 'index.html'
        s = open(f).read()
        for nom in ILLUSTRATIONS:
            motif = re.compile(r'(<a class="carte-jeu" href="jeux/%s/index.html">\s*<span class="icone-jeu[^"]*">)<svg .*?</svg>' % {'mat': 'mat', 'cases': 'cases', 'notation': 'notation', 'joue': 'joue', 'labyrinthe': 'labyrinthe'}[nom], re.S)
            s, n = motif.subn(lambda m: m.group(1) + svg(nom), s)
            assert n == 1, nom
        open(f, 'w').write(s)
        print('illustrations mises à jour dans index.html')
