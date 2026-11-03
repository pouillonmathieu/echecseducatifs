# Photos des champions pour « Joue le coup » (Wikimedia Commons, licences libres vérifiées une par une).
#   python3 outils/photos-champions.py <dossier des photos (source relative à ce dossier)>
# outils/photos-champions.json : { "<cle>": { "source": "<fichier recadré>"  (Commons, Openverse/Flickr, Library of Congress), "titre", "auteur", "licence", "url" } }
# Copie chaque photo (200 px, JPEG) dans jeux/joue/photos/<cle>.jpg et écrit jeux/joue/photos.js (crédits compris).
# Un champion sans photo garde son portrait dessiné.
import json, os, sys
from PIL import Image

RACINE = os.path.normpath(os.path.join(os.path.dirname(__file__), '..'))
LIBRES = ('public domain', 'domaine public', 'cc0', 'cc by', 'cc-by', 'cc by-sa', 'cc-by-sa')
choix = json.load(open(os.path.join(RACINE, 'outils', 'photos-champions.json'), encoding='utf-8'))
dossier = sys.argv[1] if len(sys.argv) > 1 else None
sortie = os.path.join(RACINE, 'jeux', 'joue', 'photos')
os.makedirs(sortie, exist_ok=True)
photos = {}
for cle, c in sorted(choix.items()):
    if not c['licence'].lower().startswith(LIBRES):
        raise SystemExit('%s : licence non libre (%s)' % (cle, c['licence']))
    cible = os.path.join(sortie, cle + '.jpg')
    if dossier and os.path.exists(os.path.join(dossier, c['source'])):
        Image.open(os.path.join(dossier, c['source'])).convert('RGB').resize((200, 200), Image.LANCZOS).save(cible, quality=82, optimize=True)
    if not os.path.exists(cible):
        raise SystemExit('%s : photo introuvable' % cle)
    photos[cle] = {k: c[k] for k in ('titre', 'auteur', 'licence', 'url')}
open(os.path.join(RACINE, 'jeux', 'joue', 'photos.js'), 'w', encoding='utf-8').write(
    '/* Généré par outils/photos-champions.py — photos de Wikimedia Commons (licences libres) et leurs crédits. */\n'
    'window.PHOTOS_CHAMPIONS = ' + json.dumps(photos, ensure_ascii=False, indent=1) + ';\n')
print(len(photos), 'photo(s)')
