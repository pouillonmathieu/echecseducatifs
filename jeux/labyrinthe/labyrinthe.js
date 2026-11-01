/* Le labyrinthe
   Une seule pièce (cavalier, fou, tour ou dame) doit rentrer à sa maison en contournant des obstacles
   (pierres, eau, lave ou buissons). Seuls les coups réguliers sont acceptés : les pièces qui glissent
   s'arrêtent devant un obstacle ; le cavalier saute par-dessus mais ne peut pas s'y poser.
   Les obstacles sont posés au hasard ; un parcours en largeur garantit qu'un chemin existe, donne
   sa longueur (le plus court) et vérifie que les obstacles obligent à faire un détour. */
(function () {
  const { Prefs, brancherBoutonTheme, brancherReglages, brancherInterrupteur } = window.Commun;
  const { lancerPluie, allumerEtoiles } = window.UI;
  const Sons = window.Sons;
  const $ = (id) => document.getElementById(id);
  const plateau = $('echiquier');

  // ---------- Échiquier et déplacements ----------
  const COL = 'abcdefgh';
  const nom = (f, r) => COL[f] + (r + 1);
  const coord = (c) => [COL.indexOf(c[0]), +c[1] - 1];
  const dedans = (f, r) => f >= 0 && f < 8 && r >= 0 && r < 8;
  const DIRECTIONS = { tour: [[1, 0], [-1, 0], [0, 1], [0, -1]], fou: [[1, 1], [1, -1], [-1, 1], [-1, -1]] };
  DIRECTIONS.dame = [...DIRECTIONS.tour, ...DIRECTIONS.fou];
  const SAUTS = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
  const PIECES = ['cavalier', 'fou', 'tour', 'dame'];
  const OBSTACLES = ['pierre', 'eau', 'lave', 'buisson'];
  const NOMS = { cavalier: 'le cavalier', fou: 'le fou', tour: 'la tour', dame: 'la dame' };
  const DE = { cavalier: 'du cavalier', fou: 'du fou', tour: 'de la tour', dame: 'de la dame' };

  // cases où la pièce peut aller depuis `c`
  function coups(piece, c, obstacles) {
    const [f, r] = coord(c);
    const res = [];
    if (piece === 'cavalier') {
      for (const [df, dr] of SAUTS) {
        const g = f + df, s = r + dr;
        if (dedans(g, s) && !obstacles.has(nom(g, s))) res.push(nom(g, s));
      }
      return res;
    }
    for (const [df, dr] of DIRECTIONS[piece]) {
      let g = f + df, s = r + dr;
      while (dedans(g, s) && !obstacles.has(nom(g, s))) { res.push(nom(g, s)); g += df; s += dr; }
    }
    return res;
  }
  // parcours en largeur : distance (en coups) et case précédente pour chaque case atteignable
  function parcourir(piece, depart, obstacles) {
    const dist = { [depart]: 0 };
    const avant = {};
    const file = [depart];
    while (file.length) {
      const c = file.shift();
      for (const n of coups(piece, c, obstacles)) {
        if (n in dist) continue;
        dist[n] = dist[c] + 1;
        avant[n] = c;
        file.push(n);
      }
    }
    return { dist, avant };
  }
  function chemin(piece, depart, arrivee, obstacles) {
    const { avant, dist } = parcourir(piece, depart, obstacles);
    if (!(arrivee in dist)) return null;
    const res = [arrivee];
    while (res[0] !== depart) res.unshift(avant[res[0]]);
    return res;
  }

  // ---------- Génération ----------
  const entre = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const auHasard = (t) => t[Math.floor(Math.random() * t.length)];
  // nombre d'obstacles et longueur du plus court chemin voulue, selon la pièce
  const REGLES = {
    cavalier: { obstacles: [12, 18], coups: [3, 5] },
    fou: { obstacles: [16, 22], coups: [3, 5] },
    tour: { obstacles: [16, 24], coups: [3, 5] },
    dame: { obstacles: [20, 28], coups: [3, 4] },
  };
  function generer(piece) {
    const R = REGLES[piece];
    for (let essai = 0; essai < 3000; essai++) {
      // des petits murs (1 à 4 cases, en ligne ou en colonne), comme sur une fiche d'exercices
      const obstacles = new Set();
      const voulu = entre(...R.obstacles);
      while (obstacles.size < voulu) {
        let f = entre(0, 7), r = entre(0, 7);
        const horizontal = Math.random() < 0.5;
        for (let i = entre(1, 4); i > 0 && dedans(f, r); i--) { obstacles.add(nom(f, r)); horizontal ? f++ : r++; }
      }
      const libres = [];
      for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) if (!obstacles.has(nom(f, r))) libres.push(nom(f, r));
      const depart = auHasard(libres);
      const avec = parcourir(piece, depart, obstacles).dist;
      const sans = parcourir(piece, depart, new Set()).dist;
      // la maison : assez loin, et (sauf pour le cavalier) les obstacles obligent à un détour
      const relache = essai > 2500;
      const maisons = Object.keys(avec).filter(c => avec[c] >= (relache ? 2 : R.coups[0]) && avec[c] <= R.coups[1] &&
        (piece === 'cavalier' || relache || avec[c] > sans[c]));
      if (maisons.length) {
        const maison = auHasard(maisons);
        return { piece, obstacles, depart, maison, optimal: avec[maison] };
      }
    }
    return null;
  }

  // ---------- État ----------
  const choix = { piece: 'hasard', obstacle: 'hasard' }; // au hasard par défaut, à chaque visite
  const reglages = {
    possibles: Prefs.lire('echecs.laby.possibles', false),
    coordonnees: Prefs.lire('echecs.laby.coordonnees', true),
  };
  const jeu = { laby: null, theme: 'pierre', parcours: [], fini: false, aide: false, voir: false, anim: false };
  const ici = () => jeu.parcours[jeu.parcours.length - 1];

  // ---------- Affichage ----------
  const cellule = (c) => plateau.querySelector(`[data-case="${c}"]`);
  function dessiner() {
    const L = jeu.laby;
    Echiquier.dessiner(plateau, '8/8/8/8/8/8/8/8');
    for (const c of L.obstacles) {
      const el = cellule(c);
      el.classList.add('bloquee');
      // chaque obstacle un peu différent : tourné ou retourné
      const t = jeu.theme === 'eau' ? `scale(${auHasard([1, -1])}, 1)` : `rotate(${auHasard([0, 90, 180, 270])}deg)`;
      el.insertAdjacentHTML('beforeend', `<svg class="obstacle" viewBox="0 0 100 100" style="transform:${t}" aria-hidden="true"><use href="#obstacle-${jeu.theme}"/></svg>`);
      el.setAttribute('aria-label', `${c} : obstacle`);
    }
    const maison = cellule(L.maison);
    maison.classList.add('maison');
    maison.insertAdjacentHTML('beforeend',
      `<svg class="maison-dessin" viewBox="0 0 100 100" aria-hidden="true">` +
      `<path d="M50 9 93 47H81v44H19V47H7Z" class="maison-trace"/>` +
      `<use href="#piece-${L.piece}-noir" x="24" y="38" width="52" height="52" class="maison-fantome"/></svg>`);
    maison.setAttribute('aria-label', `${L.maison} : maison ${DE[L.piece]}`);
    poserPiece(ici());
    majMarques();
  }
  function poserPiece(c) {
    const ancienne = plateau.querySelector('.piece-laby');
    if (ancienne) ancienne.remove();
    cellule(c).insertAdjacentHTML('beforeend',
      `<svg class="piece-e piece-laby" viewBox="0 0 100 100" aria-hidden="true"><use href="#piece-${jeu.laby.piece}-noir"/></svg>`);
  }
  // numéros du chemin parcouru, cases possibles, solution
  function majMarques() {
    plateau.querySelectorAll('.etape').forEach(e => e.remove());
    Echiquier.effacer(plateau, 'possible', 'chemin');
    jeu.parcours.slice(1).forEach((c, i) => {
      cellule(c).insertAdjacentHTML('beforeend', `<span class="etape" aria-hidden="true">${i + 1}</span>`);
      cellule(c).classList.add('chemin');
    });
    if (jeu.solution) {
      jeu.solution.slice(1).forEach((c, i) => {
        if (c === ici()) return;
        cellule(c).insertAdjacentHTML('beforeend', `<span class="etape solution" aria-hidden="true">${jeu.parcours.length + i}</span>`);
      });
    }
    if (!jeu.fini && (reglages.possibles || jeu.voir)) Echiquier.marquer(plateau, coups(jeu.laby.piece, ici(), jeu.laby.obstacles), 'possible');
    $('nb-coups').textContent = jeu.parcours.length - 1;
    $('btn-annuler').disabled = jeu.parcours.length < 2 || jeu.fini;
    $('btn-recommencer').disabled = jeu.parcours.length < 2 && !jeu.solution;
    const deplace = jeu.parcours.length - 1;
    $('nb-coups').parentElement.classList.toggle('depasse', deplace > jeu.laby.optimal);
  }

  // ---------- Partie ----------
  function nouveau() {
    const piece = choix.piece === 'hasard' ? auHasard(PIECES) : choix.piece;
    jeu.theme = choix.obstacle === 'hasard' ? auHasard(OBSTACLES) : choix.obstacle;
    jeu.laby = generer(piece);
    demarrer();
  }
  function demarrer() {
    jeu.parcours = [jeu.laby.depart];
    jeu.fini = false;
    jeu.aide = false;
    jeu.voir = false;
    jeu.solution = null;
    $('resultats').hidden = true;
    $('pluie').innerHTML = '';
    $('consigne').textContent = `Ramène ${NOMS[jeu.laby.piece]} à sa maison`;
    $('nb-optimal').textContent = jeu.laby.optimal;
    dessiner();
  }

  function toucher(c) {
    if (jeu.fini || jeu.anim) return;
    if (c === ici()) { // la pièce : on montre (ou cache) où elle peut aller
      jeu.voir = !jeu.voir;
      majMarques();
      return;
    }
    const possibles = coups(jeu.laby.piece, ici(), jeu.laby.obstacles);
    if (!possibles.includes(c)) { refuser(c); return; }
    jouer(c);
  }
  function refuser(c) {
    Sons.refus();
    const el = cellule(c);
    el.classList.remove('refus'); void el.offsetWidth; el.classList.add('refus');
    // on montre un instant les cases possibles
    jeu.voir = true;
    majMarques();
  }
  function jouer(c) {
    const de = ici();
    jeu.anim = true;
    jeu.voir = false;
    Echiquier.effacer(plateau, 'possible');
    glisser(de, c, () => {
      jeu.anim = false;
      jeu.parcours.push(c);
      if (jeu.solution && jeu.solution[jeu.parcours.length - 1] !== c) jeu.solution = null; // on a quitté la solution
      Sons.pose(3);
      poserPiece(c);
      if (c === jeu.laby.maison) arriver();
      majMarques();
    });
  }
  // la pièce glisse jusqu'à sa nouvelle case
  function glisser(de, a, fin) {
    const piece = plateau.querySelector('.piece-laby');
    const r1 = cellule(de).getBoundingClientRect();
    const r2 = cellule(a).getBoundingClientRect();
    const dx = r2.left - r1.left, dy = r2.top - r1.top;
    if (!piece || !piece.animate) { fin(); return; }
    const cases = Math.max(Math.abs(dx), Math.abs(dy)) / r1.width;
    cellule(de).style.zIndex = 3;
    const anim = piece.animate([
      { transform: 'translate(0, 0) scale(1)' },
      { transform: `translate(${dx / 2}px, ${dy / 2}px) scale(1.12)`, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(1)` },
    ], { duration: Math.min(650, 260 + cases * 70), easing: 'ease-in-out', fill: 'forwards' });
    anim.onfinish = () => { cellule(de).style.zIndex = ''; fin(); };
  }

  function arriver() {
    jeu.fini = true;
    const n = jeu.parcours.length - 1;
    const opt = jeu.laby.optimal;
    let etoiles = n === opt ? 3 : n <= opt + 2 ? 2 : 1;
    if (jeu.aide) etoiles = Math.min(etoiles, 1);
    setTimeout(() => {
      if (!jeu.fini) return;
      $('res-titre').textContent = n === opt && !jeu.aide ? 'Parfait !' : 'Bravo !';
      $('res-detail').innerHTML =
        `${NOMS[jeu.laby.piece][0].toUpperCase() + NOMS[jeu.laby.piece].slice(1)} est rentré${jeu.laby.piece === 'tour' || jeu.laby.piece === 'dame' ? 'e' : ''} en <b>${n} coup${n > 1 ? 's' : ''}</b>.<br>` +
        (n === opt ? 'C\'est le chemin le plus court !' : `Le chemin le plus court se fait en <b>${opt} coups</b>.`) +
        (jeu.aide ? '<br><small>Avec l\'aide de la solution.</small>' : '');
      allumerEtoiles($('etoiles'), etoiles);
      $('resultats').hidden = false;
      $('btn-res-nouveau').focus({ preventScroll: true });
      lancerPluie($('pluie'), etoiles === 3 ? 70 : 35);
      if (etoiles === 3) Sons.victoire(); else Sons.bravo();
    }, 450);
  }

  function annuler() {
    if (jeu.parcours.length < 2 || jeu.fini || jeu.anim) return;
    jeu.parcours.pop();
    poserPiece(ici());
    Sons.retire();
    majMarques();
  }
  function montrerSolution() {
    if (jeu.fini || jeu.anim) return;
    jeu.solution = [...jeu.parcours.slice(0, -1), ...chemin(jeu.laby.piece, ici(), jeu.laby.maison, jeu.laby.obstacles)];
    jeu.aide = true;
    majMarques();
  }

  // ---------- Choix ----------
  function brancherChoix(id, cle) {
    const boutons = [...$(id).querySelectorAll('button')];
    const maj = () => boutons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.valeur === choix[cle])));
    boutons.forEach(b => b.addEventListener('click', () => { choix[cle] = b.dataset.valeur; maj(); nouveau(); }));
    maj();
  }
  brancherChoix('choix-piece', 'piece');
  brancherChoix('choix-obstacle', 'obstacle');

  // ---------- Branchements ----------
  plateau.addEventListener('click', (e) => {
    const c = e.target.closest('.case-e');
    if (c) toucher(c.dataset.case);
  });
  $('btn-annuler').addEventListener('click', annuler);
  $('btn-recommencer').addEventListener('click', () => { if (!jeu.anim) demarrer(); });
  $('btn-solution').addEventListener('click', montrerSolution);
  $('btn-nouveau').addEventListener('click', nouveau);
  $('btn-res-nouveau').addEventListener('click', nouveau);
  $('btn-res-rejouer').addEventListener('click', demarrer);
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest('input, textarea')) return;
    if (!$('resultats').hidden) return;
    if (e.key === 'Backspace' || (e.key.toLowerCase() === 'z')) { e.preventDefault(); annuler(); }
  });

  brancherBoutonTheme($('btn-theme'));
  brancherReglages($('btn-reglages'), $('panneau-reglages'));
  brancherInterrupteur($('reg-possibles'), reglages.possibles, (v) => { reglages.possibles = v; Prefs.ecrire('echecs.laby.possibles', v); majMarques(); });
  const appliquerCoord = () => document.body.classList.toggle('sans-coordonnees', !reglages.coordonnees);
  brancherInterrupteur($('reg-coordonnees'), reglages.coordonnees, (v) => { reglages.coordonnees = v; Prefs.ecrire('echecs.laby.coordonnees', v); appliquerCoord(); });
  brancherInterrupteur($('reg-son'), Sons.actif, (v) => { Sons.actif = v; });

  // ---------- Démarrage ----------
  window.Echecs.injecterSprite();
  appliquerCoord();
  nouveau();
  // pour les tests : vérifier qu'un labyrinthe a bien une solution
  window.Labyrinthe = { generer, parcourir, coups, chemin, etat: () => jeu };
})();
