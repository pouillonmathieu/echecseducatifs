/* Génère jeux/mat/positions.js pour le jeu « Mat ou pas mat ? ».

   Chaque position est vérifiée avec la bibliothèque chess.js : la réponse (mat ou pas mat)
   et l'explication sont calculées, jamais écrites à la main.
   Les positions reprennent les mats classiques enseignés aux débutants (mat du couloir,
   du berger, du lion, à l'étouffée, de Légal, d'Anastasie, d'Arabie, de Boden, de Damiano,
   de l'épaulette…) et des « presque mats » où le roi peut s'en sortir.

   Utilisation (Node.js) :
     npm install --no-save chess.js@1.0.0
     node outils/positions-mat.js
*/
const fs = require('fs');
const path = require('path');
const { Chess } = require('chess.js');

// attendu : true = mat, false = pas mat (contrôlé par le script)
// raison  : explication à privilégier quand plusieurs défenses existent (fuite, prise, parade)
const SOURCES = [
  // ---------- Mats ----------
  { motif: 'Mat du couloir', fen: '3R2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1', attendu: true,
    idee: 'Le roi est enfermé derrière ses propres pions.' },
  { motif: 'Mat du couloir', fen: '6k1/8/8/8/8/8/5PPP/3r2K1 w - - 0 1', attendu: true,
    idee: 'Le roi blanc est enfermé derrière ses propres pions.' },
  { motif: 'Mat du couloir', fen: '4Q1k1/5ppp/8/8/8/8/8/6K1 b - - 0 1', attendu: true,
    idee: 'La dame attaque toute la dernière rangée.' },
  { motif: 'Mat du berger', coups: 'e4 e5 Bc4 Nc6 Qh5 Nf6 Qxf7#', attendu: true,
    idee: 'La dame prend en f7, protégée par le fou : le roi ne peut pas la prendre.' },
  { motif: 'Mat du lion', coups: 'f3 e5 g4 Qh4#', attendu: true,
    idee: 'Le mat le plus rapide : les pions f et g ont ouvert la diagonale du roi.' },
  { motif: 'Mat à l\'étouffée', fen: '6rk/5Npp/8/8/8/8/8/6K1 b - - 0 1', attendu: true,
    idee: 'Le roi est entouré de ses propres pièces : le cavalier le met mat.' },
  { motif: 'Mat à l\'étouffée', fen: '7k/8/8/8/8/8/5nPP/6RK w - - 0 1', attendu: true,
    idee: 'Le roi blanc est coincé par sa tour et ses pions.' },
  { motif: 'Mat de Légal', coups: 'e4 e5 Nf3 d6 Bc4 Bg4 Nc3 g6 Nxe5 Bxd1 Bxf7+ Ke7 Nd5#', attendu: true,
    idee: 'Les Blancs ont sacrifié leur dame : le fou et les deux cavaliers suffisent.' },
  { motif: 'Mat d\'Anastasie', fen: '5r2/4Nppk/8/8/8/8/8/6KR b - - 0 1', attendu: true,
    idee: 'Le cavalier garde g6 et g8, la tour attaque sur la colonne h.' },
  { motif: 'Mat d\'Arabie', fen: '7k/7R/5N2/8/8/8/8/6K1 b - - 0 1', attendu: true,
    idee: 'Le cavalier protège la tour et garde la case g8.' },
  { motif: 'Mat de Boden', fen: '2kr4/p2n4/B7/8/5B2/8/8/6K1 b - - 0 1', attendu: true,
    idee: 'Les deux fous se croisent et gardent toutes les cases du roi.' },
  { motif: 'Mat de Damiano', fen: '5rk1/5p1Q/6P1/8/8/8/8/6K1 b - - 0 1', attendu: true,
    idee: 'Le pion protège la dame : le roi ne peut pas la prendre.' },
  { motif: 'Mat de l\'épaulette', fen: '3rkr2/8/4Q3/8/8/8/8/6K1 b - - 0 1', attendu: true,
    idee: 'Les deux tours noires bouchent les cases à côté du roi.' },
  { motif: 'Mat du baiser', fen: '4k3/4Q3/4K3/8/8/8/8/8 b - - 0 1', attendu: true,
    idee: 'La dame touche le roi, protégée par son propre roi.' },
  { motif: 'Mat de l\'escalier', fen: 'R5k1/1R6/8/8/8/8/8/6K1 b - - 0 1', attendu: true,
    idee: 'Une tour garde la 7e rangée, l\'autre attaque sur la 8e.' },
  { motif: 'Mat roi et tour', fen: 'R3k3/8/4K3/8/8/8/8/8 b - - 0 1', attendu: true,
    idee: 'Le roi blanc garde les cases de fuite, la tour attaque.' },
  { motif: 'Mat roi et tour', fen: 'R5k1/8/6K1/8/8/8/8/8 b - - 0 1', attendu: true,
    idee: 'Le roi blanc garde f7, g7 et h7.' },
  { motif: 'Dame et fou', fen: '6k1/5pQp/6p1/8/3B4/8/8/6K1 b - - 0 1', attendu: true,
    idee: 'Le fou protège la dame, qui garde f8 et h8.' },
  { motif: 'Dame et cavalier', fen: '6k1/5pQp/8/5N2/8/8/8/6K1 b - - 0 1', attendu: true,
    idee: 'Le cavalier protège la dame : le roi ne peut pas la prendre.' },
  { motif: 'Mat en h7', fen: 'r4rk1/ppp2ppQ/8/8/8/3B4/PPP2PPP/6K1 b - - 0 1', attendu: true,
    idee: 'Le fou protège la dame en h7 ; la tour f8 bouche la fuite.' },

  // ---------- Pas mat ----------
  { motif: 'Presque un mat du couloir', fen: '3R2k1/5pp1/7p/8/8/8/5PPP/6K1 b - - 0 1', attendu: false, raison: 'fuite',
    idee: 'Le pion h6 a laissé une case libre au roi : une « fenêtre ».' },
  { motif: 'Presque un mat du couloir', fen: '3R2k1/5ppp/8/8/3r4/8/5PPP/6K1 b - - 0 1', attendu: false, raison: 'prise' },
  { motif: 'Presque un mat du couloir', fen: '3R2k1/5ppp/8/8/1b6/8/5PPP/6K1 b - - 0 1', attendu: false, raison: 'parade' },
  { motif: 'Presque un mat du berger', coups: 'e4 e5 Bc4 Nc6 Qh5 Qe7 Qxf7+', attendu: false, raison: 'prise',
    idee: 'La dame noire en e7 défend la case f7.' },
  { motif: 'Presque un mat du berger', coups: 'e4 e5 Qh5 Nc6 Qxf7+', attendu: false, raison: 'prise',
    idee: 'Sans le fou en c4, la dame n\'est pas protégée.' },
  { motif: 'Presque un mat du lion', coups: 'f3 e5 e4 Qh4+', attendu: false, raison: 'parade' },
  { motif: 'Presque un mat à l\'étouffée', fen: '6rk/5Np1/7p/8/8/8/8/6K1 b - - 0 1', attendu: false, raison: 'fuite' },
  { motif: 'Presque un mat d\'Anastasie', fen: '5r2/5ppk/8/8/8/8/8/6KR b - - 0 1', attendu: false, raison: 'fuite',
    idee: 'Sans le cavalier en e7, rien ne garde g6 ni g8.' },
  { motif: 'Presque un mat d\'Arabie', fen: '7k/7R/8/5N2/8/8/8/6K1 b - - 0 1', attendu: false, raison: 'prise',
    idee: 'Le cavalier est mal placé : il ne protège pas la tour.' },
  { motif: 'Presque un mat de Boden', fen: '2kr4/p1pn4/B7/8/5B2/8/8/6K1 b - - 0 1', attendu: false, raison: 'fuite',
    idee: 'Le pion c7 coupe la diagonale du fou f4.' },
  { motif: 'Presque un mat de Damiano', fen: '5rk1/5p1Q/8/8/8/8/8/6K1 b - - 0 1', attendu: false, raison: 'prise',
    idee: 'Sans le pion g6, la dame n\'est pas protégée.' },
  { motif: 'Presque un mat de l\'épaulette', fen: '3rk3/8/4Q3/8/8/8/8/6K1 b - - 0 1', attendu: false, raison: 'fuite' },
  { motif: 'Presque un mat du baiser', fen: '4k3/4Q3/8/8/8/8/8/4K3 b - - 0 1', attendu: false, raison: 'prise',
    idee: 'Le roi blanc est trop loin pour protéger sa dame.' },
  { motif: 'Presque un mat de l\'escalier', fen: 'R5k1/7R/8/8/8/8/8/6K1 b - - 0 1', attendu: false, raison: 'prise',
    idee: 'La tour en h7 est trop près du roi et n\'est pas protégée.' },
  { motif: 'Presque un mat roi et tour', fen: 'R5k1/8/8/6K1/8/8/8/8 b - - 0 1', attendu: false, raison: 'fuite',
    idee: 'Le roi blanc est trop loin pour garder les cases de fuite.' },
  { motif: 'Presque un mat en coin', fen: '7k/8/8/8/8/8/1B6/6KR b - - 0 1', attendu: false, raison: 'fuite',
    idee: 'Le fou garde g7, mais personne ne garde g8.' },
  { motif: 'Pat', fen: '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', attendu: false },
  { motif: 'Pat', fen: 'k7/2Q5/1K6/8/8/8/8/8 b - - 0 1', attendu: false },
  { motif: 'Pat', fen: '7k/7P/6K1/8/8/8/8/8 b - - 0 1', attendu: false },
  { motif: 'Pas d\'échec', coups: 'e4 e5 Bc4 Nc6 Qf3', attendu: false,
    idee: 'La dame et le fou visent f7, mais ce n\'est encore qu\'une menace.' },
];

// ---------- Mots ----------
const NOMS = { p: ['pion', 'm'], n: ['cavalier', 'm'], b: ['fou', 'm'], r: ['tour', 'f'], q: ['dame', 'f'], k: ['roi', 'm'] };
const couleurAdj = (c, genre) => (c === 'w' ? (genre === 'f' ? 'blanche' : 'blanc') : (genre === 'f' ? 'noire' : 'noir'));
function nomPiece(piece) {
  const [nom, genre] = NOMS[piece.type];
  return `${genre === 'f' ? 'la' : 'le'} ${nom} ${couleurAdj(piece.color, genre)}`;
}
const camp = (c) => (c === 'w' ? 'les Blancs' : 'les Noirs');
const Camp = (c) => (c === 'w' ? 'Les Blancs' : 'Les Noirs');
const majuscule = (s) => s[0].toUpperCase() + s.slice(1);

function caseDuRoi(jeu, couleur) {
  for (const rangee of jeu.board()) for (const p of rangee) if (p && p.type === 'k' && p.color === couleur) return p.square;
  return null;
}

function analyser(src) {
  const jeu = new Chess();
  if (src.fen) jeu.load(src.fen);
  else for (const c of src.coups.split(' ')) jeu.move(c);
  const trait = jeu.turn();
  const adversaire = trait === 'w' ? 'b' : 'w';
  const roi = caseDuRoi(jeu, trait);
  const pieceRoi = { type: 'k', color: trait };
  const attaquants = jeu.attackers(roi, adversaire);
  const mat = jeu.isCheckmate();
  if (mat !== src.attendu) throw new Error(`${src.motif} : attendu ${src.attendu ? 'mat' : 'pas mat'} (${jeu.fen()})`);

  let explication;
  let coup = null;
  if (mat) {
    const qui = attaquants.map(s => nomPiece(jeu.get(s))).join(' et ');
    explication = `${majuscule(nomPiece(pieceRoi))} est attaqué par ${qui}. Il ne peut ni s'enfuir, ni prendre l'attaquant, et aucune pièce ne peut le protéger.`;
  } else if (jeu.isStalemate()) {
    explication = `C'est pat ! ${majuscule(nomPiece(pieceRoi))} n'est pas en échec, mais ${camp(trait)} n'ont aucun coup possible. La partie est nulle.`;
  } else if (!jeu.inCheck()) {
    explication = `${majuscule(nomPiece(pieceRoi))} n'est même pas en échec : ${camp(trait)} peuvent jouer normalement.`;
  } else {
    const coups = jeu.moves({ verbose: true });
    const fuites = coups.filter(m => m.piece === 'k' && !attaquants.includes(m.to));
    const prisesRoi = coups.filter(m => m.piece === 'k' && m.captured && attaquants.includes(m.to));
    const prises = coups.filter(m => m.piece !== 'k' && attaquants.includes(m.to));
    const parades = coups.filter(m => m.piece !== 'k' && !attaquants.includes(m.to));
    const ordre = { fuite: [fuites, prisesRoi, prises, parades], prise: [prisesRoi, prises, fuites, parades], parade: [parades, prises, prisesRoi, fuites] }[src.raison || 'fuite'];
    const m = ordre.find(l => l.length)[0];
    coup = [m.from, m.to];
    const piece = { type: m.piece, color: trait };
    if (m.piece === 'k' && !attaquants.includes(m.to)) explication = `${majuscule(nomPiece(piece))} peut s'enfuir en ${m.to}${m.captured ? ` en prenant ${nomPiece({ type: m.captured, color: adversaire })}` : ''}.`;
    else if (m.captured) explication = `${majuscule(nomPiece(piece))} peut prendre ${nomPiece({ type: m.captured, color: adversaire })} en ${m.to}.`;
    else explication = `${majuscule(nomPiece(piece))} peut se placer en ${m.to} pour bloquer l'échec.`;
  }
  if (src.idee) explication += ` ${src.idee}`;

  return {
    fen: jeu.fen().split(' ')[0],
    trait: trait === 'w' ? 'blanc' : 'noir',
    mat,
    echec: jeu.inCheck(),
    motif: src.motif,
    explication,
    roi,
    attaquants,
    coup,
  };
}

const positions = SOURCES.map(analyser);
const sortie = path.join(__dirname, '..', 'jeux', 'mat', 'positions.js');
fs.mkdirSync(path.dirname(sortie), { recursive: true });
fs.writeFileSync(sortie,
  '/* Positions du jeu « Mat ou pas mat ? » — fichier généré par outils/positions-mat.js, ne pas modifier à la main. */\n' +
  `window.POSITIONS_MAT = ${JSON.stringify(positions, null, 1)};\n`);
const nbMats = positions.filter(p => p.mat).length;
console.log(`${positions.length} positions (${nbMats} mats, ${positions.length - nbMats} pas mat) → ${path.relative(process.cwd(), sortie)}`);
for (const p of positions) console.log(`${p.mat ? 'MAT     ' : 'PAS MAT '} ${p.motif.padEnd(30)} ${p.explication}`);
