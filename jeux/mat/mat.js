/* Mat ou pas mat ?
   Une position s'affiche : le camp qui a le trait est-il échec et mat ?
   Avec le réglage « pat », les positions de pat s'ajoutent et ont leur propre bouton.
   Modes : libre (positions à la suite), défi (10 positions), défi chrono (20 s par position).
   Les positions et leurs explications viennent de positions.js (vérifiées avec chess.js). */
(function () {
  const { Prefs, brancherBoutonTheme, brancherReglages, brancherInterrupteur } = window.Commun;
  const { lancerPluie, compterJusqua, formaterDuree, allumerEtoiles, ICONES } = window.UI;
  const Sons = window.Sons;
  const POSITIONS = window.POSITIONS_MAT;
  const $ = (id) => document.getElementById(id);
  const plateau = $('echiquier');

  const NB_DEFIS = 10;
  const DUREE = 20;

  const reglages = {
    coordonnees: Prefs.lire('echecs.mat.coordonnees', true),
    echec: Prefs.lire('echecs.mat.echec', false),
    pat: Prefs.lire('echecs.mat.pat', false),
  };
  // sans le réglage « pat », les positions de pat ne sortent jamais
  const disponibles = () => POSITIONS.filter(p => reglages.pat || !p.pat);
  // 'mat', 'pat' ou 'rien'
  const bonneReponse = (p) => (p.mat ? 'mat' : p.pat && reglages.pat ? 'pat' : 'rien');

  const jeu = { mode: 'libre', position: null, repondu: false, pioche: [], justes: 0, total: 0, partie: 0 };
  const defi = { chrono: false, liste: [], numero: 0, resultats: [], debut: 0, fin: 0, raf: 0, dernierTic: 0 };
  const plusTard = (fn, ms) => { const p = jeu.partie; return setTimeout(() => { if (p === jeu.partie) fn(); }, ms); };

  // ---------- Tirage des positions ----------
  function melanger(t) {
    const a = [...t];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  // mode libre : on passe toutes les positions avant de les revoir
  function piocher() {
    if (!jeu.pioche.length) jeu.pioche = melanger(POSITIONS.map((_, i) => i).filter(i => reglages.pat || !POSITIONS[i].pat)).filter(i => i !== jeu.dernier);
    jeu.dernier = jeu.pioche.pop();
    return POSITIONS[jeu.dernier];
  }
  // défi : 10 positions, entre 4 et 6 mats pour ne pas pouvoir deviner (et 1 ou 2 pats avec le réglage)
  function tirerDefi() {
    const liste = disponibles();
    const mats = melanger(liste.filter(p => p.mat));
    const pats = melanger(liste.filter(p => p.pat));
    const autres = melanger(liste.filter(p => !p.mat && !p.pat));
    const nbMats = 4 + Math.floor(Math.random() * 3);
    const nbPats = reglages.pat ? 1 + Math.floor(Math.random() * 2) : 0;
    return melanger([...mats.slice(0, nbMats), ...pats.slice(0, nbPats), ...autres.slice(0, NB_DEFIS - nbMats - nbPats)]);
  }

  // ---------- Affichage d'une position ----------
  function afficher(position) {
    jeu.position = position;
    jeu.repondu = false;
    Echiquier.dessiner(plateau, position.fen);
    if (reglages.echec && position.echec) Echiquier.marquer(plateau, [position.roi], 'roi-attaque');
    const blancs = position.trait === 'blanc';
    // le roi de la question et des boutons est celui du camp concerné
    document.querySelectorAll('#roi-question, .roi-rep').forEach(u => u.setAttribute('href', `#piece-roi-${position.trait}`));
    const camp = blancs ? 'Les Blancs' : 'Les Noirs';
    $('question-texte').textContent = reglages.pat ? `${camp} sont‑ils mat ou pat ?` : `${camp} sont‑ils échec et mat ?`;
    const q = $('question');
    q.classList.remove('nouvelle'); void q.offsetWidth; q.classList.add('nouvelle');
    $('reponses').hidden = false;
    $('retour').hidden = true;
  }

  // ---------- Réponse ----------
  const ICONE_JUSTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const ICONE_FAUX = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';

  // choix : 'mat', 'pat', 'rien', ou null quand le temps est écoulé
  function repondre(choix) {
    if (jeu.repondu || !jeu.position) return;
    if (choix === 'pat' && !reglages.pat) return;
    jeu.repondu = true;
    const p = jeu.position;
    const juste = choix === bonneReponse(p);
    const tempsEcoule = choix === null;
    montrerExplication(p, juste, tempsEcoule);
    if (juste) Sons.juste(); else Sons.echec();

    if (jeu.mode === 'libre') {
      jeu.total++;
      if (juste) jeu.justes++;
      $('score-libre').textContent = `${jeu.justes} / ${jeu.total}`;
      return;
    }
    arreterChrono();
    defi.resultats.push({ ok: juste, reponse: bonneReponse(p), motif: p.motif, temps: (performance.now() - defi.debut) / 1000 });
    majPoints();
    if (defi.numero === NB_DEFIS - 1) $('btn-suivant').firstChild.textContent = 'Voir le résultat ';
  }

  function montrerExplication(p, juste, tempsEcoule) {
    const verdict = { mat: 'C\'est échec et mat.', pat: 'C\'est pat.', rien: reglages.pat ? 'Ni mat, ni pat.' : 'Ce n\'est pas mat.' }[bonneReponse(p)];
    $('verdict').innerHTML = (juste ? ICONE_JUSTE : ICONE_FAUX) +
      `<span>${tempsEcoule ? 'Temps écoulé ! ' : juste ? 'Bravo ! ' : 'Raté ! '}${verdict}</span>`;
    $('motif').textContent = p.motif;
    $('explication').textContent = p.explication;
    const lien = $('lien-partie');
    lien.hidden = !p.lien;
    if (p.lien) lien.href = p.lien;
    const retour = $('retour');
    retour.classList.toggle('juste', juste);
    retour.classList.toggle('faux', !juste);
    $('reponses').hidden = true;
    retour.hidden = false;
    // on montre pourquoi sur l'échiquier
    Echiquier.effacer(plateau, 'roi-attaque', 'attaquant', 'depart', 'arrivee');
    if (p.echec) Echiquier.marquer(plateau, [p.roi], 'roi-attaque');
    Echiquier.marquer(plateau, p.attaquants, 'attaquant');
    if (p.coup) { Echiquier.marquer(plateau, [p.coup[0]], 'depart'); Echiquier.marquer(plateau, [p.coup[1]], 'arrivee'); }
    $('btn-suivant').firstChild.textContent = 'Suivant ';
    $('btn-suivant').focus({ preventScroll: true });
  }

  function suivant() {
    if (!jeu.repondu) return;
    if (jeu.mode === 'libre') { afficher(piocher()); return; }
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
    $('titre').textContent = `Position ${defi.numero + 1} sur ${NB_DEFIS}`;
    afficher(defi.liste[defi.numero]);
    majPoints();
    defi.debut = performance.now();
    if (defi.chrono) demarrerChrono();
  }

  function demarrerChrono() {
    arreterChrono();
    const barre = $('minuteur-barre');
    defi.fin = performance.now() + DUREE * 1000;
    defi.dernierTic = 0;
    const p = jeu.partie;
    const boucle = (t) => {
      if (p !== jeu.partie || jeu.repondu) return;
      const reste = Math.max(0, defi.fin - t) / 1000;
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
    $('res-titre').textContent = score === NB_DEFIS ? 'Parfait !' : score >= 7 ? 'Bravo !' : score >= 4 ? 'Bien joué !' : 'Continue, tu progresses !';
    allumerEtoiles($('etoiles'), etoiles);
    $('res-liste').innerHTML = defi.resultats.map((r, i) =>
      `<li class="${r.ok ? 'ok' : 'rate'}" style="animation-delay:${700 + i * 70}ms" aria-label="Position ${i + 1} (${r.motif}) : ${r.ok ? 'réussie' : 'ratée'}">` +
      `<span class="res-rond">${r.ok ? ICONES.ok : ICONES.rate}</span><span class="res-t">${{ mat: 'Mat', pat: 'Pat', rien: 'Pas mat' }[r.reponse]}</span></li>`).join('');
    const total = defi.resultats.reduce((s, r) => s + r.temps, 0);
    $('res-temps').textContent = `Temps total : ${formaterDuree(total)}`;
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
    $('titre').textContent = 'Mat ou pas mat ?';
    jeu.justes = 0; jeu.total = 0;
    $('score-libre').textContent = '0 / 0';
    afficher(piocher());
  }
  function lancerDefi(chrono) {
    fermerChoix();
    preparer('defi');
    defi.chrono = chrono;
    document.body.dataset.chrono = chrono ? 'oui' : 'non';
    defi.liste = tirerDefi();
    defi.numero = 0;
    defi.resultats = [];
    $('minuteur-barre').style.transform = 'scaleX(1)';
    construirePoints();
    lancerPosition();
  }

  // ---------- Branchements ----------
  $('rep-mat').addEventListener('click', () => repondre('mat'));
  $('rep-pas-mat').addEventListener('click', () => repondre('rien'));
  $('rep-pat').addEventListener('click', () => repondre('pat'));
  $('btn-suivant').addEventListener('click', suivant);
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!$('choix-defi').hidden || !$('resultats').hidden) {
      if (e.key === 'Escape' && !$('choix-defi').hidden) fermerChoix();
      return;
    }
    const k = e.key.toLowerCase();
    if (k === 'm') repondre('mat');
    else if (k === 'p') repondre('rien');
    else if (k === 't') repondre('pat');
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

  brancherBoutonTheme($('btn-theme'));
  brancherReglages($('btn-reglages'), $('panneau-reglages'));
  const appliquer = () => document.body.classList.toggle('sans-coordonnees', !reglages.coordonnees);
  brancherInterrupteur($('reg-coordonnees'), reglages.coordonnees, (v) => { reglages.coordonnees = v; Prefs.ecrire('echecs.mat.coordonnees', v); appliquer(); });
  brancherInterrupteur($('reg-echec'), reglages.echec, (v) => {
    reglages.echec = v; Prefs.ecrire('echecs.mat.echec', v);
    if (!jeu.repondu && jeu.position) afficher(jeu.position);
  });
  // réglage « pat » : troisième bouton, positions de pat dans la pioche
  function appliquerPat() {
    document.body.classList.toggle('avec-pat', reglages.pat);
    $('rep-pat').hidden = !reglages.pat;
    $('rep-pas-mat-texte').textContent = reglages.pat ? 'Ni l\'un ni l\'autre' : 'Pas mat';
  }
  brancherInterrupteur($('reg-pat'), reglages.pat, (v) => {
    reglages.pat = v; Prefs.ecrire('echecs.mat.pat', v);
    appliquerPat();
    jeu.pioche = [];
    if (jeu.repondu || !jeu.position) return;
    // une position de pat disparaît si on coupe le réglage (en libre) ; sinon on met juste la question à jour
    if (jeu.mode === 'libre' && jeu.position.pat && !v) afficher(piocher());
    else afficher(jeu.position);
  });
  brancherInterrupteur($('reg-son'), Sons.actif, (v) => { Sons.actif = v; });

  // ---------- Démarrage ----------
  window.Echecs.injecterSprite();
  appliquer();
  appliquerPat();
  lancerLibre();
})();
