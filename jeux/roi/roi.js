/* Capture le roi
   Le roi noir est seul sur l'échiquier ; avec une petite équipe blanche (deux tours, une tour et deux fous, un roi et
   une dame…), il faut le capturer en le moins de coups possible. Le roi noir doit bouger à chaque coup : s'il n'a plus
   de case sûre (mat ou pat), il est pris au coup suivant. Il peut prendre une pièce blanche voisine qui n'est pas
   protégée : si l'équipe ne peut plus le capturer, il s'échappe et la partie est perdue.
   L'ordinateur joue le roi noir :
   - difficile : parfaitement, grâce aux tables de toutes les positions (jeux/roi/tables/*.bin.gz, calculées par
     outils/tables-roi.js avec jeux/roi/tables.js ; si elles ne se chargent pas, elles sont recalculées ici) ;
   - facile : une fois sur deux le meilleur coup, sinon une case au hasard où il n'est pas pris tout de suite.
   Les tables donnent aussi le minimum théorique de coups depuis le départ : plus on s'en approche, plus on a d'étoiles.
   Défis : 5 parties d'affilée (jusqu'à 15 étoiles) ; défi chrono : 15 secondes par coup.
   Mode libre : « Recommencer » reprend la même position de départ ; les boutons sous l'échiquier font revoir les coups
   (js/revoir.js) ; « Solution » (niveau difficile) déroule une partie parfaite des deux côtés depuis le départ. */
(function () {
  const { EN, t, Prefs, brancherBoutonTheme, brancherReglages, brancherInterrupteur } = window.Commun;
  const { lancerPluie, compterJusqua, allumerEtoiles, formaterDuree, ICONES } = window.UI;
  const Sons = window.Sons;
  const T = window.TablesRoi;
  const $ = (id) => document.getElementById(id);
  const plateau = $('echiquier');
  const annotations = Echiquier.annotations(plateau);

  const COLONNES = 'abcdefgh';
  const nom = (c) => COLONNES[c & 7] + ((c >> 3) + 1);
  const numero = (n) => COLONNES.indexOf(n[0]) + (+n[1] - 1) * 8;
  const couleurCase = (c) => ((c & 7) + (c >> 3)) % 2;
  const NOMS = { K: 'roi', Q: 'dame', R: 'tour', B: 'fou', N: 'cavalier' };

  const EQUIPES = {
    'tours': ['R', 'R'],
    'tour-fous': ['R', 'B', 'B'],
    'tour-cavaliers': ['R', 'N', 'N'],
    'fous': ['B', 'B', 'B'],
    'roi-dame': ['K', 'Q'],
    'roi-tour': ['K', 'R'],
    'roi-fous': ['K', 'B', 'B'],
    'roi-fou-cavalier': ['K', 'B', 'N'],
  };
  const NOMS_EQUIPES = {
    'tours': ['deux tours', 'two rooks'], 'tour-fous': ['une tour et deux fous', 'a rook and two bishops'],
    'tour-cavaliers': ['une tour et deux cavaliers', 'a rook and two knights'], 'fous': ['trois fous', 'three bishops'],
    'roi-dame': ['un roi et une dame', 'a king and a queen'], 'roi-tour': ['un roi et une tour', 'a king and a rook'],
    'roi-fous': ['un roi et deux fous', 'a king and two bishops'], 'roi-fou-cavalier': ['un roi, un fou et un cavalier', 'a king, a bishop and a knight'],
  };
  const NB_DEFIS = 5, DUREE = 15, LIMITE = 80;

  // ---------- Tables ----------
  // lues dans jeux/roi/tables/ (fichiers compressés) ; sinon recalculées (plus lent, par exemple en ouvrant le
  // site directement depuis le disque)
  const SRC = document.currentScript ? document.currentScript.src : '';
  const BASE = SRC.slice(0, SRC.lastIndexOf('/') + 1);
  // même numéro de version que roi.js (outils/version.py) : après une mise à jour, le navigateur reprend les tables neuves
  const VERSION = SRC.includes('?') ? SRC.slice(SRC.indexOf('?')) : '';
  async function lireTable(types) {
    if (T.dejaLa(types)) return;
    try {
      if (!('DecompressionStream' in window)) throw new Error('pas de décompression');
      const r = await fetch(`${BASE}tables/${T.cle(types)}.bin.gz${VERSION}`);
      if (!r.ok) throw new Error(r.status);
      const flux = r.body.pipeThrough(new DecompressionStream('gzip'));
      const W = new Uint8Array(await new Response(flux).arrayBuffer());
      T.charger(types, W);
    } catch (e) {
      T.table(types);
    }
  }
  async function preparer(types) {
    for (const s of T.sousEquipes(types)) await lireTable(s);
  }
  // valeur d'une position (Blancs au trait) : nombre de coups blancs pour capturer, 255 = impossible
  function valeur(pieces, kb) {
    const tri = [...pieces].sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));
    const tb = T.dejaLa(tri.map(p => p.t));
    return tb ? tb.valeur(kb, tri.map(p => p.c)) : T.INF;
  }

  // ---------- Réglages ----------
  const lire = (cle, defaut) => { try { return localStorage.getItem(cle) || defaut; } catch (e) { return defaut; } };
  const ecrire = (cle, v) => { try { localStorage.setItem(cle, v); } catch (e) { /* stockage indisponible */ } };
  const reglages = {
    equipe: (EQUIPES[lire('echecs.roi.equipe', '')] || lire('echecs.roi.equipe', '') === 'hasard') ? lire('echecs.roi.equipe', '') : 'roi-dame',
    niveau: lire('echecs.roi.niveau', 'facile') === 'difficile' ? 'difficile' : 'facile',
    danger: Prefs.lire('echecs.roi.danger', true),
    coordonnees: Prefs.lire('echecs.roi.coordonnees', true),
  };

  // ---------- La partie ----------
  const jeu = { mode: 'libre', equipe: 'roi-dame', pieces: [], kb: 0, trait: 'blanc', coups: 0, fini: true, partie: 0, min: 0, selection: -1, dernier: null, issue: null, initial: null };
  const defi = { chrono: false, numero: 0, resultats: [], debut: 0, fin: 0, raf: 0, dernierTic: 0 };

  const occupant = (c, pieces = jeu.pieces) => pieces.findIndex(p => p.c === c);
  const roiBlanc = (pieces = jeu.pieces) => pieces.find(p => p.t === 'K');
  const occ = new Uint8Array(64);
  function remplirOcc(pieces = jeu.pieces, kb = jeu.kb) {
    occ.fill(0);
    for (const p of pieces) occ[p.c] = 1;
    if (kb >= 0) occ[kb] = 1;
  }
  const liste = [];
  // les cases où la pièce i peut aller (elle peut prendre le roi noir, pas une pièce blanche)
  function coupsPiece(i, pieces = jeu.pieces, kb = jeu.kb) {
    const p = pieces[i];
    remplirOcc(pieces, kb);
    return T.cibles(p.t, p.c, occ, liste).filter(d => occupant(d, pieces) < 0 && (p.t !== 'K' || (d !== kb && !T.voisins(d, kb))));
  }
  // une pièce blanche attaque-t-elle la case c (sans compter la pièce « sauf ») ?
  function protegee(c, pieces, sauf) {
    remplirOcc(pieces, -1);
    return pieces.some((p, j) => j !== sauf && T.attaque(p.t, p.c, c, occ));
  }
  // la pièce i, posée en d, pourrait-elle être prise par le roi noir ?
  function dangereuse(i, d) {
    if (d === jeu.kb || !T.voisins(d, jeu.kb)) return false;
    const apres = jeu.pieces.map((p, j) => (j === i ? { t: p.t, c: d } : p));
    return !protegee(d, apres, i);
  }

  function tirerPosition(types) {
    for (let essai = 0; essai < 20000; essai++) {
      const cases = new Set();
      const kb = Math.floor(Math.random() * 64);
      cases.add(kb);
      const pieces = [];
      for (const tp of types) {
        let c;
        do c = Math.floor(Math.random() * 64); while (cases.has(c));
        cases.add(c);
        pieces.push({ t: tp, c });
      }
      const roi = pieces.find(p => p.t === 'K');
      if (roi && T.voisins(roi.c, kb)) continue;
      // les fous : pas tous sur la même couleur
      const fous = pieces.filter(p => p.t === 'B').map(p => couleurCase(p.c));
      if (fous.length >= 2 && fous.every(x => x === fous[0])) continue;
      // pas de victoire en un ou deux coups, et une position gagnable
      const v = valeur(pieces, kb);
      if (v < 3 || v === T.INF) continue;
      return { pieces, kb, v };
    }
    return null;
  }

  // la position du moment (pour revoir les coups)
  const photo = () => ({ pieces: jeu.pieces.map(p => ({ t: p.t, c: p.c })), kb: jeu.kb, dernier: jeu.dernier, coups: jeu.coups });
  // memePosition : « Recommencer » reprend le même départ
  async function nouvellePartie(memePosition = false) {
    const numeroPartie = ++jeu.partie;
    arreterChrono();
    jeu.fini = true;
    const reprendre = memePosition === true && jeu.initial;
    const id = reprendre ? jeu.initial.equipe : reglages.equipe === 'hasard' ? Object.keys(EQUIPES)[Math.floor(Math.random() * 8)] : reglages.equipe;
    jeu.equipe = id;
    $('resultats').hidden = true;
    $('pluie').innerHTML = '';
    $('btn-suivante').hidden = true;
    $('etoiles-partie').textContent = '';
    if (!T.dejaLa(EQUIPES[id])) {
      $('chargement').hidden = false;
      await new Promise(r => setTimeout(r, 30));
      await preparer(EQUIPES[id]);
      $('chargement').hidden = true;
      if (numeroPartie !== jeu.partie) return;
    }
    if (!reprendre) jeu.initial = { equipe: id, ...tirerPosition(EQUIPES[id]) };
    const pos = jeu.initial;
    jeu.pieces = pos.pieces.map(p => ({ t: p.t, c: p.c }));
    jeu.kb = pos.kb;
    jeu.min = pos.v;
    jeu.trait = 'blanc';
    jeu.coups = 0;
    jeu.fini = false;
    jeu.issue = null;
    jeu.selection = jeu.pieces.length === 1 ? 0 : -1;
    jeu.dernier = null;
    annotations.effacer();
    revoir.depart(photo());
    majTextes();
    afficher();
    if (jeu.mode === 'defi') {
      $('titre').textContent = t(`Partie ${defi.numero + 1} sur ${NB_DEFIS}`, `Game ${defi.numero + 1} of ${NB_DEFIS}`);
      majPoints();
      defi.debut = performance.now();
      if (defi.chrono) demarrerChrono();
    }
    $('etat').textContent = t('À toi de jouer : choisis une pièce.', 'Your move: pick a piece.');
  }

  function fen(ph) {
    const pos = {};
    for (const p of ph.pieces) pos[p.c] = p.t;
    if (ph.kb >= 0) pos[ph.kb] = 'k';
    let f = '';
    for (let r = 7; r >= 0; r--) {
      let vide = 0;
      for (let c = 0; c < 8; c++) {
        const p = pos[r * 8 + c];
        if (p) { if (vide) f += vide; vide = 0; f += p; } else vide++;
      }
      if (vide) f += vide;
      if (r) f += '/';
    }
    return f;
  }

  // dessine une position : le direct (on peut jouer) ou un coup passé qu'on revoit
  function dessinerPhoto(ph, direct) {
    Echiquier.dessiner(plateau, fen(ph));
    if (ph.dernier) {
      Echiquier.marquer(plateau, [nom(ph.dernier[0])], 'depart');
      Echiquier.marquer(plateau, [nom(ph.dernier[1])], 'arrivee');
    }
    if (direct && !jeu.fini && jeu.trait === 'blanc') {
      jeu.pieces.forEach((p, i) => plateau.querySelector(`[data-case="${nom(p.c)}"]`).classList.add(i === jeu.selection ? 'ma-piece' : 'jouable'));
      if (jeu.selection >= 0) {
        for (const d of coupsPiece(jeu.selection)) {
          const el = plateau.querySelector(`[data-case="${nom(d)}"]`);
          el.classList.add(d === jeu.kb ? 'possible-prise' : 'possible');
          if (reglages.danger && dangereuse(jeu.selection, d)) el.classList.add('dangereuse');
        }
      }
    }
    $('coups').textContent = ph.coups;
    $('coups-mot').textContent = ph.coups > 1 ? t('coups', 'moves') : t('coup', 'move');
  }
  const afficher = () => { if (revoir.enDirect()) dessinerPhoto(photo(), true); };
  const revoir = window.Revoir({ barre: $('navigation'), dessiner: dessinerPhoto });

  // étoiles : plus on est proche du minimum théorique, mieux c'est
  const marges = () => [Math.max(1, Math.round(jeu.min * 0.25)), Math.max(3, Math.round(jeu.min * 0.75))];
  function majTextes() {
    // l'objectif du moment : la première étape de l'aide (le bouton « ? », js/aide.js)
    jeu.objectif = { titre: t('Capture le roi !', 'Capture the king!'), texte: t(`Avec ${NOMS_EQUIPES[jeu.equipe][0]}, attrape le roi noir en le moins de coups possible.`,
      `With ${NOMS_EQUIPES[jeu.equipe][1]}, catch the black king in as few moves as possible.`) };
    // au niveau facile, le roi se trompe souvent : le minimum suppose qu'il se défend parfaitement
    $('bareme').textContent = reglages.niveau === 'difficile'
      ? t(`Le plus court possible : ${coupsTexte(jeu.min)}.`, `The shortest possible: ${coupsTexte(jeu.min)}.`)
      : t(`Le plus court possible si le roi se défend parfaitement : ${coupsTexte(jeu.min)}.`, `The shortest possible if the king defends perfectly: ${coupsTexte(jeu.min)}.`);
    $('btn-solution').hidden = reglages.niveau !== 'difficile';
  }

  // ---------- Coups du joueur ----------
  plateau.addEventListener('click', (e) => {
    const el = e.target.closest('.case-e');
    if (!el || jeu.fini || jeu.trait !== 'blanc' || !revoir.enDirect()) return;
    const c = numero(el.dataset.case);
    const i = occupant(c);
    if (i >= 0) { jeu.selection = i === jeu.selection && jeu.pieces.length > 1 ? -1 : i; afficher(); return; }
    if (jeu.selection >= 0 && coupsPiece(jeu.selection).includes(c)) jouer(jeu.selection, c);
  });
  // ou on fait glisser une pièce blanche jusqu'à la case voulue
  const peutJouer = () => !jeu.fini && jeu.trait === 'blanc' && revoir.enDirect();
  window.Glisser({
    plateau,
    prendre: (n) => peutJouer() && occupant(numero(n)) >= 0,
    demarrer: (n) => { const i = occupant(numero(n)); if (i !== jeu.selection) { jeu.selection = i; afficher(); } },
    lacher: (de, vers) => {
      const i = occupant(numero(de)), d = numero(vers);
      if (peutJouer() && i >= 0 && coupsPiece(i).includes(d)) jouer(i, d);
    },
  });

  function jouer(i, d) {
    arreterChrono();
    const p = jeu.pieces[i];
    jeu.dernier = [p.c, d];
    p.c = d;
    jeu.coups++;
    // la pièce jouée n'est plus choisie : au coup suivant, on choisit de nouveau (sauf s'il ne reste qu'une pièce)
    jeu.selection = jeu.pieces.length === 1 ? 0 : -1;
    Sons.pose({ K: 4, Q: 9, R: 5, B: 3, N: 3 }[p.t]);
    if (d === jeu.kb) {
      jeu.kb = -1;
      jeu.fini = true;
      jeu.selection = -1;
      revoir.ajouter(photo());
      afficher();
      return finir('capture');
    }
    if (jeu.coups >= LIMITE) { jeu.fini = true; revoir.ajouter(photo()); afficher(); return finir('long'); }
    jeu.trait = 'noir';
    revoir.ajouter(photo());
    afficher();
    $('etat').textContent = t('Le roi noir réfléchit…', 'The black king is thinking…');
    const n = jeu.partie;
    setTimeout(() => { if (n === jeu.partie && !jeu.fini) repondre(); }, 600);
  }

  // ---------- Le roi noir ----------
  function coupsNoirs(pieces = jeu.pieces, kb = jeu.kb) {
    const roi = roiBlanc(pieces);
    const tous = T.ROI[kb].filter(m => !roi || m !== roi.c);
    const surs = tous.filter(m => !roi || !T.voisins(m, roi.c));
    return surs.length ? surs : tous;
  }
  // ce que vaut le coup m pour le roi noir : nombre de coups blancs ensuite pour le capturer (255 = il s'échappe)
  function valeurNoire(m, pieces = jeu.pieces) {
    const j = occupant(m, pieces);
    return valeur(j >= 0 ? pieces.filter((_, k) => k !== j) : pieces, m);
  }
  function repondre() {
    const coups = coupsNoirs();
    const notes = coups.map(m => ({ m, v: valeurNoire(m) }));
    let choix;
    if (reglages.niveau === 'difficile' || Math.random() < 0.5) {
      const best = Math.max(...notes.map(x => x.v));
      const meilleurs = notes.filter(x => x.v === best);
      choix = meilleurs[Math.floor(Math.random() * meilleurs.length)].m;
    } else {
      const surs = notes.filter(x => x.v > 1);
      const parmi = surs.length ? surs : notes;
      choix = parmi[Math.floor(Math.random() * parmi.length)].m;
    }
    jeu.dernier = [jeu.kb, choix];
    const j = occupant(choix);
    if (j >= 0) jeu.pieces.splice(j, 1);
    jeu.kb = choix;
    Sons.pose(j >= 0 ? 6 : 2);
    if (jeu.selection >= jeu.pieces.length || j >= 0) jeu.selection = jeu.pieces.length === 1 ? 0 : -1;
    // le roi a pris une pièce : l'équipe peut-elle encore le capturer ?
    if (j >= 0 && valeur(jeu.pieces, jeu.kb) === T.INF) { jeu.fini = true; revoir.ajouter(photo()); afficher(); return finir('echappe'); }
    jeu.trait = 'blanc';
    revoir.ajouter(photo());
    afficher();
    $('etat').textContent = j >= 0 ? t('Aïe, le roi a pris une pièce ! À toi.', 'Ouch, the king took a piece! Your move.') : t('À toi de jouer.', 'Your move.');
    if (jeu.mode === 'defi' && defi.chrono) demarrerChrono();
  }

  // ---------- Solution (niveau difficile) ----------
  // une partie parfaite des deux côtés depuis le départ : les Blancs prennent le chemin le plus court,
  // le roi noir tient le plus longtemps possible
  function solution() {
    if (jeu.mode !== 'libre' || reglages.niveau !== 'difficile' || !jeu.initial) return;
    jeu.partie++;
    arreterChrono();
    let pieces = jeu.initial.pieces.map(p => ({ t: p.t, c: p.c })), kb = jeu.initial.kb, coups = 0;
    const copie = () => pieces.map(p => ({ t: p.t, c: p.c }));
    const liste = [{ pieces: copie(), kb, dernier: null, coups: 0 }];
    for (let k = 0; k < 60 && kb >= 0; k++) {
      // coup blanc : celui qui laisse au roi noir la pire de ses meilleures réponses
      let meilleur = null;
      pieces.forEach((p, i) => {
        for (const d of coupsPiece(i, pieces, kb)) {
          if (d === kb) { if (!meilleur || meilleur.v > -1) meilleur = { i, d, v: -1 }; continue; }
          const apres = pieces.map((q, j) => (j === i ? { t: q.t, c: d } : q));
          const v = Math.max(...coupsNoirs(apres, kb).map(m => valeurNoire(m, apres)));
          if (!meilleur || v < meilleur.v) meilleur = { i, d, v };
        }
      });
      const de = pieces[meilleur.i].c;
      pieces[meilleur.i].c = meilleur.d;
      coups++;
      if (meilleur.d === kb) { kb = -1; liste.push({ pieces: copie(), kb, dernier: [de, meilleur.d], coups }); break; }
      liste.push({ pieces: copie(), kb, dernier: [de, meilleur.d], coups });
      // le roi noir : sa meilleure case
      const notes = coupsNoirs(pieces, kb).map(m => ({ m, v: valeurNoire(m, pieces) }));
      const best = Math.max(...notes.map(x => x.v));
      const m = notes.find(x => x.v === best).m;
      const j = occupant(m, pieces);
      if (j >= 0) pieces.splice(j, 1);
      liste.push({ pieces: copie(), kb: m, dernier: [kb, m], coups });
      kb = m;
    }
    jeu.fini = true;
    jeu.issue = 'solution';
    jeu.selection = -1;
    $('resultats').hidden = true;
    $('etat').textContent = t(`Solution : le roi est capturé en ${coupsTexte(coups)}.`, `Solution: the king is captured in ${coupsTexte(coups)}.`);
    revoir.photos(liste);
    revoir.lire(900);
  }

  // ---------- Chrono (défi) ----------
  function demarrerChrono() {
    arreterChrono();
    const barre = $('minuteur-barre');
    defi.fin = performance.now() + DUREE * 1000;
    defi.dernierTic = 0;
    const p = jeu.partie, coup = jeu.coups;
    const boucle = (temps) => {
      if (p !== jeu.partie || jeu.fini || coup !== jeu.coups) return;
      const reste = Math.max(0, defi.fin - temps) / 1000;
      barre.style.transform = `scaleX(${(reste / DUREE).toFixed(4)})`;
      document.body.classList.toggle('presse', reste <= 4);
      const s = Math.ceil(reste);
      if (reste <= 4 && s > 0 && s !== defi.dernierTic) { defi.dernierTic = s; Sons.tic(); }
      if (reste <= 0) { jeu.fini = true; jeu.selection = -1; afficher(); finir('temps'); return; }
      defi.raf = requestAnimationFrame(boucle);
    };
    defi.raf = requestAnimationFrame(boucle);
  }
  function arreterChrono() {
    cancelAnimationFrame(defi.raf);
    document.body.classList.remove('presse');
  }

  // ---------- Fin de partie ----------
  const coupsTexte = (n) => (EN ? `${n} move${n > 1 ? 's' : ''}` : `${n} coup${n > 1 ? 's' : ''}`);
  function etoilesPour(issue) {
    if (issue !== 'capture') return 0;
    const [m3, m2] = marges();
    return jeu.coups <= jeu.min + m3 ? 3 : jeu.coups <= jeu.min + m2 ? 2 : 1;
  }
  function finir(issue) {
    arreterChrono();
    jeu.issue = issue;
    const etoiles = etoilesPour(issue);
    let titre, detail;
    if (issue === 'capture') {
      titre = etoiles === 3 ? t('Bravo, roi capturé !', 'Well done, king captured!') : t('Roi capturé !', 'King captured!');
      detail = jeu.coups < jeu.min
        ? t(`Tu l'as capturé en ${coupsTexte(jeu.coups)}, encore mieux que le minimum (${coupsTexte(jeu.min)}) : le roi s'est trompé ! Au niveau difficile, il ne se trompe jamais.`,
          `You captured it in ${coupsTexte(jeu.coups)}, even better than the minimum (${coupsTexte(jeu.min)}): the king made a mistake! At the hard level, it never does.`)
        : t(`Tu l'as capturé en ${coupsTexte(jeu.coups)}. Le plus court possible était ${coupsTexte(jeu.min)}.`,
          `You captured it in ${coupsTexte(jeu.coups)}. The shortest possible was ${coupsTexte(jeu.min)}.`);
    } else if (issue === 'echappe') {
      titre = t('Le roi s\'est échappé !', 'The king got away!');
      detail = t('Il a pris une pièce qui n\'était pas protégée, et ce qui reste ne suffit plus pour le capturer.', 'It took an unprotected piece, and what\'s left isn\'t enough to capture it.');
    } else if (issue === 'temps') {
      titre = t('Temps écoulé !', 'Time\'s up!');
      detail = t(`Il faut jouer en moins de ${DUREE} secondes.`, `You have to move within ${DUREE} seconds.`);
    } else {
      titre = t('Le roi a tenu bon !', 'The king held out!');
      detail = t(`${LIMITE} coups sans le capturer : il faut le coincer contre un bord.`, `${LIMITE} moves without capturing it: try trapping it against an edge.`);
    }
    $('etat').textContent = titre;
    if (issue === 'capture') Sons.bravo(); else Sons.echec();
    window.Pom?.etoiles(issue === 'capture' ? Math.max(1, etoiles) : 0);
    if (jeu.mode === 'defi') {
      defi.resultats.push({ etoiles, coups: jeu.coups, min: jeu.min, equipe: jeu.equipe, temps: (performance.now() - defi.debut) / 1000 });
      majPoints();
      $('etoiles-partie').textContent = '★'.repeat(etoiles) + '☆'.repeat(3 - etoiles) + ' · ' + detail;
      $('btn-suivante').firstChild.textContent = defi.numero === NB_DEFIS - 1 ? t('Voir le résultat ', 'See the result ') : t('Partie suivante ', 'Next game ');
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
      $('res-sur').textContent = jeu.coups > 1 ? t('coups', 'moves') : t('coup', 'move');
      compterJusqua($('res-score'), jeu.coups);
      allumerEtoiles($('etoiles'), etoiles);
      $('resultats').hidden = false;
      if (etoiles >= 2) { lancerPluie($('pluie'), etoiles === 3 ? 70 : 40); Sons.victoire(); }
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
    $('titre').textContent = t('Capture le roi', 'Capture the king');
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
    allumerEtoiles($('etoiles'), etoiles);
    $('res-detail').hidden = true;
    const l = $('res-liste');
    l.hidden = false;
    l.innerHTML = defi.resultats.map((r, i) =>
      `<li class="${r.etoiles >= 2 ? 'ok' : 'rate'}" style="animation-delay:${700 + i * 70}ms"><span class="res-rond">${r.etoiles >= 2 ? ICONES.ok : ICONES.rate}</span>` +
      `<span class="res-t">${'★'.repeat(r.etoiles)}${'☆'.repeat(3 - r.etoiles)}<br>${coupsTexte(r.coups)} (${r.min})</span></li>`).join('');
    $('res-temps').hidden = false;
    $('res-temps').textContent = t('Entre parenthèses : le plus court possible. Temps total : ', 'In brackets: the shortest possible. Total time: ') + formaterDuree(defi.resultats.reduce((s, r) => s + r.temps, 0));
    $('resultats').hidden = false;
    lancerPluie($('pluie'), etoiles >= 1 ? 70 : 30);
    Sons.victoire();
    window.Pom?.resultat(etoiles);
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
  // Pom' a trouvé (la solution)
  $('btn-solution').addEventListener('click', () => window.Pom?.eureka());
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
    else if (jeu.selection >= 0 && jeu.pieces.length > 1) { jeu.selection = -1; afficher(); }
  });

  const choix = (groupe, cle) => {
    const boutons = document.querySelectorAll(`#${groupe} button`);
    const maj = () => boutons.forEach(b => b.setAttribute('aria-pressed', b.dataset[cle] === reglages[cle] ? 'true' : 'false'));
    boutons.forEach(b => b.addEventListener('click', () => {
      if (b.dataset[cle] === reglages[cle]) return;
      reglages[cle] = b.dataset[cle];
      ecrire(`echecs.roi.${cle}`, reglages[cle]);
      maj();
      if (cle === 'niveau') $('btn-solution').hidden = reglages.niveau !== 'difficile';
      nouvellePartie();
    }));
    maj();
  };
  choix('reg-equipe', 'equipe');
  choix('reg-niveau', 'niveau');

  brancherBoutonTheme($('btn-theme'));
  brancherReglages($('btn-reglages'), $('panneau-reglages'));
  const appliquerCoordonnees = () => document.body.classList.toggle('sans-coordonnees', !reglages.coordonnees);
  brancherInterrupteur($('reg-coordonnees'), reglages.coordonnees, (v) => { reglages.coordonnees = v; Prefs.ecrire('echecs.roi.coordonnees', v); appliquerCoordonnees(); });
  brancherInterrupteur($('reg-danger'), reglages.danger, (v) => { reglages.danger = v; Prefs.ecrire('echecs.roi.danger', v); afficher(); });
  brancherInterrupteur($('reg-son'), Sons.actif, (v) => { Sons.actif = v; });

  // pour les tests
  window.CaptureRoi = { etat: () => jeu, defi: () => defi, valeur, coupsPiece, valeurNoire, coupsNoirs, jouer, EQUIPES };

  if (window.Aide) window.Aide.objectif = () => jeu.objectif;

  // ---------- Démarrage ----------
  window.Echecs.injecterSprite();
  appliquerCoordonnees();
  lancerLibre();
})();
