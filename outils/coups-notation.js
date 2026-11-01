/* Génère jeux/notation/coups.js : les « derniers coups » du jeu « Note le coup ».

   Sources (domaine public, CC0) :
   - les ouvertures de Lichess (github.com/lichess-org/chess-openings, fichiers a.tsv à e.tsv) ;
   - les problèmes de Lichess, extraits de github.com/lichess-org/lila-db-seed
     (dump/lichess/puzzle2_puzzle.bson converti en JSON : [{ id, fen, line }]).

   Chaque coup est rejoué et vérifié avec chess.js. On garde la position avant et après le coup, les 3 coups
   précédents, la notation (en anglais : la traduction en français est faite par le jeu) et ce qu'elle
   a de particulier : prise, échec, mat, pièce à préciser, roque, promotion, prise en passant.

   Lancement :
   NODE_PATH=…/node_modules node outils/coups-notation.js <dossier des .tsv> <problemes.json> */
const fs = require('fs');
const path = require('path');
const { Chess } = require('chess.js');

const [dossierOuvertures, fichierProblemes] = process.argv.slice(2);
if (!dossierOuvertures || !fichierProblemes) {
  console.error('Usage : node outils/coups-notation.js <dossier des .tsv> <problemes.json>');
  process.exit(1);
}

// hasard reproductible : le même fichier à chaque lancement
let graine = 20261101;
function hasard() {
  graine = (graine + 0x6D2B79F5) | 0;
  let t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function melanger(t) {
  const a = [...t];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(hasard() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ---------- Analyse d'un coup ----------
// Ce que la notation du coup a de particulier.
function particularites(jeu, coup) {
  const t = [];
  if (coup.captured) t.push('prise');
  if (coup.san.endsWith('#')) t.push('mat');
  else if (coup.san.endsWith('+')) t.push('echec');
  if (coup.flags.includes('k') || coup.flags.includes('q')) t.push('roque');
  if (coup.promotion) t.push('promotion');
  if (coup.flags.includes('e')) t.push('passant');
  if (/^[NBRQK][a-h1-8]{1,2}x?[a-h][1-8]/.test(coup.san)) t.push('precision');
  return t;
}
// Les autres pièces du même type qui pouvaient aller sur la même case (pour expliquer la précision).
function autresPieces(jeuAvant, coup) {
  return jeuAvant.moves({ verbose: true })
    .filter(m => m.piece === coup.piece && m.to === coup.to && m.from !== coup.from)
    .map(m => m.from)
    .filter((c, i, t) => t.indexOf(c) === i);
}

const coups = new Map(); // clé : position + coup, pour éviter les doublons

// Rejoue une suite de coups depuis `depart` et retient chaque coup qui a 3 coups avant lui.
function parcourir(depart, liste, source) {
  const jeu = new Chess(depart);
  const historique = []; // { san, num, couleur }
  for (const c of liste) {
    const num = jeu.moveNumber();
    const couleur = jeu.turn();
    const avant = new Chess(jeu.fen());
    let coup;
    try { coup = jeu.move(c); } catch (e) { return; }
    if (historique.length >= 3) {
      const prec = historique.slice(-3);
      const tags = particularites(avant, coup);
      const fen = jeu.fen().split(' ')[0];
      const cle = fen + coup.san;
      if (!coups.has(cle)) {
        const entree = {
          fen,
          fenAvant: avant.fen().split(' ')[0], // pour animer le coup
          de: coup.from,
          a: coup.to,
          san: coup.san,
          avant: prec.map(h => h.san),
          num: prec[0].num,
          noir: prec[0].couleur === 'b', // le premier des coups précédents est un coup des Noirs
          trait: couleur === 'w' ? 'blanc' : 'noir',
          tags,
        };
        if (tags.includes('precision')) entree.autres = autresPieces(avant, coup);
        coups.set(cle, { entree, source });
      }
    }
    historique.push({ san: coup.san, num, couleur });
  }
}

// ---------- Sources ----------
const DEPART = new Chess().fen();
let nbOuvertures = 0;
for (const f of ['a', 'b', 'c', 'd', 'e']) {
  const lignes = fs.readFileSync(path.join(dossierOuvertures, `${f}.tsv`), 'utf8').trim().split('\n').slice(1);
  for (const l of lignes) {
    const pgn = l.split('\t')[2];
    if (!pgn) continue;
    parcourir(DEPART, pgn.replace(/\d+\.(\.\.)?/g, ' ').trim().split(/\s+/), 'ouverture');
    nbOuvertures++;
  }
}
const problemes = JSON.parse(fs.readFileSync(fichierProblemes, 'utf8'));
for (const p of problemes) {
  const uci = p.line.split(' ').map(u => ({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }));
  parcourir(p.fen, uci, 'probleme');
}

// ---------- Tri : facile / difficile ----------
const SPECIAUX = ['echec', 'mat', 'precision', 'roque', 'promotion', 'passant'];
const tous = [...coups.values()];
const faciles = tous.filter(c => !c.entree.tags.some(t => SPECIAUX.includes(t)));
const difficiles = tous.filter(c => c.entree.tags.some(t => SPECIAUX.includes(t)));

// Facile : surtout des débuts de partie, un quart de prises, quelques coups de milieu de partie.
function choisirFaciles() {
  const ouv = melanger(faciles.filter(c => c.source === 'ouverture'));
  const pb = melanger(faciles.filter(c => c.source === 'probleme'));
  const prises = [...ouv, ...pb].filter(c => c.entree.tags.includes('prise'));
  const simples = ouv.filter(c => !c.entree.tags.includes('prise'));
  const simplesPb = pb.filter(c => !c.entree.tags.includes('prise'));
  return [...simples.slice(0, 220), ...simplesPb.slice(0, 80), ...prises.slice(0, 100)];
}
// Difficile : chaque particularité est représentée.
const QUOTAS = { mat: 90, promotion: 40, passant: 20, roque: 50, precision: 80, echec: 110 };
function categorie(e) {
  for (const t of ['mat', 'promotion', 'passant', 'roque', 'precision', 'echec']) if (e.tags.includes(t)) return t;
  return null;
}
function choisirDifficiles() {
  const choix = [];
  for (const [cat, n] of Object.entries(QUOTAS)) {
    choix.push(...melanger(difficiles.filter(c => categorie(c.entree) === cat)).slice(0, n));
  }
  return choix;
}

const sortie = {
  facile: choisirFaciles().map(c => c.entree),
  difficile: choisirDifficiles().map(c => ({ ...c.entree, cat: categorie(c.entree) })),
};
const fichier = path.join(__dirname, '..', 'jeux', 'notation', 'coups.js');
fs.mkdirSync(path.dirname(fichier), { recursive: true });
fs.writeFileSync(fichier,
  '/* Coups du jeu « Note le coup » — fichier généré par outils/coups-notation.js, ne pas modifier à la main.\n' +
  '   Sources : ouvertures et problèmes de Lichess (domaine public, CC0). Notation en anglais. */\n' +
  `window.COUPS_NOTATION = ${JSON.stringify(sortie)};\n`);

const compte = {};
for (const e of sortie.difficile) compte[e.cat] = (compte[e.cat] || 0) + 1;
console.log(`${nbOuvertures} ouvertures, ${problemes.length} problèmes → ${tous.length} coups (${faciles.length} faciles, ${difficiles.length} difficiles)`);
console.log(`gardés : ${sortie.facile.length} faciles, ${sortie.difficile.length} difficiles`, compte);
console.log(`${path.relative(process.cwd(), fichier)} : ${(fs.statSync(fichier).size / 1024).toFixed(0)} Ko`);
