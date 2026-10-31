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
jeux/<nom-du-jeu>/    un dossier par jeu (index.html + .css + .js)
```

## Licence

Tous droits réservés. Aucune licence n'est accordée pour réutiliser ce code ou ces dessins.
