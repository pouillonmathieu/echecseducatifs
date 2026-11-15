/* Mat en un
   De vraies parties de grands maîtres : l'échiquier rejoue le dernier coup de l'un d'eux, une gaffe qui laisse un mat
   en un coup. Le joueur doit trouver ce mat et le jouer (en glissant la pièce ou en clic-clic).
   Un coup qui ne fait pas mat est expliqué : pas d'échec, le roi s'enfuit, on prend la pièce, on bloque l'échec, pat
   (flèches rouges sur l'échiquier). Après le mat : pourquoi c'est mat, et ce qui s'est passé dans la vraie partie.
   Modes : libre (plusieurs essais, indice puis solution), défi (10 positions, un seul essai) et défi chrono (30 s).
   Les problèmes viennent de problemes.js (généré et vérifié par outils/mats-en-un.py). */
(function () {
  const { EN, t, Prefs, brancherBoutonTheme, brancherReglages, brancherInterrupteur } = window.Commun;
  const { lancerPluie, compterJusqua, formaterDuree, allumerEtoiles, ICONES } = window.UI;
  const Sons = window.Sons;
  const PROBLEMES = window.MATS_EN_UN;
  const $ = (id) => document.getElementById(id);
  const plateau = $('echiquier');
  const annotations = Echiquier.annotations(plateau);

  const NB_DEFIS = 10;
  const DUREE = 30;
  const PAUSE_ERREUR = 2600; // ms : le coup raté reste affiché avec les défenses

  const reglages = {
    coordonnees: Prefs.lire('echecs.mat1.coordonnees', true),
    points: Prefs.lire('echecs.mat1.points', true),
  };
  // etat : 'anim' (le coup adverse se joue), 'jeu' (à toi), 'erreur' (un coup raté est montré), 'fini'
  const jeu = { mode: 'libre', p: null, etat: 'anim', selection: null, essais: 0, aide: 0, orientation: 'blanc', partie: 0, pioche: [], dernier: -1, justes: 0, total: 0, final: null };
  const defi = { chrono: false, liste: [], numero: 0, resultats: [], debut: 0, fin: 0, raf: 0, dernierTic: 0 };
  const plusTard = (fn, ms) => { const p = jeu.partie; return setTimeout(() => { if (p === jeu.partie) fn(); }, ms); };

  function melanger(tab) {
    const a = [...tab];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  // ---------- Notation et noms ----------
  const sanFr = (s) => (EN ? s : s.replace(/[NBRQK]/g, c => ({ N: 'C', B: 'F', R: 'T', Q: 'D', K: 'R' })[c]));
  const LETTRE = { pion: 'p', cavalier: 'n', fou: 'b', tour: 'r', dame: 'q', roi: 'k' };
  const TYPE = { p: 'pion', n: 'cavalier', b: 'fou', r: 'tour', q: 'dame', k: 'roi' };
  const ANGLAIS = { pion: 'pawn', cavalier: 'knight', fou: 'bishop', tour: 'rook', dame: 'queen', roi: 'king' };
  const feminin = (type) => type === 'tour' || type === 'dame';
  // « la dame blanche », « le cavalier noir » (ou sans la couleur) ; « the white queen »
  function nomDe(p, couleur = true) {
    if (!p) return t('le pion', 'the pawn');
    if (EN) return `the ${couleur ? (p.couleur === 'blanc' ? 'white ' : 'black ') : ''}${ANGLAIS[p.piece]}`;
    const f = feminin(p.piece);
    const c = p.couleur === 'blanc' ? (f ? 'blanche' : 'blanc') : (f ? 'noire' : 'noir');
    return `${f ? 'la' : 'le'} ${p.piece}${couleur ? ' ' + c : ''}`;
  }
  const majuscule = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const liste = (mots) => (mots.length <= 1 ? mots.join('') : mots.slice(0, -1).join(', ') + t(' et ', ' and ') + mots[mots.length - 1]);
  const camp = (c, maj = true) => (c === 'blanc' ? (maj ? t('Les Blancs', 'White') : t('les Blancs', 'White')) : (maj ? t('Les Noirs', 'Black') : t('les Noirs', 'Black')));
  const autre = (c) => (c === 'blanc' ? 'noir' : 'blanc');

  // ---------- Positions : jouer un coup sur la position dessinée ----------
  const ecrireFen = (cases) => {
    const lignes = [];
    for (let r = 8; r >= 1; r--) {
      let l = '', vide = 0;
      for (const c of 'abcdefgh') {
        const p = cases[c + r];
        if (!p) { vide++; continue; }
        if (vide) { l += vide; vide = 0; }
        const x = LETTRE[p.piece];
        l += p.couleur === 'blanc' ? x.toUpperCase() : x;
      }
      lignes.push(l + (vide || ''));
    }
    return lignes.join('/');
  };
  // les déplacements d'un coup (le roi et la tour quand on roque)
  function deplacements(fen, uci) {
    const cases = Echiquier.lireFen(fen);
    const de = uci.slice(0, 2), vers = uci.slice(2, 4);
    const d = [[de, vers]];
    if (cases[de] && cases[de].piece === 'roi' && Math.abs(de.charCodeAt(0) - vers.charCodeAt(0)) === 2) {
      const r = de[1];
      d.push(vers[0] === 'g' ? ['h' + r, 'f' + r] : ['a' + r, 'd' + r]);
    }
    return d;
  }
  function jouerSur(fen, uci) {
    const cases = Echiquier.lireFen(fen);
    const de = uci.slice(0, 2), vers = uci.slice(2, 4);
    let p = cases[de];
    if (p.piece === 'pion' && de[0] !== vers[0] && !cases[vers]) delete cases[vers[0] + de[1]]; // prise en passant
    for (const [a, b] of deplacements(fen, uci)) { const x = cases[a]; delete cases[a]; cases[b] = x; }
    if (uci[4]) cases[vers] = { piece: TYPE[uci[4]], couleur: p.couleur };
    return ecrireFen(cases);
  }

  // ---------- L'échiquier ----------
  function dessiner(fen, coup, anime) {
    Echiquier.dessiner(plateau, fen, { orientation: jeu.orientation });
    plateau.classList.toggle('calme', !anime); // le coup ne clignote qu'une fois, pas à chaque nouveau dessin
    if (coup) { Echiquier.marquer(plateau, [coup.slice(0, 2)], 'depart'); Echiquier.marquer(plateau, [coup.slice(2, 4)], 'arrivee'); }
    if (coup && anime) animer(deplacements(jeu.fenAvant || fen, coup));
  }
  // la pièce glisse de sa case de départ à sa case d'arrivée
  function animer(liste) {
    Sons.pose(3);
    for (const [a, b] of liste) {
      const de = plateau.querySelector(`[data-case="${a}"]`), vers = plateau.querySelector(`[data-case="${b}"]`);
      const piece = vers && vers.querySelector('.piece-e');
      if (!de || !piece || !piece.animate) continue;
      const ra = de.getBoundingClientRect(), rb = vers.getBoundingClientRect();
      piece.style.zIndex = 5;
      piece.animate([{ transform: `translate(${ra.left - rb.left}px, ${ra.top - rb.top}px)` }, { transform: 'none' }],
        { duration: 340, easing: 'cubic-bezier(.3, .7, .3, 1)' }).onfinish = () => { piece.style.zIndex = ''; };
    }
  }
  const coupsDe = (p) => p.coups.split(' ');
  // la position du problème (après la gaffe), avec les marques du moment
  function dessinerProbleme() {
    const p = jeu.p;
    jeu.fenAvant = p.fen;
    dessiner(p.apres, p.coup, false);
    apresDessin();
  }
  function apresDessin() {
    if (jeu.etat !== 'jeu') return;
    const p = jeu.p;
    // les pièces qui peuvent bouger, la pièce choisie et ses coups
    const cases = Echiquier.lireFen(p.apres);
    for (const u of coupsDe(p)) Echiquier.marquer(plateau, [u.slice(0, 2)], 'jouable');
    if (jeu.selection) {
      Echiquier.marquer(plateau, [jeu.selection], 'choisie');
      if (reglages.points) {
        for (const u of coupsDe(p).filter(u => u.startsWith(jeu.selection))) {
          const v = u.slice(2, 4);
          Echiquier.marquer(plateau, [v], cases[v] ? 'possible-prise' : 'possible');
        }
      }
    }
    if (jeu.aide >= 1) Echiquier.marquer(plateau, [p.mats[0].slice(0, 2)], 'indice');
    Echiquier.dessinerAnnotations(plateau, jeu.aide >= 2 ? [[p.mats[0].slice(0, 4), 'suite']] : []);
  }

  // ---------- Un problème ----------
  function piocher() {
    if (!jeu.pioche.length) jeu.pioche = melanger(PROBLEMES.map((_, i) => i)).filter(i => i !== jeu.dernier);
    jeu.dernier = jeu.pioche.pop();
    return PROBLEMES[jeu.dernier];
  }

  const nomJoueur = (p, c) => (c === 'blanc' ? p.partie.blancs : p.partie.noirs);
  const CADENCE = { blitz: ['Blitz', 'Blitz'], rapide: ['Rapide', 'Rapid'], classique: ['Partie longue', 'Classical'] };
  // le numéro du coup : « 42. » pour les Blancs, « 42… » pour les Noirs
  const numero = (n, c) => `${n}${c === 'blanc' ? '.' : '…'}`;

  function poser(p) {
    jeu.partie++;
    arreterChrono();
    jeu.p = p;
    jeu.etat = 'anim';
    jeu.selection = null;
    jeu.essais = 0;
    jeu.aide = 0;
    jeu.final = null;
    jeu.orientation = p.trait;
    annotations.effacer();
    fermerPromotion();
    // la partie
    const ligne = (c) => {
      const titre = c === 'blanc' ? p.partie.titreB : p.partie.titreN;
      const elo = c === 'blanc' ? p.partie.eloB : p.partie.eloN;
      return `<span class="pastille ${c}" aria-label="${c === 'blanc' ? t('Blancs', 'White') : t('Noirs', 'Black')}"></span>` +
        `<span class="nom">${nomJoueur(p, c)}</span>` +
        (titre ? `<span class="titre-fide" title="${titre === 'GM' ? t('Grand maître international', 'International Grandmaster') : titre}">${titre}</span>` : '') +
        (elo && elo !== '0' ? `<span class="elo">${elo}</span>` : '');
    };
    $('joueur-blanc').innerHTML = ligne('blanc');
    $('joueur-noir').innerHTML = ligne('noir');
    const cad = CADENCE[p.partie.cadence];
    $('tournoi').textContent = [p.partie.evenement, p.partie.evenement.includes(p.partie.annee) ? '' : p.partie.annee, cad && (EN ? cad[1] : cad[0])].filter(Boolean).join(' · ');
    $('dernier-coup').innerHTML = '&nbsp;';
    document.querySelector('#roi-question').setAttribute('href', `#piece-roi-${p.trait}`);
    $('question-texte').textContent = t(`${camp(p.trait)} jouent et font mat en un coup !`, `${camp(p.trait)} to play and mate in one!`);
    const q = $('question');
    q.classList.remove('nouvelle'); void q.offsetWidth; q.classList.add('nouvelle');
    message('');
    $('retour').hidden = true;
    $('question').hidden = false;
    majIndice();
    // la position d'avant, puis la gaffe
    jeu.fenAvant = p.fen;
    dessiner(p.fen, null, false);
    plusTard(montrerGaffe, 650);
  }
  function montrerGaffe() {
    const p = jeu.p;
    jeu.fenAvant = p.fen;
    dessiner(p.apres, p.coup, true);
    $('dernier-coup').innerHTML = t(
      `<b>${nomJoueur(p, p.gaffeur)}</b> vient de jouer <span class="coup-gaffe">${numero(p.num, p.gaffeur)}${sanFr(p.san)}<span class="gaffe">??</span></span>`,
      `<b>${nomJoueur(p, p.gaffeur)}</b> has just played <span class="coup-gaffe">${numero(p.num, p.gaffeur)}${p.san}<span class="gaffe">??</span></span>`);
    plusTard(() => {
      if (jeu.etat !== 'anim') return;
      jeu.etat = 'jeu';
      apresDessin();
      majIndice();
      if (jeu.mode === 'defi') {
        defi.debut = performance.now();
        if (defi.chrono) demarrerChrono();
      }
    }, 420);
  }
  // « Revoir le coup » : la position d'avant, puis la gaffe à nouveau
  function revoirCoup() {
    if (jeu.etat !== 'jeu') return;
    const p = jeu.p, j = jeu.partie;
    jeu.selection = null;
    jeu.etat = 'revoir';
    dessiner(p.fen, null, false);
    setTimeout(() => {
      if (j !== jeu.partie || jeu.etat !== 'revoir') return;
      jeu.fenAvant = p.fen;
      dessiner(p.apres, p.coup, true);
      setTimeout(() => { if (j === jeu.partie && jeu.etat === 'revoir') { jeu.etat = 'jeu'; apresDessin(); } }, 380);
    }, 550);
  }

  function message(texte, classe = '') {
    const m = $('message');
    m.innerHTML = texte;
    m.className = 'message ' + classe;
    m.hidden = !texte;
  }

  // ---------- Le joueur joue ----------
  const couleurSur = (c) => { const x = Echiquier.lireFen(jeu.p.apres)[c]; return x && x.couleur; };
  const aDesCoups = (c) => coupsDe(jeu.p).some(u => u.startsWith(c));
  function selectionner(c) {
    jeu.selection = c;
    dessinerProbleme();
  }
  // le coup voulu (de, vers) : les coups possibles qui vont là (plusieurs pour une promotion)
  function candidats(de, vers) {
    const coups = coupsDe(jeu.p);
    let c = coups.filter(u => u.startsWith(de + vers));
    // roquer en posant le roi sur sa tour
    if (!c.length) {
      const cases = Echiquier.lireFen(jeu.p.apres);
      if (cases[de] && cases[de].piece === 'roi' && cases[vers] && cases[vers].piece === 'tour' && cases[vers].couleur === cases[de].couleur) {
        const cible = (vers[0] > de[0] ? 'g' : 'c') + de[1];
        c = coups.filter(u => u === de + cible);
      }
    }
    return c;
  }
  function tenter(de, vers, glisse) {
    if (jeu.etat !== 'jeu') return;
    const c = candidats(de, vers);
    if (!c.length) {
      if (couleurSur(vers) === jeu.p.trait && aDesCoups(vers)) { selectionner(vers); return; }
      Sons.refus();
      selectionner(null);
      return;
    }
    if (c.length > 1) { ouvrirPromotion(c, glisse); return; }
    jouer(c[0], glisse);
  }
  plateau.addEventListener('click', (e) => {
    if (jeu.etat !== 'jeu') return;
    const el = e.target.closest('.case-e');
    if (!el) return;
    const c = el.dataset.case;
    if (jeu.selection && (c === jeu.selection)) { selectionner(null); return; }
    if (jeu.selection && candidats(jeu.selection, c).length) { tenter(jeu.selection, c, false); return; }
    if (couleurSur(c) === jeu.p.trait && aDesCoups(c)) { selectionner(c); return; }
    if (jeu.selection) tenter(jeu.selection, c, false);
  });
  window.Glisser({
    plateau,
    prendre: (c) => jeu.etat === 'jeu' && couleurSur(c) === jeu.p.trait && aDesCoups(c),
    demarrer: (c) => selectionner(c),
    lacher: (de, vers) => tenter(de, vers, true),
  });

  // promotion : le joueur choisit la pièce
  function ouvrirPromotion(coups, glisse) {
    const boite = $('promotion');
    const couleur = jeu.p.trait;
    $('promo-choix').innerHTML = ['q', 'r', 'b', 'n'].filter(x => coups.some(u => u[4] === x)).map(x =>
      `<button type="button" data-coup="${coups.find(u => u[4] === x)}" aria-label="${nomDe({ piece: TYPE[x], couleur }, false)}" title="${majuscule(nomDe({ piece: TYPE[x], couleur }, false))}">` +
      `<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#piece-${TYPE[x]}-${couleur}"/></svg></button>`).join('');
    boite.hidden = false;
    boite.dataset.glisse = glisse ? '1' : '';
    boite.querySelector('button').focus({ preventScroll: true });
  }
  function fermerPromotion() { $('promotion').hidden = true; }
  $('promo-choix').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const glisse = !!$('promotion').dataset.glisse;
    fermerPromotion();
    jouer(b.dataset.coup, glisse);
  });

  function jouer(uci, glisse) {
    const p = jeu.p;
    jeu.selection = null;
    if (p.mats.includes(uci)) { reussir(uci, glisse); return; }
    rater(uci, glisse);
  }

  // pourquoi ce coup ne fait pas mat (texte, et flèches des défenses)
  function pourquoi(uci) {
    const p = jeu.p;
    const i = coupsDe(p).indexOf(uci);
    const r = p.raisons[i] || 'n';
    const def = autre(p.trait);
    if (r === 'n') return { texte: t(`Ce coup ne donne même pas échec : le roi ${def === 'noir' ? 'noir' : 'blanc'} n'est pas attaqué.`, `That move isn't even check: the ${def === 'noir' ? 'black' : 'white'} king isn't attacked.`), fleches: [] };
    if (r === 'pat') return { texte: t(`Pat ! ${camp(def)} ne peuvent plus bouger, mais leur roi n'est pas en échec : la partie serait nulle.`, `Stalemate! ${camp(def)} can't move, but the king isn't in check: the game would be a draw.`), fleches: [] };
    const cases = Echiquier.lireFen(jouerSur(p.apres, uci));
    const morceaux = [], fleches = [];
    for (const tok of r.split(' ')) {
      const type = tok[0], de = tok.slice(1, 3), vers = tok.slice(3, 5);
      const piece = cases[de];
      fleches.push([de + vers, 'danger']);
      // le roi peut prendre… ou s'enfuir : une seule phrase pour le roi
      if (type === 'f' && morceaux.roiPrend) morceaux[morceaux.length - 1] += t(` ou s'enfuir en ${vers}`, ` or escape to ${vers}`);
      else if (type === 'f') morceaux.push(t(`le roi peut s'enfuir en ${vers}`, `the king can escape to ${vers}`));
      else if (type === 'p') {
        morceaux.roiPrend = !!(piece && piece.piece === 'roi');
        morceaux.push(piece && piece.piece === 'roi'
          ? t(`le roi peut prendre ${nomDe(cases[vers], false)} en ${vers}`, `the king can take ${nomDe(cases[vers], false)} on ${vers}`)
          : t(`${nomDe(piece)} de ${de} peut prendre ${nomDe(cases[vers], false)} en ${vers}`, `${nomDe(piece)} on ${de} can take ${nomDe(cases[vers], false)} on ${vers}`));
      } else morceaux.push(t(`${nomDe(piece)} de ${de} peut se mettre en ${vers} pour bloquer l'échec`, `${nomDe(piece)} on ${de} can block the check on ${vers}`));
    }
    return { texte: t('Échec, mais pas mat : ', 'Check, but not mate: ') + liste(morceaux) + '.', fleches };
  }

  function rater(uci, glisse) {
    const p = jeu.p;
    jeu.essais++;
    jeu.etat = 'erreur';
    annotations.effacer();
    const { texte, fleches } = pourquoi(uci);
    jeu.fenAvant = p.apres;
    dessiner(jouerSur(p.apres, uci), uci, !glisse);
    Echiquier.dessinerAnnotations(plateau, fleches);
    Sons.refus();
    plateau.classList.remove('secoue'); void plateau.offsetWidth; plateau.classList.add('secoue');
    if (jeu.mode === 'libre') {
      message(texte + ' ' + t('Essaie encore !', 'Try again!'), 'erreur');
      plusTard(() => {
        if (jeu.etat !== 'erreur') return;
        jeu.etat = 'jeu';
        dessinerProbleme();
      }, PAUSE_ERREUR);
      return;
    }
    // défi : un seul essai
    arreterChrono();
    message(texte, 'erreur');
    jeu.final = { ok: false, texte };
    plusTard(() => finir(false, false), PAUSE_ERREUR);
  }

  function reussir(uci, glisse) {
    jeu.etat = 'fini';
    arreterChrono();
    montrerMat(uci, !glisse);
    message('');
    const premier = jeu.essais === 0 && jeu.aide === 0;
    Sons.bravo();
    if (jeu.mode === 'libre') {
      jeu.total++;
      if (premier) jeu.justes++;
      $('score-libre').textContent = `${jeu.justes} / ${jeu.total}`;
    }
    montrerRetour(true, uci);
  }
  // défi raté (mauvais coup, ou temps écoulé) : on montre le mat
  function finir(ok, tempsEcoule) {
    jeu.etat = 'fini';
    arreterChrono();
    const p = jeu.p;
    montrerMat(p.mats[0], true);
    if (tempsEcoule) { message(''); Sons.echec(); }
    montrerRetour(false, p.mats[0], tempsEcoule);
  }
  function montrerMat(uci, anime) {
    const p = jeu.p;
    annotations.effacer();
    jeu.fenAvant = p.apres;
    const fen = jouerSur(p.apres, uci);
    dessiner(fen, uci, anime);
    const roi = Object.entries(Echiquier.lireFen(fen)).find(([, x]) => x.piece === 'roi' && x.couleur !== p.trait);
    if (roi) Echiquier.marquer(plateau, [roi[0]], 'roi-attaque');
    jeu.finFen = fen;
    jeu.finCoup = uci;
  }

  const ICONE_JUSTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const ICONE_FAUX = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';
  function montrerRetour(juste, uci, tempsEcoule = false) {
    const p = jeu.p;
    const i = p.mats.indexOf(uci);
    const san = (EN ? p.sanMats[i] : sanFr(p.sanMats[i]));
    const numMat = p.trait === 'blanc' ? numero(p.gaffeur === 'noir' ? p.num + 1 : p.num, 'blanc') : numero(p.num, 'noir');
    const coupMat = `${numMat}${san}`;
    let titre;
    if (juste) titre = jeu.essais || jeu.aide ? t(`C'est mat : ${coupMat}`, `That's mate: ${coupMat}`) : t(`Bravo, c'est mat : ${coupMat}`, `Well done, that's mate: ${coupMat}`);
    else titre = (tempsEcoule ? t('Temps écoulé ! ', 'Time\'s up! ') : t('Raté ! ', 'Missed! ')) + t(`Le mat était ${coupMat}`, `The mate was ${coupMat}`);
    $('verdict').innerHTML = (juste ? ICONE_JUSTE : ICONE_FAUX) + `<span>${titre}</span>`;
    $('motif').textContent = EN ? p.motif_en : p.motif;
    let expl = i === 0 ? (EN ? p.explication_en : p.explication) : '';
    const autres = p.sanMats.filter((_, k) => k !== i).map(s => (EN ? s : sanFr(s)));
    if (autres.length) expl += (expl ? ' ' : '') + t(`Autre mat possible : ${liste(autres)}.`, `Another possible mate: ${liste(autres)}.`);
    $('explication').textContent = expl;
    $('explication').hidden = !expl;
    $('histoire').innerHTML = histoire(p);
    const lien = $('lien-partie');
    lien.hidden = !p.partie.lien;
    if (p.partie.lien) lien.href = p.partie.lien;
    const r = $('retour');
    r.classList.toggle('juste', juste);
    r.classList.toggle('faux', !juste);
    r.hidden = false;
    $('question').hidden = true;
    majIndice();
    if (jeu.mode === 'defi') {
      defi.resultats.push({ ok: juste, san: coupMat, temps: (performance.now() - defi.debut) / 1000 });
      majPoints();
    }
    $('btn-suivant').firstChild.textContent = jeu.mode === 'defi' && defi.numero === NB_DEFIS - 1 ? t('Voir le résultat ', 'See the result ') : t('Suivant ', 'Next ');
    $('btn-suivant').focus({ preventScroll: true });
  }

  // ce qui s'est passé dans la vraie partie
  function histoire(p) {
    const g = nomJoueur(p, p.gaffeur), a = nomJoueur(p, autre(p.gaffeur));
    const morceaux = [];
    if (p.eval >= 3) morceaux.push(t(`Avant ce coup, ${g} avait une position gagnante !`, `Before this move, ${g} had a winning position!`));
    else if (p.eval >= -1) morceaux.push(t('Avant ce coup, la partie était encore équilibrée.', 'Before this move, the game was still balanced.'));
    if (p.joue) morceaux.push(t(`Dans la partie, ${a} n'a pas laissé passer sa chance.`, `In the game, ${a} didn't miss the chance.`));
    else {
      const suite = p.suite ? (EN ? p.suite : sanFr(p.suite)) : '';
      morceaux.push(suite
        ? t(`Incroyable : dans la partie, ${a} n'a pas vu le mat et a joué ${suite}.`, `Incredible: in the game, ${a} missed the mate and played ${suite}.`)
        : t(`Incroyable : dans la partie, ${a} n'a pas vu le mat.`, `Incredible: in the game, ${a} missed the mate.`));
      const gagnant = p.partie.resultat === '1-0' ? 'blanc' : p.partie.resultat === '0-1' ? 'noir' : p.partie.resultat === '1/2-1/2' ? 'nulle' : null;
      if (gagnant === p.gaffeur) morceaux.push(t(`Et c'est finalement ${g} qui a gagné la partie !`, `And in the end, ${g} won the game!`));
      else if (gagnant === 'nulle') morceaux.push(t('La partie s\'est terminée par une nulle.', 'The game ended in a draw.'));
      else if (gagnant) morceaux.push(t(`${a} a quand même gagné la partie.`, `${a} still won the game.`));
    }
    if (p.partie.cadence === 'blitz') morceaux.push(t('En blitz, chacun n\'a que quelques minutes pour toute la partie : même les champions font des gaffes !', 'In blitz, each player has only a few minutes for the whole game: even champions blunder!'));
    return morceaux.join(' ');
  }

  // ---------- Indice, puis solution ----------
  function majIndice() {
    const b = $('btn-indice');
    b.classList.toggle('solution', jeu.aide >= 1);
    $('btn-indice-texte').textContent = jeu.aide >= 1 ? t('Solution', 'Solution') : t('Indice', 'Hint');
    b.disabled = jeu.etat === 'fini' || jeu.aide >= 2;
    $('btn-revoir').disabled = jeu.etat === 'fini';
  }
  $('btn-indice').addEventListener('click', () => {
    if (jeu.mode !== 'libre' || jeu.etat === 'fini' || jeu.aide >= 2) return;
    jeu.aide++;
    if (jeu.etat === 'jeu') dessinerProbleme();
    message(jeu.aide === 1
      ? t('Indice : c\'est cette pièce qui fait mat.', 'Hint: this is the piece that gives mate.')
      : t('Solution : suis la flèche et joue le coup !', 'Solution: follow the arrow and play the move!'));
    majIndice();
  });
  $('btn-revoir').addEventListener('click', revoirCoup);
  // tourner l'échiquier : on redessine ce qui est montré
  $('btn-retourner').addEventListener('click', () => {
    jeu.orientation = autre(jeu.orientation);
    if (!jeu.p) return;
    if (jeu.etat === 'fini' && jeu.finFen) {
      dessiner(jeu.finFen, jeu.finCoup, false);
      const roi = Object.entries(Echiquier.lireFen(jeu.finFen)).find(([, x]) => x.piece === 'roi' && x.couleur !== jeu.p.trait);
      if (roi) Echiquier.marquer(plateau, [roi[0]], 'roi-attaque');
    } else if (jeu.etat === 'jeu') dessinerProbleme();
    else if (jeu.etat === 'anim') dessiner(jeu.p.fen, null, false);
  });
  window.addEventListener('resize', () => { if (jeu.etat === 'jeu' && jeu.aide >= 2) apresDessin(); });

  function suivant() {
    if (jeu.etat !== 'fini') return;
    if (jeu.mode === 'libre') { poser(piocher()); return; }
    defi.numero++;
    if (defi.numero >= NB_DEFIS) { montrerResultats(); return; }
    lancerPosition();
  }

  // ---------- Défis ----------
  function construirePoints() {
    $('points').innerHTML = Array.from({ length: NB_DEFIS }, (_, i) => `<li aria-label="Position ${i + 1}"></li>`).join('');
  }
  function majPoints() {
    $('points').querySelectorAll('li').forEach((li, i) => {
      const r = defi.resultats[i];
      li.className = r ? (r.ok ? 'ok' : 'rate') : (i === defi.numero ? 'actuel' : '');
    });
  }
  function lancerPosition() {
    $('titre').textContent = t(`Position ${defi.numero + 1} sur ${NB_DEFIS}`, `Position ${defi.numero + 1} of ${NB_DEFIS}`);
    $('minuteur-barre').style.transform = 'scaleX(1)';
    poser(defi.liste[defi.numero]);
    majPoints();
  }
  function demarrerChrono() {
    arreterChrono();
    const barre = $('minuteur-barre');
    defi.fin = performance.now() + DUREE * 1000;
    defi.dernierTic = 0;
    const p = jeu.partie;
    const boucle = (tps) => {
      if (p !== jeu.partie || jeu.etat === 'fini' || jeu.etat === 'erreur') return;
      const reste = Math.max(0, defi.fin - tps) / 1000;
      barre.style.transform = `scaleX(${(reste / DUREE).toFixed(4)})`;
      document.body.classList.toggle('presse', reste <= 5);
      const s = Math.ceil(reste);
      if (reste <= 5 && s > 0 && s !== defi.dernierTic) { defi.dernierTic = s; Sons.tic(); }
      if (reste <= 0) { fermerPromotion(); finir(false, true); return; }
      defi.raf = requestAnimationFrame(boucle);
    };
    defi.raf = requestAnimationFrame(boucle);
  }
  function arreterChrono() {
    cancelAnimationFrame(defi.raf);
    document.body.classList.remove('presse');
  }
  function montrerResultats() {
    arreterChrono();
    const score = defi.resultats.filter(r => r.ok).length;
    const etoiles = score === NB_DEFIS ? 3 : score >= 7 ? 2 : score >= 4 ? 1 : 0;
    $('res-titre').textContent = score === NB_DEFIS ? t('Parfait !', 'Perfect!') : score >= 7 ? t('Bravo !', 'Well done!') : score >= 4 ? t('Bien joué !', 'Nice work!') : t('Continue, tu progresses !', 'Keep going, you\'re getting better!');
    allumerEtoiles($('etoiles'), etoiles);
    $('res-liste').innerHTML = defi.resultats.map((r, i) =>
      `<li class="${r.ok ? 'ok' : 'rate'}" style="animation-delay:${700 + i * 70}ms" aria-label="Position ${i + 1} (${r.san})${t(' : ', ': ')}${r.ok ? t('réussie', 'right') : t('ratée', 'wrong')}">` +
      `<span class="res-rond">${r.ok ? ICONES.ok : ICONES.rate}</span><span class="res-t">${r.san}</span></li>`).join('');
    const total = defi.resultats.reduce((s, r) => s + r.temps, 0);
    $('res-temps').textContent = t('Temps total : ', 'Total time: ') + formaterDuree(total);
    $('resultats').hidden = false;
    $('btn-rejouer').focus({ preventScroll: true });
    compterJusqua($('res-score'), score);
    lancerPluie($('pluie'), etoiles >= 1 ? 70 : 30);
    Sons.victoire();
  }

  // ---------- Modes ----------
  function preparer(mode) {
    jeu.partie++;
    arreterChrono();
    $('resultats').hidden = true;
    $('pluie').innerHTML = '';
    jeu.mode = mode;
    document.body.dataset.mode = mode;
  }
  function lancerLibre() {
    preparer('libre');
    document.body.dataset.chrono = 'non';
    $('titre').textContent = t('Mat en un', 'Mate in one');
    jeu.justes = 0; jeu.total = 0;
    $('score-libre').textContent = '0 / 0';
    poser(piocher());
  }
  function lancerDefi(chrono) {
    fermerChoix();
    preparer('defi');
    defi.chrono = chrono;
    document.body.dataset.chrono = chrono ? 'oui' : 'non';
    defi.liste = melanger(PROBLEMES).slice(0, NB_DEFIS);
    defi.numero = 0;
    defi.resultats = [];
    construirePoints();
    lancerPosition();
  }

  // ---------- Branchements ----------
  $('btn-suivant').addEventListener('click', suivant);
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!$('choix-defi').hidden || !$('resultats').hidden) {
      if (e.key === 'Escape' && !$('choix-defi').hidden) fermerChoix();
      return;
    }
    if (e.key === 'Escape' && !$('promotion').hidden) { fermerPromotion(); return; }
    if (e.key === 'Enter' && jeu.etat === 'fini' && document.activeElement === document.body) suivant();
  });
  function ouvrirChoix() { $('choix-defi').hidden = false; $('mode-defi').focus({ preventScroll: true }); }
  function fermerChoix() { $('choix-defi').hidden = true; }
  $('btn-defis').addEventListener('click', ouvrirChoix);
  $('btn-fermer-choix').addEventListener('click', () => { fermerChoix(); $('btn-defis').focus(); });
  $('choix-defi').addEventListener('click', (e) => { if (e.target === e.currentTarget) fermerChoix(); });
  $('mode-defi').addEventListener('click', () => lancerDefi(false));
  $('mode-chrono').addEventListener('click', () => lancerDefi(true));
  $('btn-retour').addEventListener('click', lancerLibre);
  $('btn-menu').addEventListener('click', lancerLibre);
  $('btn-rejouer').addEventListener('click', () => lancerDefi(defi.chrono));

  brancherBoutonTheme($('btn-theme'));
  brancherReglages($('btn-reglages'), $('panneau-reglages'));
  const appliquer = () => document.body.classList.toggle('sans-coordonnees', !reglages.coordonnees);
  brancherInterrupteur($('reg-coordonnees'), reglages.coordonnees, (v) => { reglages.coordonnees = v; Prefs.ecrire('echecs.mat1.coordonnees', v); appliquer(); });
  brancherInterrupteur($('reg-points'), reglages.points, (v) => { reglages.points = v; Prefs.ecrire('echecs.mat1.points', v); if (jeu.etat === 'jeu') dessinerProbleme(); });
  brancherInterrupteur($('reg-son'), Sons.actif, (v) => { Sons.actif = v; });

  // ---------- Démarrage ----------
  window.Echecs.injecterSprite();
  appliquer();
  lancerLibre();
  window.MatEnUn = { jeu, defi, poser, PROBLEMES, jouer, jouerSur, pourquoi };
})();
