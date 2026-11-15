"""« Mat en un » : cherche, dans un mois de la base des retransmissions Lichess (https://database.lichess.org/#broadcasts,
domaine public), les coups où un grand maître laisse un mat en un coup.
Une ligne JSON par coup trouvé : la position avant et après le coup, les mats possibles, le coup joué ensuite dans la
partie, l'évaluation Lichess d'avant le coup, et si le joueur avait un coup qui évitait le mat.
usage : pip install chess==1.10.0 zstandard
        python3 outils/mats-en-un-recherche.py lichess_db_broadcast_2026-10.pgn.zst 2026-10.jsonl
puis : python3 outils/mats-en-un.py <dossier des .jsonl>"""
import sys, io, re, json
import zstandard, chess, chess.pgn

src, out = sys.argv[1], sys.argv[2]
r = zstandard.ZstdDecompressor().stream_reader(open(src, 'rb'))
t = io.TextIOWrapper(r, encoding='utf-8', errors='replace')
EVAL = re.compile(r'\[%eval ([^\]]+)\]')
TAG = re.compile(r'^\[(\w+) "(.*)"\]\s*$')


def ev(c):
    m = EVAL.search(c or '')
    if not m: return None
    s = m.group(1).strip()
    if s.startswith('#'): return 'M' + s[1:]
    try: return float(s)
    except ValueError: return None


def interessant(h):
    if h.get('Variant', 'Standard') != 'Standard' or 'FEN' in h or 'SetUp' in h: return False
    return h.get('WhiteTitle') == 'GM' or h.get('BlackTitle') == 'GM'


def mats(b):
    res = []
    for m in b.legal_moves:
        if not b.gives_check(m): continue
        b.push(m)
        if b.is_checkmate(): res.append(m)
        b.pop()
    return res


def traiter(h, texte, f):
    g = chess.pgn.read_game(io.StringIO(texte))
    if g is None: return
    b = g.board()
    noeuds = list(g.mainline())
    prec = None  # éval avant le coup
    for i, nd in enumerate(noeuds):
        avant = b.fen()
        coup = nd.move
        if coup not in b.legal_moves: return
        joueur = b.turn
        gm = h.get('WhiteTitle' if joueur == chess.WHITE else 'BlackTitle') == 'GM'
        # le joueur avait-il un coup qui ne laissait pas de mat en 1 ?
        b.push(coup)
        if gm and not b.is_game_over():
            m = mats(b)
            if m:
                suivant = noeuds[i + 1].move.uci() if i + 1 < len(noeuds) else None
                # coups pour le joueur qui évitaient le mat
                b.pop()
                evite = 0
                for c2 in b.legal_moves:
                    b.push(c2)
                    ok = b.is_checkmate() or not mats(b)
                    b.pop()
                    if ok: evite = 1; break
                b.push(coup)
                f.write(json.dumps({
                    'h': {k: h.get(k, '') for k in ('Event', 'Date', 'Round', 'White', 'Black', 'WhiteElo', 'BlackElo', 'WhiteTitle', 'BlackTitle', 'TimeControl', 'Result', 'BroadcastName', 'GameURL', 'WhiteFideId', 'BlackFideId')},
                    'avant': avant, 'coup': coup.uci(), 'san': None, 'apres': b.fen(), 'mats': [x.uci() for x in m],
                    'suivant': suivant, 'ply': i, 'eval_avant': prec, 'eval_apres': ev(nd.comment), 'evite': evite,
                    'joueur': 'w' if joueur else 'b', 'nb_coups': len(noeuds),
                    'coups': [x.move.uci() for x in noeuds[:i + 1]],
                }) + '\n')
        prec = ev(nd.comment)


n = gardes = 0
with open(out, 'w') as f:
    h, lignes, dans_coups = {}, [], False
    for ligne in t:
        m = TAG.match(ligne)
        if m and dans_coups:
            # nouvelle partie
            if interessant(h):
                gardes += 1
                try: traiter(h, ''.join(lignes), f)
                except Exception as e: print('erreur', e, file=sys.stderr)
            n += 1
            h, lignes, dans_coups = {}, [], False
        if m and not dans_coups:
            h[m.group(1)] = m.group(2)
            continue
        if ligne.strip():
            dans_coups = True
        lignes.append(ligne)
    if h and interessant(h):
        gardes += 1
        traiter(h, ''.join(lignes), f)
print(src, 'parties', n, 'gardées', gardes, file=sys.stderr)
