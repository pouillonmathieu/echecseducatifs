"""Génère jeux/mat1/problemes.js pour le jeu « Mat en un ».

Les problèmes viennent de vraies parties de grands maîtres (base des retransmissions Lichess, domaine public, et
parties en ligne des meilleurs grands maîtres sur Chess.com) : un grand maître joue un coup qui laisse un mat en un
coup. L'échiquier montre ce coup, le joueur doit trouver le mat.

1. outils/mats-en-un-recherche.py trouve ces coups, mois par mois (un fichier .jsonl par mois), et
   outils/mats-en-un-chesscom.py dans les parties Chess.com (un fichier .jsonl par joueur) ;
2. ce script garde les vraies gaffes : le grand maître avait un coup qui évitait le mat, et sa position n'était pas
   déjà perdue (évaluation Lichess, ou Stockfish quand elle manque) ; il écrit la sélection dans
   outils/mats-en-un.json, puis les problèmes avec, pour chaque coup possible du joueur, pourquoi ce n'est pas mat
   (pas d'échec, le roi s'enfuit, on prend la pièce, on bloque l'échec, pat), et l'explication de chaque mat.

usage : python3 outils/mats-en-un.py [dossiers des .jsonl : Lichess, Chess.com]   (sans dossier : repart de outils/mats-en-un.json)
        (pip install chess==1.10.0 ; Stockfish dans /usr/games/stockfish ou $STOCKFISH)"""
import sys, os, re, json, glob, random
import chess, chess.engine

ICI = os.path.dirname(os.path.abspath(__file__))
SELECTION = os.path.join(ICI, 'mats-en-un.json')
SORTIE = os.path.join(ICI, '..', 'jeux', 'mat1', 'problemes.js')
MAX = {'lichess': int(os.environ.get('MAX_LICHESS', 200)), 'chess.com': int(os.environ.get('MAX_CHESSCOM', 100))}  # par source
PAR_JOUEUR = int(os.environ.get('PAR_JOUEUR', 3))  # au plus tant de problèmes par joueur qui gaffe

# ---------------------------------------------------------------- sélection
def cadence(h):
    nom = (h.get('Event', '') + ' ' + h.get('BroadcastName', '')).lower()
    if 'armageddon' in nom or 'casual' in nom: return None  # pas d'armageddon ni de parties amicales en ligne
    if re.search(r'blitz|bullet|speed chess', nom): return 'blitz'
    if re.search(r'rapid|rápid|rapide|schnell|rapido', nom): return 'rapide'
    tc_class = h.get('TimeClass')  # Chess.com donne la cadence
    if tc_class: return {'blitz': 'blitz', 'rapid': 'rapide'}.get(tc_class)
    tc = re.sub(r'^\s*\d+\s*/', '', h.get('TimeControl', '') or '')
    m = re.search(r'(\d+)', tc)
    if not m: return 'classique' if re.search(r'classic|olympiad|olympiade|championship|bundesliga|league|liga', nom) else None
    n = int(m.group(1))
    minutes = n / 60 if n >= 300 or n in (180, 240) else n  # 180+2 : des secondes ; 90+30 : des minutes
    if minutes <= 10: return 'blitz'
    if minutes <= 60: return 'rapide'
    return 'classique'


def annee(h):
    for k in ('Date', 'UTCDate'):
        a = (h.get(k) or '')[:4]
        if a.isdigit(): return a
    return ''


def pov(e, blanc):
    """éval Lichess (du point de vue des Blancs) -> du point de vue du joueur ; un mat vaut ±100"""
    if e is None: return None
    if isinstance(e, str):
        n = int(e[1:])
        v = 100 if n > 0 else -100
    else:
        v = e
    return v if blanc else -v


def stockfish():
    chemin = os.environ.get('STOCKFISH', '/usr/games/stockfish')
    return chess.engine.SimpleEngine.popen_uci(chemin)


def evaluer(moteur, fen, blanc):
    info = moteur.analyse(chess.Board(fen), chess.engine.Limit(depth=16))
    s = info['score'].pov(chess.WHITE if blanc else chess.BLACK)
    return -100 if s.is_mate() and s.mate() < 0 else 100 if s.is_mate() else s.score() / 100


NOM_PROPRE = re.compile(r"^[A-Za-zÀ-ÖØ-öø-ɏḀ-ỿ][A-Za-zÀ-ÖØ-öø-ɏḀ-ỿ .,'’()-]*$")


def choisir(dossiers):
    vus, candidats = set(), []
    lignes = []
    for dossier in dossiers:
        for f in sorted(glob.glob(os.path.join(dossier, '*.jsonl'))):
            lignes += [json.loads(l) for l in open(f)]
    # d'abord les filtres rapides
    for d in lignes:
        h = d['h']
        blanc = d['joueur'] == 'w'
        titre_gaffeur = h['WhiteTitle'] if blanc else h['BlackTitle']
        if titre_gaffeur != 'GM' or not d['evite']: continue
        # de vrais noms (pas des pseudos de sites en ligne)
        if any(' ' not in n.strip() and ',' not in n for n in (h['White'], h['Black'])): continue
        # en lettres latines, sans chiffres ni pseudo (« Instagram Id… »)
        if any(not NOM_PROPRE.match(n.strip()) or re.search(r'instagram|youtube|twitch|\bid\b', n, re.I) for n in (h['White'], h['Black'])): continue
        cad = cadence(h)
        if cad is None: continue
        # en ligne : pas les gaffes des toutes dernières secondes (coups joués d'avance)
        if h.get('Source') == 'chess.com' and (d.get('horloge') or 0) < 5: continue
        cle = ' '.join(d['apres'].split()[:4])
        if cle in vus: continue
        vus.add(cle)
        d['cadence'] = cad
        candidats.append(d)
    # priorité : blitz et rapide d'abord, les parties récentes ; au plus PAR_JOUEUR problèmes par joueur qui gaffe.
    # Stockfish n'évalue que les positions nécessaires : une gaffe compte si la position n'était pas déjà perdue.
    random.seed(7)
    random.shuffle(candidats)
    candidats.sort(key=lambda d: (d['cadence'] == 'classique', -int(annee(d['h']) or 0)))
    moteur = stockfish()
    moteur.configure({'Threads': os.cpu_count() or 1, 'Hash': 128})
    par_joueur, par_source, garde, perdues = {}, {}, [], 0
    for d in candidats:
        blanc = d['joueur'] == 'w'
        g = d['h']['White'] if blanc else d['h']['Black']
        src = d['h'].get('Source', 'lichess')
        if par_joueur.get(g, 0) >= PAR_JOUEUR or par_source.get(src, 0) >= MAX[src]: continue
        v = pov(d['eval_avant'], blanc)
        if v is None:
            v = evaluer(moteur, d['avant'], blanc)
            d['eval_sf'] = v
        if v < -4:  # déjà perdu : pas une vraie gaffe
            perdues += 1
            continue
        d['eval'] = v
        par_joueur[g] = par_joueur.get(g, 0) + 1
        par_source[src] = par_source.get(src, 0) + 1
        garde.append(d)
    moteur.quit()
    print(len(lignes), 'coups trouvés,', len(candidats), 'candidats,', perdues, 'positions déjà perdues écartées,',
          len(garde), 'gardées', par_source, file=sys.stderr)
    return garde

# ---------------------------------------------------------------- textes
NOMS = {chess.PAWN: ('pion', 'pawn', 'm'), chess.KNIGHT: ('cavalier', 'knight', 'm'), chess.BISHOP: ('fou', 'bishop', 'm'),
        chess.ROOK: ('tour', 'rook', 'f'), chess.QUEEN: ('dame', 'queen', 'f'), chess.KING: ('roi', 'king', 'm')}


def la(p, en=False, couleur=True):
    """« la dame blanche », « le cavalier noir » ; en anglais « the white queen »"""
    fr, eng, g = NOMS[p.piece_type]
    if en: return f"the {'white' if p.color else 'black'} {eng}" if couleur else f'the {eng}'
    c = ('blanche' if g == 'f' else 'blanc') if p.color else ('noire' if g == 'f' else 'noir')
    return f"{'la' if g == 'f' else 'le'} {fr} {c}" if couleur else f"{'la' if g == 'f' else 'le'} {fr}"


def nom_case(s): return chess.square_name(s)


def liste(mots, en=False):
    if len(mots) <= 1: return ''.join(mots)
    return ', '.join(mots[:-1]) + (' and ' if en else ' et ') + mots[-1]


def fuite(b, roi, voisines, occupees, en):
    """« Et le roi ne peut pas s'enfuir : la dame blanche surveille f8 et g7, ses propres pièces bloquent f7. »"""
    if occupees and len(occupees) == len(voisines):
        return "And the king is boxed in by its own pieces!" if en else "Et le roi est enfermé par ses propres pièces !"
    sans_roi = b.copy()
    sans_roi.remove_piece_at(roi)  # une case derrière le roi, sur la ligne de l'échec, est aussi surveillée
    att = b.checkers()
    a_couvrir = [s for s in voisines if s not in occupees and s not in att]  # la case de l'attaquant est déjà expliquée
    qui = {s: set(sans_roi.attackers(not b.turn, s)) for s in a_couvrir}
    groupes = []
    while a_couvrir:
        # la pièce qui surveille le plus de cases restantes
        meilleure = max({x for s in a_couvrir for x in qui[s]}, key=lambda x: (sum(x in qui[s] for s in a_couvrir), b.piece_at(x).piece_type))
        cases = [s for s in a_couvrir if meilleure in qui[s]]
        groupes.append((meilleure, cases))
        a_couvrir = [s for s in a_couvrir if s not in cases]
    def noms(cases): return liste([nom_case(s) for s in sorted(cases)], en)
    def qui_(x):
        p = b.piece_at(x)
        nom = la(p, en)
        # deux pièces pareilles : on dit laquelle
        if len(b.pieces(p.piece_type, p.color)) > 1: nom += (' on ' if en else ' en ') + nom_case(x)
        return nom
    if en:
        morceaux = [f"{qui_(x)} covers {noms(c)}" for x, c in groupes]
        if occupees: morceaux.append(f"its own pieces block {noms(occupees)}")
        return "And the king can't run away: " + liste(morceaux, True) + "."
    morceaux = [f"{qui_(x)} surveille {noms(c)}" for x, c in groupes]
    if occupees: morceaux.append(f"ses propres pièces bloquent {noms(occupees)}")
    return "Et le roi ne peut pas s'enfuir : " + liste(morceaux) + "."


def explication_mat(b0, mv):
    """explication d'un coup qui fait mat (fr, en) et son motif"""
    b = b0.copy()
    piece = b.piece_at(mv.from_square)
    roque, ep = b.is_castling(mv), b.is_en_passant(mv)
    b.push(mv)
    roi = b.king(b.turn)
    att = list(b.checkers())
    cote_fr = 'noir' if b.turn == chess.BLACK else 'blanc'
    cote_en = 'black' if b.turn == chess.BLACK else 'white'
    fr, en = [], []
    motif = None
    voisines = [s for s in chess.SquareSet(chess.BB_KING_ATTACKS[roi])]
    occupees = [s for s in voisines if b.piece_at(s) and b.piece_at(s).color == b.turn]
    # qui donne échec
    if len(att) == 2:
        a, c = att
        fr.append(f"Échec double : {la(b.piece_at(a))} en {nom_case(a)} et {la(b.piece_at(c))} en {nom_case(c)} attaquent le roi {cote_fr} en même temps.")
        en.append(f"Double check: {la(b.piece_at(a), True)} on {nom_case(a)} and {la(b.piece_at(c), True)} on {nom_case(c)} both attack the {cote_en} king.")
        fr.append("Contre un échec double, seul le roi peut se sauver en bougeant.")
        en.append("Against a double check, only a king move can help.")
        fr.append(fuite(b, roi, voisines, occupees, False))
        en.append(fuite(b, roi, voisines, occupees, True))
        motif = ('Échec double', 'Double check')
    else:
        a = att[0]
        pa = b.piece_at(a)
        fem = NOMS[pa.piece_type][2] == 'f'
        le, il, e_ = ('la', 'elle', 'e') if fem else ('le', 'il', '')
        if a != mv.to_square and not roque:
            fr.append(f"En bougeant, {la(piece, couleur=False)} ouvre la route à {la(pa)} : échec à la découverte depuis {nom_case(a)} !")
            en.append(f"By moving, {la(piece, True, False)} opens the line for {la(pa, True)}: discovered check from {nom_case(a)}!")
            motif = ('Échec à la découverte', 'Discovered check')
        elif roque:
            fr.append(f"En roquant, la tour arrive en {nom_case(a)} et donne échec au roi {cote_fr} !")
            en.append(f"By castling, the rook lands on {nom_case(a)} and checks the {cote_en} king!")
            motif = ('Mat en roquant', 'Mate by castling')
        elif mv.promotion:
            fr.append(f"Le pion avance en {nom_case(a)} et devient {'une' if NOMS[mv.promotion][2] == 'f' else 'un'} {NOMS[mv.promotion][0]} qui donne échec !")
            en.append(f"The pawn moves to {nom_case(a)} and becomes a {NOMS[mv.promotion][1]} that gives check!")
            motif = ('Promotion', 'Promotion')
        elif ep:
            fr.append(f"Prise en passant : le pion arrive en {nom_case(a)} et donne échec !")
            en.append(f"En passant capture: the pawn lands on {nom_case(a)} and gives check!")
            motif = ('Prise en passant', 'En passant')
        else:
            fr.append(f"{la(pa)[0].upper() + la(pa)[1:]} en {nom_case(a)} donne échec au roi {cote_fr}.")
            en.append(f"{la(pa, True)[0].upper() + la(pa, True)[1:]} on {nom_case(a)} checks the {cote_en} king.")
        # peut-on prendre la pièce qui donne échec ?
        defenseurs = [s for s in b.attackers(b.turn, a)]
        if not defenseurs:
            fr.append(f"Aucune pièce {'noire' if b.turn == chess.BLACK else 'blanche'} ne peut {le} prendre.")
            en.append(f"No {cote_en} piece can take it.")
        else:
            roi_seul = defenseurs == [roi]
            protege = [s for s in b.attackers(not b.turn, a)]
            if roi_seul and protege:
                p2 = protege[0]
                fr.append(f"Le roi ne peut pas {le} prendre : {il} est protégé{e_} par {la(b.piece_at(p2), couleur=False)} en {nom_case(p2)}.")
                en.append(f"The king can't take it: it is protected by {la(b.piece_at(p2), True, False)} on {nom_case(p2)}.")
            else:
                cloues = [s for s in defenseurs if s != roi and b.is_pinned(b.turn, s)]
                if cloues:
                    s = cloues[0]
                    f2 = NOMS[b.piece_at(s).piece_type][2] == 'f'
                    fr.append(f"{la(b.piece_at(s), couleur=False)[0].upper() + la(b.piece_at(s), couleur=False)[1:]} en {nom_case(s)} voudrait {le} prendre, mais {'elle est clouée' if f2 else 'il est cloué'} : {'elle' if f2 else 'il'} protège son roi.")
                    en.append(f"{la(b.piece_at(s), True, False)[0].upper() + la(b.piece_at(s), True, False)[1:]} on {nom_case(s)} would like to take it, but it is pinned to its king.")
        # bloquer ?
        entre = chess.SquareSet(chess.between(a, roi))
        if entre and pa.piece_type in (chess.BISHOP, chess.ROOK, chess.QUEEN):
            fr.append("Rien ne peut venir se placer entre les deux.")
            en.append("Nothing can step in between.")
        # le roi : qui surveille ses cases de fuite, et ses propres pièces qui le bloquent
        fr.append(fuite(b, roi, voisines, occupees, False))
        en.append(fuite(b, roi, voisines, occupees, True))
        if motif is None:
            rang = chess.square_rank(roi)
            if pa.piece_type == chess.KNIGHT and occupees and len(occupees) == len(voisines):
                motif = ('Mat étouffé', 'Smothered mate')
            elif pa.piece_type in (chess.ROOK, chess.QUEEN) and rang in (0, 7) and chess.square_rank(a) == rang:
                devant = [s for s in voisines if chess.square_rank(s) != rang]
                if devant and all(b.piece_at(s) and b.piece_at(s).color == b.turn for s in devant):
                    motif = ('Mat du couloir', 'Back-rank mate')
    if motif is None:
        motif = {chess.QUEEN: ('Mat avec la dame', 'Queen mate'), chess.ROOK: ('Mat avec la tour', 'Rook mate'),
                 chess.BISHOP: ('Mat avec le fou', 'Bishop mate'), chess.KNIGHT: ('Mat avec le cavalier', 'Knight mate'),
                 chess.PAWN: ('Mat avec un pion', 'Pawn mate'), chess.KING: ('Mat', 'Mate')}[b.piece_at(att[0]).piece_type]
    return ' '.join(fr), ' '.join(en), motif


def defenses(b):
    """position après un coup qui donne échec sans mat : une défense de chaque sorte (fuite, prise, parade)"""
    roi = b.king(b.turn)
    att = list(b.checkers())
    res = {}
    for m in b.legal_moves:
        if m.from_square == roi:
            t = 'p' if m.to_square in att else 'f'
        elif m.to_square in att or (b.is_en_passant(m)):
            t = 'p'
        else:
            t = 'i'
        res.setdefault(t, m.uci())
    # la prise par le roi d'abord, puis la fuite, puis la parade
    return ' '.join(t + res[t] for t in ('p', 'f', 'i') if t in res)


def raison(b0, mv):
    """pourquoi ce coup ne fait pas mat : 'n' (pas d'échec), 'pat', ou les défenses"""
    b = b0.copy()
    b.push(mv)
    if b.is_checkmate(): return ''
    if b.is_stalemate(): return 'pat'
    if not b.is_check(): return 'n'
    return defenses(b)


def nom_joueur(n):
    """« Rapport, Richard » -> « Richard Rapport »"""
    n = re.sub(r'\s+', ' ', re.sub(r'\(.*?\)', '', n)).strip()
    if n == n.lower() or n == n.upper(): n = n.title()  # « karthikeyan pandian » -> « Karthikeyan Pandian »
    if ',' in n:
        nom, prenom = [x.strip() for x in n.split(',', 1)]
        return f'{prenom} {nom}'.strip()
    return n


def evenement(h):
    e = h.get('BroadcastName') or h.get('Event') or ''
    if e.startswith('Round') or re.match(r'^(Game|Finals?)\b', e): e = h.get('BroadcastName') or e
    e = re.sub(r'\s*\|.*$', '', e)
    # en lettres latines seulement (pas de grec, de cyrillique, de chinois…)
    e = re.sub(r'\([^)]*[\u0370-\u04ff\u3000-\u9fff\uac00-\ud7af][^)]*\)', '', e)
    e = re.sub(r'[\u0370-\u04ff\u3000-\u9fff\uac00-\ud7af]+', '', e)
    e = re.sub(r'\s+', ' ', e)
    return e.strip()


def construire(d, i):
    h = d['h']
    b0 = chess.Board(d['avant'])
    blunder = chess.Move.from_uci(d['coup'])
    san_blunder = b0.san(blunder)
    num = b0.fullmove_number
    b0.push(blunder)
    b = b0  # position du problème : au joueur de mater
    mats = [chess.Move.from_uci(u) for u in d['mats']]
    principal = chess.Move.from_uci(d['suivant']) if d['suivant'] in d['mats'] else mats[0]
    mats.sort(key=lambda m: m != principal)
    coups = sorted(b.legal_moves, key=lambda m: m.uci())
    expl, expl_en, motif = explication_mat(b, principal)
    suivant = None
    if d['suivant'] and d['suivant'] not in d['mats']:
        mv = chess.Move.from_uci(d['suivant'])
        if mv in b.legal_moves: suivant = b.san(mv)
    gaffeur_blanc = d['joueur'] == 'w'
    return {
        'id': i,
        'fen': d['avant'],
        'apres': b.fen(),
        'coup': d['coup'],
        'san': san_blunder,
        'num': num,
        'trait': 'blanc' if b.turn == chess.WHITE else 'noir',
        'mats': [m.uci() for m in mats],
        'sanMats': [b.san(m) for m in mats],
        'coups': ' '.join(m.uci() for m in coups),
        'raisons': [raison(b, m) for m in coups],
        'motif': motif[0], 'motif_en': motif[1],
        'explication': expl, 'explication_en': expl_en,
        'partie': {
            'blancs': nom_joueur(h['White']), 'noirs': nom_joueur(h['Black']),
            'titreB': h['WhiteTitle'], 'titreN': h['BlackTitle'],
            # Elo FIDE seulement : les classements des sites en ligne (au-delà de 2900) ne veulent pas dire la même chose
            'eloB': h['WhiteElo'] if h['WhiteElo'].isdigit() and int(h['WhiteElo']) < 2900 else '',
            'eloN': h['BlackElo'] if h['BlackElo'].isdigit() and int(h['BlackElo']) < 2900 else '',
            'evenement': evenement(h), 'annee': annee(h), 'cadence': d['cadence'],
            'resultat': h['Result'], 'lien': h.get('GameURL', ''),
        },
        'gaffeur': 'blanc' if gaffeur_blanc else 'noir',
        'joue': d['suivant'] in d['mats'],
        'suite': suivant,  # le coup joué à la place du mat, s'il a été raté
        'eval': round(d['eval'], 1),
    }


def main():
    if len(sys.argv) > 1:
        sel = choisir(sys.argv[1:])
        json.dump(sel, open(SELECTION, 'w'), ensure_ascii=False, indent=0)
    sel = json.load(open(SELECTION))
    probs = [construire(d, i) for i, d in enumerate(sel)]
    # vérifications
    for p in probs:
        b = chess.Board(p['apres'])
        for u in p['mats']:
            b.push(chess.Move.from_uci(u)); assert b.is_checkmate(), p; b.pop()
        assert all(r for u, r in zip(p['coups'].split(), p['raisons']) if u not in p['mats'])
    with open(SORTIE, 'w') as f:
        f.write('/* Généré par outils/mats-en-un.py : mats en un laissés par des grands maîtres dans de vraies parties\n'
                '   (base des retransmissions Lichess, domaine public). Ne pas modifier à la main. */\n')
        f.write('window.MATS_EN_UN = ' + json.dumps(probs, ensure_ascii=False, separators=(',', ':')).replace('},{', '},\n{') + ';\n')
    print(len(probs), 'problèmes écrits', file=sys.stderr)


main()
