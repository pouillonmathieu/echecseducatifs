# Génère les pages anglaises (dossier en/) à partir des pages françaises et du dictionnaire pages.json.
#   python3 outils/anglais/generer.py
# - les textes (entre les balises et dans title, aria-label, alt, placeholder, content) sont traduits ;
#   pages.json : { "commun": { "texte français": "English text" }, "<page>": { … } } (la page l'emporte sur commun)
# - les chemins des fichiers (css, js, images) pointent vers les fichiers du site français : rien n'est copié ;
# - le bouton « EN » devient « FR » et renvoie vers la page française ;
# - le code des jeux choisit lui-même sa langue avec document.documentElement.lang.
# Un texte qui semble français et qui n'a pas de traduction est signalé (et la génération échoue).
import json, os, re, sys

RACINE = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..'))
PAGES = ['index.html'] + sorted('jeux/%s/index.html' % d for d in os.listdir(os.path.join(RACINE, 'jeux'))
                                if os.path.exists(os.path.join(RACINE, 'jeux', d, 'index.html')))
DICO = json.load(open(os.path.join(os.path.dirname(__file__), 'pages.json'), encoding='utf-8'))
# pages déjà traduites (celles qui ont le bouton « EN ») ; les autres ne sont pas générées
TRADUITES = [p for p in PAGES if 'bouton-langue' in open(os.path.join(RACINE, p), encoding='utf-8').read()]
IDENTIQUES = set(DICO.get('identiques', []))  # textes qui s'écrivent pareil en anglais

MASQUE = re.compile(r'<script\b.*?</script>|<style\b.*?</style>|<!--.*?-->', re.S)
TEXTE = re.compile(r'>([^<]*[A-Za-zÀ-ÿ][^<]*)<')
ATTR = re.compile(r'\b(title|aria-label|alt|placeholder|content|data-titre|data-texte)="([^"]*[A-Za-zÀ-ÿ][^"]*)"')
RESSOURCE = re.compile(r'<(link|script|img|image|source)\b[^>]*>')
CHEMIN = re.compile(r'\b(src|href)="([^"#][^"]*)"')
FRANCAIS = re.compile(r"[àâçéèêëîïôûùüœ]|\b(le|la|les|des|du|une|un|et|ou|pour|avec|sur|dans|est|pas|ton|ta|tes)\b", re.I)


def norm(s):
    return re.sub(r'\s+', ' ', s).strip()


def traduire_page(page):
    html = open(os.path.join(RACINE, page), encoding='utf-8').read()
    dico = dict(DICO.get('commun', {}))
    dico.update(DICO.get(page, {}))
    manquants = []

    def tr(t, garder_espaces):
        n = norm(t)
        if n in dico:
            en = dico[n]
        else:
            # tout texte doit être traduit, sauf la notation (e4, Cf3…), les nombres et les textes identiques
            if not re.fullmatch(r'[a-h1-8 .+#=x<>&;gtl!?–-]*|[A-Z]?[a-h]?[1-8]?x?[a-h][1-8][+#]?|[\d\s:/.,%×+-]*', n) and n not in IDENTIQUES:
                manquants.append(n)
            return t
        if not garder_espaces:
            return en
        debut = re.match(r'\s*', t).group(0)
        fin = re.search(r'\s*$', t).group(0)
        return debut + en + fin

    masque = MASQUE.sub(lambda m: ' ' * len(m.group(0)), html)
    morceaux = []  # (début, fin, remplacement)
    for m in TEXTE.finditer(masque):
        morceaux.append((m.start(1), m.end(1), tr(html[m.start(1):m.end(1)], True)))
    for m in ATTR.finditer(masque):
        val = html[m.start(2):m.end(2)]
        if m.group(1) == 'content' and ('=' in val or not FRANCAIS.search(val)):
            continue
        morceaux.append((m.start(2), m.end(2), tr(val, False)))
    for a, b, r in sorted(morceaux, reverse=True):
        html = html[:a] + r + html[b:]

    # chemins des fichiers : depuis en/<page>, vers les fichiers du site français
    dossier_fr = os.path.dirname(page)
    dossier_en = os.path.join('en', dossier_fr)

    def chemin(m):
        att, val = m.group(1), m.group(2)
        if re.match(r'[a-z]+:|//', val):
            return m.group(0)
        partie, _, requete = val.partition('?')
        cible = os.path.normpath(os.path.join(dossier_fr, partie))
        nouveau = os.path.relpath(cible, dossier_en).replace(os.sep, '/')
        return '%s="%s%s"' % (att, nouveau, '?' + requete if requete else '')

    html = RESSOURCE.sub(lambda m: CHEMIN.sub(chemin, m.group(0)), html)
    # liens vers les jeux pas encore traduits : vers la page française
    def lien(m):
        val = m.group(1)
        cible = os.path.normpath(os.path.join(dossier_fr, val))
        if val.endswith('.html') and not re.match(r'[a-z]+:', val) and cible not in TRADUITES:
            return 'href="%s"' % os.path.relpath(cible, dossier_en).replace(os.sep, '/')
        return m.group(0)
    html = re.sub(r'(?<=<a )class="carte-jeu" href="([^"]+)"', lambda m: 'class="carte-jeu" ' + lien(m), html)
    html = html.replace('<html lang="fr">', '<html lang="en">', 1)
    # bouton de langue : retour vers la page française
    retour = os.path.relpath(page, dossier_en).replace(os.sep, '/')
    html, n = re.subn(r'<a class="bouton-icone bouton-langue"[^>]*>EN</a>',
                      '<a class="bouton-icone bouton-langue" href="%s" hreflang="fr" lang="fr" aria-label="Version française" '
                      'title="Français" data-hors-artifact>FR</a>' % retour, html)
    if n != 1:
        manquants.append('(bouton de langue introuvable)')
    entete = '<!-- Généré par outils/anglais/generer.py depuis %s : ne pas modifier à la main. -->\n' % page
    html = html.replace('<html lang="en">', entete + '<html lang="en">', 1) if html.startswith('<!doctype html>\n') is False else \
        html.replace('<!doctype html>\n', '<!doctype html>\n' + entete, 1)
    return html, manquants


def main():
    erreurs = 0
    seulement = sys.argv[1:]
    for page in PAGES:
        if (seulement and page not in seulement) or page not in TRADUITES:
            continue
        html, manquants = traduire_page(page)
        if manquants:
            erreurs += len(manquants)
            print('%s : %d texte(s) sans traduction' % (page, len(manquants)))
            for t in dict.fromkeys(manquants):
                print('   ', json.dumps(t, ensure_ascii=False))
        sortie = os.path.join(RACINE, 'en', page)
        os.makedirs(os.path.dirname(sortie), exist_ok=True)
        open(sortie, 'w', encoding='utf-8').write(html)
    print('pages générées' if not erreurs else '%d texte(s) à traduire' % erreurs)
    sys.exit(1 if erreurs else 0)


if __name__ == '__main__':
    main()
