/* La balance des pièces
   On pose des pièces de chaque côté ; la balance penche du côté le plus lourd
   (pion 1, cavalier 3, fou 3, tour 5, dame 9 ; pas de roi).
   Modes : libre (page de départ, plateaux vides, 10 pièces max par plateau)
           défis (10 positions aléatoires à équilibrer, 6 pièces max, avec ou sans chrono de 20 s). */
(function () {
  const { PIECES, injecterSprite, pastilles } = window.Echecs;
  const { Prefs, brancherBoutonTheme, brancherReglages, brancherInterrupteur } = window.Commun;
  const Sons = window.Sons;
  const NS = 'http://www.w3.org/2000/svg';
  const VALEUR = Object.fromEntries(PIECES.map(p => [p.id, p.valeur]));

  // Géométrie de la balance (unités du viewBox SVG)
  const CX = 280, CY = 120, BRAS = 190, ANGLE_MAX = 14;
  const TAILLES = { libre: 44, defi: 54 }; // taille d'une pièce posée
  const BASE_PILE = 171;       // bas de la pile, dans la coupe
  // Empilement en pyramide dans une coupe
  const RANGEES = { libre: [4, 3, 2, 1], defi: [3, 2, 1] };
  const NB_DEFIS = 10;
  const DUREE_CHRONO = 20;

  const COTES = ['gauche', 'droite'];
  const COULEUR = { gauche: 'blanc', droite: 'noir' };

  const reduireMouvement = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);
  const svg = $('balance');

  // Réglages propres à chaque mode : tout est visible en libre, rien en défi (par défaut)
  const REGLAGES = {
    libre: { valeurs: Prefs.lire('echecs.balance.libre.valeurs', true), totaux: Prefs.lire('echecs.balance.libre.totaux', true) },
    defi:  { valeurs: Prefs.lire('echecs.balance.defi.valeurs', false), totaux: Prefs.lire('echecs.balance.defi.totaux', false) },
  };
  const modeReglages = () => (jeu.mode === 'defi' ? 'defi' : 'libre');
  const reglages = () => REGLAGES[modeReglages()];

  // État de la partie
  const jeu = {
    mode: 'libre',                      // 'libre' | 'defi'
    pieces: { gauche: [], droite: [] },
    fixes: { gauche: 0, droite: 0 },    // en défi, les premières pièces sont imposées
    statut: 'jeu',                      // 'jeu' | 'reussi' | 'rate' | 'fin'
    ajout: null,                        // dernière pièce posée (pour l'animation)
    toutTombe: false,                   // animer toutes les pièces (nouvelle position)
  };
  const defi = { chrono: false, numero: 0, resultats: [], debut: 0, fin: 0, raf: 0, dernierTic: 0, minuterie: 0 };
  let etaitEquilibre = false;

  const rangees = () => RANGEES[jeu.mode === 'defi' ? 'defi' : 'libre'];
  const taille = () => TAILLES[jeu.mode === 'defi' ? 'defi' : 'libre'];
  const maxParPlateau = () => rangees().reduce((a, b) => a + b, 0);
  const peutJouer = () => jeu.mode === 'libre' || (jeu.mode === 'defi' && jeu.statut === 'jeu');
  const total = (cote) => jeu.pieces[cote].reduce((s, id) => s + VALEUR[id], 0);

  // ================= Réserves de pièces =================
  function construireReserve(cote) {
    const conteneur = $('plateau-' + cote);
    conteneur.innerHTML = '';
    for (const p of PIECES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'piece-btn';
      b.dataset.piece = p.id;
      b.innerHTML =
        `<svg class="dessin" viewBox="0 0 100 100" aria-hidden="true"><use href="#piece-${p.id}-${COULEUR[cote]}"/></svg>` +
        `<span class="valeur" aria-hidden="true"><svg class="pastilles" viewBox="0 0 30 30">${pastilles(p.valeur)}</svg>${p.valeur}</span>`;
      b.addEventListener('click', () => ajouter(cote, p.id, b));
      conteneur.appendChild(b);
    }
  }

  function etiqueterReserves() {
    for (const cote of COTES) {
      $('plateau-' + cote).querySelectorAll('.piece-btn').forEach(b => {
        const p = PIECES.find(x => x.id === b.dataset.piece);
        b.setAttribute('aria-label', `Poser ${p.nom[COULEUR[cote]]}` + (reglages().valeurs ? ` (${p.valeur})` : ''));
      });
    }
  }

  function secouer(el, classe = 'secoue') {
    el.classList.remove(classe);
    void (el.getBBox ? el.getBBox() : el.offsetWidth);
    el.classList.add(classe);
  }

  function ajouter(cote, id, bouton) {
    if (!peutJouer()) return;
    if (jeu.pieces[cote].length >= maxParPlateau()) { Sons.refus(); secouer(bouton); return; }
    jeu.pieces[cote].push(id);
    jeu.ajout = { cote, index: jeu.pieces[cote].length - 1 };
    Sons.pose(VALEUR[id]);
    rendre();
  }

  function retirer(cote, index, el) {
    if (!peutJouer()) return;
    if (index < jeu.fixes[cote]) { Sons.refus(); secouer(el, 'bloque'); return; } // pièce imposée
    jeu.pieces[cote].splice(index, 1);
    Sons.retire();
    rendre();
  }

  // ================= Dessin des piles =================
  function positionDans(index) {
    const r = rangees(), TAILLE = taille();
    let reste = index;
    for (let k = 0; k < r.length; k++) {
      if (reste < r[k]) return { x: -r[k] * TAILLE / 2 + reste * TAILLE, y: BASE_PILE - TAILLE * (k + 1) + k * 3 };
      reste -= r[k];
    }
    return { x: 0, y: 0 };
  }

  function dessinerPile(cote) {
    const pile = $('pile-' + cote);
    pile.innerHTML = '';
    jeu.pieces[cote].forEach((id, i) => {
      const { x, y } = positionDans(i);
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('transform', `translate(${x} ${y})`);
      const fixe = i < jeu.fixes[cote];
      g.setAttribute('class', 'piece-posee' + (fixe ? '' : ' mobile'));
      const interieur = document.createElementNS(NS, 'g');
      const tombe = jeu.toutTombe || (jeu.ajout && jeu.ajout.cote === cote && jeu.ajout.index === i);
      if (tombe) {
        interieur.setAttribute('class', 'tombe');
        if (jeu.toutTombe) interieur.style.animationDelay = `${(i * 70 + (cote === 'droite' ? 120 : 0))}ms`;
      }
      const use = document.createElementNS(NS, 'use');
      use.setAttribute('href', `#piece-${id}-${COULEUR[cote]}`);
      use.setAttribute('width', taille());
      use.setAttribute('height', taille());
      interieur.appendChild(use);
      g.appendChild(interieur);
      g.addEventListener('click', () => retirer(cote, i, interieur));
      pile.appendChild(g);
    });
  }

  // ================= Cadran =================
  function construireCadran() {
    const p = (r, a) => {
      const rad = a * Math.PI / 180;
      return `${(CX + r * Math.sin(rad)).toFixed(1)} ${(CY + r * Math.cos(rad)).toFixed(1)}`;
    };
    $('cadran').setAttribute('d', `M${p(118, -24)} A118 118 0 0 0 ${p(118, 24)} L${p(94, 24)} A94 94 0 0 1 ${p(94, -24)} Z`);
    let traits = '';
    for (let a = -20; a <= 20; a += 4) {
      const centre = a === 0;
      traits += `<path class="${centre ? 'trait-centre' : 'trait'}" d="M${p(centre ? 98 : 104, a)} L${p(113, a)}"/>`;
    }
    $('graduations').innerHTML = traits;
  }

  // ================= Visage =================
  function expression(g, d) {
    const vide = jeu.pieces.gauche.length === 0 && jeu.pieces.droite.length === 0;
    const ecart = d - g;
    const sens = Math.sign(ecart);
    $('yeux').style.transform = `translate(${sens * 4}px, ${sens === 0 ? 0 : 2.5}px)`;
    let bouche;
    if (jeu.statut === 'rate') bouche = 'M-9 14 Q0 6 9 14';                                   // déçu
    else if (vide) bouche = 'M-7 10 H7';                                                        // neutre
    else if (ecart === 0) bouche = 'M-11 6 Q0 19 11 6';                                         // grand sourire
    else if (Math.abs(ecart) >= 5) bouche = 'M-4.5 11 a4.5 5 0 1 0 9 0 a4.5 5 0 1 0 -9 0';    // « oh ! »
    else bouche = `M-7 ${11 + sens} Q0 8 7 ${11 - sens}`;                                      // petite moue
    $('bouche').setAttribute('d', bouche);
  }

  function cligner() {
    if (!reduireMouvement) svg.querySelectorAll('#yeux .oeil').forEach(o => secouer(o, 'cligne'));
    setTimeout(cligner, 2500 + Math.random() * 4000);
  }

  // ================= Mise à jour générale =================
  function rendre() {
    dessinerPile('gauche');
    dessinerPile('droite');
    jeu.ajout = null;
    jeu.toutTombe = false;

    const g = total('gauche');
    const d = total('droite');
    const vide = jeu.pieces.gauche.length === 0 && jeu.pieces.droite.length === 0;
    const equilibre = !vide && g === d;

    $('total-gauche').textContent = reglages().totaux ? g : '?';
    $('total-droite').textContent = reglages().totaux ? d : '?';
    $('signe').textContent = g > d ? '>' : g < d ? '<' : '=';
    svg.classList.toggle('equilibre', equilibre);
    svg.classList.toggle('avec-chrono', jeu.mode === 'defi' && defi.chrono);
    document.body.classList.toggle('sans-valeurs', !reglages().valeurs);
    $('balance-resume').textContent = reglages().totaux
      ? `Balance : ${g} à gauche, ${d} à droite`
      : `Balance : ${g > d ? 'la gauche est plus lourde' : g < d ? 'la droite est plus lourde' : 'équilibrée'}`;
    expression(g, d);

    for (const cote of COTES) {
      const bloque = !peutJouer() || jeu.pieces[cote].length >= maxParPlateau();
      $('plateau-' + cote).querySelectorAll('.piece-btn')
        .forEach(b => b.setAttribute('aria-disabled', bloque ? 'true' : 'false'));
    }

    if (equilibre && !etaitEquilibre) {
      feter();
      if (jeu.mode === 'defi' && jeu.statut === 'jeu') terminerDefi(true);
    }
    etaitEquilibre = equilibre;

    cible = ANGLE_MAX * Math.tanh((d - g) / 4);
    demarrerAnimation();
  }

  // ================= Mouvement du fléau (ressort amorti) =================
  let angle = 0, vitesse = 0, cible = 0, enCours = false, avant = 0;

  function placer() {
    const rad = angle * Math.PI / 180;
    const dx = BRAS * Math.cos(rad), dy = BRAS * Math.sin(rad);
    $('fleau').setAttribute('transform', `rotate(${angle.toFixed(2)} ${CX} ${CY})`);
    $('visage').setAttribute('transform', `rotate(${(angle * 0.35).toFixed(2)})`);
    $('pan-gauche').setAttribute('transform', `translate(${(CX - dx).toFixed(2)} ${(CY - dy).toFixed(2)})`);
    $('pan-droite').setAttribute('transform', `translate(${(CX + dx).toFixed(2)} ${(CY + dy).toFixed(2)})`);
  }

  function demarrerAnimation() {
    if (reduireMouvement) { angle = cible; vitesse = 0; placer(); return; }
    if (enCours) return;
    enCours = true;
    avant = performance.now();
    requestAnimationFrame(pas);
  }

  function pas(maintenant) {
    const dt = Math.min(0.032, (maintenant - avant) / 1000);
    avant = maintenant;
    vitesse += (70 * (cible - angle) - 7 * vitesse) * dt;
    angle += vitesse * dt;
    placer();
    if (Math.abs(cible - angle) < 0.02 && Math.abs(vitesse) < 0.02) {
      angle = cible; placer(); enCours = false; return;
    }
    requestAnimationFrame(pas);
  }

  // ================= Récompense =================
  function feter() {
    Sons.bravo();
    if (reduireMouvement) return;
    secouer($('onde'), 'onde-anime');
    const calque = $('confettis');
    const bouts = [];
    for (let i = 0; i < 18; i++) {
      const forme = document.createElementNS(NS, i % 3 ? 'rect' : 'circle');
      forme.setAttribute('class', 'c' + (1 + (i % 3)));
      if (i % 3) { forme.setAttribute('x', -4); forme.setAttribute('y', -2); forme.setAttribute('width', 8); forme.setAttribute('height', 4); forme.setAttribute('rx', 1.5); }
      else forme.setAttribute('r', 3.5);
      calque.appendChild(forme);
      const dir = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const v = 240 + Math.random() * 200;
      bouts.push({ el: forme, x: CX, y: CY - 30, vx: Math.cos(dir) * v, vy: Math.sin(dir) * v, rot: Math.random() * 360 });
    }
    const t0 = performance.now();
    let prec = t0;
    (function anime(t) {
      const dt = Math.min(0.032, (t - prec) / 1000);
      prec = t;
      const vie = (t - t0) / 1200;
      for (const b of bouts) {
        b.vy += 650 * dt;
        b.x += b.vx * dt; b.y += b.vy * dt; b.rot += 360 * dt;
        b.el.setAttribute('transform', `translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) rotate(${b.rot.toFixed(0)})`);
        b.el.setAttribute('opacity', Math.max(0, 1 - vie * vie).toFixed(2));
      }
      if (vie < 1) requestAnimationFrame(anime);
      else bouts.forEach(b => b.el.remove());
    })(t0);
  }

  // ================= Défis =================
  const hasard = (n) => Math.floor(Math.random() * n);
  // les pions sortent plus souvent que les autres pièces
  const TIRAGE = ['pion', 'pion', 'pion', 'cavalier', 'cavalier', 'fou', 'fou', 'tour', 'tour', 'dame'];
  const tirer = (n) => Array.from({ length: n }, () => TIRAGE[hasard(TIRAGE.length)])
    .sort((a, b) => VALEUR[b] - VALEUR[a]); // les plus lourdes en bas de la pile

  // nombre de pièces qu'il faut au minimum pour combler un écart (9, 5, 3, 1)
  function piecesNecessaires(ecart) {
    let n = 0;
    for (const v of [9, 5, 3, 1]) { n += Math.floor(ecart / v); ecart %= v; }
    return n;
  }

  // Positions de plus en plus difficiles : écart et nombre de pièces augmentent.
  function genererPosition(numero, precedente) {
    const ecartMax = numero < 3 ? 3 : numero < 7 ? 6 : 10;
    const ecartMin = numero < 3 ? 1 : 2;
    const nMax = numero < 3 ? 2 : numero < 7 ? 3 : 4;
    const max = RANGEES.defi.reduce((a, b) => a + b, 0);
    for (let essai = 0; essai < 1000; essai++) {
      const g = tirer(1 + hasard(nMax));
      const d = tirer(1 + hasard(nMax));
      const tg = g.reduce((s, id) => s + VALEUR[id], 0);
      const td = d.reduce((s, id) => s + VALEUR[id], 0);
      const ecart = Math.abs(tg - td);
      if (ecart < ecartMin || ecart > ecartMax) continue;
      const leger = tg < td ? g : d;
      if (piecesNecessaires(ecart) > max - leger.length) continue;
      if (precedente && g.join() === precedente.gauche.join() && d.join() === precedente.droite.join()) continue;
      return { gauche: g, droite: d };
    }
    return { gauche: ['tour'], droite: ['cavalier', 'pion'] };
  }

  let positionPrecedente = null;

  function construirePoints() {
    $('points').innerHTML = Array.from({ length: NB_DEFIS }, (_, i) => `<li aria-label="Défi ${i + 1}"></li>`).join('');
  }
  function majPoints() {
    $('points').querySelectorAll('li').forEach((li, i) => {
      const r = defi.resultats[i];
      li.className = r ? (r.ok ? 'ok' : 'rate') : (i === defi.numero ? 'actuel' : '');
    });
  }

  function nouveauDefi() {
    clearTimeout(defi.minuterie);
    const pos = genererPosition(defi.numero, positionPrecedente);
    positionPrecedente = pos;
    jeu.pieces = { gauche: [...pos.gauche], droite: [...pos.droite] };
    jeu.fixes = { gauche: pos.gauche.length, droite: pos.droite.length };
    jeu.statut = 'jeu';
    jeu.toutTombe = true;
    etaitEquilibre = false;
    defi.debut = performance.now();
    $('titre').textContent = `Défi ${defi.numero + 1} sur ${NB_DEFIS}`;
    majPoints();
    rendre();
    if (defi.chrono) demarrerChrono();
  }

  function terminerDefi(reussi) {
    if (jeu.statut !== 'jeu') return;
    arreterChrono();
    jeu.statut = reussi ? 'reussi' : 'rate';
    defi.resultats.push({ ok: reussi, temps: (performance.now() - defi.debut) / 1000 });
    majPoints();
    if (!reussi) { Sons.echec(); rendre(); }
    defi.minuterie = setTimeout(() => {
      defi.numero++;
      if (defi.numero >= NB_DEFIS) montrerResultats();
      else nouveauDefi();
    }, reussi ? 1700 : 1500);
  }

  function demarrerChrono() {
    arreterChrono();
    const anneau = $('chrono');
    const circonference = 2 * Math.PI * 39;
    anneau.style.strokeDasharray = circonference;
    defi.fin = performance.now() + DUREE_CHRONO * 1000;
    defi.dernierTic = 0;
    const boucle = (t) => {
      const reste = Math.max(0, defi.fin - t) / 1000;
      anneau.style.strokeDashoffset = (-circonference * (1 - reste / DUREE_CHRONO)).toFixed(1);
      svg.classList.toggle('presse', reste <= 5);
      const s = Math.ceil(reste);
      if (reste <= 5 && s > 0 && s !== defi.dernierTic) { defi.dernierTic = s; Sons.tic(); }
      if (reste <= 0) { terminerDefi(false); return; }
      defi.raf = requestAnimationFrame(boucle);
    };
    defi.raf = requestAnimationFrame(boucle);
  }
  function arreterChrono() {
    cancelAnimationFrame(defi.raf);
    svg.classList.remove('presse');
  }

  // ---------- Écran de résultats ----------
  const formaterDuree = (s) => {
    s = Math.round(s);
    return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
  };
  const ICONE_OK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const ICONE_RATE = '<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17"/></svg>';

  function montrerResultats() {
    jeu.statut = 'fin';
    const score = defi.resultats.filter(r => r.ok).length;
    const etoiles = score === NB_DEFIS ? 3 : score >= 7 ? 2 : score >= 4 ? 1 : 0;
    const titre = score === NB_DEFIS ? 'Parfait !' : score >= 7 ? 'Bravo !' : score >= 4 ? 'Bien joué !' : 'Continue, tu progresses !';
    $('res-titre').textContent = titre;

    $('etoiles').querySelectorAll('svg').forEach((e, i) => {
      e.classList.toggle('pleine', i < etoiles);
      e.style.animationDelay = `${400 + i * 220}ms`;
    });

    $('res-liste').innerHTML = defi.resultats.map((r, i) =>
      `<li class="${r.ok ? 'ok' : 'rate'}" style="animation-delay:${700 + i * 70}ms" aria-label="Défi ${i + 1} : ${r.ok ? 'réussi' : 'raté'}, ${formaterDuree(r.temps)}">` +
      `<span class="res-rond">${r.ok ? ICONE_OK : ICONE_RATE}</span><span class="res-t">${Math.round(r.temps)} s</span></li>`).join('');

    const reussis = defi.resultats.filter(r => r.ok);
    const totalTemps = defi.resultats.reduce((s, r) => s + r.temps, 0);
    $('res-temps').textContent = `Temps total : ${formaterDuree(totalTemps)}` +
      (reussis.length ? ` · ${formaterDuree(reussis.reduce((s, r) => s + r.temps, 0) / reussis.length)} en moyenne par balance réussie` : '');

    $('resultats').hidden = false;
    $('btn-rejouer').focus({ preventScroll: true });

    // le score compte jusqu'au résultat
    const scoreEl = $('res-score');
    if (reduireMouvement) scoreEl.textContent = score;
    else {
      const t0 = performance.now();
      (function compte(t) {
        const p = Math.min(1, (t - t0) / 900);
        scoreEl.textContent = Math.round(score * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(compte);
      })(t0);
      lancerPluie(score >= 4 ? 70 : 30);
    }
    Sons.victoire();
  }

  function lancerPluie(n) {
    const pluie = $('pluie');
    pluie.innerHTML = '';
    const couleurs = ['var(--accent)', 'var(--or)', 'var(--laiton-clair)', 'var(--surface)', 'var(--alerte)'];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i');
      c.style.setProperty('--x', `${Math.random() * 100}%`);
      c.style.setProperty('--dx', `${(Math.random() - 0.5) * 160}px`);
      c.style.setProperty('--r', `${(Math.random() - 0.5) * 1080}deg`);
      c.style.setProperty('--d', `${2.4 + Math.random() * 2}s`);
      c.style.setProperty('--delai', `${Math.random() * 1.2}s`);
      c.style.setProperty('--c', couleurs[i % couleurs.length]);
      pluie.appendChild(c);
    }
  }

  // ================= Navigation entre les modes =================
  function changerMode(mode) {
    clearTimeout(defi.minuterie);
    arreterChrono();
    $('resultats').hidden = true;
    $('pluie').innerHTML = '';
    jeu.mode = mode;
    document.body.dataset.mode = mode;
    jeu.pieces = { gauche: [], droite: [] };
    jeu.fixes = { gauche: 0, droite: 0 };
    jeu.statut = 'jeu';
    etaitEquilibre = false;
    majInterrupteurs();
    etiqueterReserves();
  }

  function lancerLibre() {
    changerMode('libre');
    $('titre').textContent = 'La balance';
    rendre();
  }

  function lancerDefis(avecChrono) {
    fermerChoixDefi();
    changerMode('defi');
    defi.chrono = avecChrono;
    defi.numero = 0;
    defi.resultats = [];
    positionPrecedente = null;
    construirePoints();
    nouveauDefi();
  }

  // ================= Boutons =================
  // fenêtre de choix du défi
  function ouvrirChoixDefi() {
    $('choix-defi').hidden = false;
    $('mode-defi').focus({ preventScroll: true });
  }
  function fermerChoixDefi() { $('choix-defi').hidden = true; }
  $('btn-defis').addEventListener('click', ouvrirChoixDefi);
  $('btn-fermer-choix').addEventListener('click', () => { fermerChoixDefi(); $('btn-defis').focus(); });
  $('choix-defi').addEventListener('click', (e) => { if (e.target === e.currentTarget) fermerChoixDefi(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('choix-defi').hidden) fermerChoixDefi(); });
  $('mode-defi').addEventListener('click', () => lancerDefis(false));
  $('mode-chrono').addEventListener('click', () => lancerDefis(true));
  $('btn-retour').addEventListener('click', lancerLibre);
  $('btn-menu').addEventListener('click', lancerLibre);
  $('btn-rejouer').addEventListener('click', () => lancerDefis(defi.chrono));
  $('btn-passer').addEventListener('click', () => { if (jeu.mode === 'defi') terminerDefi(false); });
  $('btn-vider').addEventListener('click', () => {
    if (!peutJouer()) return;
    // en défi, on ne retire que les pièces ajoutées par l'enfant
    for (const cote of COTES) jeu.pieces[cote].length = jeu.fixes[cote];
    Sons.retire();
    rendre();
  });

  brancherBoutonTheme($('btn-theme'));
  brancherReglages($('btn-reglages'), $('panneau-reglages'));
  const interValeurs = brancherInterrupteur($('reg-valeurs'), reglages().valeurs, (v) => {
    reglages().valeurs = v; Prefs.ecrire(`echecs.balance.${modeReglages()}.valeurs`, v); etiqueterReserves(); rendre();
  });
  const interTotaux = brancherInterrupteur($('reg-totaux'), reglages().totaux, (v) => {
    reglages().totaux = v; Prefs.ecrire(`echecs.balance.${modeReglages()}.totaux`, v); rendre();
  });
  function majInterrupteurs() {
    interValeurs.definir(reglages().valeurs);
    interTotaux.definir(reglages().totaux);
  }
  brancherInterrupteur($('reg-son'), Sons.actif, (v) => { Sons.actif = v; });

  // ================= Démarrage =================
  injecterSprite();
  construireCadran();
  construireReserve('gauche');
  construireReserve('droite');
  lancerLibre();
  setTimeout(cligner, 2000);
})();
