/* Échiquier partagé : affiche une position (notation FEN) avec les pièces de pieces.js,
   les coordonnées autour, et permet de surligner des cases. */
(function () {
  const COLONNES = 'abcdefgh';
  const TYPES = { p: 'pion', n: 'cavalier', b: 'fou', r: 'tour', q: 'dame', k: 'roi' };

  // 'r1bqkb1r/pppp1Qpp/...' -> { e8: { piece: 'roi', couleur: 'noir' }, ... }
  function lireFen(fen) {
    const cases = {};
    fen.split(' ')[0].split('/').forEach((ligne, i) => {
      let col = 0;
      for (const ch of ligne) {
        if (/\d/.test(ch)) { col += +ch; continue; }
        cases[COLONNES[col] + (8 - i)] = { piece: TYPES[ch.toLowerCase()], couleur: ch === ch.toUpperCase() ? 'blanc' : 'noir' };
        col++;
      }
    });
    return cases;
  }

  const ARTICLE = { pion: 'pion', cavalier: 'cavalier', fou: 'fou', tour: 'tour', dame: 'dame', roi: 'roi' };
  function nomPiece(p) {
    const f = p.piece === 'tour' || p.piece === 'dame';
    return `${ARTICLE[p.piece]} ${p.couleur === 'blanc' ? (f ? 'blanche' : 'blanc') : (f ? 'noire' : 'noir')}`;
  }

  // Construit l'échiquier dans `conteneur` (classe .echiquier ajoutée).
  // dessins : mode tout-petits, un animal par colonne et des doigts par rangée dans les marges (js/tout-petits.js).
  function dessiner(conteneur, fen, { orientation = 'blanc', dessins = false } = {}) {
    const TP = dessins && window.ToutPetits;
    const pieces = lireFen(fen);
    const cols = orientation === 'blanc' ? [...COLONNES] : [...COLONNES].reverse();
    const rangs = orientation === 'blanc' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
    const f = document.createDocumentFragment();
    const ajouter = (el, ligne, colonne) => { el.style.gridRow = ligne; el.style.gridColumn = colonne; f.appendChild(el); };
    rangs.forEach((r, i) => {
      const e = document.createElement('span');
      e.className = 'coord rangee';
      if (TP) e.innerHTML = `<span class="chiffre">${r}</span>${TP.mains(r)}`;
      else e.textContent = r;
      ajouter(e, i + 2, 1);
      cols.forEach((l, j) => {
        const nom = l + r;
        const c = document.createElement('div');
        c.className = 'case-e ' + ((COLONNES.indexOf(l) + r) % 2 ? 'claire' : 'foncee');
        c.dataset.case = nom;
        const p = pieces[nom];
        c.setAttribute('aria-label', p ? `${nom} : ${nomPiece(p)}` : nom);
        c.setAttribute('role', 'gridcell');
        if (p) c.innerHTML = `<svg class="piece-e" viewBox="0 0 100 100" aria-hidden="true"><use href="#piece-${p.piece}-${p.couleur}"/></svg>`;
        ajouter(c, i + 2, j + 2);
      });
    });
    cols.forEach((l, j) => {
      const e = document.createElement('span');
      e.className = 'coord colonne';
      if (TP) e.innerHTML = `${TP.animal(l)}<span class="lettre">${l}</span>`;
      else e.textContent = l;
      ajouter(e, 10, j + 2);
    });
    conteneur.classList.add('echiquier');
    conteneur.classList.toggle('avec-dessins', !!TP);
    conteneur.setAttribute('role', 'grid');
    conteneur.replaceChildren(f);
  }

  function marquer(conteneur, cases, classe) {
    for (const nom of cases) {
      const c = conteneur.querySelector(`[data-case="${nom}"]`);
      if (c) c.classList.add(classe);
    }
  }
  function effacer(conteneur, ...classes) {
    conteneur.querySelectorAll('.case-e').forEach(c => c.classList.remove(...classes));
  }

  window.Echiquier = { lireFen, dessiner, marquer, effacer, nomPiece };
})();
