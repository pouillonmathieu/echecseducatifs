# Pom', le coach : l'atelier des animations

Pom' est sur le site (voir le README principal, « Pom', le coach »). Cet atelier est la seule source de son dessin et de
ses animations : après une modification, lancer `python3 outils/pom/construire.py`, qui fabrique `js/pom-moteur.js`
(le dessin, sans les gants inutilisés et avec les gants décalqués allégés, et le bloc `<script id="moteur-pom">` repris
tel quel), puis `python3 outils/version.py` et `python3 outils/anglais/generer.py`.

- Le moteur (`window.creerPom(svg, options)`) ne dépend pas de la page : les ids du dessin commencent par `pom-` et
  ses styles ne valent que dans `.pom-svg` (sauf ceux des gants et du pion, repris par des `<use>`, dont les noms
  suffisent : `gant-…`, `pom-pion…`). Il rend `jouer(nom, suite)`, `auHasard(niveau)` (une réussite du niveau, ou une
  erreur sans niveau ; jamais deux fois de suite la même), `peindre('noir' | 'blanc')`, `demarrer()`, `arreter()`, et
  les listes `DANSES`, `NIVEAUX`, `ERREURS`, `NOMS`.

- `animations-pom.html` : la page de test des animations de Pom' (publiée comme artefact Claude privé :
  « Animations de Pom' »). Pom' y est dessiné en SVG ; un petit moteur décrit chaque animation par des pistes
  (valeurs clés dans le temps) pour le corps, la tête, les yeux, les sourcils, le chapeau et les bras.
  Animations : Hop, hourra ! ; La danse du chapeau ; La toupie ; Yes ! ; Bonjour ! ; Hmm… ; Eurêka ! ;
  Bonjour ! par la gauche (le même, en miroir : celui du site) ; Hmm… puis Eurêka ! ; Oh non… ; Oh là là ! ; Quel beau coup ! (révérence, chapeau qui tombe) ; Dab ! (double dab, tête penchée) ; Le floss (bras devant et derrière le corps) ; Bravo ! (il applaudit) ; Clin d'œil (avec le signe OK) ; Tape-m'en cinq ! (high-five vers l'écran) ; Pouce levé ; La vague ; La guitare (imaginaire) ; Le music-hall (le chapeau roule le long des bras) ;
  Le basket (le chapeau tourne sur l'index) ; Le tour de magie (un pion sort du chapeau) ; La glissade ; La roue ; Il s'endort… (puis il dort, en boucle) ; Réveil !
- Niveaux de réussite (pour les exercices) : 1 étoile (Yes !, Pouce levé, Clin d'œil, Bravo !, La vague, Tape-m'en cinq !),
  2 étoiles (Hop, hourra !, Quel beau coup !, Le music-hall, La glissade, La danse du chapeau, La roue), 3 étoiles (Dab !,
  Le floss, La toupie, Le basket, La guitare, Le tour de magie). Le niveau règle les effets : 5 petites étoiles ; 10
  étoiles et un halo doré ; 16 grandes étoiles colorées qui scintillent, le halo et une pluie de confettis. La page
  propose « Réussite, au hasard » pour chaque niveau.
- Les erreurs (6) : Oh non… ; Oh là là ! ; Non, non, non ! (le doigt qui fait non, puis « essaie encore ») ; Il se
  gratte la tête (il soulève son chapeau d'une main, se gratte de l'autre ; un point d'interrogation) ; Oups ! (il se cache derrière son chapeau) ; La tête qui tourne
  (yeux en spirale, étoiles autour de la tête). La page propose aussi « Erreur, au hasard ».
- Les gants viennent des dessins de l'auteur (images non versionnées) : `gants-decalquer.py` décalque les deux
  gants du dessin d'origine (`gants2.json`), `mains-reperer.py` repère les 16 mains des planches (poignet,
  direction du bras), `mains-decalquer.py` les décalque (`gants16.json`). Le décalque utilise potracer
  (`pip install potracer scipy`). Les mains « index sous le menton », « main de profil » (pour applaudir) et « index pointé vers nous » sont dessinées
  à la main dans la page ;
  « pouce et petit doigt, de dos » (la main sur le manche de la guitare) est le décalque de la paume, retourné, sans
  la ligne de la paume ni le bas des doigts repliés.
