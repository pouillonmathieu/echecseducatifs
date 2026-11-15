/* Génère jeux/ouvertures/donnees.js pour le « Quiz des ouvertures » et les fiches des ouvertures.

   Chaque ouverture : ses coups (notation anglaise), son niveau (facile : l'ouverture de base, 2-3 coups ; moyen :
   une variante principale, 4-6 coups ; expert : une variante avancée, 6 coups ou plus), l'ouverture dont elle est une
   variante (parent), un résumé (affiché quand on a répondu), trois idées à retenir et quelques suites (variantes
   courtes, pour la fiche). Les textes sont écrits pour le site, en français et en anglais.

   Le script rejoue chaque ligne avec chess.js (coups vérifiés, positions et déplacements calculés) et retrouve le nom
   de l'ouverture dans la liste de Lichess (lichess-org/chess-openings) pour faire les liens vers lichess.org.

   Utilisation (Node.js) :
     npm install --no-save chess.js@1.0.0
     node outils/ouvertures.js [dossier des fichiers a.tsv … e.tsv de lichess-org/chess-openings]
   Avec le dossier, les noms Lichess sont recalculés et rangés dans outils/ouvertures-lichess.json ;
   sans, le script reprend ce fichier. */
const fs = require('fs');
const path = require('path');
const { Chess } = require('chess.js');

const O = [];
const ouv = (o) => O.push(o);

// =====================================================================================================
// FACILE : les ouvertures de base
// =====================================================================================================
ouv({ id: 'italienne', niveau: 'facile', nom: 'Partie italienne', nom_en: 'Italian Game', coups: 'e4 e5 Nf3 Nc6 Bc4',
  resume: 'Le fou blanc vise tout de suite la case f7, le point faible des Noirs, que seul le roi protège. Les Blancs sortent vite leurs pièces et préparent le petit roque : une des plus vieilles ouvertures, idéale pour apprendre.',
  resume_en: 'The white bishop immediately aims at f7, Black\'s weak spot, protected only by the king. White develops quickly and gets ready to castle: one of the oldest openings, perfect for learning.',
  idees: ['Sortir les cavaliers et les fous avant la dame.', 'Le fou c4 surveille le centre et la case f7.', 'Les Blancs roquent vite, puis préparent c3 et d4 pour prendre le centre.'],
  idees_en: ['Bring out the knights and bishops before the queen.', 'The bishop on c4 watches the centre and the f7 square.', 'White castles quickly, then prepares c3 and d4 to take the centre.'] });

ouv({ id: 'espagnole', niveau: 'facile', nom: 'Partie espagnole', nom_en: 'Ruy Lopez (Spanish Game)', coups: 'e4 e5 Nf3 Nc6 Bb5',
  resume: 'Le fou blanc attaque le cavalier c6, qui défend le pion e5. Les Blancs mettent une pression lente mais durable sur le centre noir. On l\'appelle aussi « Ruy Lopez », du nom d\'un prêtre espagnol du XVIe siècle.',
  resume_en: 'The white bishop attacks the c6 knight, which defends the e5 pawn. White puts slow but lasting pressure on Black\'s centre. It is named after Ruy López, a 16th-century Spanish priest.',
  idees: ['Le fou b5 gêne le cavalier qui défend e5.', 'Les Noirs jouent souvent a6 pour demander au fou de choisir : reculer ou prendre.', 'L\'ouverture préférée de nombreux champions du monde.'],
  idees_en: ['The bishop on b5 bothers the knight that defends e5.', 'Black often plays a6 to ask the bishop to choose: retreat or take.', 'A favourite opening of many world champions.'] });

ouv({ id: 'ecossaise', niveau: 'facile', nom: 'Partie écossaise', nom_en: 'Scotch Game', coups: 'e4 e5 Nf3 Nc6 d4',
  resume: 'Dès le troisième coup, les Blancs poussent d4 pour ouvrir le centre. Après l\'échange des pions, le cavalier blanc s\'installe en d4 : la partie devient vite ouverte et active.',
  resume_en: 'On move three, White pushes d4 to open the centre. After the pawns are exchanged, the white knight settles on d4: the game quickly becomes open and lively.',
  idees: ['Ouvrir le centre tout de suite avec d4.', 'Après exd4 Cxd4, le cavalier blanc est très bien placé au centre.', 'Les Noirs répondent souvent Cf6 ou Fc5 pour attaquer le pion e4 ou le cavalier d4.'],
  idees_en: ['Open the centre straight away with d4.', 'After exd4 Nxd4, the white knight is beautifully placed in the centre.', 'Black often answers Nf6 or Bc5 to attack the e4 pawn or the d4 knight.'],
  suites: [{ nom: 'Variante classique', nom_en: 'Classical Variation', coups: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5',
    texte: 'Le fou noir attaque tout de suite le cavalier d4.', texte_en: 'The black bishop attacks the d4 knight at once.' }] });

ouv({ id: 'sicilienne', niveau: 'facile', nom: 'Défense sicilienne', nom_en: 'Sicilian Defence', coups: 'e4 c5 Nf3 d6',
  resume: 'Les Noirs répondent à e4 par c5 : ils contrôlent la case d4 sans copier les Blancs. La position devient déséquilibrée, avec des chances de gagner pour les deux camps. C\'est la défense la plus jouée contre e4.',
  resume_en: 'Black answers e4 with c5, controlling d4 without copying White. The position becomes unbalanced, with winning chances for both sides. It is the most popular reply to e4.',
  idees: ['Le pion c5 surveille d4 par le côté.', 'Souvent, les Noirs échangent leur pion c contre le pion d blanc : ils ont alors deux pions au centre contre un.', 'Les Blancs attaquent souvent à l\'aile roi, les Noirs à l\'aile dame.'],
  idees_en: ['The c5 pawn watches d4 from the side.', 'Black often swaps the c-pawn for White\'s d-pawn, keeping two centre pawns against one.', 'White often attacks on the kingside, Black on the queenside.'] });

ouv({ id: 'francaise', niveau: 'facile', nom: 'Défense française', nom_en: 'French Defence', coups: 'e4 e6 d4 d5',
  resume: 'Les Noirs préparent d5 avec e6 pour attaquer le pion e4. Leur position est solide, mais le fou c8 est souvent enfermé derrière ses pions. Les Blancs ont plus d\'espace, les Noirs contre-attaquent avec c5.',
  resume_en: 'Black prepares d5 with e6 to attack the e4 pawn. The position is solid, but the c8 bishop is often shut in behind its pawns. White has more space; Black counter-attacks with c5.',
  idees: ['Le pion e6 soutient d5 : une chaîne de pions solide.', 'Le fou c8 a du mal à sortir : c\'est le gros souci des Noirs.', 'Le coup c5 est l\'arme habituelle des Noirs contre le centre blanc.'],
  idees_en: ['The e6 pawn supports d5: a solid pawn chain.', 'The c8 bishop struggles to get out: that is Black\'s main worry.', 'The move c5 is Black\'s usual weapon against White\'s centre.'] });

ouv({ id: 'caro-kann', niveau: 'facile', nom: 'Défense Caro-Kann', nom_en: 'Caro-Kann Defence', coups: 'e4 c6 d4 d5',
  resume: 'Comme dans la française, les Noirs attaquent e4 avec d5, mais ils le soutiennent avec c6. Avantage : le fou c8 peut sortir avant d\'être enfermé par les pions. Une défense réputée très solide.',
  resume_en: 'As in the French, Black attacks e4 with d5, but supports it with c6. The advantage: the c8 bishop can come out before the pawns shut it in. A defence known for being very solid.',
  idees: ['Le pion c6 soutient d5 sans enfermer le fou c8.', 'Les Noirs sortent souvent ce fou en f5 ou en g4.', 'Une défense solide : les Noirs ont rarement des faiblesses.'],
  idees_en: ['The c6 pawn supports d5 without shutting in the c8 bishop.', 'Black often develops that bishop to f5 or g4.', 'A solid defence: Black rarely has weaknesses.'] });

ouv({ id: 'scandinave', niveau: 'facile', nom: 'Défense scandinave', nom_en: 'Scandinavian Defence', coups: 'e4 d5 exd5 Qxd5',
  resume: 'Les Noirs attaquent tout de suite le pion e4 avec d5. Après exd5, la dame noire reprend souvent en d5, mais elle risque d\'être chassée par les pièces blanches, qui sortent en gagnant du temps.',
  resume_en: 'Black attacks the e4 pawn at once with d5. After exd5 the black queen often recaptures on d5, but she can be chased by White\'s pieces, which develop with gain of time.',
  idees: ['Une défense simple qui ouvre le jeu dès le premier coup.', 'Après exd5 Dxd5 Cc3, la dame doit bouger : les Blancs gagnent un temps.', 'La dame se replie souvent en a5, d6 ou d8.'],
  idees_en: ['A simple defence that opens the game on move one.', 'After exd5 Qxd5 Nc3 the queen has to move: White gains time.', 'The queen usually retreats to a5, d6 or d8.'],
  suites: [{ nom: 'Avec Dd6', nom_en: 'With Qd6', coups: 'e4 d5 exd5 Qxd5 Nc3 Qd6',
    texte: 'La dame recule en d6 : une façon moderne et solide de jouer la scandinave.', texte_en: 'The queen drops back to d6: a modern, solid way to play the Scandinavian.' }] });

ouv({ id: 'alekhine', niveau: 'facile', nom: 'Défense Alekhine', nom_en: 'Alekhine\'s Defence', coups: 'e4 Nf6 e5 Nd5',
  resume: 'Le cavalier noir attaque e4 dès le premier coup et invite les pions blancs à avancer pour le chasser. Les Blancs gagnent de l\'espace, mais leurs pions avancés peuvent devenir des cibles.',
  resume_en: 'The black knight attacks e4 on move one and invites White\'s pawns to advance and chase it. White gains space, but the advanced pawns can become targets.',
  idees: ['Une défense provocante : on laisse l\'adversaire avancer ses pions.', 'Après e5, le cavalier va en d5, puis parfois en b6.', 'Les Noirs attaquent ensuite les pions avancés avec d6.'],
  idees_en: ['A provocative defence: let the opponent push their pawns.', 'After e5 the knight goes to d5, then sometimes b6.', 'Black then attacks the advanced pawns with d6.'],
  suites: [
    { nom: 'Attaque des quatre pions', nom_en: 'Four Pawns Attack', coups: 'e4 Nf6 e5 Nd5 d4 d6 c4 Nb6 f4',
      texte: 'Les Blancs avancent quatre pions pour prendre un maximum d\'espace.', texte_en: 'White pushes four pawns to grab as much space as possible.' },
    { nom: 'Variante moderne', nom_en: 'Modern Variation', coups: 'e4 Nf6 e5 Nd5 d4 d6 Nf3',
      texte: 'Les Blancs sortent tranquillement leurs pièces au lieu d\'avancer leurs pions.', texte_en: 'White calmly develops pieces instead of pushing pawns.' }] });

ouv({ id: 'petrov', niveau: 'facile', nom: 'Défense Petrov', nom_en: 'Petrov\'s Defence', coups: 'e4 e5 Nf3 Nf6',
  resume: 'Au lieu de défendre son pion e5, les Noirs attaquent le pion e4 de la même façon. Une défense symétrique et très solide, appelée aussi « défense russe ».',
  resume_en: 'Instead of defending the e5 pawn, Black attacks the e4 pawn in the same way. A symmetrical and very solid defence, also called the Russian Game.',
  idees: ['Contre-attaque : les Noirs attaquent e4 au lieu de défendre e5.', 'Piège : après Cxe5, il ne faut pas prendre tout de suite Cxe4 à cause de De2 ! On joue d\'abord d6.', 'Une ouverture souvent choisie pour obtenir une partie équilibrée.'],
  idees_en: ['Counter-attack: Black attacks e4 instead of defending e5.', 'Trap: after Nxe5, don\'t take Nxe4 at once because of Qe2! Play d6 first.', 'Often chosen to reach a balanced game.'],
  suites: [
    { nom: 'Variante classique', nom_en: 'Classical Variation', coups: 'e4 e5 Nf3 Nf6 Nxe5 d6 Nf3 Nxe4 d4',
      texte: 'La bonne méthode : d\'abord chasser le cavalier avec d6, puis prendre le pion e4.', texte_en: 'The right way: first chase the knight with d6, then take the e4 pawn.' },
    { nom: 'Attaque moderne (d4)', nom_en: 'Modern Attack (d4)', coups: 'e4 e5 Nf3 Nf6 d4',
      texte: 'Les Blancs ouvrent tout de suite le centre.', texte_en: 'White opens the centre straight away.' }] });

ouv({ id: 'gambit-roi', niveau: 'facile', nom: 'Gambit du roi', nom_en: 'King\'s Gambit', coups: 'e4 e5 f4',
  resume: 'Les Blancs offrent le pion f4 pour détourner le pion e5 et ouvrir la colonne f vers le roi noir. C\'était l\'ouverture la plus à la mode au XIXe siècle : un jeu d\'attaque, plein de pièges.',
  resume_en: 'White offers the f4 pawn to lure away the e5 pawn and open the f-file towards the black king. It was the most fashionable opening of the 19th century: attacking play, full of traps.',
  idees: ['Un gambit : on donne un pion pour gagner du temps et ouvrir des lignes.', 'Si les Noirs prennent (exf4), les Blancs veulent jouer d4 et occuper le centre.', 'Attention au roi blanc : la diagonale e1-h4 est ouverte.'],
  idees_en: ['A gambit: give a pawn to gain time and open lines.', 'If Black takes (exf4), White wants to play d4 and occupy the centre.', 'Watch the white king: the e1-h4 diagonal is open.'],
  suites: [{ nom: 'Gambit du roi refusé', nom_en: 'King\'s Gambit Declined', coups: 'e4 e5 f4 Bc5',
    texte: 'Les Noirs ne prennent pas : leur fou c5 vise g1 et empêche le petit roque blanc.', texte_en: 'Black declines: the c5 bishop eyes g1 and stops White from castling kingside.' }] });

ouv({ id: 'gambit-dame', niveau: 'facile', nom: 'Gambit dame', nom_en: 'Queen\'s Gambit', coups: 'd4 d5 c4',
  resume: 'Les Blancs offrent le pion c4 pour détourner le pion d5 du centre. Ce n\'est pas un vrai sacrifice : s\'ils le prennent, les Noirs ont du mal à le garder. Une des ouvertures les plus classiques après d4.',
  resume_en: 'White offers the c4 pawn to lure the d5 pawn away from the centre. It is not a real sacrifice: if Black takes, the pawn is hard to keep. One of the most classical openings after d4.',
  idees: ['Le pion c4 attaque d5 par le côté.', 'Les Noirs peuvent prendre (gambit dame accepté) ou défendre d5 avec e6 ou c6.', 'Les Blancs veulent avoir plus de pions au centre.'],
  idees_en: ['The c4 pawn attacks d5 from the side.', 'Black can take (Queen\'s Gambit Accepted) or defend d5 with e6 or c6.', 'White wants more pawns in the centre.'] });

ouv({ id: 'anglaise', niveau: 'facile', nom: 'Partie anglaise', nom_en: 'English Opening', coups: 'c4 e5 Nc3 Nf6',
  resume: 'Les Blancs commencent avec le pion c pour contrôler la case d5 de loin. Le jeu est souple : les Blancs placent souvent leur fou en g2 et attendent avant de décider où pousser leurs pions du centre.',
  resume_en: 'White starts with the c-pawn to control d5 from a distance. The play is flexible: White often puts the bishop on g2 and waits before deciding where to push the centre pawns.',
  idees: ['Contrôler le centre par le côté avec c4.', 'Le fou en g2 (fianchetto) vise toute la grande diagonale.', 'Une ouverture souple, qui peut rejoindre d\'autres ouvertures.'],
  idees_en: ['Control the centre from the side with c4.', 'The bishop on g2 (fianchetto) eyes the whole long diagonal.', 'A flexible opening that can transpose into others.'],
  suites: [
    { nom: 'Avec le fianchetto', nom_en: 'With the fianchetto', coups: 'c4 e5 Nc3 Nf6 g3 d5 cxd5 Nxd5 Bg2',
      texte: 'Une sicilienne avec les couleurs inversées : les Blancs ont un coup de plus.', texte_en: 'A Sicilian with colours reversed: White has an extra move.' },
    { nom: 'Quatre cavaliers', nom_en: 'Four Knights', coups: 'c4 e5 Nc3 Nf6 Nf3 Nc6',
      texte: 'Les quatre cavaliers sortent : un jeu calme et classique.', texte_en: 'All four knights come out: calm, classical play.' }] });

ouv({ id: 'hollandaise', niveau: 'facile', nom: 'Défense hollandaise', nom_en: 'Dutch Defence', coups: 'd4 f5 c4 Nf6',
  resume: 'Les Noirs répondent à d4 par f5 pour contrôler la case e4 et préparer une attaque à l\'aile roi. Une défense combative, qui affaiblit un peu le roi noir.',
  resume_en: 'Black answers d4 with f5 to control e4 and prepare a kingside attack. A fighting defence that slightly weakens the black king.',
  idees: ['Le pion f5 contrôle la case e4.', 'Les Noirs attaquent souvent à l\'aile roi, avec la tour en f6 ou la dame en h5.', 'Attention à la diagonale e8-h5, ouverte devant le roi noir.'],
  idees_en: ['The f5 pawn controls e4.', 'Black often attacks on the kingside, with a rook on f6 or the queen on h5.', 'Watch the e8-h5 diagonal, open in front of the black king.'],
  suites: [
    { nom: 'Variante Leningrad', nom_en: 'Leningrad Variation', coups: 'd4 f5 c4 Nf6 g3 g6 Bg2 Bg7',
      texte: 'Les Noirs placent leur fou en g7, comme dans l\'est-indienne.', texte_en: 'Black puts the bishop on g7, as in the King\'s Indian.' },
    { nom: 'Stonewall', nom_en: 'Stonewall', coups: 'd4 f5 c4 Nf6 g3 e6 Bg2 d5 Nf3 c6',
      texte: 'Les Noirs construisent un mur de pions : c6, d5, e6 et f5.', texte_en: 'Black builds a wall of pawns: c6, d5, e6 and f5.' }] });

ouv({ id: 'est-indienne', niveau: 'facile', nom: 'Défense est-indienne', nom_en: 'King\'s Indian Defence', coups: 'd4 Nf6 c4 g6 Nc3 Bg7',
  resume: 'Les Noirs laissent les Blancs construire un grand centre, puis l\'attaquent plus tard. Leur fou se place en g7, sur la grande diagonale, devant le roi qui va roquer. Une défense très combative.',
  resume_en: 'Black lets White build a big centre, then attacks it later. The bishop goes to g7, on the long diagonal, next to the soon-castled king. A very fighting defence.',
  idees: ['Fianchetto du fou en g7 et roque rapide.', 'Les Noirs attaquent ensuite le centre avec e5 ou c5.', 'Souvent, chaque camp attaque sur une aile différente.'],
  idees_en: ['Fianchetto the bishop on g7 and castle quickly.', 'Black then strikes the centre with e5 or c5.', 'Often, each side attacks on a different wing.'],
  suites: [
    { nom: 'Attaque des quatre pions', nom_en: 'Four Pawns Attack', coups: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f4',
      texte: 'Les Blancs avancent quatre pions et prennent beaucoup d\'espace.', texte_en: 'White pushes four pawns and takes lots of space.' },
    { nom: 'Variante Sämisch', nom_en: 'Sämisch Variation', coups: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3',
      texte: 'f3 protège e4 et prépare souvent une attaque avec g4 et h4.', texte_en: 'f3 protects e4 and often prepares an attack with g4 and h4.' }] });

ouv({ id: 'londres', niveau: 'facile', nom: 'Système de Londres', nom_en: 'London System', coups: 'd4 d5 Nf3 Nf6 Bf4',
  resume: 'Les Blancs sortent leur fou en f4 avant de jouer e3, puis construisent presque toujours la même installation solide : pions en c3, d4 et e3. Un système simple à apprendre.',
  resume_en: 'White develops the bishop to f4 before playing e3, then builds almost the same solid set-up every time: pawns on c3, d4 and e3. An easy system to learn.',
  idees: ['Le fou sort en f4 avant e3, pour ne pas être enfermé.', 'Une structure solide : pions en c3, d4 et e3.', 'Les Blancs jouent ensuite Cbd2, Fd3 et le petit roque.'],
  idees_en: ['The bishop comes to f4 before e3, so it is not shut in.', 'A solid structure: pawns on c3, d4 and e3.', 'White then plays Nbd2, Bd3 and castles kingside.'],
  suites: [
    { nom: 'Avec c5', nom_en: 'With c5', coups: 'd4 d5 Nf3 Nf6 Bf4 e6 e3 c5 c3 Nc6 Nbd2 Bd6 Bg3',
      texte: 'L\'installation typique : les Blancs gardent leur fou et leurs pions bien solides.', texte_en: 'The typical set-up: White keeps the bishop and pawns rock-solid.' },
    { nom: 'Avec Ff5', nom_en: 'With Bf5', coups: 'd4 d5 Nf3 Nf6 Bf4 Bf5 e3 e6 c4',
      texte: 'Les Noirs sortent aussi leur fou, comme dans un miroir.', texte_en: 'Black develops the bishop too, like a mirror.' }] });

ouv({ id: 'philidor', niveau: 'facile', nom: 'Défense Philidor', nom_en: 'Philidor Defence', coups: 'e4 e5 Nf3 d6',
  resume: 'Les Noirs défendent le pion e5 avec le pion d6. C\'est solide, mais un peu passif : le fou f8 a moins de place. Elle porte le nom de François-André Danican Philidor, grand joueur français du XVIIIe siècle.',
  resume_en: 'Black defends the e5 pawn with the d6 pawn. It is solid but a little passive: the f8 bishop has less room. It is named after François-André Danican Philidor, a great 18th-century French player.',
  idees: ['Défendre e5 avec un pion plutôt qu\'avec une pièce.', 'Les Noirs gardent une position compacte et solide.', 'Les Blancs ont un peu plus d\'espace et répondent souvent d4.'],
  idees_en: ['Defend e5 with a pawn rather than a piece.', 'Black keeps a compact, solid position.', 'White has a bit more space and often replies d4.'],
  suites: [
    { nom: 'Variante d\'échange', nom_en: 'Exchange Variation', coups: 'e4 e5 Nf3 d6 d4 exd4 Nxd4',
      texte: 'Les Noirs échangent au centre ; le cavalier blanc reprend en d4.', texte_en: 'Black exchanges in the centre; the white knight recaptures on d4.' },
    { nom: 'Variante Hanham', nom_en: 'Hanham Variation', coups: 'e4 e5 Nf3 d6 d4 Nd7',
      texte: 'Les Noirs gardent leur pion e5 en le protégeant avec le cavalier.', texte_en: 'Black keeps the e5 pawn by protecting it with the knight.' }] });

ouv({ id: 'viennoise', niveau: 'facile', nom: 'Partie viennoise', nom_en: 'Vienna Game', coups: 'e4 e5 Nc3',
  resume: 'Les Blancs sortent le cavalier dame au lieu du cavalier roi, pour garder la possibilité de pousser f4 plus tard. Une ouverture souple qui peut devenir très agressive.',
  resume_en: 'White develops the queen\'s knight instead of the king\'s knight, keeping the option of pushing f4 later. A flexible opening that can become very aggressive.',
  idees: ['Le cavalier c3 protège e4 et contrôle d5.', 'Les Blancs peuvent ensuite jouer f4, comme dans le gambit du roi.', 'Les Noirs répondent souvent Cf6 ou Cc6.'],
  idees_en: ['The c3 knight protects e4 and controls d5.', 'White can follow up with f4, as in the King\'s Gambit.', 'Black often replies Nf6 or Nc6.'],
  suites: [
    { nom: 'Gambit viennois', nom_en: 'Vienna Gambit', coups: 'e4 e5 Nc3 Nf6 f4',
      texte: 'Comme dans le gambit du roi, les Blancs avancent f4.', texte_en: 'As in the King\'s Gambit, White pushes f4.' },
    { nom: 'Avec Fc4', nom_en: 'With Bc4', coups: 'e4 e5 Nc3 Nf6 Bc4',
      texte: 'Le fou blanc vise la case f7.', texte_en: 'The white bishop aims at f7.' }] });

ouv({ id: 'pirc', niveau: 'facile', nom: 'Défense Pirc', nom_en: 'Pirc Defence', coups: 'e4 d6 d4 Nf6 Nc3 g6',
  resume: 'Les Noirs laissent les Blancs occuper le centre avec deux pions, puis l\'attaquent avec leurs pièces. Le fou noir se place en g7, comme dans l\'est-indienne.',
  resume_en: 'Black lets White occupy the centre with two pawns, then attacks it with pieces. The black bishop goes to g7, as in the King\'s Indian.',
  idees: ['Une défense « hypermoderne » : on attaque le centre au lieu de l\'occuper.', 'Fianchetto en g7 et petit roque.', 'Les Blancs peuvent attaquer vite, par exemple avec f4.'],
  idees_en: ['A "hypermodern" defence: attack the centre instead of occupying it.', 'Fianchetto on g7 and castle kingside.', 'White can attack quickly, for example with f4.'],
  suites: [
    { nom: 'Attaque autrichienne', nom_en: 'Austrian Attack', coups: 'e4 d6 d4 Nf6 Nc3 g6 f4 Bg7',
      texte: 'Les Blancs avancent f4 pour attaquer au plus vite.', texte_en: 'White pushes f4 to attack as fast as possible.' },
    { nom: 'Variante classique', nom_en: 'Classical Variation', coups: 'e4 d6 d4 Nf6 Nc3 g6 Nf3 Bg7 Be2 O-O',
      texte: 'Les Blancs sortent tranquillement leurs pièces et roquent.', texte_en: 'White calmly develops and castles.' }] });

ouv({ id: 'nimzo-indienne', niveau: 'facile', nom: 'Défense nimzo-indienne', nom_en: 'Nimzo-Indian Defence', coups: 'd4 Nf6 c4 e6 Nc3 Bb4',
  resume: 'Le fou noir cloue le cavalier c3, qui ne peut plus protéger la case e4. Les Noirs sont prêts à échanger ce fou contre le cavalier pour abîmer les pions blancs. Une des défenses les plus respectées contre d4.',
  resume_en: 'The black bishop pins the c3 knight, which can no longer guard e4. Black is ready to give the bishop for the knight to damage White\'s pawns. One of the most respected defences against d4.',
  idees: ['Le clouage Fb4 empêche les Blancs de pousser e4 facilement.', 'Les Noirs acceptent de donner la paire de fous pour doubler les pions blancs.', 'Inventée par Aron Nimzowitsch, qui a beaucoup écrit sur la stratégie.'],
  idees_en: ['The Bb4 pin makes it hard for White to push e4.', 'Black is willing to give up the bishop pair to double White\'s pawns.', 'Invented by Aron Nimzowitsch, who wrote a lot about strategy.'] });

ouv({ id: 'reti', niveau: 'facile', nom: 'Ouverture Réti', nom_en: 'Réti Opening', coups: 'Nf3 d5 c4',
  resume: 'Les Blancs sortent d\'abord le cavalier, puis attaquent le pion d5 avec c4, sans occuper le centre avec leurs pions. Une ouverture de Richard Réti, l\'un des pères des idées hypermodernes.',
  resume_en: 'White develops the knight first, then attacks the d5 pawn with c4, without occupying the centre with pawns. An opening by Richard Réti, one of the fathers of hypermodern ideas.',
  idees: ['Contrôler le centre de loin, avec les pièces et le pion c.', 'Les Blancs placent souvent leur fou en g2.', 'Une ouverture souple qui peut rejoindre la partie anglaise ou le gambit dame.'],
  idees_en: ['Control the centre from afar, with pieces and the c-pawn.', 'White often puts the bishop on g2.', 'A flexible opening that can transpose to the English or the Queen\'s Gambit.'],
  suites: [
    { nom: 'Réti accepté', nom_en: 'Réti Accepted', coups: 'Nf3 d5 c4 dxc4',
      texte: 'Les Noirs prennent le pion c4, que les Blancs récupèrent souvent plus tard.', texte_en: 'Black takes the c4 pawn, which White usually wins back later.' },
    { nom: 'Variante d\'avance', nom_en: 'Advance Variation', coups: 'Nf3 d5 c4 d4',
      texte: 'Le pion noir avance pour gagner de l\'espace.', texte_en: 'The black pawn advances to gain space.' }] });

// =====================================================================================================
// MOYEN : les variantes principales
// =====================================================================================================
ouv({ id: 'giuoco-piano', niveau: 'moyen', parent: 'italienne', nom: 'Italienne : Giuoco piano', nom_en: 'Italian: Giuoco Piano',
  coups: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4',
  resume: 'Les deux fous visent f7 et f2. Avec c3 puis d4, les Blancs essaient de construire un grand centre de pions. Giuoco piano veut dire « jeu tranquille » en italien… même si la partie peut vite s\'animer !',
  resume_en: 'Both bishops aim at f7 and f2. With c3 and then d4, White tries to build a big pawn centre. Giuoco piano means "quiet game" in Italian… though things can heat up quickly!',
  idees: ['c3 prépare d4 pour chasser le fou c5 et occuper le centre.', 'Après d4, les Noirs prennent souvent exd4 pour casser le centre.', 'Les Noirs doivent surveiller la case f7, visée par le fou c4.'],
  idees_en: ['c3 prepares d4 to chase the c5 bishop and occupy the centre.', 'After d4, Black often takes exd4 to break up the centre.', 'Black must keep an eye on f7, targeted by the c4 bishop.'],
  suites: [
    { nom: 'Avec Fd2', nom_en: 'With Bd2', coups: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4 exd4 cxd4 Bb4+ Bd2',
      texte: 'Les Blancs bloquent l\'échec et proposent d\'échanger les fous.', texte_en: 'White blocks the check and offers to trade bishops.' },
    { nom: 'Attaque Moeller', nom_en: 'Moeller Attack', coups: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4 exd4 cxd4 Bb4+ Nc3 Nxe4 O-O',
      texte: 'Les Blancs donnent le pion e4 pour attaquer au plus vite.', texte_en: 'White gives up the e4 pawn to attack as fast as possible.' }] });

ouv({ id: 'deux-cavaliers', niveau: 'moyen', parent: 'italienne', nom: 'Défense des deux cavaliers', nom_en: 'Two Knights Defence',
  coups: 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Na5',
  resume: 'Les Noirs sortent leur second cavalier et attaquent e4. Les Blancs répondent Cg5 pour attaquer f7 ; les Noirs bloquent avec d5 et, après exd5, chassent le fou blanc avec Ca5 : ils donnent un pion pour sortir vite leurs pièces.',
  resume_en: 'Black develops the second knight and attacks e4. White replies Ng5 to attack f7; Black blocks with d5 and, after exd5, chases the white bishop with Na5, giving a pawn for quick development.',
  idees: ['Cg5 attaque f7 avec le cavalier et le fou.', 'Le coup d5 coupe la diagonale du fou c4.', 'Après Ca5, les Noirs ont un pion de moins mais des pièces très actives.'],
  idees_en: ['Ng5 attacks f7 with knight and bishop.', 'The move d5 blocks the c4 bishop\'s diagonal.', 'After Na5, Black is a pawn down but has very active pieces.'] });

ouv({ id: 'evans', niveau: 'moyen', parent: 'italienne', nom: 'Gambit Evans', nom_en: 'Evans Gambit', coups: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4',
  resume: 'Les Blancs offrent le pion b4 pour chasser le fou c5 et gagner du temps : ils veulent jouer c3 et d4 avec un grand centre. Inventé par le capitaine William Evans vers 1827, c\'était une arme favorite des joueurs romantiques.',
  resume_en: 'White offers the b4 pawn to chase the c5 bishop and gain time, aiming for c3 and d4 with a big centre. Invented by Captain William Evans around 1827, it was a favourite weapon of the Romantic players.',
  idees: ['Donner un pion pour gagner du temps et le centre.', 'Après Fxb4 c3, le fou noir doit encore bouger.', 'Les Blancs attaquent souvent f7 avec Db3.'],
  idees_en: ['Give a pawn to gain time and the centre.', 'After Bxb4 c3, the black bishop has to move again.', 'White often attacks f7 with Qb3.'] });

ouv({ id: 'berlinoise', niveau: 'moyen', parent: 'espagnole', nom: 'Espagnole : défense berlinoise', nom_en: 'Ruy Lopez: Berlin Defence',
  coups: 'e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4',
  resume: 'Les Noirs attaquent e4 avec leur cavalier et le prennent même quand les Blancs ont roqué. Une défense très solide, rendue célèbre par Vladimir Kramnik contre Garry Kasparov au championnat du monde de 2000.',
  resume_en: 'Black attacks e4 with the knight and even takes it after White castles. A very solid defence, made famous by Vladimir Kramnik against Garry Kasparov in the 2000 World Championship.',
  idees: ['Le cavalier f6 attaque e4 au lieu de jouer a6.', 'Après le roque, les Noirs peuvent prendre le pion e4.', 'Souvent, les dames s\'échangent très tôt (le « mur de Berlin »).'],
  idees_en: ['The f6 knight attacks e4 instead of playing a6.', 'After White castles, Black can take the e4 pawn.', 'The queens are often exchanged very early (the "Berlin Wall").'] });

ouv({ id: 'espagnole-echange', niveau: 'moyen', parent: 'espagnole', nom: 'Espagnole : variante d\'échange', nom_en: 'Ruy Lopez: Exchange Variation',
  coups: 'e4 e5 Nf3 Nc6 Bb5 a6 Bxc6 dxc6',
  resume: 'Les Blancs prennent tout de suite le cavalier c6. Les Noirs ont deux pions sur la colonne c (des pions doublés), mais gardent la paire de fous. Les Blancs espèrent une finale où leurs pions de l\'aile roi seront plus forts.',
  resume_en: 'White takes the c6 knight at once. Black gets two pawns on the c-file (doubled pawns) but keeps the bishop pair. White hopes for an endgame where the kingside pawns will be stronger.',
  idees: ['Fxc6 abîme les pions noirs.', 'Les Noirs reprennent avec le pion d pour ouvrir la diagonale de leur fou c8.', 'Une variante appréciée de Bobby Fischer.'],
  idees_en: ['Bxc6 damages Black\'s pawns.', 'Black recaptures with the d-pawn to open the c8 bishop\'s diagonal.', 'A line Bobby Fischer liked.'],
  suites: [{ nom: 'Variante Fischer', nom_en: 'Fischer Variation', coups: 'e4 e5 Nf3 Nc6 Bb5 a6 Bxc6 dxc6 O-O f6 d4',
    texte: 'Les Blancs roquent, puis ouvrent le centre avec d4.', texte_en: 'White castles, then opens the centre with d4.' }] });

ouv({ id: 'espagnole-fermee', niveau: 'moyen', parent: 'espagnole', nom: 'Espagnole fermée', nom_en: 'Closed Ruy Lopez',
  coups: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7',
  resume: 'La ligne principale de l\'espagnole : le fou blanc garde la pression en reculant en a4, les Noirs sortent leurs pièces et préparent le roque. Une partie longue et stratégique, avec beaucoup de manœuvres.',
  resume_en: 'The main line of the Ruy Lopez: the white bishop keeps the pressure by retreating to a4, while Black develops and prepares to castle. A long, strategic game with lots of manoeuvring.',
  idees: ['Fa4 garde la pression sur le cavalier c6.', 'Les Noirs jouent souvent b5 pour chasser le fou, qui va en b3.', 'Les Blancs préparent c3 et d4 pour prendre le centre.'],
  idees_en: ['Ba4 keeps the pressure on the c6 knight.', 'Black often plays b5 to chase the bishop, which goes to b3.', 'White prepares c3 and d4 to take the centre.'] });

ouv({ id: 'najdorf', niveau: 'moyen', parent: 'sicilienne', nom: 'Sicilienne : variante Najdorf', nom_en: 'Sicilian: Najdorf Variation',
  coups: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6',
  resume: 'Avec a6, les Noirs empêchent les pièces blanches de venir en b5 et préparent e5 ou b5. La sicilienne préférée de Bobby Fischer et de Garry Kasparov : une des lignes les plus jouées et les plus étudiées.',
  resume_en: 'With a6, Black keeps White\'s pieces out of b5 and prepares e5 or b5. The favourite Sicilian of Bobby Fischer and Garry Kasparov: one of the most played and studied lines.',
  idees: ['a6 contrôle b5 et prépare l\'avance à l\'aile dame.', 'Les Noirs gardent beaucoup de choix : e5, e6 ou b5.', 'Les Blancs choisissent entre plusieurs attaques : Fe3, Fg5, Fe2…'],
  idees_en: ['a6 controls b5 and prepares queenside expansion.', 'Black keeps many options: e5, e6 or b5.', 'White chooses between several attacks: Be3, Bg5, Be2…'] });

ouv({ id: 'dragon', niveau: 'moyen', parent: 'sicilienne', nom: 'Sicilienne : variante du dragon', nom_en: 'Sicilian: Dragon Variation',
  coups: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6',
  resume: 'Le fou noir va se placer en g7, d\'où il vise toute la grande diagonale. Les pions noirs dessineraient la constellation du Dragon, d\'où le nom de la variante. Une ligne très tranchante.',
  resume_en: 'The black bishop goes to g7, eyeing the whole long diagonal. Black\'s pawns are said to look like the Draco constellation, hence the name. A very sharp line.',
  idees: ['Le fou g7 est la pièce la plus forte des Noirs.', 'Les Noirs attaquent à l\'aile dame, souvent avec une tour en c8.', 'Les Blancs roquent souvent du grand côté et attaquent avec h4-h5.'],
  idees_en: ['The g7 bishop is Black\'s best piece.', 'Black attacks on the queenside, often with a rook on c8.', 'White often castles queenside and attacks with h4-h5.'] });

ouv({ id: 'alapin', niveau: 'moyen', parent: 'sicilienne', nom: 'Sicilienne : variante Alapin', nom_en: 'Sicilian: Alapin Variation',
  coups: 'e4 c5 c3 Nf6 e5 Nd5 d4 cxd4',
  resume: 'Les Blancs jouent c3 pour préparer d4 et garder deux pions au centre. Les Noirs attaquent tout de suite e4 avec leur cavalier ; après e5, le cavalier s\'installe en d5.',
  resume_en: 'White plays c3 to prepare d4 and keep two pawns in the centre. Black attacks e4 at once with the knight; after e5, the knight settles on d5.',
  idees: ['c3 prépare d4 : les Blancs veulent un grand centre.', 'Les Noirs répondent souvent Cf6 ou d5 pour attaquer e4.', 'Une façon simple et solide de jouer contre la sicilienne.'],
  idees_en: ['c3 prepares d4: White wants a big centre.', 'Black often replies Nf6 or d5 to attack e4.', 'A simple and solid way to meet the Sicilian.'],
  suites: [
    { nom: 'Reprise avec le pion', nom_en: 'Pawn recapture', coups: 'e4 c5 c3 Nf6 e5 Nd5 d4 cxd4 Nf3 Nc6 cxd4 d6 Bc4',
      texte: 'Les Blancs reprennent en d4 et gardent un beau centre ; le fou vise le cavalier d5.', texte_en: 'White recaptures on d4 and keeps a fine centre; the bishop eyes the d5 knight.' },
    { nom: 'Reprise avec la dame', nom_en: 'Queen recapture', coups: 'e4 c5 c3 Nf6 e5 Nd5 d4 cxd4 Qxd4 e6 Nf3',
      texte: 'La dame reprend tout de suite en d4, au centre de l\'échiquier.', texte_en: 'The queen recaptures on d4 at once, in the middle of the board.' }] });

ouv({ id: 'sicilienne-fermee', niveau: 'moyen', parent: 'sicilienne', nom: 'Sicilienne fermée', nom_en: 'Closed Sicilian',
  coups: 'e4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7 d3 d6',
  resume: 'Les Blancs ne poussent pas d4 : ils gardent le centre fermé, placent leur fou en g2 et préparent une attaque lente à l\'aile roi avec f4. Les deux camps font souvent le même fianchetto.',
  resume_en: 'White does not push d4: the centre stays closed, the bishop goes to g2 and White prepares a slow kingside attack with f4. Both sides often make the same fianchetto.',
  idees: ['Pas de d4 : le centre reste fermé.', 'Les Blancs avancent souvent f4, puis f5 vers le roi noir.', 'Les Noirs jouent à l\'aile dame avec b5.'],
  idees_en: ['No d4: the centre stays closed.', 'White often pushes f4, then f5 towards the black king.', 'Black plays on the queenside with b5.'],
  suites: [{ nom: 'Avec f4', nom_en: 'With f4', coups: 'e4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7 d3 d6 f4 e6 Nf3 Nge7 O-O O-O',
    texte: 'Les Blancs avancent f4 et préparent f5.', texte_en: 'White pushes f4 and prepares f5.' }] });

ouv({ id: 'francaise-avance', niveau: 'moyen', parent: 'francaise', nom: 'Française : variante d\'avance', nom_en: 'French: Advance Variation',
  coups: 'e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6',
  resume: 'Les Blancs avancent e5 et prennent de l\'espace. Les Noirs attaquent tout de suite la base de la chaîne de pions blancs, le pion d4, avec c5, Cc6 et Db6.',
  resume_en: 'White pushes e5 and gains space. Black immediately attacks the base of White\'s pawn chain, the d4 pawn, with c5, Nc6 and Qb6.',
  idees: ['La chaîne de pions blanche d4-e5 coupe l\'échiquier en deux.', 'Les Noirs attaquent la base de la chaîne : d4.', 'La dame en b6 vise aussi le pion b2.'],
  idees_en: ['White\'s d4-e5 pawn chain splits the board in two.', 'Black attacks the base of the chain: d4.', 'The queen on b6 also eyes the b2 pawn.'],
  suites: [
    { nom: 'Avec Fe2', nom_en: 'With Be2', coups: 'e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6 Be2 cxd4 cxd4 Nh6',
      texte: 'Le cavalier noir va passer par f5 pour attaquer d4 encore une fois.', texte_en: 'The black knight heads for f5 to hit d4 once more.' },
    { nom: 'Avec a3', nom_en: 'With a3', coups: 'e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6 a3 c4 Nbd2',
      texte: 'Les Noirs bloquent l\'aile dame avec c4.', texte_en: 'Black locks the queenside with c4.' }] });

ouv({ id: 'winawer', niveau: 'moyen', parent: 'francaise', nom: 'Française : variante Winawer', nom_en: 'French: Winawer Variation',
  coups: 'e4 e6 d4 d5 Nc3 Bb4 e5 c5 a3 Bxc3+ bxc3',
  resume: 'Le fou noir cloue le cavalier c3. Après e5 et c5, les Noirs donnent leur fou contre le cavalier pour doubler les pions blancs. Les Blancs gardent la paire de fous et des chances d\'attaque à l\'aile roi.',
  resume_en: 'The black bishop pins the c3 knight. After e5 and c5, Black gives the bishop for the knight to double White\'s pawns. White keeps the bishop pair and attacking chances on the kingside.',
  idees: ['Fb4 cloue le cavalier qui défend e4.', 'Après Fxc3+ bxc3, les pions blancs sont doublés.', 'Le roque noir est souvent fragile : les Blancs attaquent avec Dg4.'],
  idees_en: ['Bb4 pins the knight that defends e4.', 'After Bxc3+ bxc3, White\'s pawns are doubled.', 'Black\'s kingside is often fragile: White attacks with Qg4.'] });

ouv({ id: 'tarrasch', niveau: 'moyen', parent: 'francaise', nom: 'Française : variante Tarrasch', nom_en: 'French: Tarrasch Variation',
  coups: 'e4 e6 d4 d5 Nd2 c5 exd5 exd5 Ngf3 Nc6',
  resume: 'Les Blancs sortent le cavalier en d2 pour éviter le clouage Fb4. Après c5 et les échanges en d5, les Noirs ont souvent un pion isolé en d5 : actif, mais fragile.',
  resume_en: 'White develops the knight to d2 to avoid the Bb4 pin. After c5 and the exchanges on d5, Black often gets an isolated pawn on d5: active, but fragile.',
  idees: ['Cd2 évite le clouage Fb4.', 'Le pion isolé d5 donne de l\'activité aux pièces noires.', 'Les Blancs essaient de bloquer ce pion, puis de l\'attaquer.'],
  idees_en: ['Nd2 avoids the Bb4 pin.', 'The isolated d5 pawn gives Black\'s pieces activity.', 'White tries to blockade that pawn, then attack it.'],
  suites: [{ nom: 'Avec Fb5', nom_en: 'With Bb5', coups: 'e4 e6 d4 d5 Nd2 c5 exd5 exd5 Ngf3 Nc6 Bb5 Bd6 dxc5 Bxc5 O-O',
    texte: 'Les Blancs échangent en c5 et visent le pion isolé.', texte_en: 'White exchanges on c5 and targets the isolated pawn.' }] });

ouv({ id: 'caro-kann-avance', niveau: 'moyen', parent: 'caro-kann', nom: 'Caro-Kann : variante d\'avance', nom_en: 'Caro-Kann: Advance Variation',
  coups: 'e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5',
  resume: 'Les Blancs avancent e5 pour gagner de l\'espace. Les Noirs sortent leur fou en f5 avant de jouer e6 : contrairement à la française, il n\'est pas enfermé. Puis ils attaquent le centre avec c5.',
  resume_en: 'White pushes e5 to gain space. Black develops the bishop to f5 before playing e6: unlike in the French, it is not shut in. Then Black attacks the centre with c5.',
  idees: ['e5 prend de l\'espace.', 'Le fou sort en f5 avant e6.', 'c5 attaque la chaîne de pions blancs.'],
  idees_en: ['e5 gains space.', 'The bishop comes out to f5 before e6.', 'c5 attacks White\'s pawn chain.'],
  suites: [{ nom: 'Avec le roque', nom_en: 'With castling', coups: 'e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5 O-O Nc6 c3',
    texte: 'Les Blancs roquent et soutiennent d4 avec c3.', texte_en: 'White castles and supports d4 with c3.' }] });

ouv({ id: 'caro-kann-classique', niveau: 'moyen', parent: 'caro-kann', nom: 'Caro-Kann : variante classique', nom_en: 'Caro-Kann: Classical Variation',
  coups: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6',
  resume: 'Les Noirs prennent en e4 et sortent leur fou en f5 en attaquant le cavalier. Après Cg3, le fou recule en g6. Les Blancs poussent souvent h4-h5 pour gêner ce fou.',
  resume_en: 'Black takes on e4 and develops the bishop to f5, hitting the knight. After Ng3 the bishop drops back to g6. White often pushes h4-h5 to harass it.',
  idees: ['Prendre en e4 libère le jeu des Noirs.', 'Le fou f5 gagne du temps sur le cavalier e4.', 'Les Blancs jouent h4-h5 pour chasser le fou.'],
  idees_en: ['Taking on e4 frees Black\'s game.', 'The f5 bishop gains time on the e4 knight.', 'White plays h4-h5 to chase the bishop.'],
  suites: [{ nom: 'Ligne principale avec h4', nom_en: 'Main line with h4', coups: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7 h5 Bh7 Bd3 Bxd3 Qxd3',
    texte: 'Les Blancs poussent h4-h5, puis échangent les fous.', texte_en: 'White pushes h4-h5, then trades bishops.' }] });

ouv({ id: 'gd-refuse', niveau: 'moyen', parent: 'gambit-dame', nom: 'Gambit dame refusé : variante orthodoxe', nom_en: 'Queen\'s Gambit Declined: Orthodox',
  coups: 'd4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O',
  resume: 'Les Noirs gardent leur pion d5 avec e6 et sortent tranquillement leurs pièces. Les Blancs clouent le cavalier f6 avec Fg5. Une des lignes les plus classiques de l\'histoire des échecs.',
  resume_en: 'Black holds the d5 pawn with e6 and develops calmly. White pins the f6 knight with Bg5. One of the most classical lines in chess history.',
  idees: ['e6 défend d5, mais enferme un peu le fou c8.', 'Fg5 cloue le cavalier qui défend d5.', 'Les Noirs cherchent à libérer leur jeu avec c5 ou e5.'],
  idees_en: ['e6 defends d5 but shuts in the c8 bishop a little.', 'Bg5 pins the knight that defends d5.', 'Black looks to free the game with c5 or e5.'] });

ouv({ id: 'gd-accepte', niveau: 'moyen', parent: 'gambit-dame', nom: 'Gambit dame accepté', nom_en: 'Queen\'s Gambit Accepted',
  coups: 'd4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5',
  resume: 'Les Noirs prennent le pion c4 sans essayer de le garder. Ils le rendent pour sortir leurs pièces et attaquer le centre avec c5. Les Blancs reprennent le pion avec le fou.',
  resume_en: 'Black takes the c4 pawn without trying to keep it, giving it back to develop and attack the centre with c5. White wins the pawn back with the bishop.',
  idees: ['Les Noirs ne gardent pas le pion pris.', 'Après e3 et Fxc4, les Blancs ont le centre.', 'c5 attaque d4 pour équilibrer le centre.'],
  idees_en: ['Black does not hang on to the extra pawn.', 'After e3 and Bxc4, White has the centre.', 'c5 attacks d4 to balance the centre.'],
  suites: [{ nom: 'Avec a6', nom_en: 'With a6', coups: 'd4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5 O-O a6',
    texte: 'Les Noirs préparent b5 pour chasser le fou.', texte_en: 'Black prepares b5 to chase the bishop.' }] });

ouv({ id: 'slave', niveau: 'moyen', parent: 'gambit-dame', nom: 'Défense slave', nom_en: 'Slav Defence',
  coups: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5',
  resume: 'Les Noirs défendent d5 avec c6, comme dans la Caro-Kann, pour pouvoir sortir leur fou c8. Dans la ligne principale, ils prennent en c4 et développent ce fou en f5.',
  resume_en: 'Black defends d5 with c6, as in the Caro-Kann, so the c8 bishop can come out. In the main line Black takes on c4 and develops that bishop to f5.',
  idees: ['c6 défend d5 sans enfermer le fou c8.', 'Après dxc4, a4 empêche b5, qui garderait le pion.', 'Le fou noir sort en f5 avant e6.'],
  idees_en: ['c6 defends d5 without shutting in the c8 bishop.', 'After dxc4, a4 stops b5, which would keep the pawn.', 'The black bishop comes out to f5 before e6.'] });

ouv({ id: 'est-indienne-classique', niveau: 'moyen', parent: 'est-indienne', nom: 'Est-indienne : variante classique', nom_en: 'King\'s Indian: Classical Variation',
  coups: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5',
  resume: 'Les Blancs construisent un grand centre (c4, d4, e4) et sortent tranquillement leurs pièces. Les Noirs attaquent ce centre avec e5. Souvent, les Blancs poussent d5 et le centre se ferme.',
  resume_en: 'White builds a big centre (c4, d4, e4) and develops calmly. Black attacks that centre with e5. White often pushes d5 and the centre locks up.',
  idees: ['Les Blancs ont trois pions au centre : c4, d4 et e4.', 'e5 attaque le pion d4.', 'Après d5, les Blancs jouent à l\'aile dame, les Noirs à l\'aile roi avec f5.'],
  idees_en: ['White has three centre pawns: c4, d4 and e4.', 'e5 attacks the d4 pawn.', 'After d5, White plays on the queenside, Black on the kingside with f5.'] });

ouv({ id: 'nimzo-rubinstein', niveau: 'moyen', parent: 'nimzo-indienne', nom: 'Nimzo-indienne : variante Rubinstein', nom_en: 'Nimzo-Indian: Rubinstein Variation',
  coups: 'd4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5 Nf3 c5',
  resume: 'Avec e3, les Blancs protègent d4 et préparent la sortie du fou f1. Les deux camps jouent des coups classiques : roque, d5, c5. Une ligne très jouée au plus haut niveau.',
  resume_en: 'With e3, White protects d4 and prepares to develop the f1 bishop. Both sides play classical moves: castling, d5, c5. A line played a lot at the highest level.',
  idees: ['e3 libère le fou f1 et protège d4.', 'Les Noirs frappent le centre avec d5 et c5.', 'Les Blancs ne craignent pas les pions doublés après Fxc3.'],
  idees_en: ['e3 frees the f1 bishop and protects d4.', 'Black strikes the centre with d5 and c5.', 'White is not afraid of doubled pawns after Bxc3.'],
  suites: [{ nom: 'Avec le roque', nom_en: 'With castling', coups: 'd4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5 Nf3 c5 O-O dxc4 Bxc4 Nc6',
    texte: 'Les Noirs prennent en c4 et mettent la pression sur d4.', texte_en: 'Black takes on c4 and puts pressure on d4.' }] });

ouv({ id: 'gambit-roi-accepte', niveau: 'moyen', parent: 'gambit-roi', nom: 'Gambit du roi accepté : défense moderne', nom_en: 'King\'s Gambit Accepted: Modern Defence',
  coups: 'e4 e5 f4 exf4 Nf3 d5 exd5 Nf6',
  resume: 'Les Noirs prennent le pion f4, puis jouent d5 pour ouvrir le jeu et sortir vite leurs pièces. Une façon moderne et sûre de répondre au gambit du roi.',
  resume_en: 'Black takes the f4 pawn, then plays d5 to open the game and develop quickly. A modern, safe way to meet the King\'s Gambit.',
  idees: ['Cf3 empêche la dame noire d\'aller en h4.', 'd5 ouvre les lignes pour les pièces noires.', 'Le pion f4 gêne le fou c1 blanc.'],
  idees_en: ['Nf3 stops the black queen from going to h4.', 'd5 opens lines for Black\'s pieces.', 'The f4 pawn gets in the way of White\'s c1 bishop.'],
  suites: [
    { nom: 'Avec Fb5+', nom_en: 'With Bb5+', coups: 'e4 e5 f4 exf4 Nf3 d5 exd5 Nf6 Bb5+ c6 dxc6 bxc6',
      texte: 'Les Noirs donnent un pion de plus pour sortir leurs pièces.', texte_en: 'Black gives another pawn to develop the pieces.' },
    { nom: 'Avec Fc4', nom_en: 'With Bc4', coups: 'e4 e5 f4 exf4 Nf3 d5 exd5 Nf6 Bc4 Nxd5',
      texte: 'Les Noirs reprennent le pion en d5.', texte_en: 'Black wins the pawn back on d5.' }] });

ouv({ id: 'scandinave-principale', niveau: 'moyen', parent: 'scandinave', nom: 'Scandinave : variante principale (Da5)', nom_en: 'Scandinavian: Main Line (Qa5)',
  coups: 'e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6 Nf3 c6',
  resume: 'La dame noire reprend en d5, puis se réfugie en a5 quand le cavalier l\'attaque. De là, elle cloue parfois le cavalier c3. Les Noirs jouent ensuite c6 pour lui préparer une case de retraite.',
  resume_en: 'The black queen recaptures on d5, then retreats to a5 when the knight attacks her. From there she sometimes pins the c3 knight. Black then plays c6 to give her a retreat square.',
  idees: ['La dame en a5 est à l\'abri et active.', 'c6 donne à la dame la case c7 pour reculer.', 'Les Noirs sortent ensuite leur fou en f5 ou g4.'],
  idees_en: ['The queen on a5 is safe and active.', 'c6 gives the queen the c7 square to retreat to.', 'Black then develops the bishop to f5 or g4.'],
  suites: [{ nom: 'Avec Fc4', nom_en: 'With Bc4', coups: 'e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6 Nf3 c6 Bc4 Bf5',
    texte: 'Le fou noir sort en f5 avant e6.', texte_en: 'The black bishop comes out to f5 before e6.' }] });

ouv({ id: 'grunfeld', niveau: 'moyen', nom: 'Défense Grünfeld : variante d\'échange', nom_en: 'Grünfeld Defence: Exchange Variation',
  coups: 'd4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3 bxc3 Bg7',
  resume: 'Les Noirs laissent les Blancs construire un grand centre avec c3, d4 et e4… pour mieux l\'attaquer ensuite avec le fou g7, c5 et leurs pièces. Une défense dynamique, souvent jouée par Garry Kasparov.',
  resume_en: 'Black lets White build a big centre with c3, d4 and e4… the better to attack it with the g7 bishop, c5 and the pieces. A dynamic defence, often played by Garry Kasparov.',
  idees: ['Les Blancs ont un centre impressionnant : c3, d4 et e4.', 'Le fou g7 et le coup c5 attaquent d4.', 'Les Noirs doivent agir vite, avant que le centre blanc n\'avance.'],
  idees_en: ['White has an impressive centre: c3, d4 and e4.', 'The g7 bishop and the move c5 attack d4.', 'Black must act fast, before White\'s centre advances.'] });

// =====================================================================================================
// EXPERT : les variantes avancées
// =====================================================================================================
ouv({ id: 'najdorf-anglaise', niveau: 'expert', parent: 'najdorf', nom: 'Najdorf : attaque anglaise', nom_en: 'Najdorf: English Attack',
  coups: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5 Nb3 Be6 f3',
  resume: 'Les Blancs placent leur fou en e3, poussent f3, puis roquent du grand côté pour lancer leurs pions g et h contre le roi noir. Les Noirs ont joué e5 et Fe6 et attaquent à l\'aile dame. Une des lignes les plus tranchantes des échecs modernes.',
  resume_en: 'White puts the bishop on e3, plays f3, then castles queenside to throw the g- and h-pawns at the black king. Black has played e5 and Be6 and attacks on the queenside. One of the sharpest lines in modern chess.',
  idees: ['f3 protège e4 et prépare g4.', 'Les rois roquent de côtés opposés : c\'est une course entre deux attaques.', 'Le pion d6 est faible, mais les Noirs surveillent bien la case d5.'],
  idees_en: ['f3 protects e4 and prepares g4.', 'The kings castle on opposite sides: a race between two attacks.', 'The d6 pawn is weak, but Black keeps a close eye on d5.'],
  suites: [{ nom: 'Grand roque et g4', nom_en: 'Long castling and g4', coups: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5 Nb3 Be6 f3 Be7 Qd2 O-O O-O-O Nbd7 g4',
    texte: 'Les Blancs roquent du grand côté et lancent leurs pions vers le roi noir.', texte_en: 'White castles queenside and launches the pawns at the black king.' }] });

ouv({ id: 'dragon-yougoslave', niveau: 'expert', parent: 'dragon', nom: 'Dragon : attaque yougoslave', nom_en: 'Dragon: Yugoslav Attack',
  coups: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3 O-O Qd2 Nc6 Bc4',
  resume: 'Les Blancs jouent Fe3, f3 et Dd2, puis roquent du grand côté. Leur plan est simple : échanger le fou g7 avec Fh6, puis attaquer sur la colonne h. Les Noirs contre-attaquent sur la colonne c.',
  resume_en: 'White plays Be3, f3 and Qd2, then castles queenside. The plan is simple: trade off the g7 bishop with Bh6, then attack down the h-file. Black counter-attacks on the c-file.',
  idees: ['Le fou c4 vise le roi noir et freine d5.', 'h4-h5 ouvre la colonne h.', 'Les Noirs sacrifient souvent la qualité en c3 (Txc3).'],
  idees_en: ['The c4 bishop eyes the black king and holds back d5.', 'h4-h5 opens the h-file.', 'Black often sacrifices the exchange on c3 (Rxc3).'],
  suites: [{ nom: 'La course est lancée', nom_en: 'The race is on', coups: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3 O-O Qd2 Nc6 Bc4 Bd7 O-O-O Rc8 Bb3 Ne5 h4',
    texte: 'Chaque camp attaque le roi adverse : le plus rapide gagnera.', texte_en: 'Each side attacks the other king: the faster one wins.' }] });

ouv({ id: 'sveshnikov', niveau: 'expert', parent: 'sicilienne', nom: 'Sicilienne : variante Sveshnikov', nom_en: 'Sicilian: Sveshnikov Variation',
  coups: 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5 Ndb5 d6 Bg5 a6 Na3 b5',
  resume: 'Les Noirs poussent e5 très tôt et chassent le cavalier d4. Ils acceptent une case d5 faible et un pion d6 en retard, en échange de pièces très actives. Magnus Carlsen l\'a beaucoup jouée.',
  resume_en: 'Black pushes e5 very early and kicks the d4 knight. Black accepts a weak d5 square and a backward d6 pawn in return for very active pieces. Magnus Carlsen has played it a lot.',
  idees: ['e5 chasse le cavalier du centre.', 'La case d5 est la clé : les Blancs veulent y installer un cavalier.', 'Les Noirs gagnent du temps en chassant les cavaliers blancs avec a6 et b5.'],
  idees_en: ['e5 kicks the knight out of the centre.', 'The d5 square is the key: White wants to plant a knight there.', 'Black gains time by chasing White\'s knights with a6 and b5.'],
  suites: [{ nom: 'Fxf6 et Cd5', nom_en: 'Bxf6 and Nd5', coups: 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5 Ndb5 d6 Bg5 a6 Na3 b5 Bxf6 gxf6 Nd5 f5',
    texte: 'Les Noirs acceptent des pions abîmés pour garder la paire de fous.', texte_en: 'Black accepts damaged pawns to keep the bishop pair.' }] });

ouv({ id: 'marshall', niveau: 'expert', parent: 'espagnole-fermee', nom: 'Espagnole : attaque Marshall', nom_en: 'Ruy Lopez: Marshall Attack',
  coups: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O c3 d5',
  resume: 'Les Noirs sacrifient le pion e5 avec d5 pour lancer une attaque rapide contre le roi blanc. Frank Marshall l\'aurait gardée secrète pendant des années pour la jouer contre José Raúl Capablanca, en 1918.',
  resume_en: 'Black sacrifices the e5 pawn with d5 to launch a quick attack on the white king. Frank Marshall is said to have kept it secret for years to spring it on José Raúl Capablanca in 1918.',
  idees: ['Un gambit : un pion contre une attaque.', 'Les pièces noires (dame, fous, tour) se dirigent vers le roi blanc.', 'Beaucoup de joueurs l\'évitent avec a4 ou h3 au 8e coup (« anti-Marshall »).'],
  idees_en: ['A gambit: a pawn for an attack.', 'Black\'s pieces (queen, bishops, rook) head for the white king.', 'Many players avoid it with a4 or h3 on move 8 ("Anti-Marshall").'],
  suites: [{ nom: 'Ligne principale', nom_en: 'Main line', coups: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O c3 d5 exd5 Nxd5 Nxe5 Nxe5 Rxe5 c6 d4 Bd6 Re1 Qh4',
    texte: 'Les Noirs ont un pion de moins, mais leur dame arrive déjà près du roi blanc.', texte_en: 'Black is a pawn down, but the queen is already close to the white king.' }] });

ouv({ id: 'tchigorine', niveau: 'expert', parent: 'espagnole-fermee', nom: 'Espagnole fermée : variante Tchigorine', nom_en: 'Closed Ruy Lopez: Chigorin Variation',
  coups: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3 Na5 Bc2 c5',
  resume: 'La ligne la plus classique de l\'espagnole fermée. h3 empêche Fg4, puis le cavalier noir va en a5 pour chasser le fou b3 et préparer c5. Une longue bataille de manœuvres.',
  resume_en: 'The most classical line of the Closed Ruy Lopez. h3 stops Bg4, then the black knight goes to a5 to chase the b3 bishop and prepare c5. A long manoeuvring battle.',
  idees: ['h3 empêche le clouage Fg4.', 'Ca5 chasse le fou et libère le pion c.', 'Les Blancs ramènent souvent le cavalier b1 par d2 et f1 jusqu\'en g3.'],
  idees_en: ['h3 prevents the Bg4 pin.', 'Na5 chases the bishop and frees the c-pawn.', 'White often reroutes the b1 knight via d2 and f1 to g3.'],
  suites: [{ nom: 'Avec d4', nom_en: 'With d4', coups: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3 Na5 Bc2 c5 d4 Qc7 Nbd2',
    texte: 'Les Blancs tiennent le centre et commencent la manœuvre du cavalier.', texte_en: 'White holds the centre and starts the knight manoeuvre.' }] });

ouv({ id: 'fegatello', niveau: 'expert', parent: 'deux-cavaliers', nom: 'Deux cavaliers : attaque Fegatello', nom_en: 'Two Knights: Fried Liver Attack',
  coups: 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5 Nxf7 Kxf7 Qf3+ Ke6 Nc3',
  resume: 'Après Cxd5, les Blancs sacrifient leur cavalier en f7 et attirent le roi noir au centre. Avec Df3+ et Cc3, ils attaquent le cavalier cloué en d5. Une attaque spectaculaire (fegatello veut dire « foie » en italien), mais les Noirs peuvent se défendre.',
  resume_en: 'After Nxd5, White sacrifices the knight on f7 and drags the black king into the centre. With Qf3+ and Nc3, White attacks the pinned d5 knight. A spectacular attack (the "Fried Liver"), but Black can defend.',
  idees: ['Le sacrifice Cxf7 oblige le roi noir à sortir.', 'Le cavalier d5 est cloué devant le roi.', 'Pour l\'éviter, les Noirs jouent plutôt Ca5 au 5e coup.'],
  idees_en: ['The Nxf7 sacrifice forces the black king out.', 'The d5 knight is pinned in front of the king.', 'To avoid it, Black usually plays Na5 on move 5.'],
  suites: [{ nom: 'Une suite folle', nom_en: 'A wild line', coups: 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5 Nxf7 Kxf7 Qf3+ Ke6 Nc3 Ncb4 a3 Nxc2+ Kd1 Nxa1 Nxd5',
    texte: 'Les deux rois sont en danger : le cavalier noir a pris une tour, les Blancs attaquent toujours.', texte_en: 'Both kings are in danger: the black knight has grabbed a rook, and White keeps attacking.' }] });

ouv({ id: 'mur-berlin', niveau: 'expert', parent: 'berlinoise', nom: 'Berlinoise : le mur de Berlin', nom_en: 'Berlin: the Berlin Wall',
  coups: 'e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4 d4 Nd6 Bxc6 dxc6 dxe5 Nf5 Qxd8+ Kxd8',
  resume: 'Les dames s\'échangent dès le 8e coup et le roi noir ne peut plus roquer. Pourtant, avec sa paire de fous, la position noire est très difficile à percer : on l\'appelle le « mur de Berlin ». Kramnik s\'en est servi face à Kasparov en 2000.',
  resume_en: 'The queens come off on move 8 and the black king can no longer castle. Yet with the bishop pair, Black\'s position is very hard to break: it is called the "Berlin Wall". Kramnik used it against Kasparov in 2000.',
  idees: ['Une finale très tôt, sans les dames.', 'Le roi noir reste au centre, mais sans dames ce n\'est pas grave.', 'Les Blancs ont plus de pions à l\'aile roi, les Noirs ont la paire de fous.'],
  idees_en: ['An endgame very early, without queens.', 'The black king stays in the centre, but without queens that is fine.', 'White has more kingside pawns; Black has the bishop pair.'],
  suites: [{ nom: 'Avec Cc3', nom_en: 'With Nc3', coups: 'e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4 d4 Nd6 Bxc6 dxc6 dxe5 Nf5 Qxd8+ Kxd8 Nc3 Ke8 h3',
    texte: 'Le roi noir revient en e8 ; les Blancs préparent l\'avance de leurs pions.', texte_en: 'The black king returns to e8; White prepares to advance the pawns.' }] });

ouv({ id: 'pion-empoisonne', niveau: 'expert', parent: 'winawer', nom: 'Winawer : variante du pion empoisonné', nom_en: 'Winawer: Poisoned Pawn Variation',
  coups: 'e4 e6 d4 d5 Nc3 Bb4 e5 c5 a3 Bxc3+ bxc3 Ne7 Qg4 Qc7 Qxg7 Rg8 Qxh7 cxd4',
  resume: 'La dame blanche fonce en g7 et prend deux pions de l\'aile roi. En échange, les Noirs attaquent le centre et ouvrent des lignes vers le roi blanc. Une des variantes les plus folles de la française.',
  resume_en: 'The white queen dashes to g7 and grabs two kingside pawns. In return, Black attacks the centre and opens lines towards the white king. One of the wildest lines of the French.',
  idees: ['Dg4 attaque g7 tant que le roi noir n\'a pas roqué.', 'Les Noirs donnent les pions g7 et h7 pour gagner de l\'activité.', 'La tour noire profite de la colonne g ouverte.'],
  idees_en: ['Qg4 attacks g7 while the black king has not castled.', 'Black gives up the g7 and h7 pawns for activity.', 'The black rook makes use of the open g-file.'],
  suites: [{ nom: 'Avec Ce2', nom_en: 'With Ne2', coups: 'e4 e6 d4 d5 Nc3 Bb4 e5 c5 a3 Bxc3+ bxc3 Ne7 Qg4 Qc7 Qxg7 Rg8 Qxh7 cxd4 Ne2 Nbc6 f4',
    texte: 'Les Blancs protègent leur centre ; le roi blanc reste au milieu.', texte_en: 'White shores up the centre; the white king stays in the middle.' }] });

ouv({ id: 'meran', niveau: 'expert', parent: 'slave', nom: 'Semi-slave : variante Meran', nom_en: 'Semi-Slav: Meran Variation',
  coups: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 e6 e3 Nbd7 Bd3 dxc4 Bxc4 b5',
  resume: 'Les Noirs mélangent les idées de la slave (c6) et du gambit dame refusé (e6). Ils prennent en c4, puis chassent le fou avec b5 pour gagner de l\'espace à l\'aile dame. Le nom vient du tournoi de Merano, en Italie, en 1924.',
  resume_en: 'Black combines ideas from the Slav (c6) and the Queen\'s Gambit Declined (e6), takes on c4, then chases the bishop with b5 to gain queenside space. It is named after the 1924 Merano tournament in Italy.',
  idees: ['c6 et e6 forment un triangle solide autour de d5.', 'b5 gagne du temps sur le fou c4.', 'Les Noirs préparent c5 pour attaquer le centre.'],
  idees_en: ['c6 and e6 form a solid triangle around d5.', 'b5 gains time on the c4 bishop.', 'Black prepares c5 to attack the centre.'],
  suites: [{ nom: 'Avec c5', nom_en: 'With c5', coups: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 e6 e3 Nbd7 Bd3 dxc4 Bxc4 b5 Bd3 Bb7 O-O a6 e4 c5',
    texte: 'Les Noirs gagnent de l\'espace et frappent le centre avec c5.', texte_en: 'Black gains space and strikes the centre with c5.' }] });

ouv({ id: 'mar-del-plata', niveau: 'expert', parent: 'est-indienne-classique', nom: 'Est-indienne : variante Mar del Plata', nom_en: 'King\'s Indian: Mar del Plata Variation',
  coups: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7',
  resume: 'Les Blancs ferment le centre avec d5. Alors chacun attaque sur son aile : les Blancs à l\'aile dame avec c5, les Noirs à l\'aile roi avec f5, g5, g4… directement contre le roi blanc.',
  resume_en: 'White closes the centre with d5. Then each side attacks on its own wing: White on the queenside with c5, Black on the kingside with f5, g5, g4… straight at the white king.',
  idees: ['Le centre est fermé : on attaque sur les ailes.', 'Le cavalier e7 laisse passer le pion f.', 'Souvent une course : qui arrivera le premier ?'],
  idees_en: ['The centre is closed: the play is on the wings.', 'The e7 knight makes way for the f-pawn.', 'Often a race: who will get there first?'],
  suites: [{ nom: 'Avec Ce1 et f5', nom_en: 'With Ne1 and f5', coups: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7 Ne1 Nd7 Nd3 f5',
    texte: 'Les Noirs lancent leur pion f, les Blancs préparent c5.', texte_en: 'Black launches the f-pawn while White prepares c5.' }] });

ouv({ id: 'tartakower', niveau: 'expert', parent: 'gd-refuse', nom: 'Gambit dame refusé : défense Tartakower', nom_en: 'Queen\'s Gambit Declined: Tartakower Defence',
  coups: 'd4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 h6 Bh4 b6',
  resume: 'Les Noirs jouent h6 pour poser une question au fou g5, puis b6 pour sortir leur fou c8 en b7. Ce fou, souvent enfermé dans le gambit dame refusé, devient ainsi actif. Une défense très solide.',
  resume_en: 'Black plays h6 to question the g5 bishop, then b6 to develop the c8 bishop on b7. That bishop, often shut in in the Queen\'s Gambit Declined, becomes active. A very solid defence.',
  idees: ['h6 oblige le fou à choisir : prendre ou reculer.', 'b6 et Fb7 règlent le problème du fou c8.', 'Les Noirs jouent ensuite c5 pour libérer leur jeu.'],
  idees_en: ['h6 makes the bishop choose: take or retreat.', 'b6 and Bb7 solve the problem of the c8 bishop.', 'Black then plays c5 to free the game.'],
  suites: [{ nom: 'Avec Fxf6', nom_en: 'With Bxf6', coups: 'd4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 h6 Bh4 b6 Be2 Bb7 Bxf6 Bxf6 cxd5 exd5',
    texte: 'Les Blancs échangent pour créer des faiblesses dans le camp noir.', texte_en: 'White exchanges to create weaknesses in Black\'s camp.' }] });

ouv({ id: 'nimzo-classique', niveau: 'expert', parent: 'nimzo-indienne', nom: 'Nimzo-indienne : variante classique (Dc2)', nom_en: 'Nimzo-Indian: Classical Variation (Qc2)',
  coups: 'd4 Nf6 c4 e6 Nc3 Bb4 Qc2 O-O a3 Bxc3+ Qxc3 b6 Bg5 Bb7',
  resume: 'Avec Dc2, les Blancs protègent le cavalier c3 pour pouvoir reprendre avec la dame, sans pions doublés. Ils gardent la paire de fous ; les Noirs développent leur fou en b7 et visent la case e4.',
  resume_en: 'With Qc2, White protects the c3 knight so as to recapture with the queen, avoiding doubled pawns. White keeps the bishop pair; Black develops the bishop to b7 and eyes e4.',
  idees: ['Dc2 évite les pions doublés.', 'a3 oblige le fou noir à se décider.', 'Le fou b7 contrôle la grande diagonale et la case e4.'],
  idees_en: ['Qc2 avoids doubled pawns.', 'a3 forces the black bishop to decide.', 'The b7 bishop controls the long diagonal and e4.'],
  suites: [{ nom: 'Avec f3', nom_en: 'With f3', coups: 'd4 Nf6 c4 e6 Nc3 Bb4 Qc2 O-O a3 Bxc3+ Qxc3 b6 Bg5 Bb7 f3 h6 Bh4 d5',
    texte: 'Les Blancs préparent e4, les Noirs frappent tout de suite avec d5.', texte_en: 'White prepares e4; Black strikes at once with d5.' }] });

ouv({ id: 'grunfeld-tb1', niveau: 'expert', parent: 'grunfeld', nom: 'Grünfeld : échange moderne (Tb1)', nom_en: 'Grünfeld: Modern Exchange (Rb1)',
  coups: 'd4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3 bxc3 Bg7 Nf3 c5 Rb1 O-O Be2',
  resume: 'Les Blancs jouent Tb1 pour sortir leur tour de la diagonale du fou g7 et attaquer le pion b7. Les Noirs attaquent d4 avec c5 et leurs pièces ; ils peuvent même prendre le pion a2.',
  resume_en: 'White plays Rb1 to get the rook off the g7 bishop\'s diagonal and to attack the b7 pawn. Black attacks d4 with c5 and the pieces, and can even grab the a2 pawn.',
  idees: ['Tb1 vise b7 et quitte la grande diagonale.', 'Tout tourne autour du pion d4.', 'Si la dame noire prend a2, les Blancs gagnent du temps pour attaquer.'],
  idees_en: ['Rb1 eyes b7 and leaves the long diagonal.', 'Everything revolves around the d4 pawn.', 'If the black queen takes a2, White gains time to attack.'],
  suites: [{ nom: 'La prise du pion a2', nom_en: 'Grabbing the a2 pawn', coups: 'd4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3 bxc3 Bg7 Nf3 c5 Rb1 O-O Be2 cxd4 cxd4 Qa5+ Bd2 Qxa2 O-O',
    texte: 'La dame noire gagne un pion ; les Blancs ont de l\'avance pour attaquer.', texte_en: 'The black queen wins a pawn; White is ahead in development to attack.' }] });

ouv({ id: 'evans-accepte', niveau: 'expert', parent: 'evans', nom: 'Gambit Evans accepté', nom_en: 'Evans Gambit Accepted',
  coups: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O',
  resume: 'Les Noirs prennent le pion b4, le fou recule en a5 et les Blancs ouvrent le centre avec d4. Ils ont donné des pions… mais leurs pièces sont prêtes à attaquer le roi noir, resté au centre.',
  resume_en: 'Black takes the b4 pawn, the bishop retreats to a5 and White opens the centre with d4. White has given up pawns… but the pieces are ready to attack the black king, still in the centre.',
  idees: ['Les Blancs donnent du matériel pour ouvrir le centre.', 'Le roi noir n\'a pas encore roqué.', 'Les Blancs visent f7 et la colonne e.'],
  idees_en: ['White gives up material to open the centre.', 'The black king has not castled yet.', 'White aims at f7 and the e-file.'],
  suites: [{ nom: 'Avec Cge7', nom_en: 'With Nge7', coups: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O Nge7 cxd4 d5',
    texte: 'Les Noirs rendent un pion pour se dégager.', texte_en: 'Black gives a pawn back to free the position.' }] });

ouv({ id: 'mieses', niveau: 'expert', parent: 'ecossaise', nom: 'Écossaise : variante Mieses', nom_en: 'Scotch: Mieses Variation',
  coups: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2 Nd5 c4',
  resume: 'Les Blancs prennent en c6, poussent e5 pour chasser le cavalier f6, puis chassent encore le cavalier d5 avec c4. La dame noire en e7 bloque son propre fou, mais elle attaque e5. Une position originale, où chaque camp a ses faiblesses.',
  resume_en: 'White takes on c6, pushes e5 to kick the f6 knight, then kicks the d5 knight again with c4. The black queen on e7 blocks her own bishop but attacks e5. An unusual position where both sides have weaknesses.',
  idees: ['Cxc6 abîme les pions noirs.', 'Le pion e5 gêne beaucoup les pièces noires.', 'De2 protège e5 et met les deux dames face à face.'],
  idees_en: ['Nxc6 damages Black\'s pawns.', 'The e5 pawn cramps Black\'s pieces.', 'Qe2 protects e5 and puts the two queens face to face.'],
  suites: [{ nom: 'Avec Fa6', nom_en: 'With Ba6', coups: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2 Nd5 c4 Ba6 b3',
    texte: 'Le fou noir attaque le pion c4 ; les Blancs le protègent.', texte_en: 'The black bishop attacks the c4 pawn; White protects it.' }] });

ouv({ id: 'steinitz', niveau: 'expert', parent: 'francaise', nom: 'Française : variante Steinitz', nom_en: 'French: Steinitz Variation',
  coups: 'e4 e6 d4 d5 Nc3 Nf6 e5 Nfd7 f4 c5 Nf3 Nc6 Be3',
  resume: 'Les Blancs avancent e5 et soutiennent leur chaîne de pions avec f4. Les Noirs attaquent la base, d4, avec c5 et Cc6. Une lutte typique de la française : l\'espace des Blancs contre la contre-attaque des Noirs.',
  resume_en: 'White pushes e5 and supports the pawn chain with f4. Black attacks its base, d4, with c5 and Nc6. A typical French battle: White\'s space against Black\'s counter-attack.',
  idees: ['La chaîne f4-e5 donne de l\'espace aux Blancs.', 'Les Noirs frappent la base de la chaîne : d4.', 'Plus tard, les Blancs peuvent attaquer avec f5.'],
  idees_en: ['The f4-e5 chain gives White space.', 'Black strikes the base of the chain: d4.', 'Later, White can attack with f5.'],
  suites: [{ nom: 'Avec Fc5', nom_en: 'With Bc5', coups: 'e4 e6 d4 d5 Nc3 Nf6 e5 Nfd7 f4 c5 Nf3 Nc6 Be3 cxd4 Nxd4 Bc5 Qd2',
    texte: 'Les Noirs échangent au centre et sortent leur fou en c5.', texte_en: 'Black exchanges in the centre and develops the bishop to c5.' }] });

// =====================================================================================================
// Calculs
// =====================================================================================================
function rejouer(san, quoi) {
  const jeu = new Chess();
  const fens = [jeu.fen().split(' ').slice(0, 4).join(' ')];
  const coups = [], sans = [];
  for (const s of san.trim().split(/\s+/)) {
    let m;
    try { m = jeu.move(s); } catch (e) { m = null; }
    if (!m) throw new Error(`${quoi} : coup impossible « ${s} » (${san})`);
    // déplacements à animer : la pièce, plus la tour quand on roque
    const d = [[m.from, m.to]];
    if (m.flags.includes('k')) d.push(m.color === 'w' ? ['h1', 'f1'] : ['h8', 'f8']);
    if (m.flags.includes('q')) d.push(m.color === 'w' ? ['a1', 'd1'] : ['a8', 'd8']);
    coups.push(d);
    sans.push(m.san);
    fens.push(jeu.fen().split(' ').slice(0, 4).join(' '));
  }
  return { san: sans, coups, fens };
}

// noms Lichess : la ligne connue la plus longue qui commence comme notre ouverture
const FICHIER_LICHESS = path.join(__dirname, 'ouvertures-lichess.json');
function nomsLichess(dossier) {
  const lignes = [];
  for (const f of ['a', 'b', 'c', 'd', 'e']) {
    for (const l of fs.readFileSync(path.join(dossier, f + '.tsv'), 'utf8').split('\n').slice(1)) {
      const [eco, nom, pgn] = l.split('\t');
      if (!pgn) continue;
      lignes.push({ eco, nom, san: pgn.replace(/\d+\.\s*/g, '').trim().split(/\s+/) });
    }
  }
  const res = {};
  for (const o of O) {
    const s = rejouer(o.coups, o.id).san;
    let meilleur = null;
    for (const l of lignes) {
      if (l.san.length > s.length || !l.san.every((x, i) => x === s[i])) continue;
      if (!meilleur || l.san.length > meilleur.san.length) meilleur = l;
    }
    res[o.id] = meilleur ? { eco: meilleur.eco, nom: meilleur.nom, plis: meilleur.san.length } : null;
  }
  fs.writeFileSync(FICHIER_LICHESS, JSON.stringify(res, null, 1) + '\n');
  return res;
}
// adresse d'une page d'ouverture sur Lichess (même calcul que lichess : accents et ponctuation retirés, espaces en _)
const cleLichess = (nom) => nom.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '_').replace(/[^\w-]+/g, '');

const lichess = process.argv[2] ? nomsLichess(process.argv[2]) : JSON.parse(fs.readFileSync(FICHIER_LICHESS, 'utf8'));
const ids = new Set();
const NIVEAUX = { facile: [2, 3], moyen: [4, 6], expert: [6, 99] };
const sortie = O.map((o) => {
  if (ids.has(o.id)) throw new Error('identifiant en double : ' + o.id);
  ids.add(o.id);
  if (o.parent && !O.some(p => p.id === o.parent)) throw new Error(`${o.id} : parent inconnu ${o.parent}`);
  for (const k of ['nom', 'nom_en', 'resume', 'resume_en']) if (!o[k]) throw new Error(`${o.id} : ${k} manquant`);
  if (o.idees.length !== o.idees_en.length) throw new Error(`${o.id} : idées sans traduction`);
  const r = rejouer(o.coups, o.id);
  const nbCoups = Math.ceil(r.san.length / 2);
  const [min, max] = NIVEAUX[o.niveau];
  if (nbCoups < min || nbCoups > max) throw new Error(`${o.id} : ${nbCoups} coups pour le niveau ${o.niveau}`);
  const suites = (o.suites || []).map((s) => {
    const rs = rejouer(s.coups, `${o.id} / ${s.nom}`);
    if (!r.san.every((x, i) => x === rs.san[i])) throw new Error(`${o.id} / ${s.nom} : ne commence pas par l'ouverture`);
    return { nom: s.nom, nom_en: s.nom_en, texte: s.texte, texte_en: s.texte_en, ...rs };
  });
  const l = lichess[o.id];
  const coupsUrl = r.san.map(x => x.replace(/[+#]/g, '')).join('_');
  return {
    id: o.id, niveau: o.niveau, parent: o.parent || null, nom: o.nom, nom_en: o.nom_en,
    ...r,
    resume: o.resume, resume_en: o.resume_en, idees: o.idees, idees_en: o.idees_en, suites,
    lichess: l ? {
      eco: l.eco, nom: l.nom,
      // la page de l'ouverture, à la position exacte quand notre ligne va plus loin que le nom
      page: `https://lichess.org/opening/${cleLichess(l.nom)}${l.plis < r.san.length ? '/' + coupsUrl : ''}`,
    } : null,
    analyse: `https://lichess.org/analysis/pgn/${coupsUrl}`,
  };
});

const fichier = path.join(__dirname, '..', 'jeux', 'ouvertures', 'donnees.js');
fs.mkdirSync(path.dirname(fichier), { recursive: true });
fs.writeFileSync(fichier,
  '/* Ouvertures du « Quiz des ouvertures » et de leurs fiches — fichier généré par outils/ouvertures.js, ne pas modifier à la main. */\n' +
  `window.OUVERTURES = ${JSON.stringify(sortie)};\n`);
const compte = (n) => sortie.filter(o => o.niveau === n).length;
console.log(`${sortie.length} ouvertures (facile ${compte('facile')}, moyen ${compte('moyen')}, expert ${compte('expert')}) → ${path.relative(process.cwd(), fichier)}`);
for (const o of sortie) console.log(`${o.niveau.padEnd(7)} ${o.id.padEnd(24)} ${String(Math.ceil(o.san.length / 2)).padStart(2)} coups  ${o.lichess ? o.lichess.eco + ' ' + o.lichess.nom : '(pas de nom Lichess)'}`);
