/* Petits outils d'interface partagés par les jeux : confettis, compteur animé, durées, icônes. */
(function () {
  const reduireMouvement = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // pluie de confettis dans un conteneur .pluie
  function lancerPluie(conteneur, n) {
    conteneur.innerHTML = '';
    if (reduireMouvement()) return;
    const couleurs = ['var(--accent)', 'var(--or)', 'var(--laiton-clair)', 'var(--surface)', 'var(--alerte)'];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i');
      c.style.setProperty('--x', `${Math.random() * 100}%`);
      c.style.setProperty('--dx', `${(Math.random() - 0.5) * 160}px`);
      c.style.setProperty('--r', `${(Math.random() - 0.5) * 1080}deg`);
      c.style.setProperty('--d', `${2.4 + Math.random() * 2}s`);
      c.style.setProperty('--delai', `${Math.random() * 1.2}s`);
      c.style.setProperty('--c', couleurs[i % couleurs.length]);
      conteneur.appendChild(c);
    }
  }

  // fait monter un nombre de 0 à sa valeur finale
  function compterJusqua(el, valeur, duree = 900) {
    if (reduireMouvement()) { el.textContent = valeur; return; }
    const t0 = performance.now();
    (function pas(t) {
      const p = Math.min(1, (t - t0) / duree);
      el.textContent = Math.round(valeur * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(pas);
    })(t0);
  }

  function formaterDuree(s) {
    s = Math.round(s);
    return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
  }

  // étoiles de l'écran de résultats (0 à 3), qui apparaissent l'une après l'autre
  function allumerEtoiles(conteneur, nombre) {
    conteneur.querySelectorAll('svg').forEach((e, i) => {
      e.classList.toggle('pleine', i < nombre);
      e.style.animationDelay = `${400 + i * 220}ms`;
    });
  }

  const ICONES = {
    ok: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    rate: '<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17"/></svg>',
  };

  window.UI = { lancerPluie, compterJusqua, formaterDuree, allumerEtoiles, ICONES, reduireMouvement };
})();
