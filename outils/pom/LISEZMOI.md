# Pom', le coach (atelier, pas encore intégré au site)

- `animations-pom.html` : la page de test des animations de Pom' (publiée comme artefact Claude privé :
  « Animations de Pom' »). Pom' y est dessiné en SVG ; un petit moteur décrit chaque animation par des pistes
  (valeurs clés dans le temps) pour le corps, la tête, les yeux, les sourcils, le chapeau et les bras.
  Animations : Hop, hourra ! ; La danse du chapeau ; La toupie ; Yes ! ; Bonjour ! ; Hmm… ; Eurêka ! ;
  Hmm… puis Eurêka ! ; Oh non… ; Oh là là ! ; Il s'endort… (puis il dort, en boucle) ; Réveil !
- Les gants viennent des dessins de l'auteur (images non versionnées) : `gants-decalquer.py` décalque les deux
  gants du dessin d'origine (`gants2.json`), `mains-reperer.py` repère les 16 mains des planches (poignet,
  direction du bras), `mains-decalquer.py` les décalque (`gants16.json`). Le décalque utilise potracer
  (`pip install potracer scipy`). La main « index sous le menton » est dessinée à la main dans la page.
