/* Quiz des ouvertures
   Les premiers coups d'une ouverture connue se jouent tout seuls sur l'échiquier ; il faut la reconnaître parmi
   quatre noms. Trois niveaux : facile (les ouvertures de base), moyen (leurs variantes principales), expert (des
   variantes avancées). Sous l'échiquier, les flèches font revoir les coups à son rythme (js/revoir.js), et un bouton
   rejoue l'ouverture depuis le début.
   Modes : libre, défi (10 ouvertures), défi chrono (20 s, le chrono part quand les coups ont fini de se jouer).
   Après la réponse : le nom et les idées de l'ouverture, un lien vers sa fiche (fiche.html), et « Rejouer
   l'ouverture » : c'est alors le joueur qui joue les coups (les Blancs, les Noirs ou les deux), en glissant les pièces
   ou en clic-clic, avec un indice (la pièce à jouer) puis la solution (une flèche).
   Les ouvertures viennent de donnees.js (généré et vérifié par outils/ouvertures.js). */
(function () {
  const { EN, t, Prefs, brancherBoutonTheme, brancherReglages, brancherInterrupteur } = window.Commun;
  const { lancerPluie, compterJusqua, formaterDuree, allumerEtoiles, ICONES } = window.UI;
  const Sons = window.Sons;
  const OUVERTURES = window.OUVERTURES;
  const PAR_ID = Object.fromEntries(OUVERTURES.map(o => [o.id, o]));
  const $ = (id) => document.getElementById(id);
  const plateau = $('echiquier');
  const annotations = Echiquier.annotations(plateau);

  const NB_DEFIS = 10;
  const DUREE = 20;
  const VITESSE = 850; // ms entre deux coups de l'animation

  const nomDe = (o) => (EN ? o.nom_en : o.nom);
  // notation : en français, C (cavalier), F (fou), T (tour), D (dame), R (roi)
  const sanFr = (s) => (EN ? s : s.replace(/[NBRQK]/g, c => ({ N: 'C', B: 'F', R: 'T', Q: 'D', K: 'R' })[c]));
  const lire = (cle, defaut) => { try { return localStorage.getItem(cle) || defaut; } catch (e) { return defaut; } };
  const ecrire = (cle, v) => { try { localStorage.setItem(cle, v); } catch (e) { /* stockage indisponible */ } };

  const NIVEAUX = ['facile', 'moyen', 'expert'];
  const reglages = {
    niveau: NIVEAUX.includes(lire('echecs.ouvertures.niveau', '')) ? lire('echecs.ouvertures.niveau', '') : 'facile',
    coordonnees: Prefs.lire('echecs.ouvertures.coordonnees', true),
  };
  const jeu = { mode: 'libre', vue: 'quiz', ouverture: null, choix: [], repondu: false, pioche: [], dernier: null, justes: 0, total: 0, partie: 0, question: 0, orientation: 'blanc' };
  const defi = { chrono: false, liste: [], numero: 0, resultats: [], debut: 0, fin: 0, raf: 0, dernierTic: 0, chronoLance: false };
  const plusTard = (fn, ms) => { const p = jeu.partie; return setTimeout(() => { if (p === jeu.partie) fn(); }, ms); };

  function melanger(t) {
    const a = [...t];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  // ---------- L'échiquier : positions, animation des coups ----------
  // une « photo » par position : la position, son numéro, les déplacements du coup qui y mène
  const photosDe = (o) => o.fens.map((fen, i) => ({ fen, i, anim: i ? o.coups[i - 1] : null }));
  let numeroAvant = -1; // position dessinée juste avant : on n'anime que le coup suivant
  function dessinerPhoto(ph) {
    Echiquier.dessiner(plateau, ph.fen, { orientation: jeu.orientation });
    if (ph.anim) { Echiquier.marquer(plateau, [ph.anim[0][0]], 'depart'); Echiquier.marquer(plateau, [ph.anim[0][1]], 'arrivee'); }
    if (ph.anim && ph.i === numeroAvant + 1) animer(ph.anim);
    numeroAvant = ph.i;
    if (jeu.vue === 'entrainement') apresDessinEnt();
    majListes();
  }
  // la pièce glisse de sa case de départ à sa case d'arrivée (et la tour quand on roque)
  function animer(deplacements) {
    Sons.pose(3);
    for (const [a, b] of deplacements) {
      const de = plateau.querySelector(`[data-case="${a}"]`), vers = plateau.querySelector(`[data-case="${b}"]`);
      const piece = vers && vers.querySelector('.piece-e');
      if (!de || !piece || !piece.animate) continue;
      const ra = de.getBoundingClientRect(), rb = vers.getBoundingClientRect();
      piece.style.zIndex = 5;
      piece.animate([{ transform: `translate(${ra.left - rb.left}px, ${ra.top - rb.top}px)` }, { transform: 'none' }],
        { duration: 320, easing: 'cubic-bezier(.3, .7, .3, 1)' }).onfinish = () => { piece.style.zIndex = ''; };
    }
  }
  const revoir = window.Revoir({ barre: $('navigation'), dessiner: dessinerPhoto, quandChange: () => { majListes(); if (jeu.vue === 'entrainement') reprendreEnt(); } });

  // ---------- Liste des coups (cliquable : on revoit la position) ----------
  function listeCoups(conteneur, san, nbVisibles, vue, { aVenir = false, li = false } = {}) {
    const morceaux = [];
    for (let i = 0; i < san.length; i++) {
      const numero = i % 2 === 0 ? `<span class="num">${i / 2 + 1}.</span>` : '';
      if (i < nbVisibles) morceaux.push(`${numero}<button type="button" class="coup${i + 1 === vue ? ' actuel' : ''}" data-vue="${i + 1}">${sanFr(san[i])}</button>`);
      else if (aVenir) morceaux.push(`${numero}<span class="coup a-venir" aria-label="${t('coup à jouer', 'move to play')}">…</span>`);
    }
    if (li) {
      // une ligne par coup complet (Blancs puis Noirs)
      const lignes = [];
      for (let i = 0; i < morceaux.length; i += 2) lignes.push(`<li>${morceaux[i]}${morceaux[i + 1] || ''}</li>`);
      conteneur.innerHTML = lignes.join('');
    } else conteneur.innerHTML = morceaux.join(' ');
  }
  function majListes() {
    if (jeu.vue === 'quiz' && jeu.ouverture) listeCoups($('liste-quiz'), jeu.ouverture.san, revoir.vue(), revoir.vue());
    if (jeu.vue === 'entrainement' && ent.o) listeCoups($('ent-coups'), ent.o.san, ent.k, revoir.vue(), { aVenir: true, li: true });
  }
  for (const id of ['liste-quiz', 'ent-coups']) {
    $(id).addEventListener('click', (e) => {
      const b = e.target.closest('button[data-vue]');
      if (b) revoir.aller(+b.dataset.vue);
    });
  }

  // ---------- Tirage ----------
  const duNiveau = () => OUVERTURES.filter(o => o.niveau === reglages.niveau);
  function piocher() {
    if (!jeu.pioche.length) jeu.pioche = melanger(duNiveau().map(o => o.id)).filter(id => id !== jeu.dernier);
    jeu.dernier = jeu.pioche.pop();
    return PAR_ID[jeu.dernier];
  }
  // trois autres noms du même niveau ; aux niveaux moyen et expert, de préférence des ouvertures qui commencent
  // pareil (sinon le premier coup suffirait à répondre)
  function propositions(o) {
    const autres = OUVERTURES.filter(x => x.niveau === o.niveau && x.id !== o.id && nomDe(x) !== nomDe(o));
    const proches = o.niveau === 'facile' ? [] : melanger(autres.filter(x => x.san[0] === o.san[0])).slice(0, 2);
    const reste = melanger(autres.filter(x => !proches.includes(x))).slice(0, 3 - proches.length);
    return melanger([o, ...proches, ...reste]);
  }

  // ---------- Une question ----------
  function poserQuestion(o) {
    jeu.ouverture = o;
    jeu.repondu = false;
    jeu.question++;
    defi.chronoLance = false;
    jeu.choix = propositions(o);
    jeu.orientation = 'blanc';
    $('reponses').innerHTML = jeu.choix.map((x, i) =>
      `<button type="button" class="choix-ouv" data-i="${i}"><span class="num-choix" aria-hidden="true">${i + 1}</span><span>${nomDe(x)}</span></button>`).join('');
    $('reponses').hidden = false;
    $('retour').hidden = true;
    const q = $('question');
    q.classList.remove('nouvelle'); void q.offsetWidth; q.classList.add('nouvelle');
    annotations.effacer();
    lancerAnimation();
  }
  // les coups se jouent tout seuls depuis la position de départ
  function lancerAnimation() {
    const q = jeu.question, p = jeu.partie;
    revoir.arreter();
    numeroAvant = -1;
    revoir.photos(photosDe(jeu.ouverture));
    plusTard(() => {
      if (q !== jeu.question || jeu.vue !== 'quiz') return;
      revoir.lire(VITESSE, () => { if (q === jeu.question && p === jeu.partie) animationFinie(); });
    }, 600);
  }
  // le défi chrono démarre quand les coups ont fini de se jouer (ou quand on interrompt l'animation)
  function animationFinie() {
    if (jeu.mode === 'defi' && defi.chrono && !jeu.repondu && !defi.chronoLance) { defi.chronoLance = true; demarrerChrono(); }
  }

  // ---------- Réponse ----------
  const ICONE_JUSTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const ICONE_FAUX = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';
  // i : numéro de la proposition, ou null quand le temps est écoulé
  function repondre(i) {
    if (jeu.repondu || !jeu.ouverture || jeu.vue !== 'quiz') return;
    jeu.repondu = true;
    arreterChrono();
    const o = jeu.ouverture;
    const choisi = i === null ? null : jeu.choix[i];
    const juste = choisi === o;
    $('verdict').innerHTML = (juste ? ICONE_JUSTE : ICONE_FAUX) +
      `<span>${i === null ? t('Temps écoulé !', 'Time\'s up!') : juste ? t('Bravo !', 'Well done!') : t('Raté !', 'Missed!')}</span>`;
    $('retour-nom').textContent = nomDe(o);
    $('retour-choix').hidden = juste || !choisi;
    if (choisi && !juste) $('retour-choix').textContent = t(`Tu as répondu : ${nomDe(choisi)}.`, `You answered: ${nomDe(choisi)}.`);
    $('explication').textContent = EN ? o.resume_en : o.resume;
    $('btn-savoir').href = `fiche.html?o=${o.id}`;
    const retour = $('retour');
    retour.classList.toggle('juste', juste);
    retour.classList.toggle('faux', !juste);
    $('reponses').hidden = true;
    retour.hidden = false;
    if (juste) Sons.bravo(); else Sons.echec();
    $('btn-suivant').firstChild.textContent = t('Suivant ', 'Next ');
    if (jeu.mode === 'libre') {
      jeu.total++;
      if (juste) jeu.justes++;
      $('score-libre').textContent = `${jeu.justes} / ${jeu.total}`;
    } else {
      defi.resultats.push({ ok: juste, nom: nomDe(o), temps: (performance.now() - defi.debut) / 1000 });
      majPoints();
      if (defi.numero === NB_DEFIS - 1) $('btn-suivant').firstChild.textContent = t('Voir le résultat ', 'See the result ');
    }
    $('btn-suivant').focus({ preventScroll: true });
  }
  $('reponses').addEventListener('click', (e) => { const b = e.target.closest('.choix-ouv'); if (b) repondre(+b.dataset.i); });

  function suivant() {
    if (!jeu.repondu) return;
    if (jeu.mode === 'libre') { poserQuestion(piocher()); return; }
    defi.numero++;
    if (defi.numero >= NB_DEFIS) { montrerResultats(); return; }
    lancerQuestionDefi();
  }

  // ---------- Défis ----------
  function construirePoints() {
    $('points').innerHTML = Array.from({ length: NB_DEFIS }, (_, i) => `<li aria-label="${t('Ouverture', 'Opening')} ${i + 1}"></li>`).join('');
  }
  function majPoints() {
    $('points').querySelectorAll('li').forEach((li, i) => {
      const r = defi.resultats[i];
      li.className = r ? (r.ok ? 'ok' : 'rate') : (i === defi.numero ? 'actuel' : '');
    });
  }
  function lancerQuestionDefi() {
    $('titre').textContent = t(`Ouverture ${defi.numero + 1} sur ${NB_DEFIS}`, `Opening ${defi.numero + 1} of ${NB_DEFIS}`);
    arreterChrono();
    $('minuteur-barre').style.transform = 'scaleX(1)';
    poserQuestion(defi.liste[defi.numero]);
    majPoints();
    defi.debut = performance.now();
  }
  function demarrerChrono() {
    arreterChrono();
    const barre = $('minuteur-barre');
    defi.fin = performance.now() + DUREE * 1000;
    defi.dernierTic = 0;
    const p = jeu.partie;
    const boucle = (tps) => {
      if (p !== jeu.partie || jeu.repondu) return;
      const reste = Math.max(0, defi.fin - tps) / 1000;
      barre.style.transform = `scaleX(${(reste / DUREE).toFixed(4)})`;
      document.body.classList.toggle('presse', reste <= 5);
      const s = Math.ceil(reste);
      if (reste <= 5 && s > 0 && s !== defi.dernierTic) { defi.dernierTic = s; Sons.tic(); }
      if (reste <= 0) { repondre(null); return; }
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
      `<li class="${r.ok ? 'ok' : 'rate'}" style="animation-delay:${700 + i * 70}ms" title="${r.nom}" aria-label="${r.nom}${t(' : ', ': ')}${r.ok ? t('réussie', 'right') : t('ratée', 'wrong')}">` +
      `<span class="res-rond">${r.ok ? ICONES.ok : ICONES.rate}</span><span class="res-t">${i + 1}</span></li>`).join('');
    $('res-temps').textContent = t('Temps total : ', 'Total time: ') + formaterDuree(defi.resultats.reduce((s, r) => s + r.temps, 0));
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
    revoir.arreter();
    $('resultats').hidden = true;
    $('pluie').innerHTML = '';
    jeu.mode = mode;
    document.body.dataset.mode = mode;
    montrerVue('quiz');
  }
  function lancerLibre() {
    preparer('libre');
    document.body.dataset.chrono = 'non';
    $('titre').textContent = t('Quiz des ouvertures', 'Openings quiz');
    jeu.justes = 0; jeu.total = 0;
    $('score-libre').textContent = '0 / 0';
    poserQuestion(piocher());
  }
  function lancerDefi(chrono) {
    fermerChoix();
    preparer('defi');
    defi.chrono = chrono;
    document.body.dataset.chrono = chrono ? 'oui' : 'non';
    defi.liste = melanger(duNiveau()).slice(0, NB_DEFIS);
    defi.numero = 0;
    defi.resultats = [];
    construirePoints();
    lancerQuestionDefi();
  }
  function montrerVue(vue) {
    jeu.vue = vue;
    document.body.dataset.vue = vue;
  }

  // =====================================================================================================
  // Rejouer l'ouverture : le joueur joue les coups d'un camp (ou des deux), l'ordinateur joue les autres
  // =====================================================================================================
  const CAMPS = ['blanc', 'noir', 'deux'];
  const ent = { o: null, camp: CAMPS.includes(lire('echecs.ouvertures.camp', '')) ? lire('echecs.ouvertures.camp', '') : 'blanc', k: 0, selection: null, indice: 0, erreurs: 0, aides: 0, jeton: 0, ordi: 0 };
  const traitDe = (k) => (k % 2 === 0 ? 'blanc' : 'noir');
  const aMoi = (k) => ent.camp === 'deux' || traitDe(k) === ent.camp;
  const fini = () => ent.k >= ent.o.san.length;
  const peutJouer = () => jeu.vue === 'entrainement' && ent.o && !fini() && aMoi(ent.k) && revoir.enDirect() && !revoir.lecture();
  const couleurSur = (c) => { const p = Echiquier.lireFen(ent.o.fens[ent.k])[c]; return p ? p.couleur : null; };

  function ouvrirEntrainement(o) {
    jeu.partie++;
    arreterChrono();
    revoir.arreter();
    ent.o = o;
    montrerVue('entrainement');
    $('titre').textContent = t('Rejoue l\'ouverture', 'Replay the opening');
    $('ent-nom').textContent = nomDe(o);
    $('btn-savoir-ent').href = `fiche.html?o=${o.id}`;
    majCamp();
    recommencerEnt();
  }
  function recommencerEnt() {
    ent.jeton++;
    ent.k = 0; ent.selection = null; ent.indice = 0; ent.erreurs = 0; ent.aides = 0; ent.ordi = 0;
    jeu.orientation = ent.camp === 'noir' ? 'noir' : 'blanc';
    annotations.effacer();
    const depart = { fen: ent.o.fens[0], i: 0, anim: null };
    revoir.depart(depart);
    numeroAvant = -1;
    dessinerPhoto(depart);
    etape();
  }
  function message(texte, classe = '') {
    const m = $('ent-message');
    m.textContent = texte;
    m.className = 'message-ent ' + classe;
  }
  // à qui de jouer ?
  function etape() {
    majIndice();
    majListes();
    if (fini()) {
      const bilan = ent.erreurs || ent.aides
        ? t(` (${ent.erreurs} erreur${ent.erreurs > 1 ? 's' : ''}, ${ent.aides} indice${ent.aides > 1 ? 's' : ''})`, ` (${ent.erreurs} mistake${ent.erreurs === 1 ? '' : 's'}, ${ent.aides} hint${ent.aides === 1 ? '' : 's'})`)
        : t(' sans aucune erreur !', ' without a single mistake!');
      message(t('Bravo, tu as rejoué toute l\'ouverture', 'Well done, you replayed the whole opening') + bilan, 'reussi');
      Sons.bravo();
      return;
    }
    const camp = traitDe(ent.k) === 'blanc' ? t('des Blancs', 'for White') : t('des Noirs', 'for Black');
    if (aMoi(ent.k)) { message(t(`À toi : joue le coup ${camp}.`, `Your turn: play the move ${camp}.`)); return; }
    message(t(`L'ordinateur joue le coup ${camp}…`, `The computer plays the move ${camp}…`));
    programmerOrdi();
  }
  function programmerOrdi() {
    const j = ent.jeton, k = ent.k;
    clearTimeout(ent.ordi);
    ent.ordi = setTimeout(() => {
      ent.ordi = 0;
      if (j !== ent.jeton || k !== ent.k || jeu.vue !== 'entrainement') return;
      // si on est en train de revoir un coup passé, l'ordinateur attend qu'on revienne au dernier coup
      if (!revoir.enDirect()) return;
      jouerCoupEnt(true);
    }, 700);
  }
  // revenu au dernier coup : si c'était à l'ordinateur, il joue
  function reprendreEnt() {
    if (!ent.o || fini() || aMoi(ent.k) || ent.ordi || !revoir.enDirect()) { majIndice(); return; }
    programmerOrdi();
  }
  function jouerCoupEnt(anime) {
    const k = ent.k;
    ent.k++;
    ent.selection = null;
    ent.indice = 0;
    annotations.effacer();
    const ph = { fen: ent.o.fens[k + 1], i: k + 1, anim: ent.o.coups[k] };
    revoir.ajouter(ph);
    if (!anime) { numeroAvant = k + 1; Sons.pose(3); } // pièce posée à la main : pas d'animation
    dessinerPhoto(ph);
    etape();
  }
  // après chaque dessin de l'échiquier : la pièce choisie, l'indice, la solution
  function apresDessinEnt() {
    if (!ent.o || !revoir.enDirect() || fini()) return;
    if (ent.selection) Echiquier.marquer(plateau, [ent.selection], 'choisie');
    const [a, b] = ent.o.coups[ent.k][0];
    if (ent.indice >= 1) Echiquier.marquer(plateau, [a], 'indice');
    if (ent.indice >= 2) Echiquier.dessinerAnnotations(plateau, [[a + b, 'suite']]);
  }
  function selectionner(c) {
    ent.selection = c;
    Echiquier.effacer(plateau, 'choisie');
    if (c) Echiquier.marquer(plateau, [c], 'choisie');
  }
  // le joueur essaie un coup : c'est celui de l'ouverture ?
  function tenter(de, vers, glisse) {
    if (!peutJouer()) return;
    const attendu = ent.o.coups[ent.k];
    const [a, b] = attendu[0];
    // en roquant, on peut aussi poser le roi sur sa tour
    const ok = de === a && (vers === b || (attendu.length > 1 && vers === attendu[1][0]));
    if (ok) { jouerCoupEnt(!glisse); return; }
    ent.erreurs++;
    selectionner(null);
    Sons.refus();
    message(t('Ce n\'est pas le coup de l\'ouverture. Essaie encore !', 'That\'s not the move of the opening. Try again!'), 'erreur');
    plateau.classList.remove('secoue'); void plateau.offsetWidth; plateau.classList.add('secoue');
  }
  plateau.addEventListener('click', (e) => {
    if (jeu.vue !== 'entrainement' || !ent.o) return;
    const el = e.target.closest('.case-e');
    if (!el) return;
    if (!revoir.enDirect() && !fini()) { message(t('Tu revois un coup passé : reviens au dernier coup (⏭) pour continuer.', 'You are looking at an earlier move: go back to the last move (⏭) to continue.')); return; }
    if (!peutJouer()) return;
    const c = el.dataset.case;
    // roque : le roi choisi, puis sa tour (c'est permis, comme en posant le roi deux cases plus loin)
    const attendu = ent.o.coups[ent.k];
    const roque = attendu.length > 1 && ent.selection === attendu[0][0] && c === attendu[1][0];
    if (!roque && couleurSur(c) === traitDe(ent.k)) { selectionner(c === ent.selection ? null : c); return; }
    if (ent.selection) tenter(ent.selection, c, false);
  });
  window.Glisser({
    plateau,
    prendre: (c) => peutJouer() && couleurSur(c) === traitDe(ent.k),
    demarrer: (c) => selectionner(c),
    lacher: (de, vers) => tenter(de, vers, true),
  });

  // Indice (la pièce à jouer), puis Solution (une flèche pour le coup)
  function majIndice() {
    const b = $('btn-indice');
    b.classList.toggle('solution', ent.indice >= 1);
    $('btn-indice-texte').textContent = ent.indice >= 1 ? t('Solution', 'Solution') : t('Indice', 'Hint');
    b.disabled = !peutJouer() || ent.indice >= 2;
  }
  $('btn-indice').addEventListener('click', () => {
    if (!peutJouer() || ent.indice >= 2) return;
    if (ent.indice === 0) ent.aides++;
    ent.indice++;
    const [a, b] = ent.o.coups[ent.k][0];
    if (ent.indice === 1) {
      Echiquier.marquer(plateau, [a], 'indice');
      message(t('Indice : c\'est cette pièce qu\'il faut jouer.', 'Hint: this is the piece to move.'));
    } else {
      Echiquier.dessinerAnnotations(plateau, [[a + b, 'suite']]);
      message(t(`Solution : ${sanFr(ent.o.san[ent.k])}. Joue-le sur l'échiquier !`, `Solution: ${ent.o.san[ent.k]}. Play it on the board!`));
    }
    majIndice();
  });
  function majCamp() {
    document.querySelectorAll('#reg-camp button').forEach(b => b.setAttribute('aria-pressed', b.dataset.camp === ent.camp ? 'true' : 'false'));
  }
  document.querySelectorAll('#reg-camp button').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.camp === ent.camp) return;
    ent.camp = b.dataset.camp;
    ecrire('echecs.ouvertures.camp', ent.camp);
    majCamp();
    if (ent.o) recommencerEnt();
  }));
  $('btn-recommencer').addEventListener('click', recommencerEnt);
  $('btn-retour-quiz').addEventListener('click', () => { clearTimeout(ent.ordi); ent.jeton++; lancerLibre(); });
  $('btn-rejouer-ouv').addEventListener('click', () => { if (jeu.ouverture) ouvrirEntrainement(jeu.ouverture); });
  window.addEventListener('resize', () => { if (jeu.vue === 'entrainement' && ent.indice >= 2 && revoir.enDirect()) apresDessinEnt(); });

  // ---------- Branchements ----------
  $('btn-suivant').addEventListener('click', suivant);
  $('btn-animation').addEventListener('click', () => { if (jeu.ouverture && jeu.vue === 'quiz') lancerAnimation(); });
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!$('choix-defi').hidden || !$('resultats').hidden) {
      if (e.key === 'Escape' && !$('choix-defi').hidden) fermerChoix();
      return;
    }
    if (jeu.vue !== 'quiz') return;
    if (/^[1-4]$/.test(e.key)) repondre(+e.key - 1);
    else if (e.key === 'Enter' && jeu.repondu && document.activeElement === document.body) suivant();
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

  // niveau
  const boutonsNiveau = document.querySelectorAll('#reg-niveau button');
  const majNiveau = () => boutonsNiveau.forEach(b => b.setAttribute('aria-pressed', b.dataset.niveau === reglages.niveau ? 'true' : 'false'));
  boutonsNiveau.forEach(b => b.addEventListener('click', () => {
    if (b.dataset.niveau === reglages.niveau) return;
    reglages.niveau = b.dataset.niveau;
    ecrire('echecs.ouvertures.niveau', reglages.niveau);
    majNiveau();
    jeu.pioche = [];
    if (jeu.mode === 'libre' && jeu.vue === 'quiz') poserQuestion(piocher());
  }));

  brancherBoutonTheme($('btn-theme'));
  brancherReglages($('btn-reglages'), $('panneau-reglages'));
  const appliquer = () => document.body.classList.toggle('sans-coordonnees', !reglages.coordonnees);
  brancherInterrupteur($('reg-coordonnees'), reglages.coordonnees, (v) => { reglages.coordonnees = v; Prefs.ecrire('echecs.ouvertures.coordonnees', v); appliquer(); });
  brancherInterrupteur($('reg-son'), Sons.actif, (v) => { Sons.actif = v; });

  // ---------- Démarrage ----------
  window.Echecs.injecterSprite();
  appliquer();
  majNiveau();
  // depuis une fiche : index.html?rejouer=<ouverture> ouvre directement « Rejouer l'ouverture »
  const demande = new URLSearchParams(location.search).get('rejouer');
  if (demande && PAR_ID[demande]) {
    jeu.mode = 'libre';
    document.body.dataset.mode = 'libre';
    jeu.ouverture = PAR_ID[demande];
    ouvrirEntrainement(PAR_ID[demande]);
  } else lancerLibre();

  // pour les tests
  window.Ouvertures = { etat: () => jeu, ent: () => ent, repondre, ouvrirEntrainement, OUVERTURES };
})();
