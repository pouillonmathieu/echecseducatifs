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
  La consigne s'affiche dans une fenêtre au lancement (et quand on change de pièce), avec « Compris » ; on la revoit
  depuis les réglages. Même chose dans « Capture le roi », où la pièce jouée n'est plus choisie après son coup.
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
  joue les coups (les Blancs, les Noirs ou les deux ; l'ordinateur joue l'autre camp), en glissant les pièces ou en
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
« Mat ou pas mat ? » aussi ; les dessins s'effacent à chaque nouvelle position.

## Réglages du site

Le menu Réglages de la page d'accueil vaut pour tous les jeux (il est gardé dans le navigateur) :
- **Pièces** : classiques (dessin Cburnett) ou simples (`js/pieces.js`, clé `echecs.pieces.classiques`) ;
  les petits pions des icônes (symbole `#mini-pion`) suivent le même choix ;
- **Échiquier** : vert, bleu, rouge ou bois (`js/commun.js`, clé `echecs.plateau`, attribut `data-plateau` de `<html>`).
  Les couleurs sont les variables `--plateau-claire` et `--plateau-foncee` de `css/commun.css` (avec leur version
  pour le mode sombre) ; tous les échiquiers et toutes les icônes d'échiquier s'en servent.

## Page d'accueil

Une carte par jeu (icône simple en SVG, nom, une phrase), toutes visibles sans faire défiler : 6 colonnes sur
ordinateur (icônes plus petites sur un écran peu haut), 4 sur tablette, 2 colonnes sur téléphone (icône à gauche du nom,
sans la phrase).

## Version anglaise

Les pages anglaises (dossier `en/`) sont générées par `python3 outils/anglais/generer.py` à partir des pages
françaises et du dictionnaire `outils/anglais/pages.json` : on ne les modifie pas à la main. Elles utilisent les mêmes
fichiers CSS et JS que le site français ; le code des jeux choisit sa langue avec `document.documentElement.lang`
(`Commun.t('texte français', 'English text')`). Un jeu est traduit quand sa page française a le bouton « EN » ; le
script signale tout texte sans traduction. Les textes générés ont aussi leur version anglaise : explications de « Mat ou pas mat ? »
(`outils/positions-mat.js`), introductions des parties célèbres (`titre_en`, `texte_en` dans `jeux/joue/intros.js`) et
commentaires du coach (`texte_en`, `fin_en` dans `outils/commentaires-coach.json`). Dans « Note le coup » et « Joue le
coup », la version anglaise n'utilise que la notation anglaise.

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
js/revoir.js          revoir les coups (⏮ ◀ ▶ ⏭, flèches du clavier, lecture automatique)
js/glisser.js         glisser-déposer une pièce sur l'échiquier
js/consigne.js        la consigne d'un jeu dans une fenêtre (au lancement, « Compris », à revoir dans les réglages)
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
