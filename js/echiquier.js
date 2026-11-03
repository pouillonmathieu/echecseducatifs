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
        c.className = 'case-e ' + ((COLONNES.indexOf(l) + r) % 2 ? 'foncee' : 'claire'); // a1 est une case foncée
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

  // ---------- Dessins au clic droit ----------
  // Clic droit glissé : une flèche ; clic droit sur une case : la case colorée. La touche tenue choisit la couleur
  // (sans touche : vert, Maj : orange, Ctrl ou Cmd : rouge, Alt : gris) ; refaire la même chose l'efface.
  // liste : [["g1f3", "suite"], ["e4", "menace"], …] (2 lettres = une case, 4 = une flèche).
  const TEINTES = { suite: '#2FA36B', menace: '#E2622A', danger: '#C8323C', adversaire: '#5A6474' };
  const VOILES = { suite: 'rgba(47, 163, 107, .6)', menace: 'rgba(226, 98, 42, .62)', danger: 'rgba(200, 50, 60, .6)', adversaire: 'rgba(90, 100, 116, .55)' };
  const couleurTouche = (e) => (e.shiftKey ? 'menace' : e.ctrlKey || e.metaKey ? 'danger' : e.altKey ? 'adversaire' : 'suite');
  const r1 = (n) => Math.round(n * 10) / 10;
  function dessinerAnnotations(conteneur, liste) {
    // les cases : un voile de couleur sur le fond de la case, sous la pièce
    conteneur.querySelectorAll('.case-e[data-voile]').forEach(c => { c.style.backgroundImage = ''; delete c.dataset.voile; });
    for (const [u, g] of liste.filter(f => f[0].length === 2)) {
      const c = conteneur.querySelector(`[data-case="${u}"]`);
      if (c) { c.style.backgroundImage = `linear-gradient(${VOILES[g]}, ${VOILES[g]})`; c.dataset.voile = g; }
    }
    // les flèches : un calque SVG au-dessus de l'échiquier
    const vieux = conteneur.querySelector(':scope > .annotations');
    if (vieux) vieux.remove();
    const fleches = liste.filter(f => f[0].length >= 4);
    if (!fleches.length) return;
    if (getComputedStyle(conteneur).position === 'static') conteneur.style.position = 'relative';
    const r0 = conteneur.getBoundingClientRect();
    let h = `<svg class="annotations" viewBox="0 0 ${r1(r0.width)} ${r1(r0.height)}" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;z-index:6;pointer-events:none"><defs>`;
    for (const [g, c] of Object.entries(TEINTES)) h += `<marker id="annot-${g}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="2.6" markerHeight="2.6" orient="auto"><path d="M0 0 10 5 0 10Z" fill="${c}"/></marker>`;
    h += '</defs>';
    for (const [u, g] of fleches) {
      const a = conteneur.querySelector(`[data-case="${u.slice(0, 2)}"]`), b = conteneur.querySelector(`[data-case="${u.slice(2, 4)}"]`);
      if (!a || !b) continue;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const x1 = ra.left + ra.width / 2 - r0.left, y1 = ra.top + ra.height / 2 - r0.top;
      let x2 = rb.left + rb.width / 2 - r0.left, y2 = rb.top + rb.height / 2 - r0.top;
      const d = Math.hypot(x2 - x1, y2 - y1) || 1;
      x2 -= (x2 - x1) / d * ra.width * 0.28; y2 -= (y2 - y1) / d * ra.width * 0.28;
      h += `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${TEINTES[g]}" stroke-width="${r1(ra.width * 0.15)}" stroke-linecap="round" opacity=".85"` +
        `${g === 'danger' ? ` stroke-dasharray="${r1(ra.width * 0.15)} ${r1(ra.width * 0.09)}"` : ''} marker-end="url(#annot-${g})"/>`;
    }
    conteneur.insertAdjacentHTML('beforeend', h + '</svg>');
  }
  // branche le clic droit sur un échiquier ; renvoie { effacer() } pour tout effacer (quand la position change)
  function annotations(conteneur) {
    let liste = [], depart = null;
    conteneur.addEventListener('contextmenu', (e) => e.preventDefault());
    conteneur.addEventListener('pointerdown', (e) => {
      if (e.button !== 2) return;
      const c = e.target.closest('.case-e');
      depart = c ? c.dataset.case : null;
    });
    window.addEventListener('pointerup', (e) => {
      if (e.button !== 2 || !depart) return;
      const de = depart;
      depart = null;
      const sous = document.elementFromPoint(e.clientX, e.clientY);
      const c = sous && sous.closest('.case-e');
      if (!c || !conteneur.contains(c)) return;
      const u = c.dataset.case === de ? de : de + c.dataset.case, g = couleurTouche(e);
      const i = liste.findIndex(x => x[0] === u);
      if (i >= 0 && liste[i][1] === g) liste.splice(i, 1);
      else if (i >= 0) liste[i] = [u, g];
      else liste.push([u, g]);
      dessinerAnnotations(conteneur, liste);
    });
    window.addEventListener('resize', () => { if (liste.length) dessinerAnnotations(conteneur, liste); });
    return { effacer() { liste = []; dessinerAnnotations(conteneur, liste); } };
  }

  window.Echiquier = { lireFen, dessiner, marquer, effacer, nomPiece, dessinerAnnotations, annotations };
})();
