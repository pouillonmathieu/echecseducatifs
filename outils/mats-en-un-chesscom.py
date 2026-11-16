"""« Mat en un » : cherche, dans les parties en ligne des meilleurs grands maîtres sur Chess.com (API publique,
https://api.chess.com), les coups où l'un d'eux laisse un mat en un coup.

Les joueurs : les grands maîtres des classements blitz et rapide de Chess.com (avec leur vrai nom). Leurs parties de
blitz et de rapide comptées pour le classement, des derniers mois. L'adversaire doit avoir un vrai nom dans son profil
(sinon la partie n'est pas gardée). Une ligne JSON par coup trouvé, au même format que outils/mats-en-un-recherche.py
(les noms sont les vrais noms, le tournoi est « Titled Tuesday », « Titled Arena » ou « Chess.com »).

usage : python3 outils/mats-en-un-chesscom.py <dossier de sortie> [nombre de mois, 12 par défaut] [mois récents à sauter, 0]
        (par exemple « out2 12 12 » : les 12 mois d'avant les 12 derniers)
puis : python3 outils/mats-en-un.py <dossier Lichess> <dossier Chess.com>"""
import sys, os, io, re, json, time, urllib.request, urllib.error
import chess, chess.pgn

UA = 'EchecsEducatifsBot/1.0 (https://pouillonmathieu.github.io/echecseducatifs/)'
dossier = sys.argv[1]
NB_MOIS = int(sys.argv[2]) if len(sys.argv) > 2 else 12
SAUTER = int(sys.argv[3]) if len(sys.argv) > 3 else 0
os.makedirs(dossier, exist_ok=True)


def lire(url, essais=5):
    for k in range(essais):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            time.sleep(5 * (k + 1))  # 429 : on attend
        except Exception:
            time.sleep(5 * (k + 1))
    return None


profils = {}
def profil(u):
    u = u.lower()
    if u not in profils:
        p = lire(f'https://api.chess.com/pub/player/{u}') or {}
        profils[u] = {'nom': (p.get('name') or '').strip(), 'titre': p.get('title', '')}
    return profils[u]


def mats(b):
    res = []
    for m in b.legal_moves:
        if not b.gives_check(m): continue
        b.push(m)
        if b.is_checkmate(): res.append(m)
        b.pop()
    return res


def evenement(g):
    t = (g.get('tournament') or '') + ' ' + (g.get('match') or '')
    if 'titled-tuesday' in t: return 'Titled Tuesday'
    if 'titled-arena' in t: return 'Titled Arena'
    return 'Chess.com'


CLK = re.compile(r'\[%clk ([0-9:.]+)\]')
def secondes(c):
    m = CLK.search(c or '')
    if not m: return None
    s = 0.0
    for x in m.group(1).split(':'): s = s * 60 + float(x)
    return s


def chercher(g, joueur, sortie):
    pgn = chess.pgn.read_game(io.StringIO(g['pgn']))
    if pgn is None: return 0
    couleur_gm = chess.WHITE if g['white']['username'].lower() == joueur.lower() else chess.BLACK
    b = pgn.board()
    noeuds = list(pgn.mainline())
    n = 0
    for i, nd in enumerate(noeuds):
        avant = b.fen()
        coup = nd.move
        if coup not in b.legal_moves: return n
        tour = b.turn
        b.push(coup)
        if tour != couleur_gm or b.is_game_over(): continue
        m = mats(b)
        if not m: continue
        b.pop()
        evite = 0
        for c2 in b.legal_moves:
            b.push(c2)
            ok = b.is_checkmate() or not mats(b)
            b.pop()
            if ok: evite = 1; break
        b.push(coup)
        if not evite: continue
        adv = g['black' if couleur_gm == chess.WHITE else 'white']['username']
        pa = profil(adv)
        if not pa['nom'] or ' ' not in pa['nom']: continue  # un vrai nom, pas un pseudo
        pj = profil(joueur)
        noms = {couleur_gm: (pj['nom'], pj['titre'] or 'GM'), (not couleur_gm): (pa['nom'], pa['titre'])}
        h = {
            'Event': evenement(g), 'BroadcastName': evenement(g),
            'Date': time.strftime('%Y.%m.%d', time.gmtime(g.get('end_time', 0))),
            'Round': '', 'White': noms[chess.WHITE][0], 'Black': noms[chess.BLACK][0],
            'WhiteElo': '', 'BlackElo': '',  # classements en ligne : pas des Elo FIDE
            'WhiteTitle': noms[chess.WHITE][1], 'BlackTitle': noms[chess.BLACK][1],
            'TimeControl': g.get('time_control', ''), 'Result': pgn.headers.get('Result', '*'),
            'GameURL': g.get('url', ''), 'WhiteFideId': '', 'BlackFideId': '',
            'Source': 'chess.com', 'TimeClass': g.get('time_class', ''),
        }
        sortie.write(json.dumps({
            'h': h, 'avant': avant, 'coup': coup.uci(), 'san': None, 'apres': b.fen(), 'mats': [x.uci() for x in m],
            'suivant': noeuds[i + 1].move.uci() if i + 1 < len(noeuds) else None, 'ply': i,
            'eval_avant': None, 'eval_apres': None, 'evite': evite, 'joueur': 'w' if couleur_gm else 'b',
            'nb_coups': len(noeuds), 'coups': [x.move.uci() for x in noeuds[:i + 1]],
            'horloge': secondes(nd.comment),
        }) + '\n')
        sortie.flush()
        n += 1
    return n


def main():
    lb = lire('https://api.chess.com/pub/leaderboards')
    joueurs = []
    for cat in ('live_blitz', 'live_rapid'):
        for x in lb.get(cat, []):
            if x.get('title') == 'GM' and x.get('name') and x['username'] not in joueurs:
                joueurs.append(x['username'])
                profils[x['username'].lower()] = {'nom': x['name'].strip(), 'titre': 'GM'}
    print(len(joueurs), 'grands maîtres', file=sys.stderr)
    for j in joueurs:
        fin = os.path.join(dossier, j.lower() + '.jsonl')
        if os.path.exists(fin + '.ok'): continue
        arch = (lire(f'https://api.chess.com/pub/player/{j.lower()}/games/archives') or {}).get('archives', [])
        total = trouves = 0
        with open(fin, 'w') as f:
            for url in (arch[-NB_MOIS - SAUTER:-SAUTER] if SAUTER else arch[-NB_MOIS:]):
                mois = lire(url) or {}
                for g in mois.get('games', []):
                    if g.get('rules') != 'chess' or not g.get('rated') or g.get('time_class') not in ('blitz', 'rapid'): continue
                    if 'initial_setup' in g and g['initial_setup'] not in ('', chess.STARTING_FEN): continue
                    total += 1
                    try: trouves += chercher(g, j, f)
                    except Exception as e: print('erreur', j, e, file=sys.stderr)
        open(fin + '.ok', 'w').close()
        print(j, total, 'parties', trouves, 'gaffes', file=sys.stderr, flush=True)


main()
