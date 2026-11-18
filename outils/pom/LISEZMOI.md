# Pom', le coach (atelier, pas encore intégré au site)

- `animations-pom.html` : la page de test des animations de Pom' (publiée comme artefact Claude privé :
  « Animations de Pom' »). Pom' y est dessiné en SVG ; un petit moteur décrit chaque animation par des pistes
  (valeurs clés dans le temps) pour le corps, la tête, les yeux, les sourcils, le chapeau et les bras.
  Animations : Hop, hourra ! ; La danse du chapeau ; La toupie ; Yes ! ; Bonjour ! ; Hmm… ; Eurêka ! ;
  Hmm… puis Eurêka ! ; Oh non… ; Oh là là ! ; Quel beau coup ! (révérence, chapeau qui tombe) ; Dab ! (double dab, tête penchée) ; Le floss (bras devant et derrière le corps) ; Bravo ! (il applaudit) ; Clin d'œil (avec le signe OK) ; Tape-m'en cinq ! (high-five vers l'écran) ; Pouce levé ; Il s'endort… (puis il dort, en boucle) ; Réveil !
- Niveaux de réussite (pour les exercices) : 1 étoile (Yes !, Pouce levé, Clin d'œil, Bravo !), 2 étoiles (Hop,
  hourra !, Quel beau coup !, Tape-m'en cinq !), 3 étoiles (La danse du chapeau, Dab !, Le floss, La toupie). Le niveau
  règle les effets : 5 petites étoiles ; 10 étoiles et un halo doré ; 16 grandes étoiles colorées qui scintillent, le
  halo et une pluie de confettis. La page propose « Réussite, au hasard » pour chaque niveau.
- Les gants viennent des dessins de l'auteur (images non versionnées) : `gants-decalquer.py` décalque les deux
  gants du dessin d'origine (`gants2.json`), `mains-reperer.py` repère les 16 mains des planches (poignet,
  direction du bras), `mains-decalquer.py` les décalque (`gants16.json`). Le décalque utilise potracer
  (`pip install potracer scipy`). Les mains « index sous le menton » et « main de profil » (pour applaudir) sont dessinées à la main dans la page.
