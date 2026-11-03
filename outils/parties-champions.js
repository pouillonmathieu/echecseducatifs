/* Génère jeux/joue/parties.js : les parties du jeu « Joue le coup ».

   Source : outils/parties-champions.pgn (coups des parties seulement, sans commentaire).
   Chaque partie est rejouée et vérifiée avec chess.js. Le « champion » d'une partie est son vainqueur :
   c'est lui que l'enfant fait jouer. Les moments où l'enfant prend la main sont choisis parmi les coups
   du champion, à partir du 7e coup, grâce à l'analyse de Stockfish (outils/analyse-parties.json) :
   - les sacrifices que Stockfish confirme comme le meilleur coup (spectaculaires : toujours gardés) ;
   - les coups qu'il fallait trouver : le champion a joué le meilleur coup, et le 2e meilleur faisait perdre
     au moins 12 points de chances de gain (pas les reprises toutes simples) ;
   - une dizaine de moments par partie (au plus les deux tiers des coups du champion), qui peuvent se suivre ;
     on complète avec les meilleurs coups du champion, puis avec les coups tactiques (mat, sacrifice, gain, échec) ;
   - le mat final est toujours un moment.
   Sans analyse, on garde seulement les règles tactiques.
   Pour chaque moment, on garde la liste des coups légaux (pour montrer où la pièce peut aller).
   Le PGN source a été préparé à partir des parties fournies par Mathieu Pouillon (300 parties classiques),
   complétées par 4 parties de la base github.com/goatchess/goatchess.github.io.

   Lancement : NODE_PATH=…/node_modules node outils/parties-champions.js */
const fs = require('fs');
const path = require('path');
const { Chess } = require('chess.js');

// Les champions qui ont leur portrait (au moins 3 parties gagnées, plus Morphy et Euwe).
// Les autres vainqueurs sont regroupés sous « autres ».
const CHAMPIONS = {
  'Paul Morphy': 'morphy', 'Wilhelm Steinitz': 'steinitz', 'Mikhaïl Tchigorine': 'tchigorine', 'Siegbert Tarrasch': 'tarrasch',
  'Emanuel Lasker': 'lasker', 'Carl Schlechter': 'schlechter', 'Akiba Rubinstein': 'rubinstein', 'Aron Nimzowitsch': 'nimzowitsch',
  'José Raúl Capablanca': 'capablanca', 'Richard Réti': 'reti', 'Alexandre Alekhine': 'alekhine', 'Max Euwe': 'euwe',
  'Mikhaïl Botvinnik': 'botvinnik', 'Paul Keres': 'keres', 'Vassily Smyslov': 'smyslov', 'Isaac Boleslavski': 'boleslavski',
  'David Bronstein': 'bronstein', 'Miguel Najdorf': 'najdorf', 'Svetozar Gligorić': 'gligoric', 'Tigran Petrossian': 'petrossian',
  'Mikhaïl Tal': 'tal', 'Leonid Stein': 'stein', 'Lev Polougaïevski': 'polougaievski', 'Boris Spassky': 'spassky',
  'Bent Larsen': 'larsen', 'Bobby Fischer': 'fischer', 'Ulf Andersson': 'andersson', 'Anatoli Karpov': 'karpov', 'Garry Kasparov': 'kasparov',
  // aujourd'hui (parties des diffusions Lichess) et championnes (toutes, même avec peu de parties)
  'Magnus Carlsen': 'carlsen', 'Gukesh Dommaraju': 'gukesh', 'Ding Liren': 'ding', 'Ian Nepomniachtchi': 'nepo', 'Fabiano Caruana': 'caruana',
  'Hikaru Nakamura': 'nakamura', 'Rameshbabu Praggnanandhaa': 'pragg', 'Alireza Firouzja': 'firouzja', 'Arjun Erigaisi': 'arjun',
  'Nodirbek Abdusattorov': 'abdusattorov', 'Judit Polgar': 'polgar', 'Irina Krush': 'krush', 'Alexandra Kosteniuk': 'kosteniuk',
  'Koneru Humpy': 'humpy', 'Nana Dzagnidze': 'dzagnidze', 'Kateryna Lagno': 'lagno', 'Anna Muzychuk': 'amuzychuk', 'Ju Wenjun': 'ju',
  'Tan Zhongyi': 'tan', 'Mariya Muzychuk': 'mmuzychuk', 'Lei Tingjie': 'lei', 'Aleksandra Goryachkina': 'goryachkina',
  'Vaishali Rameshbabu': 'vaishali', 'Zhu Jiner': 'zhu', 'Bibisara Assaubayeva': 'assaubayeva', 'Divya Deshmukh': 'divya',
};

const VALEUR = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const racine = path.join(__dirname, '..');
const texte = fs.readFileSync(path.join(__dirname, 'parties-champions.pgn'), 'utf8');

function lirePgn(bloc) {
  const h = {};
  bloc.replace(/^\[(\w+) "(.*)"\]$/gm, (_, k, v) => { h[k] = v; });
  const coups = bloc.replace(/^\[.*\]$/gm, '').replace(/\d+\./g, ' ').replace(/(1-0|0-1)\s*$/, '').split(/\s+/).filter(Boolean);
  return { h, coups };
}

// note d'un coup du champion : plus c'est haut, plus c'est un moment à jouer soi-même
function noter(avant, m, precedent) {
  const apres = new Chess(avant.fen());
  apres.move(m.san);
  const moi = m.color, lui = moi === 'w' ? 'b' : 'w';
  let note = 0, type = 'calme';
  if (m.san.includes('#')) return { note: 100, type: 'mat' };
  if (m.promotion) { note += 50; type = 'promotion'; }
  const gain = m.captured ? VALEUR[m.captured] : 0;
  const v = VALEUR[m.promotion || m.piece];
  const attaquants = apres.attackers(m.to, lui).map(c => VALEUR[apres.get(c).type]);
  const defenseurs = apres.attackers(m.to, moi).length;
  let risque = 0;
  if (attaquants.length && m.piece !== 'k') {
    const plusPetit = Math.min(...attaquants.map(a => a || 100));
    risque = defenseurs ? Math.max(0, v - plusPetit) : v;
  }
  const bilan = gain - risque;
  const reprise = precedent && precedent.captured && precedent.to === m.to;
  if (bilan <= -2) { note += 60 + 5 * Math.min(6, -bilan); type = 'sacrifice'; }
  else if (gain >= 3 && bilan >= 1 && !reprise) { note += 35; type = type === 'calme' ? 'gain' : type; }
  else if (gain >= 1 && bilan >= 1 && !reprise) { note += 15; type = type === 'calme' ? 'gain' : type; }
  if (m.san.includes('+')) { note += 22; if (type === 'calme') type = 'echec'; }
  if (reprise && type !== 'sacrifice') note -= 40;
  return { note, type };
}

// chances de gain (0 à 1) d'après l'évaluation en centièmes de pion
const chances = (cp) => 1 / (1 + Math.exp(-0.00368208 * cp));

function choisirMoments(coups, champion, analyse) {
  const notes = [];
  const j = new Chess();
  let precedent = null;
  coups.forEach((san, i) => {
    const m = j.moves({ verbose: true }).find(x => x.san === san);
    if (m.color === champion && i >= 12) {
      const n = { i, ...noter(j, m, precedent), m, ecart: 0 };
      const reprise = precedent && precedent.captured && precedent.to === m.to;
      // Stockfish : le champion a joué le meilleur coup, et le 2e meilleur était nettement moins bon
      const a = analyse && analyse[i];
      if (a) {
        n.ecart = chances(a[0]) - chances(a[1]);
        n.critique = n.ecart >= 0.12 && chances(a[0]) >= 0.3 && !reprise;
        if (n.critique && n.type === 'calme') n.type = 'unique';
        // un sacrifice que Stockfish confirme comme le meilleur coup : spectaculaire, toujours gardé
        n.spectaculaire = n.type === 'sacrifice' && chances(a[0]) >= 0.5;
      }
      notes.push(n);
    }
    j.move(san);
    precedent = m;
  });
  const pris = [];
  // une dizaine de moments, jamais plus des deux tiers des coups du champion ; les coups qui se suivent sont permis
  const VISE = Math.min(10, Math.ceil(notes.length * 2 / 3));
  const libre = (i, ecart) => pris.every(p => Math.abs(p.i - i) >= ecart);
  const prendre = (liste, max = VISE, ecart = 2) => { for (const n of liste) { if (pris.length >= max) break; if (libre(n.i, ecart)) pris.push(n); } };
  const dernier = notes[notes.length - 1];
  if (dernier && dernier.type === 'mat') pris.push(dernier);
  if (analyse) {
    // 1. les sacrifices confirmés, puis les coups qu'il fallait trouver (le plus grand écart d'abord)
    prendre(notes.filter(n => n.spectaculaire));
    prendre(notes.filter(n => n.critique).sort((a, b) => b.ecart - a.ecart));
    // 2. puis les meilleurs coups joués par le champion (pas les reprises toutes simples)
    prendre(notes.filter(n => !n.critique && n.ecart > 0.02 && n.note > -20).sort((a, b) => b.ecart - a.ecart));
  }
  // 3. sinon (ou pas d'analyse), les coups tactiques repérés par noter(), puis des coups calmes répartis
  prendre([...notes].sort((a, b) => b.note - a.note).filter(n => n.note >= 25), VISE, analyse ? 2 : 6);
  if (pris.length < 3) {
    const calmes = notes.filter(n => n.note >= 0 && n.m.piece !== 'k' && n.m.piece !== 'p');
    const pas = Math.max(1, Math.floor(calmes.length / 5));
    for (let k = Math.floor(pas / 2); k < calmes.length && pris.length < 3; k += pas) if (libre(calmes[k].i, 6)) pris.push(calmes[k]);
  }
  pris.sort((a, b) => a.i - b.i);
  return pris;
}

// analyse Stockfish (facultative) : { n° de partie : { demi-coup : [éval du meilleur coup, éval du 2e] } },
// seulement pour les demi-coups où le champion a joué le meilleur coup. Produite par outils/analyser-parties.js.
const fichierAnalyse = path.join(__dirname, 'analyse-parties.json');
const ANALYSE = fs.existsSync(fichierAnalyse) ? JSON.parse(fs.readFileSync(fichierAnalyse, 'utf8')) : {};

// explications (facultatives) : outils/explications.json, produit par outils/analyser-explications.js
const fichierExpl = path.join(__dirname, 'explications.json');
const EXPL = fs.existsSync(fichierExpl) ? JSON.parse(fs.readFileSync(fichierExpl, 'utf8')) : {};
const POINTS = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const materiel = (j, c) => j.board().flat().filter(x => x && x.color === c).reduce((t, x) => t + POINTS[x.type], 0);
const ecart = (j, c) => materiel(j, c) - materiel(j, c === 'w' ? 'b' : 'w');
// joue une suite de coups « de-vers » ; renvoie les coups joués [notation, de-vers]
function suivre(j, pv, max) {
  const joues = [];
  for (const u of (pv || []).slice(0, max)) {
    try { const m = j.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }); joues.push([m.san, u]); } catch (e) { break; }
  }
  return joues;
}
// explication d'un moment : g = matériel gagné au bout de la suite, me = menace [notation, de-vers, pièce prise] ou
// [notation, de-vers, 'mat', mat en n coups],
// au = autre coup [notation, 'perd' | 'egal' | 'moins'], su = suite [[notation, de-vers]…], mt = mat inévitable en n coups
function expliquerMoment(fenAvant, coup, champion, e) {
  if (!e) return null;
  const x = {};
  const j = new Chess(fenAvant);
  const avant = ecart(j, champion);
  j.move(coup);
  const fenApres = j.fen();
  if (e.suite) {
    const k = new Chess(fenApres);
    x.su = suivre(k, e.suite.pv, 3);
    const l = new Chess(fenApres);
    suivre(l, e.suite.pv, 5);
    x.g = ecart(l, champion) - avant;
    if (e.suite.mat < 0) x.mt = -e.suite.mat; // l'adversaire est maté en n coups
  }
  if (e.menace && e.menace.pv && e.menace.pv.length) {
    // la menace : le champion rejoue tout de suite (on change le trait)
    const champs = fenApres.split(' ');
    champs[1] = champion; champs[3] = '-';
    const k = new Chess(champs.join(' '));
    const av = ecart(k, champion);
    const cible = e.menace.pv[0] && k.get(e.menace.pv[0].slice(2, 4));
    const joues = suivre(k, e.menace.pv, 3);
    const cpSuite = e.suite ? -e.suite.cp : 0;
    let quoi = null;
    if (e.menace.mat > 0) quoi = 'mat';
    // une vraie menace : le coup prend directement une pièce, et le champion y gagne vraiment
    else if (cible && cible.color !== champion && cible.type !== 'p' && ecart(k, champion) - av >= 2 && e.menace.cp - cpSuite >= 120) quoi = cible.type;
    if (joues[0] && quoi) x.me = quoi === 'mat' ? [joues[0][0], joues[0][1], 'mat', e.menace.mat] : [joues[0][0], joues[0][1], quoi];
  }
  // en amont : ce que menaçait l'adversaire, et comment le coup du champion y répond
  // am = [notation de la menace, de-vers, 'mat' ou 'prise', parade, pièce visée, mat en n coups]
  // parades : abri (la pièce visée s'en va), prend (on prend la pièce qui menaçait), protege, bloque, roi (le roi s'écarte),
  //           pare (autre façon), contre (on ne pare pas : on attaque plus fort)
  const jAvant = new Chess(fenAvant);
  if (jAvant.inCheck()) x.ec = 1; // le roi du champion était en échec
  else if (e.amont && e.amont.pv && e.amont.pv.length) {
    const lui = champion === 'w' ? 'b' : 'w';
    const champs = fenAvant.split(' ');
    champs[1] = lui; champs[3] = '-';
    const k = new Chess(champs.join(' '));
    const av = ecart(k, lui);
    const t = suivre(k, e.amont.pv, 3);
    const gain = ecart(k, lui) - av;
    const cpNormal = e.autre && e.autre.cp1 !== undefined ? -e.autre.cp1 : 0; // l'éval pour l'adversaire si le champion joue bien
    const mat = e.amont.mat > 0 ? e.amont.mat : 0;
    const prise = t[0] && new Chess(fenAvant).get(t[0][1].slice(2, 4));
    const vraie = prise && prise.color === champion && prise.type !== 'p' && gain >= 2 && e.amont.cp - cpNormal >= 150;
    if (t[0] && (mat || vraie)) {
      const tu = t[0][1], tf = tu.slice(0, 2), tt = tu.slice(2, 4);
      const jm = new Chess(fenAvant);
      const vise = jm.get(tt);
      const m = jm.move(coup);
      let parade = 'pare';
      // la menace marche-t-elle encore après le coup ? (l'adversaire la joue-t-il dans la suite ?)
      const encore = e.suite && e.suite.pv && e.suite.pv[0] === tu;
      if (m.from === tt) parade = 'abri';
      else if (m.to === tf) parade = 'prend';
      else if (m.piece === 'k' && !vise) parade = 'roi';
      else if (vise && jm.attackers(tt, champion).length > new Chess(fenAvant).attackers(tt, champion).length) parade = 'protege';
      else {
        // bloque : le coup se met sur la ligne entre la pièce qui menace et sa cible
        const [c1, r1] = [tf.charCodeAt(0), +tf[1]], [c2, r2] = [tt.charCodeAt(0), +tt[1]], [c3, r3] = [m.to.charCodeAt(0), +m.to[1]];
        const aligne = (c3 - c1) * (r2 - r1) === (r3 - r1) * (c2 - c1);
        const entre = Math.min(c1, c2) <= c3 && c3 <= Math.max(c1, c2) && Math.min(r1, r2) <= r3 && r3 <= Math.max(r1, r2);
        if (aligne && entre && m.to !== tf && m.to !== tt) parade = 'bloque';
      }
      if (encore && parade === 'pare') parade = 'contre';
      x.am = [t[0][0], tu, mat ? 'mat' : 'prise', parade, vise ? vise.type : '', mat || 0];
    }
  }
  if (e.autre && e.autre.coup && e.autre.cp !== null) {
    const k = new Chess(fenAvant);
    const m = suivre(k, [e.autre.coup], 1)[0];
    const cp2 = e.autre.cp, cp1 = e.autre.cp1;
    if (m && chances(cp1) - chances(cp2) >= 0.08) x.au = [m[0], cp2 < -150 ? 'perd' : Math.abs(cp2) < 90 ? 'egal' : 'moins'];
  }
  return x;
}
// ---------- motifs tactiques, d'échange, de finale et de stratégie ----------
const COLS = 'abcdefgh';
const caseDe = (c, r) => (c >= 0 && c < 8 && r >= 1 && r <= 8 ? COLS[c] + r : null);
const DIRECTIONS = { b: [[1, 1], [1, -1], [-1, 1], [-1, -1]], r: [[1, 0], [-1, 0], [0, 1], [0, -1]] };
DIRECTIONS.q = [...DIRECTIONS.b, ...DIRECTIONS.r];
const pionPasse = (j, sq, c) => {
  const col = COLS.indexOf(sq[0]), rg = +sq[1], sens = c === 'w' ? 1 : -1;
  for (let r = rg + sens; r >= 1 && r <= 8; r += sens) for (const dc of [-1, 0, 1]) {
    const q = caseDe(col + dc, r), p = q && j.get(q);
    if (p && p.type === 'p' && p.color !== c) return false;
  }
  return true;
};
const materielPieces = (j) => j.board().flat().filter(x => x && x.type !== 'p' && x.type !== 'k').reduce((t, x) => t + POINTS[x.type], 0);
// mo = [[code, cases…]] : les motifs du coup du champion, dans la position d'après
function motifs(fenAvant, coup, champion, ply, x, e) {
  const lui = champion === 'w' ? 'b' : 'w';
  const j = new Chess(fenAvant);
  const avant = new Chess(fenAvant);
  const m = j.move(coup);
  const mo = [];
  const p = j.get(m.to);
  const V = (q) => POINTS[j.get(q).type] || 0;
  // pièces adverses attaquées par la pièce jouée (le champion rejoue en pensée)
  const flip = j.fen().split(' '); flip[1] = champion; flip[3] = '-';
  let cibles = [];
  try {
    const k = new Chess(flip.join(' '));
    cibles = [...new Set(k.moves({ square: m.to, verbose: true }).filter(c => c.captured && c.captured !== 'k').map(c => c.to))];
  } catch (err) { /* position impossible */ }
  const roiLui = j.board().flat().find(q => q && q.type === 'k' && q.color === lui);
  const echecPar = j.inCheck() ? j.attackers(roiLui.square, champion) : [];
  if (echecPar.length >= 2) mo.push(['double-echec', ...echecPar]);
  // fourchette : la pièce attaque au moins deux cibles intéressantes (le roi, ou plus forte qu'elle, ou sans défense)
  const bonnes = cibles.filter(q => V(q) > POINTS[p.type] || !j.attackers(q, lui).length);
  if (echecPar.includes(m.to) && !bonnes.includes(roiLui.square)) bonnes.push(roiLui.square);
  if (bonnes.length >= 2 && !j.attackers(m.to, lui).length || bonnes.length >= 2 && bonnes.some(q => V(q) >= 5 || q === roiLui.square)) mo.push(['fourchette', m.to, ...bonnes.slice(0, 3)]);
  // clouage et enfilade : le long des lignes de la pièce jouée
  for (const [dc, dr] of DIRECTIONS[p.type] || []) {
    let c = COLS.indexOf(m.to[0]) + dc, r = +m.to[1] + dr, premier = null;
    for (; caseDe(c, r); c += dc, r += dr) {
      const q = caseDe(c, r), pc = j.get(q);
      if (!pc) continue;
      if (pc.color === champion) break;
      if (!premier) { premier = q; continue; }
      const v1 = pc.type === 'k' ? 100 : POINTS[pc.type], v0 = j.get(premier).type === 'k' ? 100 : POINTS[j.get(premier).type];
      if (v1 > v0 && v0 < POINTS[p.type] + 1) mo.push(['clouage', m.to, premier, q]);
      else if (v0 > v1 && v1 >= 3) mo.push(['enfilade', m.to, premier, q]);
      break;
    }
  }
  // attaque à la découverte : une autre pièce du champion attaque maintenant une cible grâce à la case libérée
  for (const q of j.board().flat().filter(q => q && q.color === champion && 'bqr'.includes(q.type) && q.square !== m.to)) {
    for (const [dc, dr] of DIRECTIONS[q.type]) {
      let c = COLS.indexOf(q.square[0]) + dc, r = +q.square[1] + dr, passe = false;
      for (; caseDe(c, r); c += dc, r += dr) {
        const s = caseDe(c, r);
        if (s === m.from) { passe = true; continue; }
        const pc = j.get(s);
        if (!pc) continue;
        if (pc.color === lui && passe && (pc.type === 'k' || POINTS[pc.type] >= 3)) mo.push(['decouverte', q.square, s]);
        break;
      }
    }
  }
  // échanges
  const ecartAvant = ecart(avant, champion);
  if (m.captured && POINTS[m.captured] === POINTS[m.piece] && m.piece !== 'p' && j.attackers(m.to, lui).length && ecartAvant >= 2) mo.push(['echange-avance']);
  if (e && e.autre && e.autre.coup) {
    try {
      const k = new Chess(fenAvant);
      const alt = k.move({ from: e.autre.coup.slice(0, 2), to: e.autre.coup.slice(2, 4), promotion: e.autre.coup[4] });
      if (alt.captured && POINTS[alt.captured] === POINTS[alt.piece] && alt.piece !== 'p' && !m.captured) mo.push(['evite-echange', e.autre.coup]);
    } catch (err) { /* rien */ }
  }
  // finales
  const finale = materielPieces(j) <= 16;
  if (m.piece === 'k' && finale && !m.san.startsWith('O-O')) {
    const centre = (q) => Math.max(Math.abs(COLS.indexOf(q[0]) - 3.5), Math.abs(+q[1] - 4.5));
    const roiLuiCase = roiLui.square;
    const dc = Math.abs(COLS.indexOf(m.to[0]) - COLS.indexOf(roiLuiCase[0])), dr = Math.abs(+m.to[1] - +roiLuiCase[1]);
    if ((dc === 0 && dr === 2) || (dr === 0 && dc === 2)) mo.push(['opposition', m.to, roiLuiCase]);
    else if (centre(m.to) < centre(m.from) || +m.to[1] !== +m.from[1] && (champion === 'w' ? +m.to[1] > +m.from[1] : +m.to[1] < +m.from[1])) mo.push(['roi-actif', m.from + m.to]);
  }
  if (m.piece === 'p' && pionPasse(j, m.to, champion) && (champion === 'w' ? +m.to[1] >= 5 : +m.to[1] <= 4)) mo.push(['pion-passe', m.to + m.to[0] + (champion === 'w' ? 8 : 1)]);
  // stratégie
  if (m.san.startsWith('O-O')) mo.push(['roque']);
  if (m.piece === 'r') {
    const col = m.to[0];
    const pions = j.board().flat().filter(q => q && q.type === 'p' && q.square[0] === col);
    if (m.from[0] !== col && !pions.length) mo.push(['colonne-ouverte', col]);
    else if (m.from[0] !== col && !pions.some(q => q.color === champion)) mo.push(['colonne-semi', col]);
    if (+m.to[1] === (champion === 'w' ? 7 : 2) && +m.from[1] !== +m.to[1]) mo.push(['septieme']);
  }
  if (m.piece === 'n') {
    const col = COLS.indexOf(m.to[0]), rg = +m.to[1], sens = champion === 'w' ? 1 : -1;
    const chezLui = champion === 'w' ? rg >= 5 : rg <= 4;
    const soutenu = [-1, 1].some(dc => { const q = caseDe(col + dc, rg - sens), pc = q && j.get(q); return pc && pc.type === 'p' && pc.color === champion; });
    let chassable = false;
    for (let r = rg + sens; r >= 1 && r <= 8; r += sens) for (const dc of [-1, 1]) { const q = caseDe(col + dc, r), pc = q && j.get(q); if (pc && pc.type === 'p' && pc.color === lui) chassable = true; }
    if (chezLui && soutenu && !chassable && rg !== (champion === 'w' ? 8 : 1)) mo.push(['avant-poste', m.to]);
  }
  if (m.piece === 'p' && ply < 24 && ['d4', 'e4', 'd5', 'e5', 'c4', 'c5', 'f4', 'f5'].includes(m.to) && !m.captured) mo.push(['centre', m.to]);
  return mo;
}

// explication de la fin : mt = mat en n coups, d = avance en matériel, su = suite, pr = un pion va devenir dame, cp
function expliquerFin(fen, champion, e) {
  if (!e || !e.fin) return null;
  const j = new Chess(fen);
  const signe = j.turn() === champion ? 1 : -1;
  const x = { d: ecart(j, champion), cp: Math.max(-2000, Math.min(2000, signe * e.fin.cp)) };
  if (e.fin.mat && Math.sign(e.fin.mat) === signe) x.mt = Math.abs(e.fin.mat);
  const k = new Chess(fen);
  x.su = suivre(k, e.fin.pv, 4);
  if (x.su.some(([san]) => /=/.test(san))) x.pr = 1;
  return x;
}

// commentaires écrits par le coach dans l'atelier (outils/coach), style retouché : outils/commentaires-coach.json
// { "<champion>-<empreinte des coups>": { moments: { demi-coup: { joue, texte, fleches } }, fin, intro } }
const fichierCoach = path.join(__dirname, 'commentaires-coach.json');
const COACH = fs.existsSync(fichierCoach) ? JSON.parse(fs.readFileSync(fichierCoach, 'utf8')) : {};
// même empreinte que dans l'atelier du coach
function empreinte(t) { let h = 5381; for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0; return h.toString(36); }

const parties = [];
const parChampion = {};
let numero = -1;
for (const bloc of texte.split(/\n(?=\[White )/)) {
  const { h, coups } = lirePgn(bloc);
  if (!h.White) continue;
  numero++;
  const champion = h.Result === '1-0' ? 'w' : 'b';
  const vainqueur = champion === 'w' ? h.White : h.Black;
  // vérification complète : chaque coup doit être légal
  const j = new Chess();
  const uci = [];
  for (const san of coups) { const m = j.move(san); uci.push(m.from + m.to + (m.promotion || '')); }
  let moments = choisirMoments(coups, champion, ANALYSE[numero]);
  // les choix du coach : un coup commenté (ou coché) devient un moment, un coup décoché n'en est plus un
  const cleCh = CHAMPIONS[vainqueur] || 'autres';
  const coach = COACH[`${cleCh}-${empreinte(coups.join(' '))}`];
  if (coach) {
    const ici = new Set(moments.map(m => m.i));
    for (const [k, v] of Object.entries(coach.moments || {})) {
      const i = +k;
      const veut = v.joue !== undefined ? v.joue : ici.has(i) || !!(v.texte || (v.fleches && v.fleches.length));
      if (!veut) moments = moments.filter(m => m.i !== i);
      else if (!ici.has(i)) {
        const q = new Chess();
        for (const san of coups.slice(0, i)) q.move(san);
        const m = q.moves({ verbose: true }).find(x => x.san === coups[i]);
        moments.push({ i, ...noter(q, m, null), m });
      }
    }
    moments.sort((a, b) => a.i - b.i);
  }
  // coups légaux à chaque moment (de + vers), pour montrer les cases possibles
  const legaux = {};
  const k = new Chess();
  coups.forEach((san, i) => {
    if (moments.some(m => m.i === i)) {
      // regroupés par case de départ : « g1f3h3 » = le cavalier g1 peut aller en f3 ou h3
      const groupes = {};
      for (const m of k.moves({ verbose: true })) (groupes[m.from] = groupes[m.from] || new Set()).add(m.to);
      legaux[i] = Object.entries(groupes).map(([de, vers]) => de + [...vers].join('')).join(' ');
    }
    k.move(san);
  });
  const cle = CHAMPIONS[vainqueur] || 'autres';
  parChampion[cle] = (parChampion[cle] || 0) + 1;
  // explications des moments et de la fin
  const fens = [];
  const f = new Chess();
  for (const san of coups) { fens.push(f.fen()); f.move(san); }
  const e = EXPL[numero] || {};
  const x = {};
  for (const m of moments) {
    const r = expliquerMoment(fens[m.i], coups[m.i], champion, e[m.i]) || {};
    const mo = motifs(fens[m.i], coups[m.i], champion, m.i, r, e[m.i]);
    if (mo.length) r.mo = mo;
    if (Object.keys(r).length) x[m.i] = r;
  }
  const fin = f.isCheckmate() ? { fin: 'mat' } : expliquerFin(f.fen(), champion, e[coups.length]);
  parties.push({
    ch: cle, c: champion, bl: h.White, no: h.Black, l: h.Site || '', a: /\d{4}/.test(h.Date) ? +h.Date : 0, r: h.Result,
    u: uci.join(' '), s: coups.join(' '), m: moments.map(m => (m.critique ? [m.i, m.type, 1] : [m.i, m.type])), lg: legaux,
    x, f: fin,
    ...(coach ? {
      co: Object.fromEntries(Object.entries(coach.moments || {}).filter(([, v]) => v.texte || (v.fleches && v.fleches.length)).map(([k, v]) => [k, [v.texte || '', v.fleches || []]])),
      ...(coach.fin ? { cf: coach.fin } : {}),
      ...(coach.intro ? { ci: coach.intro } : {}),
    } : {}),
  });
}

// sortie : un fichier par champion (chargé quand on le choisit) et un petit index
const dossier = path.join(racine, 'jeux/joue/parties');
fs.mkdirSync(dossier, { recursive: true });
for (const f of fs.readdirSync(dossier)) if (f.endsWith('.js')) fs.unlinkSync(path.join(dossier, f));
const entete = '/* Généré par outils/parties-champions.js — ne pas modifier à la main.\n' +
  '   Parties : coups seulement (faits historiques). u = coups (de-vers), s = notation anglaise,\n' +
  '   m = moments où l\'enfant joue [demi-coup, type, 1 si c\'était le seul bon coup], lg = coups légaux à ces moments\n' +
  '   (groupés par case de départ : « g1f3h3 »), x = explications des moments, f = explication de la fin,\n' +
  '   co / cf / ci = commentaires du coach (coups, fin, introduction). */\n';
let taille = 0;
for (const cle of Object.keys(parChampion)) {
  const texteCh = entete + `(window.PARTIES_CH = window.PARTIES_CH || {})[${JSON.stringify(cle)}] = ` + JSON.stringify(parties.filter(p => p.ch === cle)) + ';\n';
  fs.writeFileSync(path.join(dossier, cle + '.js'), texteCh);
  taille += texteCh.length;
}
const sortie = '/* Généré par outils/parties-champions.js — nombre de parties par champion (les parties sont dans parties/). */\n' +
  'window.PARTIES_INDEX = ' + JSON.stringify(parChampion) + ';\n';
fs.writeFileSync(path.join(racine, 'jeux/joue/parties.js'), sortie);
// les moments, pour outils/analyser-explications.js
fs.writeFileSync(path.join(__dirname, 'moments.json'), JSON.stringify(parties.map(p => p.m.map(m => m[0]))));
const types = {};
parties.forEach(p => p.m.forEach(([, t]) => { types[t] = (types[t] || 0) + 1; }));
console.log(parties.length, 'parties ;', Object.keys(parChampion).length - 1, 'champions + autres ;', (taille / 1024).toFixed(0), 'Ko en tout');
console.log('moments :', types, '; par partie :', (parties.reduce((s, p) => s + p.m.length, 0) / parties.length).toFixed(1));
console.log(Object.entries(parChampion).sort((a, b) => b[1] - a[1]).map(e => e.join(':')).join(' '));
