/* La consigne d'un jeu, dans une fenêtre (le cheval de la reine, capture le roi) : elle s'ouvre au lancement du jeu,
   se ferme avec « Compris » (ou Entrée, Échap, un clic à côté), et se rouvre depuis les réglages.
     const consigne = Consigne({ voile, compris, rouvrir }); consigne.ouvrir(); */
(function () {
  window.Consigne = function ({ voile, compris, rouvrir }) {
    const fermer = () => { voile.hidden = true; };
    const ouvrir = () => { voile.hidden = false; compris.focus({ preventScroll: true }); };
    compris.addEventListener('click', fermer);
    voile.addEventListener('click', (e) => { if (e.target === voile) fermer(); });
    document.addEventListener('keydown', (e) => {
      if (voile.hidden || (e.key !== 'Escape' && e.key !== 'Enter')) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      fermer();
    }, true);
    if (rouvrir) rouvrir.addEventListener('click', ouvrir);
    return { ouvrir, fermer, ouverte: () => !voile.hidden };
  };
})();
