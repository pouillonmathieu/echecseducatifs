/* Le cheval de la reine
   Une dame et un cavalier, seuls sur l'échiquier.
   - Mode « dame » : tu joues la dame blanche et tu dois attraper le cavalier noir en le moins de coups possible.
   - Mode « cavalier » : tu joues le cavalier blanc et tu dois échapper à la dame noire le plus longtemps possible.
   Le joueur commence. Le cavalier peut prendre la dame si elle se pose sur une case qu'il attaque.
   L'adversaire est joué par l'ordinateur, avec deux niveaux :
   - difficile : il joue parfaitement, grâce à une table calculée au chargement (toutes les positions dame/cavalier,
     coup par coup en partant des prises : c'est une « analyse rétrograde ») ;
   - facile : le cavalier fuit au hasard vers une case où il n'est pas pris tout de suite ;
     la dame joue le meilleur coup une fois sur deux, sinon un coup au hasard qui ne la met pas en prise.
   Bon à savoir : avec un jeu parfait des deux côtés, la dame attrape toujours le cavalier en 5 coups au plus. */
(function () {
  const { EN, t, Prefs, brancherBoutonTheme, brancherReglages, brancherInterrupteur } = window.Commun;
  const { lancerPluie, compterJusqua, allumerEtoiles } = window.UI;
  const Sons = window.Sons;
  const $ = (id) => document.getElementById(id);
  const plateau = $('echiquier');
  const annotations = Echiquier.annotations(plateau);

  // ---------- Les coups ----------
  // une case = un nombre de 0 à 63 : colonne = c & 7 (a…h), rangée = c >> 3 (1…8)
  const COLONNES = 'abcdefgh';
  const nom = (c) => COLONNES[c & 7] + ((c >> 3) + 1);
  const numero = (n) => COLONNES.indexOf(n[0]) + (+n[1] - 1) * 8;
  const SAUTS = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
  const LIGNES = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const CAVALIER = [];
  for (let c = 0; c < 64; c++) {
    CAVALIER[c] = [];
    for (const [dx, dy] of SAUTS) {
      const x = (c & 7) + dx, y = (c >> 3) + dy;
      if (x >= 0 && x < 8 && y >= 0 && y < 8) CAVALIER[c].push(y * 8 + x);
    }
  }
  // cases où la dame en q peut aller ; elle s'arrête sur le cavalier en n (elle peut le prendre, pas sauter par-dessus)
  function coupsDame(q, n) {
    const cases = [];
    for (const [dx, dy] of LIGNES) {
      let x = (q & 7) + dx, y = (q >> 3) + dy;
      while (x >= 0 && x < 8 && y >= 0 && y < 8) {
        const c = y * 8 + x;
        cases.push(c);
        if (c === n) break;
        x += dx; y += dy;
      }
    }
    return cases;
  }
  const dameAttaque = (q, n) => coupsDame(q, n).includes(n);
  const cavalierAttaque = (n, q) => CAVALIER[n].includes(q);

  // ---------- La table : nombre de coups de dame pour prendre le cavalier, si les deux jouent parfaitement ----------
  // AVEC_DAME[q * 64 + n] : la dame doit jouer ; AVEC_CAVALIER[q * 64 + n] : le cavalier doit jouer.
  // INF = jamais (le cavalier prend la dame).
  const INF = 99;
  const AVEC_DAME = new Array(4096).fill(INF);
  const AVEC_CAVALIER = new Array(4096).fill(INF);
  for (let q = 0; q < 64; q++) for (let n = 0; n < 64; n++) if (q !== n && dameAttaque(q, n)) AVEC_DAME[q * 64 + n] = 1;
  for (let tour = 0; tour < 30; tour++) {
    let change = false;
    for (let q = 0; q < 64; q++) for (let n = 0; n < 64; n++) {
      if (q === n) continue;
      let v = INF;
      if (!cavalierAttaque(n, q)) { v = 0; for (const m of CAVALIER[n]) v = Math.max(v, AVEC_DAME[q * 64 + m]); }
      if (v !== AVEC_CAVALIER[q * 64 + n]) { AVEC_CAVALIER[q * 64 + n] = v; change = true; }
    }
    for (let q = 0; q < 64; q++) for (let n = 0; n < 64; n++) {
      if (q === n || AVEC_DAME[q * 64 + n] === 1) continue;
      let v = INF;
      for (const c of coupsDame(q, n)) if (c !== n) v = Math.min(v, 1 + AVEC_CAVALIER[c * 64 + n]);
      if (v !== AVEC_DAME[q * 64 + n]) { AVEC_DAME[q * 64 + n] = v; change = true; }
    }
    if (!change) break;
  }

  // ---------- L'ordinateur ----------
  const auHasard = (liste) => liste[Math.floor(Math.random() * liste.length)];
  // le cavalier (mode « dame ») : il prend la dame s'il peut ; sinon il fuit
  function coupCavalier(q, n, difficile) {
    if (cavalierAttaque(n, q)) return q;
    const coups = CAVALIER[n];
    if (difficile) {
      const meilleur = Math.max(...coups.map(m => AVEC_DAME[q * 64 + m]));
      return auHasard(coups.filter(m => AVEC_DAME[q * 64 + m] === meilleur));
    }
    const surs = coups.filter(m => !dameAttaque(q, m));
    return auHasard(surs.length ? surs : coups);
  }
  // la dame (mode « cavalier ») : elle prend le cavalier si elle peut ; sinon elle s'approche sans se mettre en prise
  function coupDame(q, n, difficile) {
    if (dameAttaque(q, n)) return n;
    const coups = coupsDame(q, n).filter(c => c !== n);
    const surs = coups.filter(c => !cavalierAttaque(n, c));
    if (difficile || Math.random() < 0.5) {
      const meilleur = Math.min(...surs.map(c => AVEC_CAVALIER[c * 64 + n]));
      return auHasard(surs.filter(c => AVEC_CAVALIER[c * 64 + n] === meilleur));
    }
    return auHasard(surs.length ? surs : coups);
  }

  // ---------- Réglages ----------
  const lire = (cle, defaut) => { try { return localStorage.getItem(cle) || defaut; } catch (e) { return defaut; } };
  const ecrire = (cle, v) => { try { localStorage.setItem(cle, v); } catch (e) { /* stockage indisponible */ } };
  const reglages = {
    camp: lire('echecs.cheval.camp', 'reine') === 'cavalier' ? 'cavalier' : 'reine',
    niveau: lire('echecs.cheval.niveau', 'facile') === 'difficile' ? 'difficile' : 'facile',
    danger: Prefs.lire('echecs.cheval.danger', true),
    coordonnees: Prefs.lire('echecs.cheval.coordonnees', true),
  };
  const LIMITE = 30; // le cavalier qui tient 30 coups a gagné : la dame abandonne

  // ---------- La partie ----------
  const jeu = { q: 0, n: 0, coups: 0, aMoi: true, fini: false, partie: 0, meilleur: 0, dernier: null };
  const dameJoueur = () => reglages.camp === 'reine';

  function placer() {
    // la dame n'attaque pas le cavalier au départ, et le cavalier n'attaque pas la dame ;
    // en mode cavalier, on évite les départs où même le meilleur cavalier est pris tout de suite
    for (;;) {
      const q = Math.floor(Math.random() * 64), n = Math.floor(Math.random() * 64);
      if (q === n || dameAttaque(q, n) || cavalierAttaque(n, q)) continue;
      if (!dameJoueur() && AVEC_CAVALIER[q * 64 + n] < 3) continue;
      return [q, n];
    }
  }
  function nouvellePartie() {
    jeu.partie++;
    [jeu.q, jeu.n] = placer();
    jeu.coups = 0;
    jeu.aMoi = true;
    jeu.fini = false;
    jeu.dernier = null;
    // le meilleur résultat possible depuis ce départ, face à un adversaire parfait
    jeu.meilleur = dameJoueur() ? AVEC_DAME[jeu.q * 64 + jeu.n] : AVEC_CAVALIER[jeu.q * 64 + jeu.n];
    $('resultats').hidden = true;
    $('pluie').innerHTML = '';
    annotations.effacer();
    majTextes();
    afficher();
  }

  function fen() {
    const pieces = {};
    pieces[jeu.q] = dameJoueur() ? 'Q' : 'q';
    pieces[jeu.n] = dameJoueur() ? 'n' : 'N';
    let f = '';
    for (let r = 7; r >= 0; r--) {
      let vide = 0;
      for (let c = 0; c < 8; c++) {
        const p = pieces[r * 8 + c];
        if (p) { if (vide) f += vide; vide = 0; f += p; } else vide++;
      }
      if (vide) f += vide;
      if (r) f += '/';
    }
    return f;
  }
  // les coups possibles du joueur
  function mesCoups() {
    return dameJoueur() ? coupsDame(jeu.q, jeu.n) : CAVALIER[jeu.n];
  }
  // une case est dangereuse si l'adversaire pourra y prendre ma pièce au coup suivant
  function dangereuse(c) {
    return dameJoueur() ? c !== jeu.n && cavalierAttaque(jeu.n, c) : c !== jeu.q && dameAttaque(jeu.q, c);
  }

  function afficher() {
    Echiquier.dessiner(plateau, fen());
    const moi = dameJoueur() ? jeu.q : jeu.n;
    if (moi >= 0) Echiquier.marquer(plateau, [nom(moi)], 'ma-piece');
    if (jeu.dernier) {
      Echiquier.marquer(plateau, [nom(jeu.dernier[0])], 'depart');
      Echiquier.marquer(plateau, [nom(jeu.dernier[1])], 'arrivee');
    }
    if (jeu.aMoi && !jeu.fini) {
      const cible = dameJoueur() ? jeu.n : jeu.q;
      for (const c of mesCoups()) {
        const el = plateau.querySelector(`[data-case="${nom(c)}"]`);
        el.classList.add(c === cible ? 'possible-prise' : 'possible');
        if (reglages.danger && c !== cible && dangereuse(c)) el.classList.add('dangereuse');
      }
    }
    $('coups').textContent = jeu.coups;
    $('coups-mot').textContent = jeu.coups > 1 ? t('coups', 'moves') : t('coup', 'move');
  }

  function majTextes() {
    const dame = dameJoueur();
    $('piece-question').setAttribute('href', dame ? '#piece-dame-blanc' : '#piece-cavalier-blanc');
    $('question-titre').textContent = dame ? t('Attrape le cavalier !', 'Catch the knight!') : t('Échappe à la dame !', 'Escape from the queen!');
    $('question-texte').textContent = dame
      ? t('Le cheval de la reine s\'est enfui : aide la dame à le rattraper en le moins de coups possible. Attention, le cavalier peut prendre ta dame !',
        'The queen\'s horse has run away: help the queen catch it in as few moves as possible. Careful, the knight can take your queen!')
      : t('Tu es le cheval de la reine et tu t\'es enfui : échappe-lui le plus longtemps possible. Si elle se pose trop près de toi, tu peux même la prendre !',
        'You\'re the queen\'s horse and you\'ve run away: escape from her for as long as you can. If she lands too close, you can even take her!');
    let bareme;
    if (dame) bareme = t('★★★ en 5 coups ou moins · ★★ en 6 à 8 coups · ★ en 9 coups ou plus', '★★★ in 5 moves or fewer · ★★ in 6 to 8 · ★ in 9 or more');
    else if (reglages.niveau === 'facile') bareme = t('★ pris en 5 coups ou moins · ★★ en 6 à 8 coups · ★★★ 9 coups ou plus', '★ caught within 5 moves · ★★ 6 to 8 · ★★★ 9 or more');
    else bareme = t(`La dame joue parfaitement : ici, on peut tenir au plus ${jeu.meilleur} coups. ★★★ si tu y arrives.`,
      `The queen plays perfectly: from here you can last at most ${jeu.meilleur} moves. ★★★ if you manage it.`);
    $('bareme').textContent = bareme;
    $('etat').textContent = t('À toi de jouer.', 'Your move.');
  }

  // ---------- Coups ----------
  plateau.addEventListener('click', (e) => {
    const el = e.target.closest('.case-e');
    if (!el || !jeu.aMoi || jeu.fini) return;
    const c = numero(el.dataset.case);
    if (!mesCoups().includes(c)) return;
    jouer(c);
  });

  function jouer(c) {
    const dame = dameJoueur();
    const de = dame ? jeu.q : jeu.n;
    jeu.coups++;
    jeu.dernier = [de, c];
    if (dame) jeu.q = c; else jeu.n = c;
    const prise = jeu.q === jeu.n;
    Sons.pose(dame ? 9 : 3);
    jeu.aMoi = false;
    if (prise) {
      // la dame attrape le cavalier, ou le cavalier prend la dame
      if (dame) jeu.n = -1; else jeu.q = -1;
      jeu.fini = true;
      afficher();
      return finir(dame ? 'attrape' : 'dame-prise');
    }
    if (!dame && jeu.coups >= LIMITE) { jeu.fini = true; afficher(); return finir('tient'); }
    afficher();
    $('etat').textContent = dame ? t('Le cavalier réfléchit…', 'The knight is thinking…') : t('La dame réfléchit…', 'The queen is thinking…');
    const p = jeu.partie;
    setTimeout(() => { if (p === jeu.partie) repondre(); }, 650);
  }

  function repondre() {
    const dame = dameJoueur();
    const difficile = reglages.niveau === 'difficile';
    if (dame) {
      const de = jeu.n;
      jeu.n = coupCavalier(jeu.q, jeu.n, difficile);
      jeu.dernier = [de, jeu.n];
      Sons.pose(3);
      if (jeu.n === jeu.q) { jeu.q = -1; jeu.fini = true; afficher(); return finir('perdue'); }
    } else {
      const de = jeu.q;
      jeu.q = coupDame(jeu.q, jeu.n, difficile);
      jeu.dernier = [de, jeu.q];
      Sons.pose(9);
      if (jeu.q === jeu.n) { jeu.n = -1; jeu.fini = true; afficher(); return finir('pris'); }
    }
    jeu.aMoi = true;
    $('etat').textContent = t('À toi de jouer.', 'Your move.');
    afficher();
  }

  // ---------- Fin de partie ----------
  function etoilesPour(issue) {
    const c = jeu.coups;
    if (issue === 'perdue') return 0;
    if (issue === 'attrape') return c <= 5 ? 3 : c <= 8 ? 2 : 1;
    if (issue === 'dame-prise' || issue === 'tient') return 3;
    if (reglages.niveau === 'facile') return c <= 5 ? 1 : c <= 8 ? 2 : 3;
    return c >= jeu.meilleur ? 3 : c === jeu.meilleur - 1 ? 2 : 1;
  }
  function finir(issue) {
    const etoiles = etoilesPour(issue);
    const c = jeu.coups;
    const coupsTexte = (n) => (EN ? `${n} move${n > 1 ? 's' : ''}` : `${n} coup${n > 1 ? 's' : ''}`);
    let titre, detail;
    if (issue === 'attrape') {
      titre = etoiles === 3 ? t('Bravo, quelle chasse !', 'Well done, what a chase!') : t('Attrapé !', 'Caught!');
      detail = t(`Tu as rattrapé le cheval en ${coupsTexte(c)}.`, `You caught the horse in ${coupsTexte(c)}.`);
      if (reglages.niveau === 'difficile') detail += ' ' + t(`Le plus court possible depuis le départ : ${coupsTexte(jeu.meilleur)}.`, `The shortest possible from the start: ${coupsTexte(jeu.meilleur)}.`);
    } else if (issue === 'perdue') {
      titre = t('Oh non !', 'Oh no!');
      detail = t('Le cavalier a pris ta dame. Avant de bouger, regarde bien les cases qu\'il attaque !', 'The knight took your queen. Before you move, look carefully at the squares it attacks!');
    } else if (issue === 'dame-prise') {
      titre = t('Incroyable !', 'Amazing!');
      detail = t('Le cheval a pris la dame !', 'The horse took the queen!');
    } else if (issue === 'tient') {
      titre = t('La dame abandonne !', 'The queen gives up!');
      detail = t(`Tu as tenu ${coupsTexte(c)} : elle n'a pas réussi à t'attraper.`, `You lasted ${coupsTexte(c)}: she couldn't catch you.`);
    } else {
      titre = etoiles === 3 ? t('Bravo, tu as tenu bon !', 'Well done, you held out!') : t('Attrapé !', 'Caught!');
      detail = t(`Tu as tenu ${coupsTexte(c)} avant d'être attrapé.`, `You lasted ${coupsTexte(c)} before being caught.`);
      if (reglages.niveau === 'difficile') detail += ' ' + t(`Face à cette dame parfaite, le maximum ici était ${coupsTexte(jeu.meilleur)}.`, `Against this perfect queen, the most possible here was ${coupsTexte(jeu.meilleur)}.`);
    }
    $('etat').textContent = titre;
    if (issue === 'perdue' || issue === 'pris') Sons.echec(); else Sons.bravo();
    const p = jeu.partie;
    setTimeout(() => {
      if (p !== jeu.partie) return;
      $('res-titre').textContent = titre;
      $('res-detail').textContent = detail;
      $('res-sur').textContent = c > 1 ? t('coups', 'moves') : t('coup', 'move');
      compterJusqua($('res-score'), c);
      allumerEtoiles($('etoiles'), etoiles);
      $('resultats').hidden = false;
      if (etoiles >= 2) { lancerPluie($('pluie'), etoiles === 3 ? 70 : 40); Sons.victoire(); }
      $('btn-rejouer').focus({ preventScroll: true });
    }, 900);
  }

  // ---------- Branchements ----------
  $('btn-nouvelle').addEventListener('click', nouvellePartie);
  $('btn-rejouer').addEventListener('click', nouvellePartie);
  $('btn-revoir').addEventListener('click', () => { $('resultats').hidden = true; $('btn-nouvelle').focus({ preventScroll: true }); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('resultats').hidden) $('resultats').hidden = true;
  });

  const choix = (groupe, cle, quand) => {
    const boutons = document.querySelectorAll(`#${groupe} button`);
    const maj = () => boutons.forEach(b => b.setAttribute('aria-pressed', b.dataset[cle] === reglages[cle] ? 'true' : 'false'));
    boutons.forEach(b => b.addEventListener('click', () => {
      if (b.dataset[cle] === reglages[cle]) return;
      reglages[cle] = b.dataset[cle];
      ecrire(`echecs.cheval.${cle}`, reglages[cle]);
      maj();
      quand();
    }));
    maj();
  };
  choix('reg-camp', 'camp', nouvellePartie);
  choix('reg-niveau', 'niveau', nouvellePartie);

  brancherBoutonTheme($('btn-theme'));
  brancherReglages($('btn-reglages'), $('panneau-reglages'));
  const appliquerCoordonnees = () => document.body.classList.toggle('sans-coordonnees', !reglages.coordonnees);
  brancherInterrupteur($('reg-coordonnees'), reglages.coordonnees, (v) => { reglages.coordonnees = v; Prefs.ecrire('echecs.cheval.coordonnees', v); appliquerCoordonnees(); });
  brancherInterrupteur($('reg-danger'), reglages.danger, (v) => { reglages.danger = v; Prefs.ecrire('echecs.cheval.danger', v); afficher(); });
  brancherInterrupteur($('reg-son'), Sons.actif, (v) => { Sons.actif = v; });

  // pour les tests
  window.Cheval = { etat: () => jeu, AVEC_DAME, AVEC_CAVALIER, jouer: (c) => jouer(typeof c === 'string' ? numero(c) : c), coupsDame, CAVALIER };

  // ---------- Démarrage ----------
  window.Echecs.injecterSprite();
  appliquerCoordonnees();
  nouvellePartie();
})();
