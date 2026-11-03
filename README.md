# Échecs éducatifs

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
- **Mat ou pas mat ?** (`jeux/mat/`) : une position s'affiche, il faut dire si le camp qui a le trait est échec et mat.
  112 positions : mats classiques pour débutants (couloir, berger, lion, étouffée, Légal, Anastasie, Arabie,
  Boden, Damiano, épaulette…), fins de parties célèbres du domaine public (Morphy, Anderssen, Réti…),
  mats tirés de vraies parties jouées sur Lichess, et « presque mats » (fuite, prise, parade, pat).
  Chaque réponse est expliquée et montrée sur l'échiquier. Mode libre, défi (10 positions) et défi chrono
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
- **La balance** (`jeux/balance/`) : poser des pièces de chaque côté d'une balance qui penche selon leur valeur
  (pion 1, cavalier 3, fou 3, tour 5, dame 9). Mode libre, défis (10 balances à équilibrer) et défis chrono (20 s par balance).
- **Dice chess** (`jeux/des/`) : compagnon pour jouer aux échecs avec des dés sur un vrai échiquier.
  Les Blancs puis les Noirs lancent 3 dés (ou 1 en version classique) ; chaque face montre une pièce
  (1 pion, 2 cavalier, 3 fou, 4 tour, 5 dame, 6 roi). Règles illustrées, mode face à face, historique, annulation,
  et la partie en cours est gardée dans le navigateur.

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
- Toutes les positions et tous les coups sont vérifiés avec [chess.js](https://github.com/jhlywa/chess.js) (licence BSD)
  par `outils/positions-mat.js`, `outils/coups-notation.js` et `outils/parties-champions.js` ; chess.js n'est pas
  utilisé par le site lui-même.

## Atelier du coach

`outils/coach/index.html` est une page à part (publiée comme artefact Claude, privée) pour écrire ses propres
commentaires : on rejoue les parties de « Joue le coup », on choisit les coups que l'enfant doit trouver, on écrit
l'explication de chaque coup (avec des flèches), la raison de l'abandon et une introduction. Les commentaires sont
enregistrés dans la base de l'artefact, puis repris (style seulement) dans `outils/commentaires-coach.json`
(le texte d'origine est gardé à côté) et intégrés aux données du jeu par `outils/parties-champions.js` : ils
remplacent l'explication automatique, avec leurs flèches, et décident des coups que l'enfant doit trouver. Un coup
commenté mais pas « à jouer » est joué tout seul, puis la partie s'arrête pour montrer le commentaire. Dans la
galerie, l'interrupteur « Commentées par le coach » ne montre que ces parties-là.

## Organisation

```
index.html            accueil
css/commun.css        couleurs (thèmes clair et sombre), typographie, boutons, réglages
css/jeux.css          composants partagés des jeux : défis, progression, résultats, confettis
css/accueil.css       page d'accueil
js/commun.js          préférences, thème clair/sombre, panneau de réglages, interrupteurs
js/pieces.js          pièces d'échecs : valeurs, noms, dessins SVG
js/sons.js            petits sons synthétisés (aucun fichier audio)
js/ui.js              confettis, compteur animé, durées, étoiles
js/tout-petits.js     dessins des animaux (a à h) et des mains (1 à 8)
js/echiquier.js       échiquier partagé : affichage d'une position (FEN) et surlignage de cases
css/echiquier.css     style de cet échiquier
outils/positions-mat.js  génère jeux/mat/positions.js en vérifiant chaque position avec chess.js
outils/coups-notation.js génère jeux/notation/coups.js (ouvertures et problèmes Lichess rejoués avec chess.js)
outils/parties-champions.js génère jeux/joue/parties.js (parties de outils/parties-champions.pgn et moments à jouer)
jeux/<nom-du-jeu>/    un dossier par jeu (index.html + .css + .js)
```

## Licence

© 2026 Mathieu Pouillon. Tous droits réservés. Aucune licence n'est accordée pour réutiliser ce code ou ces dessins.
