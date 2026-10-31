/* Pièces d'échecs partagées par tous les jeux : valeurs, noms et dessins.
   Script classique (pas de module) pour que le site marche aussi en ouvrant
   les fichiers directement depuis le disque.
   Les couleurs viennent des variables CSS --piece-* (thème clair ou sombre). */
(function () {
  const PIECES = [
    { id: 'pion',     valeur: 1, nom: { blanc: 'un pion blanc',     noir: 'un pion noir' } },
    { id: 'cavalier', valeur: 3, nom: { blanc: 'un cavalier blanc', noir: 'un cavalier noir' } },
    { id: 'fou',      valeur: 3, nom: { blanc: 'un fou blanc',      noir: 'un fou noir' } },
    { id: 'tour',     valeur: 5, nom: { blanc: 'une tour blanche',  noir: 'une tour noire' } },
    { id: 'dame',     valeur: 9, nom: { blanc: 'une dame blanche',  noir: 'une dame noire' } },
  ];

  const TEINTES = {
    blanc: { corps: 'var(--piece-blanc)', trait: 'var(--piece-blanc-trait)', detail: 'var(--piece-blanc-trait)' },
    noir:  { corps: 'var(--piece-noir)',  trait: 'var(--piece-noir-trait)',  detail: 'var(--piece-noir-detail)' },
  };

  // Dessins dans une boîte de 100 × 100, socle commun en bas.
  const SOCLE = '<path d="M18 92 H82 A4 4 0 0 0 86 88 V84 A6 6 0 0 0 80 78 H20 A6 6 0 0 0 14 84 V88 A4 4 0 0 0 18 92 Z"/>';
  const FORMES = {
    pion: () =>
      '<path d="M33 78 C33 66 39 58 43 52 H57 C61 58 67 66 67 78 Z"/>' +
      '<rect x="35" y="44" width="30" height="9" rx="4.5"/>' +
      '<circle cx="50" cy="29" r="15"/>',
    tour: () =>
      '<path d="M30 78 L33 46 H67 L70 78 Z"/>' +
      '<path d="M25 46 V18 H37 V27 H44.5 V18 H55.5 V27 H63 V18 H75 V46 Z"/>',
    fou: (t) =>
      '<path d="M33 78 C35 67 41 61 43 57 H57 C59 61 65 67 67 78 Z"/>' +
      '<rect x="35" y="49" width="30" height="9" rx="4.5"/>' +
      '<path d="M50 15 C38 24 32 34 34 41 C36 47 42 50 50 50 C58 50 64 47 66 41 C68 34 62 24 50 15 Z"/>' +
      '<circle cx="50" cy="10" r="5.5"/>' +
      `<path d="M57 26 L47 38" style="fill:none;stroke:${t.detail}" stroke-width="4"/>`,
    cavalier: (t) =>
      '<path d="M29 78 C29 66 34 58 41 52 C35 52 30 54 25 56 C17 59 12 52 16 46 L33 26 C35 22 37 17 40 14 L44 8 L49 17 C66 20 76 35 75 54 C75 63 72 70 71 78 Z"/>' +
      `<circle cx="37" cy="32" r="3.5" style="fill:${t.detail};stroke:none"/>` +
      `<path d="M52 22 C63 28 68 40 67 58" style="fill:none;stroke:${t.detail}" stroke-width="3"/>`,
    dame: () =>
      '<path d="M30 78 L36 52 H64 L70 78 Z"/>' +
      '<rect x="32" y="44" width="36" height="9" rx="4.5"/>' +
      '<path d="M31 45 L23 20 L38 32 L50 14 L62 32 L77 20 L69 45 Z"/>' +
      '<circle cx="23" cy="18" r="5"/><circle cx="50" cy="11" r="5"/><circle cx="77" cy="18" r="5"/>',
  };

  function dessin(id, couleur) {
    const t = TEINTES[couleur];
    return `<g style="fill:${t.corps};stroke:${t.trait}" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">${FORMES[id](t)}${SOCLE}</g>`;
  }

  // Ajoute une fois pour toutes les symboles SVG des pièces dans la page.
  // On les utilise ensuite avec <use href="#piece-dame-blanc"/>.
  function injecterSprite() {
    if (document.getElementById('sprite-pieces')) return;
    let symboles = '';
    for (const p of PIECES) {
      for (const c of ['blanc', 'noir']) {
        symboles += `<symbol id="piece-${p.id}-${c}" viewBox="0 0 100 100">${dessin(p.id, c)}</symbol>`;
      }
    }
    const boite = document.createElement('div');
    boite.innerHTML = `<svg id="sprite-pieces" width="0" height="0" style="position:absolute" aria-hidden="true">${symboles}</svg>`;
    document.body.prepend(boite.firstChild);
  }

  // Points façon dé pour lire une valeur sans savoir lire les nombres (1, 3, 5, 9).
  const MOTIFS = { 1: [4], 3: [0, 4, 8], 5: [0, 2, 4, 6, 8], 9: [0, 1, 2, 3, 4, 5, 6, 7, 8] };
  function pastilles(valeur) {
    return (MOTIFS[valeur] || []).map(i =>
      `<circle cx="${5 + (i % 3) * 10}" cy="${5 + Math.floor(i / 3) * 10}" r="3.4"/>`).join('');
  }

  window.Echecs = Object.assign(window.Echecs || {}, { PIECES, dessin, injecterSprite, pastilles });
})();
