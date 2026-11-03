/* Génère jeux/mat/positions.js pour le jeu « Mat ou pas mat ? ».

   Chaque position est vérifiée avec la bibliothèque chess.js : la réponse (mat ou pas mat)
   et l'explication sont calculées, jamais écrites à la main.
   Les positions reprennent les mats classiques enseignés aux débutants (mat du couloir,
   du berger, du lion, à l'étouffée, de Légal, d'Anastasie, d'Arabie, de Boden, de Damiano,
   de l'épaulette…), des fins de parties célèbres du domaine public (Morphy, Anderssen,
   Réti…) et des « presque mats » où le roi peut s'en sortir.
   Pour une partie célèbre (presque: true), le script crée aussi un « presque mat » :
   un autre échec possible au coup juste avant le mat, qui ne mate pas.

   S'y ajoutent des mats tirés de vraies parties jouées sur Lichess (outils/lichess-mats.json) :
   des problèmes de la base Lichess (domaine public, CC0), pris dans l'échantillon publié
   avec le dépôt lichess-org/lila-db-seed (licence MIT). Le script rejoue la solution
   jusqu'au mat, puis fabrique aussi le « presque mat » correspondant.

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
    idee: 'Le roi est enfermé derrière ses propres pions.', idea: 'The king is trapped behind its own pawns.' },
  { motif: 'Mat du couloir', fen: '6k1/8/8/8/8/8/5PPP/3r2K1 w - - 0 1', attendu: true,
    idee: 'Le roi blanc est enfermé derrière ses propres pions.', idea: 'The white king is trapped behind its own pawns.' },
  { motif: 'Mat du couloir', fen: '4Q1k1/5ppp/8/8/8/8/8/6K1 b - - 0 1', attendu: true,
    idee: 'La dame attaque toute la dernière rangée.', idea: 'The queen controls the whole back rank.' },
  { motif: 'Mat du berger', coups: 'e4 e5 Bc4 Nc6 Qh5 Nf6 Qxf7#', attendu: true,
    idee: 'La dame prend en f7, protégée par le fou : le roi ne peut pas la prendre.', idea: 'The queen takes on f7, protected by the bishop: the king can\'t take her.' },
  { motif: 'Mat du lion', coups: 'f3 e5 g4 Qh4#', attendu: true,
    idee: 'Le mat le plus rapide : les pions f et g ont ouvert la diagonale du roi.', idea: 'The fastest mate: the f- and g-pawns have opened the king\'s diagonal.' },
  { motif: 'Mat à l\'étouffée', fen: '6rk/5Npp/8/8/8/8/8/6K1 b - - 0 1', attendu: true,
    idee: 'Le roi est entouré de ses propres pièces : le cavalier le met mat.', idea: 'The king is surrounded by its own pieces: the knight delivers mate.' },
  { motif: 'Mat à l\'étouffée', fen: '7k/8/8/8/8/8/5nPP/6RK w - - 0 1', attendu: true,
    idee: 'Le roi blanc est coincé par sa tour et ses pions.', idea: 'The white king is boxed in by its rook and its pawns.' },
  { motif: 'Mat de Légal', coups: 'e4 e5 Nf3 d6 Bc4 Bg4 Nc3 g6 Nxe5 Bxd1 Bxf7+ Ke7 Nd5#', attendu: true,
    idee: 'Les Blancs ont sacrifié leur dame : le fou et les deux cavaliers suffisent.', idea: 'White sacrificed the queen: the bishop and the two knights are enough.' },
  { motif: 'Mat d\'Anastasie', fen: '5r2/4Nppk/8/8/8/8/8/6KR b - - 0 1', attendu: true,
    idee: 'Le cavalier garde g6 et g8, la tour attaque sur la colonne h.', idea: 'The knight covers g6 and g8, and the rook attacks along the h-file.' },
  { motif: 'Mat d\'Arabie', fen: '7k/7R/5N2/8/8/8/8/6K1 b - - 0 1', attendu: true,
    idee: 'Le cavalier protège la tour et garde la case g8.', idea: 'The knight protects the rook and covers g8.' },
  { motif: 'Mat de Boden', fen: '2kr4/p2n4/B7/8/5B2/8/8/6K1 b - - 0 1', attendu: true,
    idee: 'Les deux fous se croisent et gardent toutes les cases du roi.', idea: 'The two bishops cross and cover all the king\'s squares.' },
  { motif: 'Mat de Damiano', fen: '5rk1/5p1Q/6P1/8/8/8/8/6K1 b - - 0 1', attendu: true,
    idee: 'Le pion protège la dame : le roi ne peut pas la prendre.', idea: 'The pawn protects the queen: the king can\'t take her.' },
  { motif: 'Mat de l\'épaulette', fen: '3rkr2/8/4Q3/8/8/8/8/6K1 b - - 0 1', attendu: true,
    idee: 'Les deux tours noires bouchent les cases à côté du roi.', idea: 'The two black rooks block the squares next to the king.' },
  { motif: 'Mat du baiser', fen: '4k3/4Q3/4K3/8/8/8/8/8 b - - 0 1', attendu: true,
    idee: 'La dame touche le roi, protégée par son propre roi.', idea: 'The queen is right next to the king, protected by her own king.' },
  { motif: 'Mat de l\'escalier', fen: 'R5k1/1R6/8/8/8/8/8/6K1 b - - 0 1', attendu: true,
    idee: 'Une tour garde la 7e rangée, l\'autre attaque sur la 8e.', idea: 'One rook covers the 7th rank, the other attacks on the 8th.' },
  { motif: 'Mat roi et tour', fen: 'R3k3/8/4K3/8/8/8/8/8 b - - 0 1', attendu: true,
    idee: 'Le roi blanc garde les cases de fuite, la tour attaque.', idea: 'The white king covers the escape squares, and the rook attacks.' },
  { motif: 'Mat roi et tour', fen: 'R5k1/8/6K1/8/8/8/8/8 b - - 0 1', attendu: true,
    idee: 'Le roi blanc garde f7, g7 et h7.', idea: 'The white king covers f7, g7 and h7.' },
  { motif: 'Dame et fou', fen: '6k1/5pQp/6p1/8/3B4/8/8/6K1 b - - 0 1', attendu: true,
    idee: 'Le fou protège la dame, qui garde f8 et h8.', idea: 'The bishop protects the queen, which covers f8 and h8.' },
  { motif: 'Dame et cavalier', fen: '6k1/5pQp/8/5N2/8/8/8/6K1 b - - 0 1', attendu: true,
    idee: 'Le cavalier protège la dame : le roi ne peut pas la prendre.', idea: 'The knight protects the queen: the king can\'t take her.' },
  { motif: 'Mat en h7', fen: 'r4rk1/ppp2ppQ/8/8/8/3B4/PPP2PPP/6K1 b - - 0 1', attendu: true,
    idee: 'Le fou protège la dame en h7 ; la tour f8 bouche la fuite.', idea: 'The bishop protects the queen on h7, and the rook on f8 blocks the escape.' },

  { motif: 'Mat de Morphy', fen: '7k/7p/8/8/8/8/1B6/K5R1 b - - 0 1', attendu: true,
    idee: 'Le fou attaque sur la grande diagonale, la tour ferme la colonne g.', idea: 'The bishop attacks along the long diagonal, and the rook closes the g-file.' },
  { motif: 'Mat de Greco', fen: '7k/6p1/8/8/2B5/8/8/K6R b - - 0 1', attendu: true,
    idee: 'La tour attaque sur la colonne h, le fou garde la case g8.', idea: 'The rook attacks along the h-file, and the bishop covers g8.' },
  { motif: 'Mat de Pillsbury', fen: '5rk1/5p1p/8/8/8/8/1B6/K5R1 b - - 0 1', attendu: true,
    idee: 'La tour donne échec sur la colonne g, le fou garde h8.', idea: 'The rook gives check on the g-file, and the bishop covers h8.' },
  { motif: 'Mat des deux fous', fen: '7k/7p/8/8/2B5/8/1B6/K7 b - - 0 1', attendu: true,
    idee: 'Un fou attaque le roi, l\'autre garde la case g8.', idea: 'One bishop attacks the king, the other covers g8.' },
  { motif: 'Mat de la queue d\'aronde', fen: '4r3/4kp2/3Q4/2P5/8/8/8/K7 b - - 0 1', attendu: true,
    idee: 'La dame, protégée par le pion, garde toutes les cases ; la tour et le pion noirs bouchent les autres.', idea: 'The queen, protected by the pawn, covers every square; the black rook and pawn block the others.' },

  // ---------- Fins de parties célèbres (domaine public) ----------
  { motif: 'Partie de l\'Opéra (Morphy, 1858)', presque: true, attendu: true,
    coups: 'e4 e5 Nf3 d6 d4 Bg4 dxe5 Bxf3 Qxf3 dxe5 Bc4 Nf6 Qb3 Qe7 Nc3 c6 Bg5 b5 Nxb5 cxb5 Bxb5+ Nbd7 O-O-O Rd8 Rxd7 Rxd7 Rd1 Qe6 Bxd7+ Nxd7 Qb8+ Nxb8 Rd8#',
    idee: 'Morphy a sacrifié sa dame : la tour, protégée par le fou g5, met mat.', idea: 'Morphy sacrificed his queen: the rook, protected by the bishop on g5, delivers mate.' },
  { motif: 'Réti contre Tartakower (Vienne, 1910)', presque: true, attendu: true,
    coups: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Nf6 Qd3 e5 dxe5 Qa5+ Bd2 Qxe5 O-O-O Nxe4 Qd8+ Kxd8 Bg5+ Kc7 Bd8#',
    idee: 'Après le sacrifice de la dame, le fou en d8 est protégé par la tour d1.', idea: 'After the queen sacrifice, the bishop on d8 is protected by the rook on d1.' },
  { motif: 'L\'Immortelle (Anderssen, 1851)', presque: true, attendu: true,
    coups: 'e4 e5 f4 exf4 Bc4 Qh4+ Kf1 b5 Bxb5 Nf6 Nf3 Qh6 d3 Nh5 Nh4 Qg5 Nf5 c6 g4 Nf6 Rg1 cxb5 h4 Qg6 h5 Qg5 Qf3 Ng8 Bxf4 Qf6 Nc3 Bc5 Nd5 Qxb2 Bd6 Bxg1 e5 Qxa1+ Ke2 Na6 Nxg7+ Kd8 Qf6+ Nxf6 Be7#',
    idee: 'Anderssen a donné ses deux tours et sa dame : il mate avec trois petites pièces.', idea: 'Anderssen gave up both rooks and his queen: he mates with three minor pieces.' },
  { motif: 'La Toujours-verte (Anderssen, 1852)', presque: true, attendu: true,
    coups: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O d3 Qb3 Qf6 e5 Qg6 Re1 Nge7 Ba3 b5 Qxb5 Rb8 Qa4 Bb6 Nbd2 Bb7 Ne4 Qf5 Bxd3 Qh5 Nf6+ gxf6 exf6 Rg8 Rad1 Qxf3 Rxe7+ Nxe7 Qxd7+ Kxd7 Bf5+ Ke8 Bd7+ Kf8 Bxe7#',
    idee: 'Les deux fous blancs chassent le roi jusqu\'au mat.', idea: 'The two white bishops chase the king all the way to mate.' },
  { motif: 'Edward Lasker contre Thomas (Londres, 1912)', presque: true, attendu: true,
    coups: 'd4 e6 Nf3 f5 Nc3 Nf6 Bg5 Be7 Bxf6 Bxf6 e4 fxe4 Nxe4 b6 Ne5 O-O Bd3 Bb7 Qh5 Qe7 Qxh7+ Kxh7 Nxf6+ Kh6 Neg4+ Kg5 h4+ Kf4 g3+ Kf3 Be2+ Kg2 Rh2+ Kg1 Kd2#',
    idee: 'Le roi noir a traversé tout l\'échiquier : un simple coup du roi blanc le met mat.', idea: 'The black king has walked across the whole board: a simple king move by White mates it.' },
  { motif: 'Piège de Greco (1620)', presque: true, attendu: true,
    coups: 'e4 e5 Nf3 f6 Nxe5 fxe5 Qh5+ Ke7 Qxe5+ Kf7 Bc4+ d5 Bxd5+ Kg6 h4 h5 Bxb7 Bxb7 Qf5+ Kh6 d4+ g5 Qf7 Qe7 hxg5+ Qxg5 Rxh5#',
    idee: 'La tour, protégée par la dame, met mat sur la colonne h.', idea: 'The rook, protected by the queen, mates on the h-file.' },
  { motif: 'Piège de Blackburne', presque: true, attendu: true,
    coups: 'e4 e5 Nf3 Nc6 Bc4 Nd4 Nxe5 Qg5 Nxf7 Qxg2 Rf1 Qxe4+ Be2 Nf3#',
    idee: 'Le roi blanc est étouffé par son fou et sa tour.', idea: 'The white king is smothered by its bishop and its rook.' },
  { motif: 'Piège de l\'Englund', presque: true, attendu: true,
    coups: 'd4 e5 dxe5 Nc6 Nf3 Qe7 Bf4 Qb4+ Bd2 Qxb2 Bc3 Bb4 Qd2 Bxc3 Qxc3 Qc1#',
    idee: 'La dame noire entre en c1 : le roi blanc est coincé par ses propres pièces.', idea: 'The black queen lands on c1: the white king is boxed in by its own pieces.' },
  { motif: 'Piège sibérien', presque: true, attendu: true,
    coups: 'e4 c5 d4 cxd4 c3 dxc3 Nxc3 Nc6 Nf3 e6 Bc4 Qc7 O-O Nf6 Qe2 Ng4 h3 Nd4 Nxd4 Qh2#',
    idee: 'La dame, protégée par le cavalier g4, met mat en h2.', idea: 'The queen, protected by the knight on g4, mates on h2.' },

  // ---------- Pas mat ----------
  { motif: 'Presque un mat du couloir', fen: '3R2k1/5pp1/7p/8/8/8/5PPP/6K1 b - - 0 1', attendu: false, raison: 'fuite',
    idee: 'Le pion h6 a laissé une case libre au roi : une « fenêtre ».', idea: 'The h6 pawn has left the king a free square: an escape hatch.' },
  { motif: 'Presque un mat du couloir', fen: '3R2k1/5ppp/8/8/3r4/8/5PPP/6K1 b - - 0 1', attendu: false, raison: 'prise' },
  { motif: 'Presque un mat du couloir', fen: '3R2k1/5ppp/8/8/1b6/8/5PPP/6K1 b - - 0 1', attendu: false, raison: 'parade' },
  { motif: 'Presque un mat du berger', coups: 'e4 e5 Bc4 Nc6 Qh5 Qe7 Qxf7+', attendu: false, raison: 'prise',
    idee: 'La dame noire en e7 défend la case f7.', idea: 'The black queen on e7 defends f7.' },
  { motif: 'Presque un mat du berger', coups: 'e4 e5 Qh5 Nc6 Qxf7+', attendu: false, raison: 'prise',
    idee: 'Sans le fou en c4, la dame n\'est pas protégée.', idea: 'Without the bishop on c4, the queen isn\'t protected.' },
  { motif: 'Presque un mat du lion', coups: 'f3 e5 e4 Qh4+', attendu: false, raison: 'parade' },
  { motif: 'Presque un mat à l\'étouffée', fen: '6rk/5Np1/7p/8/8/8/8/6K1 b - - 0 1', attendu: false, raison: 'fuite' },
  { motif: 'Presque un mat d\'Anastasie', fen: '5r2/5ppk/8/8/8/8/8/6KR b - - 0 1', attendu: false, raison: 'fuite',
    idee: 'Sans le cavalier en e7, rien ne garde g6 ni g8.', idea: 'Without the knight on e7, nothing covers g6 or g8.' },
  { motif: 'Presque un mat d\'Arabie', fen: '7k/7R/8/5N2/8/8/8/6K1 b - - 0 1', attendu: false, raison: 'prise',
    idee: 'Le cavalier est mal placé : il ne protège pas la tour.', idea: 'The knight is in the wrong place: it doesn\'t protect the rook.' },
  { motif: 'Presque un mat de Boden', fen: '2kr4/p1pn4/B7/8/5B2/8/8/6K1 b - - 0 1', attendu: false, raison: 'fuite',
    idee: 'Le pion c7 coupe la diagonale du fou f4.', idea: 'The c7 pawn blocks the f4 bishop\'s diagonal.' },
  { motif: 'Presque un mat de Damiano', fen: '5rk1/5p1Q/8/8/8/8/8/6K1 b - - 0 1', attendu: false, raison: 'prise',
    idee: 'Sans le pion g6, la dame n\'est pas protégée.', idea: 'Without the g6 pawn, the queen isn\'t protected.' },
  { motif: 'Presque un mat de l\'épaulette', fen: '3rk3/8/4Q3/8/8/8/8/6K1 b - - 0 1', attendu: false, raison: 'fuite' },
  { motif: 'Presque un mat du baiser', fen: '4k3/4Q3/8/8/8/8/8/4K3 b - - 0 1', attendu: false, raison: 'prise',
    idee: 'Le roi blanc est trop loin pour protéger sa dame.', idea: 'The white king is too far away to protect its queen.' },
  { motif: 'Presque un mat de l\'escalier', fen: 'R5k1/7R/8/8/8/8/8/6K1 b - - 0 1', attendu: false, raison: 'prise',
    idee: 'La tour en h7 est trop près du roi et n\'est pas protégée.', idea: 'The rook on h7 is too close to the king and isn\'t protected.' },
  { motif: 'Presque un mat roi et tour', fen: 'R5k1/8/8/6K1/8/8/8/8 b - - 0 1', attendu: false, raison: 'fuite',
    idee: 'Le roi blanc est trop loin pour garder les cases de fuite.', idea: 'The white king is too far away to cover the escape squares.' },
  { motif: 'Presque un mat en coin', fen: '7k/8/8/8/8/8/1B6/6KR b - - 0 1', attendu: false, raison: 'fuite',
    idee: 'Le fou garde g7, mais personne ne garde g8.', idea: 'The bishop covers g7, but nobody covers g8.' },
  { motif: 'Pat', fen: '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', attendu: false },
  { motif: 'Pat', fen: 'k7/2Q5/1K6/8/8/8/8/8 b - - 0 1', attendu: false },
  { motif: 'Pat', fen: '7k/7P/6K1/8/8/8/8/8 b - - 0 1', attendu: false },
  { motif: 'Pat', fen: 'k7/8/1Q6/8/8/8/8/K7 b - - 0 1', attendu: false,
    idee: 'La dame garde toutes les cases autour du roi, sans lui faire échec.', idea: 'The queen covers every square around the king, without giving check.' },
  { motif: 'Pat', fen: 'k7/1R6/1K6/8/8/8/8/8 b - - 0 1', attendu: false,
    idee: 'Le roi ne peut pas prendre la tour : le roi blanc la protège.', idea: 'The king can\'t take the rook: the white king protects it.' },
  { motif: 'Pat', fen: '7k/5K2/6B1/8/8/8/8/8 b - - 0 1', attendu: false,
    idee: 'Le roi et le fou blancs gardent les trois cases autour du roi noir.', idea: 'The white king and bishop cover the three squares around the black king.' },
  { motif: 'Pat', fen: '8/8/8/8/8/1k6/p7/K7 w - - 0 1', attendu: false,
    idee: 'Le roi blanc est coincé derrière le pion noir.', idea: 'The white king is stuck behind the black pawn.' },
  { motif: 'Pas d\'échec', coups: 'e4 e5 Bc4 Nc6 Qf3', attendu: false,
    idee: 'La dame et le fou visent f7, mais ce n\'est encore qu\'une menace.', idea: 'The queen and bishop are aiming at f7, but it\'s still only a threat.' },

  // Fiche d'exercices transmise par l'auteur (logiqboard.com) : positions par paires qui se ressemblent.
  { motif: 'Presque un mat du couloir', fen: '6k1/1bp4p/1p4pB/8/R7/8/1P3PPP/2r3K1 w - - 0 1', attendu: false, raison: 'prise',
    idee: 'C\'est le seul coup qui sauve le roi : regarde bien les pièces loin du roi !', idea: 'It\'s the only move that saves the king: look carefully at the pieces far from the king!' },
  { motif: 'Presque un mat du couloir', fen: '6k1/1R3p1p/Bp4pb/8/8/8/1P3PPP/2r3K1 w - - 0 1', attendu: false, raison: 'parade',
    idee: 'C\'est le seul coup qui sauve le roi.', idea: 'It\'s the only move that saves the king.' },
  { motif: 'Dame et fou', fen: '6k1/1p3p1p/1Qb3p1/8/8/2B3P1/1P3P1P/6Kq w - - 0 1', attendu: true,
    idee: 'Le roi ne peut pas prendre la dame : le fou en c6 la protège de loin.', idea: 'The king can\'t take the queen: the bishop on c6 protects her from afar.' },
  { motif: 'Pat', fen: '8/3p4/3P4/8/8/5k2/6r1/7K w - - 0 1', attendu: false,
    idee: 'Le pion en d6 est bloqué, et le roi ne peut aller sur aucune case.', idea: 'The d6 pawn is blocked, and the king has no square to go to.' },
  { motif: 'Pas d\'échec', fen: '8/3p4/8/3P4/8/5k2/6r1/7K w - - 0 1', attendu: false,
    idee: 'Le roi ne peut pas bouger, mais le pion peut avancer en d6 : ce n\'est donc pas pat.', idea: 'The king can\'t move, but the pawn can advance to d6: so it isn\'t stalemate.' },
  { motif: 'Pat', fen: '1k6/bp6/2b5/8/8/7p/5N1P/3r1BKR w - - 0 1', attendu: false,
    idee: 'Le cavalier et le fou sont cloués : s\'ils bougeaient, le roi serait en échec.', idea: 'The knight and the bishop are pinned: if they moved, the king would be in check.' },
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
// en anglais
const NOMS_EN = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const nomPieceEn = (piece) => `the ${piece.color === 'w' ? 'white' : 'black'} ${NOMS_EN[piece.type]}`;
const campEn = (c) => (c === 'w' ? 'White' : 'Black');
const MOTIFS_EN = {
  'Mat du couloir': 'Back-rank mate', 'Mat du berger': 'Scholar\'s mate', 'Mat du lion': 'Fool\'s mate', 'Mat à l\'étouffée': 'Smothered mate',
  'Mat de Légal': 'Légal\'s mate', 'Mat d\'Anastasie': 'Anastasia\'s mate', 'Mat d\'Arabie': 'Arabian mate', 'Mat de Boden': 'Boden\'s mate',
  'Mat de Damiano': 'Damiano\'s mate', 'Mat de l\'épaulette': 'Epaulette mate', 'Mat du baiser': 'Kiss of death', 'Mat de l\'escalier': 'Staircase mate',
  'Mat roi et tour': 'King and rook mate', 'Dame et fou': 'Queen and bishop', 'Dame et cavalier': 'Queen and knight', 'Mat en h7': 'Mate on h7',
  'Mat de Morphy': 'Morphy\'s mate', 'Mat de Greco': 'Greco\'s mate', 'Mat de Pillsbury': 'Pillsbury\'s mate', 'Mat des deux fous': 'Two-bishop mate',
  'Mat de la queue d\'aronde': 'Dovetail mate', 'Mat du crochet': 'Hook mate',
  'Partie de l\'Opéra (Morphy, 1858)': 'The Opera Game (Morphy, 1858)', 'Réti contre Tartakower (Vienne, 1910)': 'Réti vs Tartakower (Vienna, 1910)',
  'L\'Immortelle (Anderssen, 1851)': 'The Immortal Game (Anderssen, 1851)', 'La Toujours-verte (Anderssen, 1852)': 'The Evergreen Game (Anderssen, 1852)',
  'Edward Lasker contre Thomas (Londres, 1912)': 'Edward Lasker vs Thomas (London, 1912)', 'Piège de Greco (1620)': 'Greco\'s trap (1620)',
  'Piège de Blackburne': 'Blackburne\'s trap', 'Piège de l\'Englund': 'Englund Gambit trap', 'Piège sibérien': 'Siberian trap',
  'Presque un mat en coin': 'Almost a corner mate', 'Presque un mat d\'Arabie': 'Almost an Arabian mate', 'Pat': 'Stalemate', 'Pas d\'échec': 'No check',
};
function motifEn(m) {
  if (MOTIFS_EN[m]) return MOTIFS_EN[m];
  let r;
  if ((r = m.match(/^Presque : (.*)$/))) return `Almost: ${motifEn(r[1])}`;
  if ((r = m.match(/^Presque un (m.*)$/))) { const e = motifEn(r[1][0].toUpperCase() + r[1].slice(1)); return `Almost ${/^[AEIOU]/.test(e) ? 'an' : 'a'} ${e[0].toLowerCase() + e.slice(1)}`.replace(/^Almost an? ((?:[A-Z]|légal|morphy|greco|boden|damiano|anastasia|pillsbury)[^ ]*'s)/i, (x, y) => `Almost ${y[0].toUpperCase() + y.slice(1)}`); }
  if ((r = m.match(/^(.*) \(partie Lichess\)$/))) return `${motifEn(r[1])} (Lichess game)`;
  if (m === 'Partie jouée sur Lichess') return 'Game played on Lichess';
  throw new Error('motif sans traduction : ' + m);
}

function caseDuRoi(jeu, couleur) {
  for (const rangee of jeu.board()) for (const p of rangee) if (p && p.type === 'k' && p.color === couleur) return p.square;
  return null;
}

function rejouer(src, saufDernier = false) {
  const jeu = new Chess();
  let coups;
  if (src.uci) {
    jeu.load(src.depart);
    coups = src.uci.split(' ').map(u => ({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }));
  } else {
    coups = src.coups.split(' ');
  }
  for (const c of (saufDernier ? coups.slice(0, -1) : coups)) jeu.move(c);
  return { jeu, dernier: coups[coups.length - 1] };
}

function analyser(src) {
  let jeu;
  if (src.fen) jeu = new Chess(src.fen);
  else jeu = rejouer(src).jeu;
  const trait = jeu.turn();
  const adversaire = trait === 'w' ? 'b' : 'w';
  const roi = caseDuRoi(jeu, trait);
  const pieceRoi = { type: 'k', color: trait };
  const attaquants = jeu.attackers(roi, adversaire);
  const mat = jeu.isCheckmate();
  if (mat !== src.attendu) throw new Error(`${src.motif} : attendu ${src.attendu ? 'mat' : 'pas mat'} (${jeu.fen()})`);

  let explication, en;
  let coup = null;
  if (mat) {
    const qui = attaquants.map(s => nomPiece(jeu.get(s))).join(' et ');
    explication = `${majuscule(nomPiece(pieceRoi))} est attaqué par ${qui}. Il ne peut ni s'enfuir, ni prendre l'attaquant, et aucune pièce ne peut le protéger.`;
    en = `${majuscule(nomPieceEn(pieceRoi))} is attacked by ${attaquants.map(s => nomPieceEn(jeu.get(s))).join(' and ')}. It can't run away or capture the attacker, and no piece can protect it.`;
  } else if (jeu.isStalemate()) {
    explication = `C'est pat ! ${majuscule(nomPiece(pieceRoi))} n'est pas en échec, mais ${camp(trait)} n'ont aucun coup possible. La partie est nulle.`;
    en = `It's stalemate! ${majuscule(nomPieceEn(pieceRoi))} isn't in check, but ${campEn(trait)} has no legal move. The game is a draw.`;
  } else if (!jeu.inCheck()) {
    explication = `${majuscule(nomPiece(pieceRoi))} n'est même pas en échec : ${camp(trait)} peuvent jouer normalement.`;
    en = `${majuscule(nomPieceEn(pieceRoi))} isn't even in check: ${campEn(trait)} can play normally.`;
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
    const prise = m.captured && { type: m.captured, color: adversaire };
    if (m.piece === 'k' && !attaquants.includes(m.to)) {
      explication = `${majuscule(nomPiece(piece))} peut s'enfuir en ${m.to}${m.captured ? ` en prenant ${nomPiece(prise)}` : ''}.`;
      en = `${majuscule(nomPieceEn(piece))} can escape to ${m.to}${m.captured ? ` by taking ${nomPieceEn(prise)}` : ''}.`;
    } else if (m.captured) {
      explication = `${majuscule(nomPiece(piece))} peut prendre ${nomPiece(prise)} en ${m.to}.`;
      en = `${majuscule(nomPieceEn(piece))} can take ${nomPieceEn(prise)} on ${m.to}.`;
    } else {
      explication = `${majuscule(nomPiece(piece))} peut se placer en ${m.to} pour bloquer l'échec.`;
      en = `${majuscule(nomPieceEn(piece))} can move to ${m.to} to block the check.`;
    }
  }
  if (src.idee) explication += ` ${src.idee}`;
  if (src.idea) en += ` ${src.idea}`;
  else if (src.idee) throw new Error('idée sans traduction : ' + src.idee);

  return {
    fen: jeu.fen().split(' ')[0],
    trait: trait === 'w' ? 'blanc' : 'noir',
    mat,
    pat: jeu.isStalemate(),
    echec: jeu.inCheck(),
    motif: src.motif,
    explication,
    motif_en: motifEn(src.motif),
    explication_en: en,
    roi,
    attaquants,
    coup,
    ...(src.lien ? { lien: src.lien } : {}),
  };
}

// Au coup juste avant le mat, un autre échec qui ne mate pas (de préférence avec la même pièce).
const LETTRES = { p: 'pion', n: 'cavalier', b: 'fou', r: 'tour', q: 'dame', k: 'roi' };
function presqueMat(src) {
  const { jeu, dernier } = rejouer(src, true);
  const mat = jeu.move(dernier);
  jeu.undo();
  const echecs = jeu.moves({ verbose: true }).filter(m => m.san.endsWith('+'));
  if (!echecs.length) return null;
  const choix = echecs.find(m => m.piece === mat.piece && m.to !== mat.to) || echecs[0];
  jeu.move(choix.san);
  const nomMat = nomPiece({ type: mat.piece, color: mat.color });
  return {
    motif: `Presque : ${src.motif}`,
    fen: jeu.fen(),
    attendu: false,
    raison: 'fuite',
    idee: `Dans la partie, c'est ${nomMat} en ${mat.to} qui a donné mat.`,
    idea: `In the game, ${nomPieceEn({ type: mat.piece, color: mat.color })} on ${mat.to} gave mate.`,
    lien: src.lien,
  };
}
const MOTIFS_LICHESS = {
  backRankMate: 'Mat du couloir', smotheredMate: 'Mat à l\'étouffée', anastasiaMate: 'Mat d\'Anastasie',
  hookMate: 'Mat du crochet', doubleBishopMate: 'Mat des deux fous', arabianMate: 'Mat d\'Arabie',
  bodenMate: 'Mat de Boden', dovetailMate: 'Mat de la queue d\'aronde',
};
for (const l of JSON.parse(fs.readFileSync(path.join(__dirname, 'lichess-mats.json'), 'utf8'))) {
  const nom = l.themes.map(t => MOTIFS_LICHESS[t]).find(Boolean);
  SOURCES.push({
    motif: nom ? `${nom} (partie Lichess)` : 'Partie jouée sur Lichess',
    depart: l.fen, uci: l.line, attendu: true, presque: true,
    lien: `https://lichess.org/training/${l.id}`,
  });
}

for (const src of SOURCES.filter(s => s.presque)) {
  const p = presqueMat(src);
  if (p) SOURCES.push(p);
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
