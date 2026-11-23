/* L'aide des jeux : un petit bouton « ? » à côté des réglages ouvre un tutoriel en quelques étapes, dans une fenêtre
   (précédent / suivant ; flèches du clavier, Entrée, Échap). Le jeu est reconnu par son dossier (jeux/<nom>/).
   - Le premier passage dans un jeu, le bouton « ? » bat doucement, pour qu'on le remarque (clé echecs.aide.<nom>).
   - « Capture le roi » et « Le cheval de la reine » donnent leur objectif du moment (l'équipe, la pièce jouée) :
     Aide.objectif = () => ({ titre, texte }) ; il remplace la première étape.
   - Dice chess a déjà ses règles illustrées : le « ? » les ouvre. */
(function () {
  const EN = document.documentElement.lang === 'en';
  const t = (fr, en) => (EN ? en : fr);
  const jeu = (location.pathname.match(/\/jeux\/([^/]+)\//) || [])[1];
  const k = (x) => `<kbd>${x}</kbd>`;

  // ---------- Les tutoriels : [titre, texte] en français et en anglais ----------
  const TUTORIELS = {
    labyrinthe: [
      [t('Ramène la pièce à sa maison', 'Bring the piece home'),
        t('Une pièce (cavalier, fou, tour ou dame) doit rentrer à sa maison 🏠. Des obstacles lui barrent la route : pierres, eau, lave ou buissons.',
          'A piece (knight, bishop, rook or queen) has to get back home 🏠. Obstacles are in the way: stones, water, lava or bushes.')],
      [t('Fais-la avancer', 'Move it'),
        t('Touche une case où elle peut aller, ou fais-la glisser. Touche la pièce pour voir toutes ses cases possibles. Le cavalier saute par-dessus les obstacles.',
          'Tap a square it can reach, or drag it. Tap the piece to see all the squares it can go to. The knight jumps over obstacles.')],
      [t('Le chemin le plus court', 'The shortest path'),
        t('Arrive en le moins de coups possible pour gagner les 3 étoiles. « Recommencer » remet la pièce au départ, « Solution » montre le chemin.',
          'Get there in as few moves as possible to win all 3 stars. “Restart” puts the piece back, “Solution” shows the way.')],
      [t('Les défis', 'Challenges'),
        t('Avec « Défis » : 10 labyrinthes à faire par le chemin le plus court, ou le défi chrono, 30 secondes par labyrinthe.',
          'With “Challenges”: 10 mazes to solve by the shortest path, or the timed challenge, 30 seconds per maze.')],
    ],
    roi: [
      [t('Capture le roi !', 'Capture the king!'),
        t('Avec ton équipe blanche, attrape le roi noir en le moins de coups possible.', 'With your white team, catch the black king in as few moves as possible.')],
      [t('Le roi noir', 'The black king'),
        t('Il doit bouger à chaque coup. Quand il ne peut plus bouger (mat ou pat), tu le prends au coup suivant. Attention : il peut prendre une de tes pièces si elle n\'est pas protégée !',
          'It has to move every turn. When it can\'t move any more (mate or stalemate), you take it on the next move. Careful: it can take one of your pieces if it isn\'t protected!')],
      [t('Jouer', 'Playing'),
        t('Touche ta pièce puis sa case d\'arrivée, ou fais-la glisser. En haut, choisis ton équipe et le niveau. Dans les réglages, « Cases dangereuses » montre en rouge où le roi peut prendre ta pièce.',
          'Tap your piece then its destination, or drag it. At the top, choose your team and the level. In the settings, “Dangerous squares” shows in red where the king could take your piece.')],
      [t('Les étoiles', 'Stars'),
        t('Moins tu joues de coups, plus tu gagnes d\'étoiles : le panneau dit le plus court possible. « Recommencer » rejoue la même position.',
          'The fewer moves you play, the more stars you win: the panel shows the shortest possible. “Restart” replays the same position.')],
      [t('Les défis', 'Challenges'),
        t('5 parties à la suite (jusqu\'à 15 étoiles), ou le défi chrono : 15 secondes par coup.', '5 games in a row (up to 15 stars), or the timed challenge: 15 seconds per move.')],
    ],
    mat: [
      [t('Mat ou pas mat ?', 'Mate or not mate?'),
        t('Une position s\'affiche. Le roi du camp qui doit jouer est-il échec et mat ?', 'A position appears. Is the king of the side to move checkmated?')],
      [t('Réponds', 'Answer'),
        t('Touche « Échec et mat » ou « Pas mat ». Avec le bouton « Pat », en haut, il y a une troisième réponse : pat (le roi n\'est pas en échec, mais son camp ne peut plus bouger).',
          'Tap “Checkmate” or “Not mate”. With the “Stalemate” switch at the top, there is a third answer: stalemate (the king isn\'t in check, but its side can\'t move).')],
      [t('L\'explication', 'The explanation'),
        t('Chaque réponse est expliquée. Quand ce n\'est pas mat, tu vois comment s\'en sortir : le roi s\'enfuit, on prend l\'attaquant, ou une pièce bloque l\'échec.',
          'Every answer is explained. When it isn\'t mate, you see the way out: the king runs away, the attacker is taken, or a piece blocks the check.')],
      [t('Les défis', 'Challenges'),
        t(`10 positions, ou le défi chrono : 20 secondes par position. Sur un ordinateur : ${k('M')} mat, ${k('P')} pas mat, ${k('T')} pat, ${k('Entrée')} suivant.`,
          `10 positions, or the timed challenge: 20 seconds per position. On a computer: ${k('M')} mate, ${k('P')} not mate, ${k('T')} stalemate, ${k('Enter')} next.`)],
    ],
    cases: [
      [t('Trouve la case', 'Find the square'),
        t('Une case s\'affiche, par exemple e4 : touche-la sur l\'échiquier.', 'A square appears, for example e4: tap it on the board.')],
      [t('Lettre et chiffre', 'Letter and number'),
        t('La lettre donne la colonne (de a à h), le chiffre la rangée (de 1 à 8). En haut, choisis de quel côté tu regardes l\'échiquier : celui des Blancs, des Noirs, ou au hasard.',
          'The letter gives the file (a to h), the number the rank (1 to 8). At the top, choose which side you look from: White\'s, Black\'s, or random.')],
      [t('Pour les tout-petits', 'For little ones'),
        t('Dans les réglages, le mode tout-petits met des animaux pour les colonnes et des doigts pour les rangées.', 'In the settings, the little ones mode shows animals for the files and fingers for the ranks.')],
      [t('Les défis', 'Challenges'),
        t('10 cases à trouver, ou le défi chrono : le plus de cases possible en 20 secondes.', '10 squares to find, or the timed challenge: as many squares as you can in 20 seconds.')],
    ],
    notation: [
      [t('Note le coup', 'Write the move'),
        t('Le dernier coup se rejoue sur l\'échiquier : écris-le, comme sur une feuille de partie.', 'The last move is replayed on the board: write it down, like on a score sheet.')],
      [t('Comment l\'écrire', 'How to write it'),
        t('D\'abord la pièce en majuscule (R roi, D dame, T tour, F fou, C cavalier ; rien pour un pion), puis sa case d\'arrivée : Cf3, e4. Pour une prise, un x : Fxe5.',
          'First the piece in capitals (K king, Q queen, R rook, B bishop, N knight; nothing for a pawn), then its destination: Nf3, e4. For a capture, an x: Bxe5.')],
      [t('Valide', 'Check it'),
        t('Écris avec le clavier à l\'écran (ou celui de l\'ordinateur), puis valide. Le bouton à côté de l\'échiquier fait revoir le coup.',
          'Type with the on-screen keyboard (or the computer\'s), then check it. The button next to the board replays the move.')],
      [t('Plus difficile', 'Harder'),
        t('Au niveau difficile : échec (+), mat (#), roque (0-0), promotion (e8=D)… Défis : 10 coups, ou 20 secondes par coup.',
          'At the hard level: check (+), mate (#), castling (O-O), promotion (e8=Q)… Challenges: 10 moves, or 20 seconds per move.')],
    ],
    joue: [
      [t('Joue comme un champion', 'Play like a champion'),
        t('Choisis un champion ou une championne : une de ses vraies parties se joue toute seule sur l\'échiquier.', 'Choose a champion: one of their real games plays by itself on the board.')],
      [t('À toi de jouer', 'Your turn'),
        t('Aux moments importants, la partie s\'arrête : c\'est toi qui joues à sa place. Au niveau facile, le coup est écrit ; au niveau difficile, il faut le trouver.',
          'At the key moments, the game stops: you play instead of the champion. At the easy level, the move is written; at the hard level, you have to find it.')],
      [t('Jouer le coup', 'Playing the move'),
        t('Fais glisser la pièce, ou touche-la puis touche sa case. « Indice » fait briller la pièce qui doit bouger, « Montre-moi » joue le coup.',
          'Drag the piece, or tap it and then its square. “Hint” makes the piece to move glow, “Show me” plays the move.')],
      [t('Comprendre', 'Understanding'),
        t('Après chaque coup, une explication avec des flèches. Les flèches sous l\'échiquier font revoir la partie.', 'After each move, an explanation with arrows. The arrows below the board let you replay the game.')],
    ],
    mots: [
      [t('Comment ça s\'appelle ?', 'What\'s it called?'),
        t('Une image s\'affiche : une pièce, une case, un coup… Écris son nom, lettre par lettre. Le petit mot (le, la, un…) est déjà écrit.',
          'A picture appears: a piece, a square, a move… Write its name, letter by letter. The little word (the, a…) is already written.')],
      [t('Langue et niveau', 'Language and level'),
        t('En haut, choisis la langue (9 langues) et le niveau. Le haut-parleur lit le mot.', 'At the top, choose the language (9 languages) and the level. The speaker reads the word aloud.')],
      [t('Un peu d\'aide', 'A little help'),
        t('Une lettre fausse n\'est pas posée ; après 3 erreurs, elle apparaît en pâle. « Indice » ne garde sur le clavier que les lettres du mot, « Solution » montre le mot.',
          'A wrong letter isn\'t placed; after 3 mistakes, it appears faintly. “Hint” keeps only the word\'s letters on the keyboard, “Solution” shows the word.')],
      [t('Les défis', 'Challenges'),
        t('10 mots, ou le défi chrono : 30 secondes par mot.', '10 words, or the timed challenge: 30 seconds per word.')],
    ],
    balance: [
      [t('La balance', 'The scales'),
        t('Pose des pièces de chaque côté de la balance : elle penche du côté le plus lourd.', 'Put pieces on each side of the scales: they tip towards the heavier side.')],
      [t('La valeur des pièces', 'Piece values'),
        t('Chaque pièce a une valeur : pion 1, cavalier 3, fou 3, tour 5, dame 9.', 'Each piece has a value: pawn 1, knight 3, bishop 3, rook 5, queen 9.')],
      [t('Équilibre-la', 'Balance it'),
        t('Les deux côtés doivent valoir autant ! Touche une pièce sur un plateau pour l\'enlever.', 'Both sides must be worth the same! Tap a piece on a pan to remove it.')],
      [t('Les défis', 'Challenges'),
        t('10 balances à équilibrer, ou le défi chrono : 20 secondes par balance.', '10 scales to balance, or the timed challenge: 20 seconds per scale.')],
    ],
    cheval: [
      [t('Le cheval de la reine', 'The queen\'s horse'),
        t('La dame poursuit le cavalier.', 'The queen chases the knight.')],
      [t('Choisis ta pièce', 'Choose your piece'),
        t('En haut : la dame (attrape le cavalier), le cavalier (échappe à la dame) ou à deux, sur le même écran.', 'At the top: the queen (catch the knight), the knight (escape from the queen), or two players on the same screen.')],
      [t('Jouer', 'Playing'),
        t('Fais glisser ta pièce, ou touche-la puis touche sa case. Attention : le cavalier prend la dame si elle se pose sur une case qu\'il attaque. Dans les réglages, « Cases dangereuses » les montre en rouge.',
          'Drag your piece, or tap it and then its square. Careful: the knight takes the queen if she lands on a square it attacks. In the settings, “Dangerous squares” shows them in red.')],
      [t('Les étoiles et les défis', 'Stars and challenges'),
        t('Avec la dame, attrape le cavalier en 5 coups ou moins pour les 3 étoiles ; avec le cavalier, tiens le plus longtemps possible. Défis : 5 parties, ou 10 secondes par coup.',
          'With the queen, catch the knight in 5 moves or fewer for all 3 stars; with the knight, last as long as you can. Challenges: 5 games, or 10 seconds per move.')],
    ],
    ouvertures: [
      [t('Quiz des ouvertures', 'Openings quiz'),
        t('Les premiers coups d\'une ouverture célèbre se jouent sur l\'échiquier : reconnais-la !', 'The first moves of a famous opening are played on the board: recognise it!')],
      [t('Réponds', 'Answer'),
        t('Choisis parmi les quatre noms. Les flèches sous l\'échiquier, ou la liste des coups, font revoir les coups.', 'Choose one of the four names. The arrows below the board, or the list of moves, let you replay the moves.')],
      [t('Pour aller plus loin', 'Going further'),
        t('Après ta réponse : l\'idée de l\'ouverture, « En savoir plus », et « Rejouer l\'ouverture » pour jouer ses coups toi-même.',
          'After your answer: the idea of the opening, “Learn more”, and “Replay the opening” to play its moves yourself.')],
      [t('Niveaux et défis', 'Levels and challenges'),
        t(`Trois niveaux : facile, moyen, expert. Défis : 10 ouvertures, ou 20 secondes par ouverture. Sur un ordinateur : ${k('1')} à ${k('4')} pour répondre, ${k('←')} ${k('→')} pour revoir les coups.`,
          `Three levels: easy, medium, expert. Challenges: 10 openings, or 20 seconds per opening. On a computer: ${k('1')} to ${k('4')} to answer, ${k('←')} ${k('→')} to replay the moves.`)],
    ],
    mat1: [
      [t('Mat en un', 'Mate in one'),
        t('Un grand maître vient de faire une gaffe : son adversaire peut faire échec et mat en un seul coup. Trouve ce coup !',
          'A grandmaster has just blundered: the opponent can checkmate in a single move. Find that move!')],
      [t('Jouer', 'Playing'),
        t('Fais glisser la pièce, ou touche-la puis touche sa case. En haut, « Revoir le coup » rejoue la gaffe et la double flèche tourne l\'échiquier.',
          'Drag the piece, or tap it and then its square. At the top, “Replay the move” shows the blunder again and the double arrow flips the board.')],
      [t('Un peu d\'aide', 'A little help'),
        t('Un coup qui ne fait pas mat est expliqué. « Indice » éclaire la pièce qui mate, puis « Solution » montre le coup.', 'A move that isn\'t mate is explained. “Hint” lights up the mating piece, then “Solution” shows the move.')],
      [t('Après le mat', 'After the mate'),
        t('Le motif du mat, et ce qui s\'est passé dans la vraie partie. Défis : 10 positions (un seul essai), ou 30 secondes par position.',
          'The mating pattern, and what happened in the real game. Challenges: 10 positions (one try only), or 30 seconds per position.')],
    ],
    mer: [
      [t('La mer rouge', 'The Red Sea'),
        t('Fais traverser la mer rouge à tes 8 pions, peints de trois couleurs, sans te faire attraper par Pom\' !',
          'Get your 8 pawns, painted in three colours, across the Red Sea without Pom\' catching them!')],
      [t('La question', 'The question'),
        t('Chaque tour, les pions demandent « Petit poisson, peut-on traverser la mer rouge ? ». Pom\' répond : « À condition d\'avoir du… » et une couleur.',
          'Each turn, the pawns ask "Little fish, may we cross the Red Sea?". Pom\' answers: "Only if you\'re wearing…" and a colour.')],
      [t('Avancer', 'Moving'),
        t('Seuls les pions qui ont cette couleur peuvent avancer, chacun une fois : une case, ou deux depuis la case de départ. Touche un pion, puis « Finir le tour ».',
          'Only the pawns wearing that colour can move, each one once: one square, or two from its starting square. Tap a pawn, then "End the turn".')],
      [t('Attention à Pom\'', 'Watch out for Pom\''),
        t('Pom\' saute où il veut et attrape un pion qui n\'a pas la couleur annoncée et qui a quitté sa case de départ… sauf s\'il est défendu : un autre pion juste derrière lui, en diagonale. Fais des chaînes de pions ! Le point d\'exclamation montre les pions en danger.',
          'Pom\' jumps anywhere and catches a pawn that isn\'t wearing the announced colour and has left its starting square… unless it is defended: another pawn just behind it, diagonally. Build pawn chains! The exclamation mark shows the pawns in danger.')],
    ],
    aveugle: [
      [t('À l\'aveugle', 'Blindfold'),
        t('Une vraie partie contre l\'ordinateur… sans voir l\'échiquier ! Il faut se souvenir de la position dans sa tête.',
          'A real game against the computer… without seeing the board! You have to keep the position in your head.')],
      [t('Joue ton coup', 'Play your move'),
        t('Écris-le sur la feuille de partie, comme dans « Note le coup » : Cf3, e4, Fxc4, O-O… puis « Jouer ». Tu peux aussi le dire avec le micro : « cavalier f3 ».',
          'Write it on the score sheet, like in “Write the move”: Nf3, e4, Bxc4, O-O… then “Play”. You can also say it with the microphone: “knight f3”.')],
      [t('Écoute l\'ordinateur', 'Listen to the computer'),
        t('L\'ordinateur répond tout de suite : son coup s\'écrit sur la feuille et il le dit à voix haute. Le haut-parleur le fait répéter.',
          'The computer answers right away: its move is written on the sheet and read aloud. The speaker repeats it.')],
      [t('Un coup d\'œil', 'A quick peek'),
        t('Garde le doigt appuyé sur « Coup d\'œil » (ou la barre d\'espace) pour voir l\'échiquier un instant. Le compteur dit combien de fois tu as regardé !',
          'Hold your finger on “Peek” (or the space bar) to see the board for a moment. The counter shows how many times you looked!')],
      [t('Niveaux', 'Levels'),
        t('En haut : le niveau de l\'ordinateur (1 à 4) et ta couleur. Dans les réglages, l\'ordinateur « adaptatif » joue moins bien quand il gagne et se défend mieux quand il perd.',
          'At the top: the computer\'s level (1 to 4) and your colour. In the settings, the “adaptive” computer plays worse when it\'s winning and defends better when it\'s losing.')],
    ],
  };

  const Aide = window.Aide = { objectif: null, ouvrir };
  let etape = 0, etapes = [], voile = null;

  function construire() {
    voile = document.createElement('div');
    voile.className = 'voile aide-voile';
    voile.hidden = true;
    voile.innerHTML = `<div class="carte-aide" role="dialog" aria-modal="true" aria-labelledby="aide-titre">
        <div class="aide-tete">
          <p class="aide-compteur" id="aide-compteur"></p>
          <button class="bouton-icone aide-fermer" type="button" aria-label="${t('Fermer', 'Close')}" title="${t('Fermer', 'Close')}"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
        </div>
        <div class="aide-corps">
          <span class="aide-numero" id="aide-numero" aria-hidden="true"></span>
          <h2 id="aide-titre"></h2>
          <p class="aide-texte" id="aide-texte"></p>
        </div>
        <div class="aide-nav">
          <button class="bouton-secondaire aide-prec" type="button">${t('Précédent', 'Back')}</button>
          <ol class="aide-points" aria-hidden="true"></ol>
          <button class="bouton-principal aide-suiv" type="button"></button>
        </div>
      </div>`;
    document.body.appendChild(voile);
    voile.querySelector('.aide-fermer').addEventListener('click', fermer);
    voile.querySelector('.aide-prec').addEventListener('click', () => aller(etape - 1));
    voile.querySelector('.aide-suiv').addEventListener('click', () => (etape < etapes.length - 1 ? aller(etape + 1) : fermer()));
    voile.addEventListener('click', (e) => { if (e.target === voile) fermer(); });
    // le clavier sert au tutoriel tant qu'il est ouvert (pas au jeu, derrière)
    document.addEventListener('keydown', (e) => {
      if (!voile || voile.hidden) return;
      const touches = { Escape: fermer, ArrowLeft: () => aller(etape - 1), ArrowRight: () => aller(etape + 1), Enter: () => voile.querySelector('.aide-suiv').click() };
      if (!touches[e.key]) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      touches[e.key]();
    }, true);
  }
  function aller(i) {
    if (i < 0 || i >= etapes.length) return;
    etape = i;
    const [titre, texte] = etapes[i];
    voile.querySelector('#aide-compteur').textContent = `${i + 1} / ${etapes.length}`;
    voile.querySelector('#aide-numero').textContent = i + 1;
    voile.querySelector('#aide-titre').textContent = titre;
    voile.querySelector('#aide-texte').innerHTML = texte;
    voile.querySelector('.aide-prec').disabled = i === 0;
    voile.querySelector('.aide-suiv').textContent = i === etapes.length - 1 ? t('C\'est parti !', 'Let\'s go!') : t('Suivant', 'Next');
    voile.querySelector('.aide-points').innerHTML = etapes.map((_, j) => `<li class="${j === i ? 'actuel' : j < i ? 'vu' : ''}"></li>`).join('');
  }
  function ouvrir() {
    try { localStorage.setItem('echecs.aide.' + jeu, 'vu'); } catch (e) { /* rien */ }
    const bouton = document.getElementById('btn-aide');
    if (bouton) bouton.classList.remove('a-voir');
    // Dice chess : ses règles illustrées
    if (jeu === 'des') { const r = document.getElementById('btn-regles'); if (r) r.click(); return; }
    etapes = (TUTORIELS[jeu] || []).slice();
    if (!etapes.length) return;
    const o = Aide.objectif && Aide.objectif();
    if (o) etapes[0] = [o.titre, o.texte];
    if (!voile) construire();
    aller(0);
    voile.hidden = false;
    voile.querySelector('.aide-suiv').focus({ preventScroll: true });
  }
  function fermer() {
    if (voile) voile.hidden = true;
    const bouton = document.getElementById('btn-aide');
    if (bouton) bouton.focus({ preventScroll: true });
  }

  // ---------- Le bouton « ? », juste avant les réglages ----------
  function brancher() {
    if (!jeu || document.getElementById('btn-aide')) return;
    const reglages = document.querySelector('.barre .reglages');
    if (!reglages) return;
    const b = document.createElement('button');
    b.id = 'btn-aide';
    b.type = 'button';
    b.className = 'bouton-icone bouton-aide';
    b.setAttribute('aria-label', t('Comment jouer', 'How to play'));
    b.title = t('Comment jouer', 'How to play');
    b.setAttribute('aria-haspopup', 'dialog');
    b.innerHTML = '<span aria-hidden="true">?</span>';
    reglages.parentNode.insertBefore(b, reglages);
    b.addEventListener('click', ouvrir);
    let vu = false;
    try { vu = !!localStorage.getItem('echecs.aide.' + jeu); } catch (e) { vu = true; }
    if (!vu) b.classList.add('a-voir'); // la première fois, il bat doucement
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', brancher);
  else brancher();
})();
