# Échecs éducatifs

Petits jeux pour faire découvrir les échecs aux enfants, en lien avec d'autres disciplines (calcul, repérage…).
Le site est statique (HTML, CSS, JavaScript), sans framework, sans compte utilisateur et sans publicité.
Les réglages (thème, son, options des jeux) sont enregistrés dans le navigateur.

## Lancer le site

Ouvrir `index.html` dans un navigateur. Aucune installation n'est nécessaire.

## Jeux

- **La balance** (`jeux/balance/`) : poser des pièces de chaque côté d'une balance qui penche selon leur valeur
  (pion 1, cavalier 3, fou 3, tour 5, dame 9). Mode libre, défis (10 balances à équilibrer) et défis chrono (20 s par balance).
- **Trouve la case** (`jeux/cases/`) : une coordonnée s'affiche, il faut toucher la bonne case de l'échiquier.
  Mode libre, défi (10 cases) et défi chrono (le plus de cases en 20 s), orientation blancs / noirs / au hasard,
  et un mode tout-petits (animaux pour les colonnes, doigts pour les rangées).
- **Dice chess** (`jeux/des/`) : compagnon pour jouer aux échecs avec des dés sur un vrai échiquier.
  Les Blancs puis les Noirs lancent 3 dés (ou 1 en version classique) ; chaque face montre une pièce
  (1 pion, 2 cavalier, 3 fou, 4 tour, 5 dame, 6 roi). Règles illustrées, mode face à face, historique, annulation,
  et la partie en cours est gardée dans le navigateur.
- **Mat ou pas mat ?** (`jeux/mat/`) : une position s'affiche, il faut dire si le camp qui a le trait est échec et mat.
  102 positions : mats classiques pour débutants (couloir, berger, lion, étouffée, Légal, Anastasie, Arabie,
  Boden, Damiano, épaulette…), fins de parties célèbres du domaine public (Morphy, Anderssen, Réti…),
  mats tirés de vraies parties jouées sur Lichess, et « presque mats » (fuite, prise, parade, pat).
  Chaque réponse est expliquée et montrée sur l'échiquier. Mode libre, défi (10 positions) et défi chrono
  (20 s par position).

## Sources

- Problèmes Lichess : base de problèmes de Lichess (domaine public, CC0), extraits de l'échantillon publié
  dans le dépôt [lichess-org/lila-db-seed](https://github.com/lichess-org/lila-db-seed) (licence MIT).
  L'extrait utilisé est dans `outils/lichess-mats.json`.
- Parties célèbres : parties historiques du domaine public.
- Toutes les positions sont vérifiées avec [chess.js](https://github.com/jhlywa/chess.js) (licence BSD)
  par `outils/positions-mat.js` ; chess.js n'est pas utilisé par le site lui-même.

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
jeux/<nom-du-jeu>/    un dossier par jeu (index.html + .css + .js)
```

## Licence

Tous droits réservés. Aucune licence n'est accordée pour réutiliser ce code ou ces dessins.
