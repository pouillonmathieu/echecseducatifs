/* Le cheval de la reine
   Une dame et un cavalier, seuls sur l'échiquier.
   - Mode « dame » : tu joues la dame blanche et tu dois attraper le cavalier noir en le moins de coups possible.
   - Mode « cavalier » : tu joues le cavalier blanc et tu dois échapper à la dame noire le plus longtemps possible.
   - Mode « 2 joueurs » : l'un joue la dame blanche, l'autre le cavalier noir, sur le même écran.
   Le joueur commence (la dame en mode 2 joueurs). Le cavalier peut prendre la dame si elle se pose sur une case qu'il attaque.
   Défis (dame ou cavalier) : 5 parties d'affilée, jusqu'à 15 étoiles ; défi chrono : 10 secondes par coup.
   Mode libre : « Recommencer » reprend la même position de départ ; les boutons sous l'échiquier font revoir les coups
   (js/revoir.js) ; « Solution » (niveau difficile) déroule une partie parfaite des deux côtés depuis le départ.
   L'adversaire est joué par l'ordinateur, avec deux niveaux :
   - difficile : il joue parfaitement, grâce à une table calculée au chargement (toutes les positions dame/cavalier,
     coup par coup en partant des prises : c'est une « analyse rétrograde ») ;
   - facile : le cavalier fuit au hasard vers une case où il n'est pas pris tout de suite ;
     la dame joue le meilleur coup une fois sur deux, sinon un coup au hasard qui ne la met pas en prise.
   Bon à savoir : avec un jeu parfait des deux côtés, la dame attrape toujours le cavalier en 5 coups au plus. */
(function () {
  const { EN, t, Prefs, brancherBoutonTheme, brancherReglages, brancherInterrupteur } = window.Commun;
  const { lancerPluie, compterJusqua, allumerEtoiles, formaterDuree, ICONES } = window.UI;
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
  const CAMPS = ['reine', 'cavalier', 'deux'];
  const reglages = {
    camp: CAMPS.includes(lire('echecs.cheval.camp', 'reine')) ? lire('echecs.cheval.camp', 'reine') : 'reine',
    niveau: lire('echecs.cheval.niveau', 'facile') === 'difficile' ? 'difficile' : 'facile',
    danger: Prefs.lire('echecs.cheval.danger', true),
    coordonnees: Prefs.lire('echecs.cheval.coordonnees', true),
  };
  const LIMITE = 30;   // le cavalier qui tient 30 coups a gagné : la dame abandonne
  const NB_DEFIS = 5;  // parties par défi
  const DUREE = 10;    // secondes par coup en défi chrono

  // ---------- La partie ----------
  // trait : 'dame' ou 'cavalier' (qui doit jouer) ; coupsDame / coupsCavalier : coups joués par chacun
  const jeu = { mode: 'libre', q: 0, n: 0, trait: 'dame', coupsDame: 0, coupsCavalier: 0, fini: false, partie: 0, meilleur: 0, dernier: null, issue: null, initial: null };
  const defi = { chrono: false, numero: 0, resultats: [], debut: 0, fin: 0, raf: 0, dernierTic: 0 };
  const deux = () => reglages.camp === 'deux';
  // les blancs : la dame (modes dame et 2 joueurs) ou le cavalier (mode cavalier)
  const dameBlanche = () => reglages.camp !== 'cavalier';
  const humain = (cote) => deux() || (cote === 'dame') === (reglages.camp === 'reine');
  // le nombre de coups qui compte pour le joueur
  const mesCoupsJoues = () => (reglages.camp === 'cavalier' ? jeu.coupsCavalier : jeu.coupsDame);

  function placer() {
    // la dame n'attaque pas le cavalier au départ, et le cavalier n'attaque pas la dame ;
    // en mode cavalier, on évite les départs où même le meilleur cavalier est pris tout de suite
    for (;;) {
      const q = Math.floor(Math.random() * 64), n = Math.floor(Math.random() * 64);
      if (q === n || dameAttaque(q, n) || cavalierAttaque(n, q)) continue;
      if (reglages.camp === 'cavalier' && AVEC_CAVALIER[q * 64 + n] < 3) continue;
      return [q, n];
    }
  }
  // la position du moment (pour revoir les coups)
  const photo = () => ({ q: jeu.q, n: jeu.n, dernier: jeu.dernier, trait: jeu.trait, coupsDame: jeu.coupsDame, coupsCavalier: jeu.coupsCavalier });
  // memePosition : « Recommencer » reprend le même départ
  function nouvellePartie(memePosition = false) {
    jeu.partie++;
    arreterChrono();
    if (memePosition !== true || !jeu.initial) jeu.initial = placer();
    [jeu.q, jeu.n] = jeu.initial;
    jeu.coupsDame = 0;
    jeu.coupsCavalier = 0;
    jeu.trait = reglages.camp === 'cavalier' ? 'cavalier' : 'dame';
    jeu.fini = false;
    jeu.issue = null;
    jeu.dernier = null;
    // le meilleur résultat possible depuis ce départ, face à un adversaire parfait
    jeu.meilleur = reglages.camp === 'cavalier' ? AVEC_CAVALIER[jeu.q * 64 + jeu.n] : AVEC_DAME[jeu.q * 64 + jeu.n];
    $('resultats').hidden = true;
    $('pluie').innerHTML = '';
    $('btn-suivante').hidden = true;
    $('etoiles-partie').textContent = '';
    annotations.effacer();
    revoir.depart(photo());
    majTextes();
    afficher();
    if (jeu.mode === 'defi') {
      $('titre').textContent = t(`Partie ${defi.numero + 1} sur ${NB_DEFIS}`, `Game ${defi.numero + 1} of ${NB_DEFIS}`);
      majPoints();
      defi.debut = performance.now();
    }
    tour();
  }

  function fen(ph) {
    const pieces = {};
    if (ph.q >= 0) pieces[ph.q] = dameBlanche() ? 'Q' : 'q';
    if (ph.n >= 0) pieces[ph.n] = dameBlanche() ? 'n' : 'N';
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
  const coupsDuTrait = () => (jeu.trait === 'dame' ? coupsDame(jeu.q, jeu.n) : CAVALIER[jeu.n]);
  // une case est dangereuse si l'adversaire pourra y prendre la pièce qui joue, au coup suivant
  const dangereuse = (c) => (jeu.trait === 'dame' ? c !== jeu.n && cavalierAttaque(jeu.n, c) : c !== jeu.q && dameAttaque(jeu.q, c));
  const aMoi = () => !jeu.fini && humain(jeu.trait);

  // dessine une position : le direct (on peut jouer) ou un coup passé qu'on revoit
  function dessinerPhoto(ph, direct) {
    Echiquier.dessiner(plateau, fen(ph));
    if (ph.dernier) {
      Echiquier.marquer(plateau, [nom(ph.dernier[0])], 'depart');
      Echiquier.marquer(plateau, [nom(ph.dernier[1])], 'arrivee');
    }
    if (direct && aMoi()) {
      const moi = jeu.trait === 'dame' ? jeu.q : jeu.n;
      const cible = jeu.trait === 'dame' ? jeu.n : jeu.q;
      Echiquier.marquer(plateau, [nom(moi)], 'ma-piece');
      for (const c of coupsDuTrait()) {
        const el = plateau.querySelector(`[data-case="${nom(c)}"]`);
        el.classList.add(c === cible ? 'possible-prise' : 'possible');
        if (reglages.danger && c !== cible && dangereuse(c)) el.classList.add('dangereuse');
      }
    }
    const n = reglages.camp === 'cavalier' ? ph.coupsCavalier : ph.coupsDame;
    $('coups').textContent = n;
    $('coups-mot').textContent = deux() ? (n > 1 ? t('coups de la dame', 'queen moves') : t('coup de la dame', 'queen move'))
      : n > 1 ? t('coups', 'moves') : t('coup', 'move');
  }
  const afficher = () => { if (revoir.enDirect()) dessinerPhoto(photo(), true); };
  const revoir = window.Revoir({ barre: $('navigation'), dessiner: dessinerPhoto });

  function majTextes() {
    const camp = reglages.camp;
    $('piece-question').setAttribute('href', camp === 'cavalier' ? '#piece-cavalier-blanc' : '#piece-dame-blanc');
    $('question-titre').textContent = camp === 'reine' ? t('Attrape le cavalier !', 'Catch the knight!')
      : camp === 'cavalier' ? t('Échappe à la dame !', 'Escape from the queen!') : t('À deux : la dame contre le cavalier', 'Two players: queen against knight');
    $('question-texte').textContent = camp === 'reine'
      ? t('Le cheval de la reine s\'est enfui : aide la dame à le rattraper en le moins de coups possible. Attention, le cavalier peut prendre ta dame !',
        'The queen\'s horse has run away: help the queen catch it in as few moves as possible. Careful, the knight can take your queen!')
      : camp === 'cavalier'
        ? t('Tu es le cheval de la reine et tu t\'es enfui : échappe-lui le plus longtemps possible. Si elle se pose trop près de toi, tu peux même la prendre !',
          'You\'re the queen\'s horse and you\'ve run away: escape from her for as long as you can. If she lands too close, you can even take her!')
        : t(`L'un joue la dame blanche, l'autre le cavalier noir. La dame commence et doit attraper le cavalier ; le cavalier gagne s'il prend la dame ou s'il tient ${LIMITE} coups.`,
          `One player has the white queen, the other the black knight. The queen starts and must catch the knight; the knight wins if it takes the queen or lasts ${LIMITE} moves.`);
    // le nombre de coups de référence pour cette position (jeu parfait des deux côtés)
    const m = jeu.meilleur;
    // au niveau facile, l'ordinateur se trompe souvent : la référence suppose qu'il joue parfaitement
    const parfait = reglages.niveau === 'difficile' || deux();
    $('bareme').textContent = camp === 'cavalier'
      ? (parfait ? t(`Le plus long possible : ${coupsTexte(m)}.`, `The longest possible: ${coupsTexte(m)}.`)
        : t(`Le plus long possible si la dame joue parfaitement : ${coupsTexte(m)}.`, `The longest possible if the queen plays perfectly: ${coupsTexte(m)}.`))
      : (parfait ? t(`Le plus court possible : ${coupsTexte(m)}.`, `The shortest possible: ${coupsTexte(m)}.`)
        : t(`Le plus court possible si le cavalier fuit parfaitement : ${coupsTexte(m)}.`, `The shortest possible if the knight runs away perfectly: ${coupsTexte(m)}.`));
    $('btn-solution').hidden = deux() || reglages.niveau !== 'difficile';
  }
  function majEtat() {
    if (jeu.fini) return;
    let e;
    if (deux()) e = jeu.trait === 'dame' ? t('Au tour de la dame.', 'Queen to move.') : t('Au tour du cavalier.', 'Knight to move.');
    else if (humain(jeu.trait)) e = t('À toi de jouer.', 'Your move.');
    else e = jeu.trait === 'dame' ? t('La dame réfléchit…', 'The queen is thinking…') : t('Le cavalier réfléchit…', 'The knight is thinking…');
    $('etat').textContent = e;
  }

  // ---------- Coups ----------
  plateau.addEventListener('click', (e) => {
    const el = e.target.closest('.case-e');
    if (!el || !aMoi() || !revoir.enDirect()) return;
    const c = numero(el.dataset.case);
    if (coupsDuTrait().includes(c)) jouer(c);
  });
  // ou on fait glisser sa pièce jusqu'à la case voulue
  const maPiece = () => (jeu.trait === 'dame' ? jeu.q : jeu.n);
  window.Glisser({
    plateau,
    prendre: (n) => aMoi() && revoir.enDirect() && numero(n) === maPiece(),
    lacher: (de, vers) => { if (aMoi() && revoir.enDirect() && coupsDuTrait().includes(numero(vers))) jouer(numero(vers)); },
  });

  // à qui de jouer : le joueur (on attend son clic, avec le chrono en défi) ou l'ordinateur
  function tour() {
    majEtat();
    if (jeu.fini) return;
    if (humain(jeu.trait)) {
      if (jeu.mode === 'defi' && defi.chrono) demarrerChrono();
      return;
    }
    const p = jeu.partie;
    setTimeout(() => {
      if (p !== jeu.partie || jeu.fini) return;
      const difficile = reglages.niveau === 'difficile';
      jouer(jeu.trait === 'dame' ? coupDame(jeu.q, jeu.n, difficile) : coupCavalier(jeu.q, jeu.n, difficile));
    }, 650);
  }

  function jouer(c) {
    arreterChrono();
    const dame = jeu.trait === 'dame';
    const de = dame ? jeu.q : jeu.n;
    jeu.dernier = [de, c];
    if (dame) { jeu.q = c; jeu.coupsDame++; } else { jeu.n = c; jeu.coupsCavalier++; }
    Sons.pose(dame ? 9 : 3);
    if (jeu.q === jeu.n) {
      // une prise : la dame attrape le cavalier, ou le cavalier prend la dame
      if (dame) jeu.n = -1; else jeu.q = -1;
      jeu.fini = true;
      revoir.ajouter(photo());
      afficher();
      return finir(dame ? 'dame-gagne' : 'cavalier-prend');
    }
    if (!dame && jeu.coupsCavalier >= LIMITE) { jeu.fini = true; revoir.ajouter(photo()); afficher(); return finir('tient'); }
    jeu.trait = dame ? 'cavalier' : 'dame';
    revoir.ajouter(photo());
    afficher();
    tour();
  }

  // ---------- Solution (niveau difficile) ----------
  // une partie parfaite des deux côtés depuis le départ : la dame prend le plus court chemin, le cavalier tient le
  // plus longtemps possible (et prend la dame s'il le peut)
  function solution() {
    if (jeu.mode !== 'libre' || deux() || reglages.niveau !== 'difficile') return;
    jeu.partie++;
    arreterChrono();
    let [q, n] = jeu.initial;
    let trait = reglages.camp === 'cavalier' ? 'cavalier' : 'dame', cd = 0, cc = 0;
    const liste = [{ q, n, dernier: null, trait, coupsDame: 0, coupsCavalier: 0 }];
    for (let k = 0; k < 2 * LIMITE; k++) {
      let de, vers;
      if (trait === 'dame') {
        de = q;
        if (dameAttaque(q, n)) vers = n;
        else {
          const coups = coupsDame(q, n).filter(c => c !== n && !cavalierAttaque(n, c));
          const best = Math.min(...coups.map(c => AVEC_CAVALIER[c * 64 + n]));
          vers = coups.find(c => AVEC_CAVALIER[c * 64 + n] === best);
        }
        q = vers; cd++;
      } else {
        de = n;
        if (cavalierAttaque(n, q)) vers = q;
        else {
          const best = Math.max(...CAVALIER[n].map(m => AVEC_DAME[q * 64 + m]));
          vers = CAVALIER[n].find(m => AVEC_DAME[q * 64 + m] === best);
        }
        n = vers; cc++;
      }
      const prise = q === n;
      if (prise) { if (trait === 'dame') n = -1; else q = -1; }
      trait = trait === 'dame' ? 'cavalier' : 'dame';
      liste.push({ q, n, dernier: [de, vers], trait, coupsDame: cd, coupsCavalier: cc });
      if (prise) break;
    }
    jeu.fini = true;
    jeu.issue = 'solution';
    $('resultats').hidden = true;
    $('etat').textContent = reglages.camp === 'cavalier'
      ? t(`Solution : le cavalier tient ${coupsTexte(cc)}.`, `Solution: the knight lasts ${coupsTexte(cc)}.`)
      : t(`Solution : la dame attrape le cavalier en ${coupsTexte(cd)}.`, `Solution: the queen catches the knight in ${coupsTexte(cd)}.`);
    revoir.photos(liste);
    revoir.lire(900);
  }

  // ---------- Chrono (défi) ----------
  function demarrerChrono() {
    arreterChrono();
    const barre = $('minuteur-barre');
    defi.fin = performance.now() + DUREE * 1000;
    defi.dernierTic = 0;
    const p = jeu.partie, coup = jeu.coupsDame + jeu.coupsCavalier;
    const boucle = (temps) => {
      if (p !== jeu.partie || jeu.fini || coup !== jeu.coupsDame + jeu.coupsCavalier) return;
      const reste = Math.max(0, defi.fin - temps) / 1000;
      barre.style.transform = `scaleX(${(reste / DUREE).toFixed(4)})`;
      document.body.classList.toggle('presse', reste <= 3);
      const s = Math.ceil(reste);
      if (reste <= 3 && s > 0 && s !== defi.dernierTic) { defi.dernierTic = s; Sons.tic(); }
      if (reste <= 0) { jeu.fini = true; afficher(); finir('temps'); return; }
      defi.raf = requestAnimationFrame(boucle);
    };
    defi.raf = requestAnimationFrame(boucle);
  }
  function arreterChrono() {
    cancelAnimationFrame(defi.raf);
    document.body.classList.remove('presse');
  }

  // ---------- Fin de partie ----------
  function etoilesPour(issue) {
    const camp = reglages.camp;
    if (issue === 'temps') return 0;
    if (camp === 'reine') {
      if (issue !== 'dame-gagne') return 0;
      const c = jeu.coupsDame;
      return c <= 5 ? 3 : c <= 8 ? 2 : 1;
    }
    if (issue === 'cavalier-prend' || issue === 'tient') return 3;
    const c = jeu.coupsCavalier;
    if (reglages.niveau === 'facile') return c <= 5 ? 1 : c <= 8 ? 2 : 3;
    return c >= jeu.meilleur ? 3 : c === jeu.meilleur - 1 ? 2 : 1;
  }
  const coupsTexte = (n) => (EN ? `${n} move${n > 1 ? 's' : ''}` : `${n} coup${n > 1 ? 's' : ''}`);
  function textesFin(issue, etoiles) {
    const camp = reglages.camp, dif = reglages.niveau === 'difficile';
    if (issue === 'temps') return [t('Temps écoulé !', 'Time\'s up!'), t('Il faut jouer en moins de 10 secondes.', 'You have to move within 10 seconds.')];
    if (camp === 'deux') {
      if (issue === 'dame-gagne') return [t('La dame a gagné !', 'The queen wins!'), t(`Elle a attrapé le cavalier en ${coupsTexte(jeu.coupsDame)}.`, `She caught the knight in ${coupsTexte(jeu.coupsDame)}.`)];
      if (issue === 'cavalier-prend') return [t('Le cavalier a gagné !', 'The knight wins!'), t('Il a pris la dame.', 'It took the queen.')];
      return [t('Le cavalier a gagné !', 'The knight wins!'), t(`Il a tenu ${coupsTexte(jeu.coupsCavalier)} sans être attrapé.`, `It lasted ${coupsTexte(jeu.coupsCavalier)} without being caught.`)];
    }
    if (camp === 'reine') {
      if (issue === 'cavalier-prend') return [t('Oh non !', 'Oh no!'), t('Le cavalier a pris ta dame. Avant de bouger, regarde bien les cases qu\'il attaque !', 'The knight took your queen. Before you move, look carefully at the squares it attacks!')];
      let d = t(`Tu as rattrapé le cheval en ${coupsTexte(jeu.coupsDame)}.`, `You caught the horse in ${coupsTexte(jeu.coupsDame)}.`);
      if (dif) d += ' ' + t(`Le plus court possible depuis le départ : ${coupsTexte(jeu.meilleur)}.`, `The shortest possible from the start: ${coupsTexte(jeu.meilleur)}.`);
      return [etoiles === 3 ? t('Bravo, quelle chasse !', 'Well done, what a chase!') : t('Attrapé !', 'Caught!'), d];
    }
    if (issue === 'cavalier-prend') return [t('Incroyable !', 'Amazing!'), t('Le cheval a pris la dame !', 'The horse took the queen!')];
    if (issue === 'tient') return [t('La dame abandonne !', 'The queen gives up!'), t(`Tu as tenu ${coupsTexte(jeu.coupsCavalier)} : elle n'a pas réussi à t'attraper.`, `You lasted ${coupsTexte(jeu.coupsCavalier)}: she couldn't catch you.`)];
    let d = t(`Tu as tenu ${coupsTexte(jeu.coupsCavalier)} avant d'être attrapé.`, `You lasted ${coupsTexte(jeu.coupsCavalier)} before being caught.`);
    if (dif) d += ' ' + t(`Face à cette dame parfaite, le maximum ici était ${coupsTexte(jeu.meilleur)}.`, `Against this perfect queen, the most possible here was ${coupsTexte(jeu.meilleur)}.`);
    return [etoiles === 3 ? t('Bravo, tu as tenu bon !', 'Well done, you held out!') : t('Attrapé !', 'Caught!'), d];
  }
  function finir(issue) {
    arreterChrono();
    jeu.issue = issue;
    const etoiles = deux() ? 0 : etoilesPour(issue);
    const [titre, detail] = textesFin(issue, etoiles);
    $('etat').textContent = titre;
    const rate = issue === 'temps' || (reglages.camp === 'reine' && issue !== 'dame-gagne') || (reglages.camp === 'cavalier' && issue === 'dame-gagne' && etoiles < 2);
    if (rate) Sons.echec(); else Sons.bravo();
    // défi : on note la partie et on passe à la suivante
    if (jeu.mode === 'defi') {
      defi.resultats.push({ etoiles, coups: mesCoupsJoues(), temps: (performance.now() - defi.debut) / 1000 });
      majPoints();
      $('etoiles-partie').textContent = '★'.repeat(etoiles) + '☆'.repeat(3 - etoiles) + ' · ' + detail;
      const derniere = defi.numero === NB_DEFIS - 1;
      $('btn-suivante').firstChild.textContent = derniere ? t('Voir le résultat ', 'See the result ') : t('Partie suivante ', 'Next game ');
      $('btn-suivante').hidden = false;
      $('btn-suivante').focus({ preventScroll: true });
      return;
    }
    const p = jeu.partie;
    setTimeout(() => {
      if (p !== jeu.partie) return;
      $('res-titre').textContent = titre;
      $('res-detail').textContent = detail;
      $('res-detail').hidden = false;
      $('res-liste').hidden = true;
      $('res-temps').hidden = true;
      const c = mesCoupsJoues();
      $('res-sur').textContent = c > 1 ? t('coups', 'moves') : t('coup', 'move');
      compterJusqua($('res-score'), c);
      document.querySelector('.carte-resultats .etoiles').hidden = deux();
      allumerEtoiles($('etoiles'), etoiles);
      $('resultats').hidden = false;
      if (deux() || etoiles >= 2) { lancerPluie($('pluie'), etoiles === 3 || deux() ? 70 : 40); Sons.victoire(); }
      boutonsFin(false);
    }, 900);
  }

  // ---------- Défis ----------
  function majPoints() {
    $('points').querySelectorAll('li').forEach((li, i) => {
      const r = defi.resultats[i];
      li.className = r ? (r.etoiles >= 2 ? 'ok' : 'rate') : (i === defi.numero ? 'actuel' : '');
    });
  }
  function lancerDefi(chrono) {
    fermerChoix();
    jeu.mode = 'defi';
    document.body.dataset.mode = 'defi';
    document.body.dataset.chrono = chrono ? 'oui' : 'non';
    defi.chrono = chrono;
    defi.numero = 0;
    defi.resultats = [];
    $('minuteur-barre').style.transform = 'scaleX(1)';
    $('points').innerHTML = Array.from({ length: NB_DEFIS }, (_, i) => `<li aria-label="${t('Partie', 'Game')} ${i + 1}"></li>`).join('');
    nouvellePartie();
  }
  function lancerLibre() {
    jeu.mode = 'libre';
    document.body.dataset.mode = 'libre';
    document.body.dataset.chrono = 'non';
    $('titre').textContent = t('Le cheval de la reine', 'The queen\'s horse');
    nouvellePartie();
  }
  function partieSuivante() {
    if (!jeu.fini || jeu.mode !== 'defi') return;
    if (defi.numero < NB_DEFIS - 1) { defi.numero++; nouvellePartie(); return; }
    resultatsDefi();
  }
  function resultatsDefi() {
    const total = defi.resultats.reduce((s, r) => s + r.etoiles, 0);
    const max = NB_DEFIS * 3;
    const etoiles = total >= 13 ? 3 : total >= 9 ? 2 : total >= 5 ? 1 : 0;
    $('res-titre').textContent = total === max ? t('Parfait !', 'Perfect!') : etoiles >= 2 ? t('Bravo !', 'Well done!') : etoiles === 1 ? t('Bien joué !', 'Nice work!') : t('Continue, tu progresses !', 'Keep going, you\'re getting better!');
    $('res-sur').textContent = `/ ${max} ★`;
    compterJusqua($('res-score'), total);
    document.querySelector('.carte-resultats .etoiles').hidden = false;
    allumerEtoiles($('etoiles'), etoiles);
    $('res-detail').hidden = true;
    const liste = $('res-liste');
    liste.hidden = false;
    liste.innerHTML = defi.resultats.map((r, i) =>
      `<li class="${r.etoiles >= 2 ? 'ok' : 'rate'}" style="animation-delay:${700 + i * 70}ms"><span class="res-rond">${r.etoiles >= 2 ? ICONES.ok : ICONES.rate}</span>` +
      `<span class="res-t">${'★'.repeat(r.etoiles)}${'☆'.repeat(3 - r.etoiles)}<br>${coupsTexte(r.coups)}</span></li>`).join('');
    $('res-temps').hidden = false;
    $('res-temps').textContent = t('Temps total : ', 'Total time: ') + formaterDuree(defi.resultats.reduce((s, r) => s + r.temps, 0));
    $('resultats').hidden = false;
    lancerPluie($('pluie'), etoiles >= 1 ? 70 : 30);
    Sons.victoire();
    boutonsFin(true);
  }
  // fin de partie : « Nouvelle partie » en vert ; en défi, c'est « Rejouer » (le défi) qui l'est
  function boutonsFin(enDefi) {
    $('btn-rejouer').classList.toggle('bouton-principal', enDefi);
    $('btn-rejouer').classList.toggle('bouton-secondaire', !enDefi);
    (enDefi ? $('btn-rejouer') : $('btn-nouvelle-res')).focus({ preventScroll: true });
  }
  function ouvrirChoix() { $('choix-defi').hidden = false; $('mode-defi').focus({ preventScroll: true }); }
  function fermerChoix() { $('choix-defi').hidden = true; }

  // ---------- Branchements ----------
  $('btn-nouvelle').addEventListener('click', () => nouvellePartie());
  $('btn-recommencer').addEventListener('click', () => nouvellePartie(true));
  $('btn-solution').addEventListener('click', solution);
  $('btn-nouvelle-res').addEventListener('click', () => nouvellePartie());
  $('btn-suivante').addEventListener('click', partieSuivante);
  // « Rejouer » : la même position (mode libre) ou un nouveau défi
  $('btn-rejouer').addEventListener('click', () => (jeu.mode === 'defi' ? lancerDefi(defi.chrono) : nouvellePartie(true)));
  $('btn-revoir').addEventListener('click', () => { $('resultats').hidden = true; });
  $('btn-menu').addEventListener('click', lancerLibre);
  $('btn-retour').addEventListener('click', lancerLibre);
  $('btn-defis').addEventListener('click', ouvrirChoix);
  $('btn-fermer-choix').addEventListener('click', () => { fermerChoix(); $('btn-defis').focus(); });
  $('choix-defi').addEventListener('click', (e) => { if (e.target === e.currentTarget) fermerChoix(); });
  $('mode-defi').addEventListener('click', () => lancerDefi(false));
  $('mode-chrono').addEventListener('click', () => lancerDefi(true));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('choix-defi').hidden) fermerChoix();
    else if (!$('resultats').hidden) $('resultats').hidden = true;
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
  // en mode 2 joueurs : pas de niveau ni de défis
  const appliquerCamp = () => document.body.classList.toggle('deux-joueurs', deux());
  choix('reg-camp', 'camp', () => { appliquerCamp(); nouvellePartie(); });
  choix('reg-niveau', 'niveau', nouvellePartie);

  brancherBoutonTheme($('btn-theme'));
  brancherReglages($('btn-reglages'), $('panneau-reglages'));
  const appliquerCoordonnees = () => document.body.classList.toggle('sans-coordonnees', !reglages.coordonnees);
  brancherInterrupteur($('reg-coordonnees'), reglages.coordonnees, (v) => { reglages.coordonnees = v; Prefs.ecrire('echecs.cheval.coordonnees', v); appliquerCoordonnees(); });
  brancherInterrupteur($('reg-danger'), reglages.danger, (v) => { reglages.danger = v; Prefs.ecrire('echecs.cheval.danger', v); afficher(); });
  brancherInterrupteur($('reg-son'), Sons.actif, (v) => { Sons.actif = v; });

  // pour les tests
  window.Cheval = { etat: () => jeu, defi: () => defi, AVEC_DAME, AVEC_CAVALIER, coupsDame, CAVALIER, jouer: (c) => jouer(typeof c === 'string' ? numero(c) : c) };

  // ---------- Démarrage ----------
  window.Echecs.injecterSprite();
  appliquerCoordonnees();
  appliquerCamp();
  lancerLibre();
})();
