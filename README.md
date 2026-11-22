# Pom'chess

Le site et l'application des petits jeux d'échecs éducatifs, avec Pom', leur personnage.

Créé par **Mathieu Pouillon**.

Petits jeux pour faire découvrir les échecs aux enfants, en lien avec d'autres disciplines (calcul, repérage…).
Le site est statique (HTML, CSS, JavaScript), sans framework, sans compte utilisateur et sans publicité.
Les réglages (thème, son, options des jeux) sont enregistrés dans le navigateur.

## Lancer le site

Ouvrir `index.html` dans un navigateur. Aucune installation n'est nécessaire.

## Jeux

- **Le labyrinthe** (`jeux/labyrinthe/`) : une seule pièce (cavalier, fou, tour ou dame) doit rentrer à sa maison en
  contournant des obstacles (pierres, eau, lave ou buissons), par le chemin le plus court. Seuls les coups réguliers
  sont acceptés (le cavalier saute par-dessus les obstacles sans s'y poser). Obstacles posés au hasard ; un parcours
  en largeur garantit le chemin le plus court voulu (facile 2–3 coups, moyen 3–5, difficile 6–10, 8 au plus pour le
  cavalier) et un détour
  obligatoire. Les obstacles voisins se rejoignent (murs, mares, coulées, haies) et leur matière se change en cours
  de partie. On joue en touchant une case ou en faisant glisser la pièce. Mode libre (annuler, recommencer,
  solution), défi (10 labyrinthes à faire par le chemin le plus court) et défi chrono (30 s par labyrinthe).
- **Capture le roi** (`jeux/roi/`) : le roi noir est seul sur l'échiquier ; avec une équipe blanche choisie par des
  icônes (deux tours ; une tour et deux fous ; une tour et deux cavaliers ; trois fous ; roi et dame ; roi et tour ;
  roi et deux fous ; roi, fou et cavalier ; ou une au hasard), il faut le capturer en le moins de coups possible.
  Le roi noir doit bouger à chaque coup (mat ou pat : il est pris au coup suivant) et peut prendre une pièce non
  protégée ; si ce qui reste ne suffit plus, il s'échappe. Départ au hasard, jamais gagnable en un ou deux coups.
  L'ordinateur joue le roi : difficile, parfaitement ; facile, une fois sur deux une case sûre au hasard. Les étoiles
  comparent le nombre de coups au minimum théorique (★★★ jusqu'au minimum + 25 %, ★★ jusqu'au minimum + 75 %) ;
  le panneau n'affiche que ce minimum (au niveau facile, il précise « si le roi se défend parfaitement » : le roi s'y
  trompe souvent, et on peut alors faire mieux que le minimum).
  Défis : 5 parties (jusqu'à 15 étoiles), défi chrono à 15 s par coup. Comme dans « Le cheval de la reine » : glisser
  les pièces ou clic-clic (choisir la pièce, puis la case ; un 2e clic sur la pièce la lâche), revoir les
  coups, « Recommencer » (même position) et « Solution » (difficile : une partie parfaite au minimum de coups). Le minimum et le jeu parfait viennent de
  tables de toutes les positions (analyse rétrograde, avec les 8 symétries de l'échiquier), calculées par
  `outils/tables-roi.js` avec `jeux/roi/tables.js` et rangées compressées dans `jeux/roi/tables/` (1,8 Mo en tout ;
  le jeu ne charge que celles de l'équipe choisie, et les recalcule si elles ne se chargent pas).
- **Mat ou pas mat ?** (`jeux/mat/`) : une position s'affiche, il faut dire si le camp qui a le trait est échec et mat.
  112 positions : mats classiques pour débutants (couloir, berger, lion, étouffée, Légal, Anastasie, Arabie,
  Boden, Damiano, épaulette…), fins de parties célèbres du domaine public (Morphy, Anderssen, Réti…),
  mats tirés de vraies parties jouées sur Lichess, et « presque mats » (fuite, prise, parade, pat).
  Chaque réponse est expliquée ; quand ce n'est pas mat, l'explication cite toutes les défenses (le roi s'enfuit, on prend
  l'attaquant, on bloque l'échec), la première étant montrée sur l'échiquier. Mode libre, défi (10 positions) et défi chrono
  (20 s par position). Bouton « pat » au-dessus de l'échiquier : ajoute un troisième bouton et les positions de pat (sinon absentes).
- **Trouve la case** (`jeux/cases/`) : une coordonnée s'affiche, il faut toucher la bonne case de l'échiquier.
  Mode libre, défi (10 cases) et défi chrono (le plus de cases en 20 s), orientation blancs / noirs / au hasard,
  et un mode tout-petits (animaux pour les colonnes, doigts pour les rangées).
- **Note le coup** (`jeux/notation/`) : le dernier coup est rejoué en animation sur l'échiquier (on voit la pièce
  prise disparaître ; bouton pour le revoir), la feuille de partie reprend les 3 coups d'avant et il faut écrire le
  dernier avec le clavier à l'écran (qu'on peut masquer pour utiliser celui de l'appareil) ou celui de l'ordinateur
  (++ accepté pour le mat). Niveau facile (coups simples et prises, 400 coups) ou difficile
  (échec, mat, pièce à préciser, roque, promotion, prise en passant ; 373 coups). Notation française ou anglaise,
  conseil ciblé en cas d'erreur et notation découpée en morceaux expliqués. Mode libre, défi (10 coups) et défi
  chrono (20 s par coup). Mode tout-petits : clavier et marges de l'échiquier avec les pièces dessinées, les animaux et les doigts.
- **Joue le coup** (`jeux/joue/`) : on choisit un champion ou une championne (portraits, des plus récents aux plus
  anciens, ou « au hasard »), une de ses parties se joue toute seule sur l'échiquier, vue de son côté (bouton pour
  retourner l'échiquier), et une dizaine de fois par partie c'est l'enfant qui joue à sa place (coups-clés choisis
  avec Stockfish, parfois plusieurs à la suite). Facile : le coup est écrit, il faut le jouer ; difficile : il faut le
  trouver. Après chaque coup trouvé, une explication simple : la menace adverse parée (pièce mise à l'abri,
  protégée, mat empêché…), le motif (fourchette, clouage, enfilade, découverte, sacrifice, échange, roi actif,
  opposition, pion passé, colonne ouverte, 7e rangée, avant-poste…), ce que le coup menace ou gagne, et pourquoi un
  autre coup était moins bon, avec des flèches sur l'échiquier ; à la fin, pourquoi l'adversaire abandonne. Indice (la pièce
  qui doit bouger brille) et « Montre-moi ». On joue en touchant les cases ou en faisant
  glisser la pièce ; les cases possibles sont montrées. On peut revoir les coups déjà joués (flèches sous
  l'échiquier, flèches du clavier, ou clic sur un coup de la feuille). Parties classiques de Steinitz à Kasparov, et parties
  récentes des champions et championnes d'aujourd'hui ; vitesse réglable, notation française ou anglaise.
- **Comment ça s'appelle ?** (`jeux/mots/`) : une illustration s'affiche (une pièce, l'échiquier, une case, un échec,
  les camps, la pendule… et au niveau difficile un coup ou une idée montrés sur l'échiquier avec des flèches : petit et
  grand roque, prise en passant, colonne, rangée, diagonale, centre, fourchette, enfilade, clouage, découverte,
  ouverture, gambit, sacrifice, échange, finale, fianchetto, avant-poste, opposition, pion passé, promotion, pat,
  partie nulle, zugzwang ; 37 termes en tout) et il faut écrire son nom lettre par lettre. Le déterminant est déjà écrit, des cases vides attendent les
  lettres. 9 langues avec leur clavier à l'écran : français, anglais, espagnol, portugais, néerlandais, arabe (de droite
  à gauche), russe, hindi (avec les signes des voyelles) et mandarin (tuiles de caractères, pinyin montré à la fin).
  Une lettre fausse n'est pas posée ; après 3 erreurs elle apparaît en pâle. « Indice » ne garde sur le clavier que les
  lettres du mot ; « Solution » montre le mot. Mode libre : une série = tous les mots du niveau, avec un bilan à la
  fin ; défi (10 mots, sans indice, « Passer » compte comme raté) et défi chrono (30 s par mot).
  Le mot est lu à voix haute juste après le son de réussite (synthèse vocale du navigateur, si le son est activé) ;
  le bouton haut-parleur le lit à tout moment (grisé si l'appareil n'a pas de voix pour la langue).
  Les termes sont dans `jeux/mots/termes.js` (les termes difficiles en arabe, hindi et mandarin sont à faire relire).
- **La balance** (`jeux/balance/`) : poser des pièces de chaque côté d'une balance qui penche selon leur valeur
  (pion 1, cavalier 3, fou 3, tour 5, dame 9). Mode libre, défis (10 balances à équilibrer) et défis chrono (20 s par balance).
- **Le cheval de la reine** (`jeux/cheval/`) : une dame et un cavalier seuls sur l'échiquier, posés au hasard (aucun
  des deux n'attaque l'autre au départ). Au-dessus de l'échiquier, on choisit sa pièce. Avec la dame (blanche), il faut
  attraper le cavalier noir en le moins de coups possible (★★★ en 5 coups ou moins, ★★ de 6 à 8, ★ au-delà) ; le
  cavalier prend la dame si elle se pose sur une case qu'il attaque. Avec le cavalier (blanc), il faut échapper à la
  dame noire le plus longtemps possible (facile : ★ pris en 5 coups ou moins, ★★ de 6 à 8, ★★★ 9 ou plus ; difficile :
  ★★★ si on tient aussi longtemps que possible face à une dame parfaite) ; prendre la dame ou tenir 30 coups, c'est
  gagné. L'ordinateur a deux niveaux : difficile, il joue parfaitement grâce à une table de toutes les positions
  calculée au chargement (analyse rétrograde : avec un jeu parfait, la dame attrape toujours le cavalier en 5 coups au
  plus) ; facile, le cavalier fuit au hasard vers une case sûre et la dame ne joue le meilleur coup qu'une fois sur deux.
  On joue en glissant sa pièce jusqu'à la case voulue (souris ou doigt, `js/glisser.js`) ou en clic-clic.
  L'objectif du moment (selon la pièce jouée) est la première étape de l'aide « ? ». Dans « Capture le roi », c'est
  celui de l'équipe choisie ; la pièce jouée n'y est plus choisie après son coup.
  Réglage « Cases dangereuses » : les coups où l'adversaire peut te prendre sont marqués en rouge. Sous l'échiquier,
  des boutons font revoir les coups (`js/revoir.js`) ; « Recommencer » reprend la même position ; « Solution » (difficile)
  déroule une partie parfaite des deux côtés. Le panneau rappelle le meilleur nombre de coups possible pour la position
  (jeu parfait de l'ordinateur ; au niveau facile, il se trompe souvent, d'où la précision « si le cavalier fuit parfaitement »).
  Mode 2 joueurs (sur le même écran, la dame blanche commence ; le cavalier gagne s'il prend la dame ou tient 30 coups).
  Défis (avec la dame ou le cavalier, au niveau choisi) : 5 parties d'affilée, jusqu'à 15 étoiles ; défi chrono : 10 s
  par coup (temps écoulé : partie à 0 étoile).
- **Dice chess** (`jeux/des/`) : compagnon pour jouer aux échecs avec des dés sur un vrai échiquier.
  Les Blancs puis les Noirs lancent 3 dés (ou 1 en version classique) ; chaque face montre une pièce
  (1 pion, 2 cavalier, 3 fou, 4 tour, 5 dame, 6 roi). Règles illustrées, mode face à face, historique, annulation,
  et la partie en cours est gardée dans le navigateur.
- **Quiz des ouvertures** (`jeux/ouvertures/`) : les premiers coups d'une ouverture connue se jouent tout seuls sur
  l'échiquier, vu côté Blancs ou côté Noirs au hasard (bouton « Tourner l'échiquier ») ; il faut la reconnaître parmi
  quatre noms (aux niveaux moyen et expert : les variantes dont la position ressemble le plus, de préférence de la même
  famille, jamais une ligne qui contient l'autre). Trois niveaux : facile (20 ouvertures de base, 1 à 3 coups), moyen (23 variantes principales, 4 à 6 coups),
  expert (16 variantes avancées, 6 coups ou plus). Sous l'échiquier, les flèches (et la liste des coups, cliquable)
  font revoir les coups à son rythme, et un bouton rejoue l'ouverture depuis le début. Mode libre, défi (10 ouvertures)
  et défi chrono (20 s, le chrono part quand les coups ont fini de se jouer). Après la réponse : le nom, l'idée de
  l'ouverture, « En savoir plus » (sa fiche, dans un nouvel onglet) et « Rejouer l'ouverture » : c'est alors le joueur qui
  joue les coups (les Blancs, les Noirs ou les deux ; l'ordinateur joue l'autre camp ; en venant du quiz, l'échiquier
  garde l'orientation qu'il avait et on joue la couleur d'en bas), en glissant les pièces ou en
  clic-clic ; un mauvais coup est refusé ; « Indice » éclaire la pièce à jouer et devient « Solution » (une flèche).
  En mode libre, un bouton au-dessus de l'échiquier ouvre la liste de toutes les ouvertures (nouvel onglet).
  Couleur jouée, « Tourner l'échiquier » et « Indice » sont au-dessus de l'échiquier (toujours à portée sur téléphone) ;
  en revenant au quiz, le score du mode libre est gardé.
  Les fiches (`jeux/ouvertures/fiche.html?o=<ouverture>`, ou toutes les ouvertures sans paramètre) : l'échiquier et les
  coups, l'idée, trois choses à retenir, les principales variantes (celles du quiz ont leur propre fiche ; chacune se
  montre sur l'échiquier), un lien vers « Rejouer l'ouverture » et des liens vers Lichess (page de l'ouverture à la
  bonne position, échiquier d'analyse, exercices). Tout vient de `jeux/ouvertures/donnees.js`, généré par
  `outils/ouvertures.js` : les textes y sont écrits pour le site (français et anglais), chaque coup est vérifié avec
  chess.js, et le nom Lichess de chaque ouverture vient de la liste libre lichess-org/chess-openings
  (`outils/ouvertures-lichess.json`) ; l'adresse des pages Lichess suit leur règle (accents et ponctuation retirés,
  espaces en `_`).
- **Mat en un** (`jeux/mat1/`) : de vraies parties de grands maîtres (souvent en blitz ou en rapide). L'échiquier,
  vu du côté du joueur, rejoue le dernier coup d'un grand maître : une gaffe qui laisse un mat en un coup (« Les Noirs
  viennent de jouer 33…Ce5?? »). Les joueurs ne sont montrés qu'une fois le problème résolu : la carte de la partie
  (titre, Elo, tournoi, année, cadence) et « Magnus Carlsen avait joué 33…Ce5?? ». Il faut trouver le mat et le jouer, en glissant la pièce ou en clic-clic (points sur les cases possibles,
  réglable ; choix de la pièce pour une promotion ; roquer en posant le roi sur sa tour). Un coup qui ne fait pas mat
  est montré puis expliqué, avec des flèches rouges : pas d'échec, pat, ou les défenses (le roi s'enfuit, on prend la
  pièce, on bloque l'échec). Après le mat : le motif (mat du couloir, étouffé, échec double, à la découverte…),
  pourquoi c'est mat (qui donne échec, pourquoi on ne peut pas prendre la pièce, qui surveille chaque case de fuite),
  les autres mats possibles, et ce qui s'est passé dans la vraie partie (le mat joué, ou raté, et le résultat), avec
  un lien vers la partie sur Lichess. « Revoir le coup » rejoue la gaffe ; une fois le problème résolu, il devient
  « Rejouer » (le même exercice, sans compter dans le score ni dans le défi). « Tourner l'échiquier ». Une fois résolu,
  sur téléphone et petite tablette, « Suivant » prend la place de l'indice au-dessus de l'échiquier : toujours au même
  endroit, sans faire défiler (sur ordinateur, il reste dans le cadre de l'explication).
  Mode libre (plusieurs essais, « Indice » éclaire la pièce qui mate, puis « Solution » montre le coup ; le score compte
  les mats trouvés du premier coup), défi (10 positions, un seul essai) et défi chrono (30 s par position, à partir de
  la fin de l'animation).
  Réglage « Commentaires » : sans eux, plus d'explications ni d'histoire de la partie (un coup raté donne seulement
  « Pas mat ! », les flèches restent ; après le mat, le verdict, les joueurs sur une ligne et « Suivant »), et sur
  téléphone tout tient sur un seul écran, sans faire défiler (vérifié de l'iPhone SE au grand iPhone, en libre et en défi).
  997 positions (508 grands maîtres) : 220 de la base des retransmissions Lichess (tournois sur échiquier, janvier
  2020 à octobre 2026) et 777 parties en ligne de Chess.com (surtout du blitz, dont des Titled Tuesday ; 24 mois pour
  les 62 grands maîtres des classements blitz et rapide, 12 mois pour les 764 autres grands maîtres actifs classés
  2500 ou plus) ; au plus 5 positions par joueur. `outils/mats-en-un-recherche.py` cherche, mois par mois, chaque coup d'un grand maître après lequel
  l'adversaire a un mat en un ; `outils/mats-en-un-chesscom.py` fait de même avec l'API publique de Chess.com, pour les
  grands maîtres (vrais noms, en lettres latines ; l'adversaire doit avoir un vrai nom dans son profil ;
  pas de gaffe jouée avec moins de 5 secondes à la pendule ; pas d'Elo affiché, les classements en ligne n'en sont pas) ;
  `outils/mats-en-un.py` ne garde que les vraies gaffes (un autre coup évitait le mat, et la position n'était pas déjà
  perdue d'après l'évaluation Lichess ou Stockfish), au plus 3 par joueur, les parties de blitz et de rapide en premier
  (sélection dans `outils/mats-en-un.json`), puis écrit `jeux/mat1/problemes.js` en vérifiant chaque mat, avec la
  raison de chaque coup qui ne mate pas et les explications (français et anglais).
- **À l'aveugle** (`jeux/aveugle/`) : une partie complète contre l'ordinateur, sans voir l'échiquier. Il est caché en
  permanence ; le bouton « Coup d'œil », entre l'échiquier et la feuille de partie, le montre tant qu'on le garde
  appuyé (ou la barre d'espace ; sur un petit écran, il s'affiche en grand par-dessus le haut de la page) et compte les
  coups d'œil. Les coups s'écrivent sur la feuille de partie comme dans « Note le coup » (clavier à l'écran ou de
  l'appareil, notation française ou anglaise ; on accepte aussi 0-0, e2e4, les + et # oubliés), ou se disent au micro
  (« cavalier f3 », « e prend d5 », « petit roque » ; `voix.js` transforme la phrase entendue en notation, puis le
  coup est écrit et on appuie sur « Jouer »). Un coup impossible ou ambigu est expliqué. Les coups de l'ordinateur
  s'écrivent sur la feuille et sont lus à voix haute (réglage « Lire les coups de l'ordinateur », le haut-parleur les
  répète). Reprendre son coup, abandonner, nouvelle partie ; à la fin, l'échiquier est montré (victoire 3 étoiles,
  nulle 2, défaite 1). L'ordinateur est **Stockfish 18** (Stockfish.js, version « lite » sur un seul fil, 7 Mo, dans
  un Web Worker ; `moteur.js`, protocole UCI) : 4 niveaux, le « Skill Level » de Stockfish 3, 6, 9 et 12, avec une
  recherche limitée en profondeur et en temps. Réglage « Ordinateur adaptatif » : avant chaque coup, une courte
  évaluation à pleine force ; s'il gagne de plus de 1,5 pion, il baisse son Skill Level (jusqu'à 0), s'il perd, il
  le monte (jusqu'à +8) et cherche plus loin. Les règles (coups possibles, mat, pat, nulles) viennent de
  [chess.js](https://github.com/jhlywa/chess.js) 1.4.0 (licence BSD, `lib/chess.js`, transformé en script classique).
  Stockfish est sous licence GPL v3 : voir `jeux/aveugle/stockfish/LISEZMOI.md` (licence, code source exact) ; le
  bas de la page renvoie au code source et à la licence. Dans l'application Android, la lecture passe par la voix du
  téléphone et la dictée par sa reconnaissance vocale (`Dictee.java`, permission micro demandée la première fois) ;
  dans un navigateur, la dictée dépend du navigateur (Chrome, Edge, Safari ; souvent avec une connexion Internet).

## Sources

- Problèmes Lichess : base de problèmes de Lichess (domaine public, CC0), extraits de l'échantillon publié
  dans le dépôt [lichess-org/lila-db-seed](https://github.com/lichess-org/lila-db-seed) (licence MIT).
  L'extrait utilisé est dans `outils/lichess-mats.json`.
- Parties célèbres : parties historiques du domaine public.
- Six positions d'une fiche d'exercices [Logiqboard](https://logiqboard.com) (positions seules ; explications rédigées pour ce site).
- Ouvertures Lichess : [lichess-org/chess-openings](https://github.com/lichess-org/chess-openings) (domaine public, CC0),
  pour les coups de début de partie de « Note le coup ».
- Parties de « Joue le coup » (coups seulement) : 301 parties classiques de grands maîtres, sélection fournie par
  Mathieu Pouillon, complétée par 4 parties de [goatchess](https://github.com/goatchess/goatchess.github.io) ;
  parties récentes tirées des diffusions de tournois de la [base Lichess](https://database.lichess.org/#broadcasts)
  (domaine public, CC0), et parties de Judit Polgar et d'Irina Krush tirées de goatchess et de
  [chessdatabase](https://github.com/Dragjon/chessdatabase) (licence MIT). Les moments où l'enfant joue sont choisis
  par `outils/parties-champions.js` à partir de l'analyse de [Stockfish](https://stockfishchess.org) 16.1
  (`outils/analyser-parties.js`, résultat dans `outils/analyse-parties.json`) ; les explications des coups et des
  abandons (menace adverse en amont, menace, suite, autre coup, avance en matériel) viennent de
  `outils/analyser-explications.js`
  (résultat dans `outils/explications.json`) et sont rédigées par le jeu. Les portraits sont dessinés par le
  site (`jeux/joue/portraits.js`), sans aucune photo. Les introductions des parties célèbres
  (`jeux/joue/intros.js`) sont rédigées pour ce site à partir de faits historiques.
- Positions de « Mat en un » : parties de la [base des retransmissions Lichess](https://database.lichess.org/#broadcasts)
  (domaine public, CC0) et parties en ligne lues avec l'[API publique de Chess.com](https://www.chess.com/news/view/published-data-api)
  (coups seulement, avec un lien vers chaque partie), vérifiées avec [python-chess](https://github.com/niklasf/python-chess) (licence GPL, utilisé
  seulement par les outils, pas par le site) ; positions d'avant la gaffe évaluées avec Stockfish quand Lichess n'en
  donne pas l'évaluation.
- Toutes les positions et tous les coups sont vérifiés avec [chess.js](https://github.com/jhlywa/chess.js) (licence BSD)
  par `outils/positions-mat.js`, `outils/coups-notation.js`, `outils/parties-champions.js` et `outils/ouvertures.js` ; chess.js n'est pas
  utilisé par le site lui-même.

## Atelier du coach

`outils/coach/index.html` est une page à part (publiée comme artefact Claude, privée) pour écrire ses propres
commentaires : on rejoue les parties de « Joue le coup », on choisit les coups que l'enfant doit trouver, on écrit
l'explication de chaque coup (avec des flèches), la raison de l'abandon et une introduction. Les commentaires sont
enregistrés dans la base de l'artefact, puis repris (style seulement) dans `outils/commentaires-coach.json`
(le texte d'origine est gardé à côté) et intégrés aux données du jeu par `outils/parties-champions.js` : ils
remplacent l'explication automatique, avec leurs flèches et leurs cases colorées, et décident des coups que l'enfant doit trouver. Un coup
commenté mais pas « à jouer » est joué tout seul, puis la partie s'arrête pour montrer le commentaire. Dans la
galerie, l'interrupteur « Commentées par le coach » ne montre que ces parties-là.
Dans l'atelier comme dans le jeu, le clic droit dessine sur l'échiquier : glissé, une flèche ; sur une case, la case
colorée. La touche tenue choisit la couleur (sans touche : vert, Maj : orange, Ctrl ou Cmd : rouge, Alt : gris) et
refaire la même chose l'efface. Dans le jeu, ces dessins s'effacent quand la position change. Le labyrinthe a la même
possibilité (code commun : `Echiquier.annotations` dans `js/echiquier.js`) ; les dessins s'effacent quand la pièce bouge.
Sur un échiquier dessiné par `Echiquier.dessiner`, les dessins sont oubliés dès que la position change (un coup joué) : ils
ne reviennent pas au dessin suivant (« Le cheval de la reine », « Capture le roi »…).
« Mat ou pas mat ? » aussi ; les dessins s'effacent à chaque nouvelle position.

## L'aide des jeux

Les jeux n'affichent plus de consigne : ni fenêtre au lancement, ni ligne d'astuce, ni phrase du type « Ramène le fou
à sa maison », « À toi de jouer : choisis une pièce », « Écris le coup des Blancs », « Quelle est cette ouverture ? »,
« Comment ça s'appelle en français ? ». Les boutons qui étaient dans ces blocs ont changé de place : « Revoir le coup »
(Note le coup) est au-dessus de l'échiquier, à côté du niveau et du score ; le haut-parleur et le compteur (Comment ça
s'appelle ?) sont en haut de la carte du mot. Dans « Joue le coup », quand c'est à l'enfant de jouer, l'échiquier
s'entoure de vert (au niveau facile, le coup à jouer reste écrit), et l'histoire de la partie est repliée sur trois
lignes sur téléphone. Dans « Mat ou pas mat ? », le camp concerné se voit à la couleur du roi des boutons de réponse. À côté du bouton des
réglages, un petit bouton « ? » ouvre un tutoriel en quelques étapes (3 à 5 : le but, comment jouer, l'aide, les
étoiles et les défis, les raccourcis du clavier), avec « Précédent » / « Suivant » (ou les flèches du clavier ; Échap
ferme). Tout est dans `js/aide.js` (textes français et anglais). La première fois qu'on ouvre un jeu, le « ? » bat
doucement pour qu'on le remarque. Dice chess ouvre ses règles illustrées, qui existaient déjà.

## Sur téléphone, tout tient sur l'écran

- Les choix au-dessus de l'échiquier du labyrinthe et de « Capture le roi » tiennent sur une ligne : si la place
  manque, les groupes les plus larges se replient (seul le choix en cours, avec une petite flèche) et s'ouvrent en menu
  quand on les touche (`data-une-ligne`, `js/commun.js`).
- Sur téléphone (≤ 560 px de large), l'échiquier prend toute la largeur de l'écran : ce sont les boutons, les choix,
  les compteurs, les claviers et les textes qui se font petits (fin de `css/jeux.css`, et la fin de la feuille de
  style de chaque jeu). « Note le coup » ne montre que les deux derniers coups de la feuille, et le x est sur la
  rangée des pièces du clavier.
- Les rangées de boutons « Recommencer / Nouvelle partie / Solution » (Capture le roi, Le cheval de la reine) et les
  outils du labyrinthe ont l'attribut `data-icones-si-besoin` : si un texte ne tient pas dans son bouton (petit écran,
  ou « Solution » en plus au niveau difficile), toute la rangée ne montre plus que les dessins (`js/commun.js`) ; le
  texte reste pour les lecteurs d'écran, et le title des boutons le montre au survol.
- En dernier recours, si la page dépasse encore de l'écran, l'échiquier (ou l'illustration : l'élément `[data-ajuste]`
  de chaque jeu) rétrécit juste ce qu'il faut, sans descendre sous 210 px (`js/commun.js`). Les crédits du bas de
  page (« Créé par… », « Crédits des photos ») ne comptent pas : ils peuvent passer sous le bas de l'écran. Ce réglage se refait seulement
  quand la largeur change (rotation) : la barre d'adresse du téléphone, qui apparaît et disparaît, ne change que la
  hauteur, et ne doit pas faire rétrécir l'échiquier pendant qu'une explication est affichée.
- Vérifié : les 13 jeux tiennent sans défiler sur 390 × 844, 360 × 740, 375 × 667 et sur ordinateur, avec l'échiquier
  en pleine largeur (sauf « Note le coup » sur 375 × 667, dont le clavier prend de la place).

## « Suivant » toujours à portée

Après une réussite, on passe à la suite sans faire défiler : si le bouton « Suivant » (« Partie suivante »,
« Continuer ») est hors de l'écran, sous une longue explication sur téléphone, une copie de ce bouton flotte en bas de
l'écran (`js/commun.js`, pour tous les jeux) ; elle disparaît dès que le vrai bouton est visible. Les fenêtres de
résultats tiennent dans l'écran (Pom' y rapetisse s'il le faut).

## Pom', le coach

Pom' (une pièce d'échecs avec une pomme pour tête et un chapeau melon couronné d'une croix) est le personnage principal
du site. Sur la page d'accueil, il entre par la gauche et dit bonjour dans sa bulle et fait une danse quand on le touche (il s'endort si on le
laisse, et se réveille quand on revient). Dans les jeux, il réagit : une bonne réponse, une animation de réussite à
1 étoile (à partir de 5 bonnes réponses d'affilée : 2 étoiles ; à partir de 10 : 3 étoiles) ; une erreur, une animation d'erreur ;
une partie gagnée (« Capture le roi », « Le cheval de la reine », le labyrinthe, la fin d'une partie de « Joue le coup »,
une ouverture rejouée, une victoire à « Dice chess »), l'animation du nombre d'étoiles obtenues ; la fin d'un défi aussi
(à 0 étoile, il encourage d'un pouce levé). Un indice : il réfléchit ; une solution : « Eurêka ! » (sur grand écran seulement : sur téléphone, il cacherait l'échiquier). Dans un défi chrono,
une réussite en cours n'est pas interrompue par la suivante. Dans « Comment ça s'appelle ? », il ne réagit qu'à la
troisième lettre fausse (quand la lettre est montrée). Sur un écran assez large, il se tient juste à gauche de
l'échiquier (ou de la balance, des dés), les pieds au niveau de son bas, aussi grand que la place le permet (470 px au
plus) ; il entre par la gauche et dit bonjour en arrivant, s'endort après 90 s sans jouer, et passe devant la fenêtre
des résultats. Sur un écran plus étroit (téléphone : 760 px de large ou moins, jamais à côté de l'échiquier ; tablette en hauteur
sans place à gauche), il surgit au milieu de l'échiquier le temps
d'une petite réaction à chaque réponse (70 % de la taille de l'échiquier ; il s'efface dès qu'on touche l'écran) ; à la
fin d'une partie ou d'un défi, il apparaît dans la fenêtre des résultats, sous les étoiles (sans fenêtre, sur
l'échiquier). En attendant, il ne prend aucune place dans la page (il ne fait donc pas rétrécir l'échiquier). Il ne
prend jamais les clics. Il est noir sur
fond clair et blanc en mode sombre ; si l'appareil demande moins d'animations, il reste immobile.
Le réglage « Pom' dans les jeux » de la page d'accueil, ou « Pom', le coach » dans les réglages de chaque jeu (ajouté
par `js/pom.js`, avant « Son »), le retire des jeux (clé `echecs.pom`) ; dans un jeu, il disparaît ou revient tout de suite.
Sur l'accueil, il arrive de hors de l'écran (ses bonds y sont allongés, il y est plus petit).

Le code : `js/pom.js` (le placement, les réactions, l'API `Pom.bonneReponse()`, `Pom.erreur()`, `Pom.etoiles(n)`,
`Pom.resultat(n)`, `Pom.hmm()`, `Pom.eureka()`) charge après la page `js/pom-moteur.js` (le dessin et les animations, 64 Ko
compressé). Ce dernier est **fabriqué** par `python3 outils/pom/construire.py` à partir de l'atelier
`outils/pom/animations-pom.html`, la seule source des animations (voir `outils/pom/LISEZMOI.md`) : on règle une
animation dans l'atelier, puis on relance le script.

## Réglages du site

Le menu Réglages de la page d'accueil vaut pour tous les jeux (il est gardé dans le navigateur) ; la langue et le
thème ne se choisissent que là (les jeux n'ont plus ces boutons) :
- **Langue** : français ou anglais (liens vers `index.html` et `en/index.html`, réglés par le script de l'accueil) ;
- **Thème** : automatique (celui de l'appareil), clair ou sombre (`Commun.brancherTheme`, clé `echecs.theme`) ;
- **Pièces** : classiques (dessin Cburnett) ou simples (`js/pieces.js`, clé `echecs.pieces.classiques`) ;
  les petits pions des icônes (symbole `#mini-pion`) suivent le même choix ;
- **Échiquier** : vert, bleu, rouge ou bois (`js/commun.js`, clé `echecs.plateau`, attribut `data-plateau` de `<html>`).
  Les couleurs sont les variables `--plateau-claire` et `--plateau-foncee` de `css/commun.css` (avec leur version
  pour le mode sombre) ; tous les échiquiers et toutes les icônes d'échiquier s'en servent.

Chaque réglage tient sur une ligne : son nom à gauche, ses choix à droite (`css/accueil.css`). Les pièces et les
couleurs d'échiquier ne montrent que leur dessin, et leur nom est en info-bulle. « Automatique » s'écrit « Auto »
(son nom complet est en info-bulle), et la phrase sous « Pom' dans les jeux » passe en info-bulle.

## Page d'accueil

Pom' et sa bulle de bienvenue, puis une carte par jeu (icône simple en SVG, nom, une phrase), toutes visibles sans
faire défiler : 7 colonnes sur ordinateur (icônes plus petites sur un écran peu haut), 5 sur tablette, 2 colonnes sur
téléphone (icône à gauche du nom, sans la phrase). Si la page dépasse quand même de l'écran, Pom' se fait plus petit.

## Version anglaise

Les pages anglaises (dossier `en/`) sont générées par `python3 outils/anglais/generer.py` à partir des pages
françaises et du dictionnaire `outils/anglais/pages.json` : on ne les modifie pas à la main. Elles utilisent les mêmes
fichiers CSS et JS que le site français ; le code des jeux choisit sa langue avec `document.documentElement.lang`
(`Commun.t('texte français', 'English text')`). Une page est traduite quand elle a son entrée dans `pages.json` (toutes le sont) ; le
script signale tout texte sans traduction. Les textes générés ont aussi leur version anglaise : explications de « Mat ou pas mat ? »
(`outils/positions-mat.js`), introductions des parties célèbres (`titre_en`, `texte_en` dans `jeux/joue/intros.js`) et
commentaires du coach (`texte_en`, `fin_en` dans `outils/commentaires-coach.json`). Dans « Note le coup » et « Joue le
coup », la version anglaise n'utilise que la notation anglaise.

## Application Android

Le dossier `android/` contient l'application Android : tout le site embarqué, hors ligne (voir `android/README.md`).
Elle est reconstruite par GitHub à chaque modification du site et publiée dans la version « android » du dépôt
(<https://github.com/pouillonmathieu/echecseducatifs/releases/tag/android>, fichier `pomchess.apk`).

## Cache des navigateurs

Les fichiers CSS et JS sont appelés avec un numéro de version (`?v=AAAAMMJJHHMM`). Après une modification, lancer
`python3 outils/version.py` puis `python3 outils/anglais/generer.py` : les navigateurs rechargent alors les fichiers
modifiés au lieu de garder l'ancienne version.

## Organisation

```
index.html            accueil
css/commun.css        couleurs (thèmes clair et sombre), typographie, boutons, réglages
css/jeux.css          composants partagés des jeux : défis, progression, résultats, confettis
css/accueil.css       page d'accueil
js/commun.js          préférences, thème clair/sombre, panneau de réglages, interrupteurs
js/pieces.js          pièces : valeurs, noms, deux dessins au choix (classiques Cburnett ou simples)
js/sons.js            petits sons synthétisés (aucun fichier audio)
js/ui.js              confettis, compteur animé, durées, étoiles
js/tout-petits.js     dessins des animaux (a à h) et des mains (1 à 8)
js/echiquier.js       échiquier partagé : affichage d'une position (FEN) et surlignage de cases
css/echiquier.css     style de cet échiquier
outils/positions-mat.js  génère jeux/mat/positions.js en vérifiant chaque position avec chess.js
outils/coups-notation.js génère jeux/notation/coups.js (ouvertures et problèmes Lichess rejoués avec chess.js)
outils/tables-roi.js calcule les tables de « Capture le roi » (jeux/roi/tables/)
outils/parties-champions.js génère jeux/joue/parties.js (parties de outils/parties-champions.pgn et moments à jouer)
outils/ouvertures.js  génère jeux/ouvertures/donnees.js (ouvertures, textes, variantes, liens Lichess)
outils/mats-en-un-recherche.py  cherche les mats en un laissés par des grands maîtres (retransmissions Lichess)
outils/mats-en-un-chesscom.py  la même chose dans les parties en ligne des grands maîtres sur Chess.com
outils/mats-en-un.py  choisit les vraies gaffes et génère jeux/mat1/problemes.js
js/revoir.js          revoir les coups (⏮ ◀ ▶ ⏭, flèches du clavier, lecture automatique)
js/glisser.js         glisser-déposer une pièce sur l'échiquier
js/aide.js            l'aide des jeux : le bouton « ? » et le tutoriel de chaque jeu, en étapes (français et anglais)
js/pom.js             Pom', le coach : sa place dans la page et ses réactions (charge js/pom-moteur.js)
js/pom-moteur.js      le dessin de Pom' et ses animations (fabriqué par outils/pom/construire.py, ne pas modifier)
outils/pom/           l'atelier des animations de Pom' et ses outils (voir son LISEZMOI)
android/              l'application Android (le site embarqué ; voir android/README.md)
jeux/<nom-du-jeu>/    un dossier par jeu (index.html + .css + .js ; le quiz des ouvertures a aussi fiche.html)
```

## Licence

© 2026 Mathieu Pouillon. Tous droits réservés. Aucune licence n'est accordée pour réutiliser ce code ou ces dessins.

Exception : les photos des champions (`jeux/joue/photos/`) viennent de Wikimedia Commons, de Flickr (trouvées avec
Openverse) et de la Library of Congress. Elles sont dans le domaine public ou sous licence libre (CC0, CC BY,
CC BY-SA), vérifiée photo par photo, et recadrées pour le site ; l'auteur, la licence et la page
d'origine de chacune sont dans `jeux/joue/photos.js` et affichés sur la page du jeu (« Crédits des photos »). Elles
restent soumises à leur propre licence. La liste est tenue dans `outils/photos-champions.json`
(`outils/photos-champions.py` copie les photos et écrit `photos.js`).

Exception : les pièces « classiques » (`js/pieces.js`, réglage « Pièces » de la page d'accueil) sont le jeu de
[Colin M. L. Burnett](https://en.wikipedia.org/wiki/User:Cburnett) publié sur Wikimedia Commons (fichiers
`Chess_klt45.svg`, etc.), sous licence [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) (relevé sur Commons
via Openverse ; lichess le diffuse sous GPL v2+) ; le crédit est affiché au bas de la page d'accueil. Les tracés viennent des fichiers
SVG de [lichess-org/lila](https://github.com/lichess-org/lila/tree/master/public/piece/cburnett), seules les couleurs
ont été reliées au thème clair/sombre. Les pièces « simples » sont dessinées pour le site.
