/* Glisser-déposer une pièce sur un échiquier (js/echiquier.js), en plus du clic-clic que chaque jeu gère lui-même
   (le cheval de la reine, capture le roi).
     Glisser({ plateau,
               prendre: (case) => vrai si la pièce de cette case peut bouger maintenant,
               demarrer: (case) => le glisser commence (le jeu peut choisir la pièce et redessiner l'échiquier),
               lacher: (de, vers) => le jeu joue le coup s'il est permis })
   On appuie sur la pièce, on la déplace (au-delà de 6 pixels, une copie suit le doigt ou la souris), on la lâche
   sur la case voulue. Un simple appui sans glisser reste un clic : le jeu s'en occupe (clic-clic). */
(function () {
  window.Glisser = function ({ plateau, prendre, demarrer = () => {}, lacher }) {
    plateau.classList.add('plateau-glisser');
    let g = null, ignorerClic = false;
    const caseSous = (e) => {
      const sous = document.elementFromPoint(e.clientX, e.clientY);
      const c = sous && sous.closest('.case-e');
      return c && plateau.contains(c) ? c : null;
    };
    const eteindre = () => plateau.querySelectorAll('.case-e.visee').forEach(x => x.classList.remove('visee'));

    plateau.addEventListener('pointerdown', (e) => {
      if (e.button > 0 || g) return;
      const c = e.target.closest('.case-e');
      const svg = c && c.querySelector('.piece-e');
      if (!svg || !prendre(c.dataset.case)) return;
      e.preventDefault(); // pas de sélection de texte ni de glisser d'image
      g = { de: c.dataset.case, id: e.pointerId, x: e.clientX, y: e.clientY, svg, fantome: null, taille: c.getBoundingClientRect().width };
    });

    window.addEventListener('pointermove', (e) => {
      if (!g || e.pointerId !== g.id) return;
      if (!g.fantome) {
        if (Math.hypot(e.clientX - g.x, e.clientY - g.y) < 6) return;
        const f = g.svg.cloneNode(true);
        f.classList.add('piece-glissee');
        f.style.width = f.style.height = g.taille + 'px';
        document.body.appendChild(f);
        document.body.classList.add('glisse-en-cours');
        g.fantome = f;
        demarrer(g.de);
        // le jeu a pu redessiner l'échiquier : on retrouve la pièce dans le nouveau dessin
        const svg = plateau.querySelector(`[data-case="${g.de}"] .piece-e`);
        if (svg) svg.classList.add('en-main');
      }
      g.fantome.style.transform = `translate(${e.clientX - g.taille / 2}px, ${e.clientY - g.taille / 2}px) scale(1.12)`;
      eteindre();
      const c = caseSous(e);
      if (c && c.dataset.case !== g.de) c.classList.add('visee');
    });

    function finir(e, annule) {
      if (!g || e.pointerId !== g.id) return;
      const glisse = g;
      g = null;
      if (!glisse.fantome) return; // simple appui : c'est un clic, le jeu s'en occupe
      eteindre();
      glisse.fantome.remove();
      document.body.classList.remove('glisse-en-cours');
      plateau.querySelectorAll('.piece-e.en-main').forEach(x => x.classList.remove('en-main'));
      // le navigateur peut envoyer un clic juste après : il ne doit pas compter
      ignorerClic = true;
      setTimeout(() => { ignorerClic = false; }, 50);
      if (annule) return;
      const c = caseSous(e);
      if (c && c.dataset.case !== glisse.de) lacher(glisse.de, c.dataset.case);
    }
    window.addEventListener('pointerup', (e) => finir(e, false));
    window.addEventListener('pointercancel', (e) => finir(e, true));
    plateau.addEventListener('click', (e) => { if (ignorerClic) { e.stopImmediatePropagation(); ignorerClic = false; } }, true);
  };
})();
