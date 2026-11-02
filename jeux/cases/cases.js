/* Trouve la case
   Une coordonnée s'affiche au-dessus de l'échiquier : il faut cliquer sur la bonne case.
   Modes : libre (autant d'essais qu'on veut),
           défi (10 cases, un seul essai chacune),
           défi chrono (le plus de cases possible en 20 secondes). */
(function () {
  const { Prefs, brancherBoutonTheme, brancherReglages, brancherInterrupteur } = window.Commun;
  const { lancerPluie, compterJusqua, formaterDuree, allumerEtoiles, ICONES, reduireMouvement } = window.UI;
  const Sons = window.Sons;
  const TP = window.ToutPetits;

  const COLONNES = 'abcdefgh';
  const NB_DEFIS = 10;
  const DUREE_CHRONO = 20;
  const $ = (id) => document.getElementById(id);
  const hasard = (n) => Math.floor(Math.random() * n);

  // ---------- Préférences ----------
  const ORIENTATIONS = ['blanc', 'noir', 'hasard'];
  function lireOrientation(cle) {
    try { const v = localStorage.getItem(cle); return ORIENTATIONS.includes(v) ? v : 'blanc'; } catch (e) { return 'blanc'; }
  }
  function ecrireTexte(cle, v) { try { localStorage.setItem(cle, v); } catch (e) { /* rien */ } }

  const reglages = {
    coordonnees: Prefs.lire('echecs.cases.coordonnees', true),
    survol: Prefs.lire('echecs.cases.survol', false),
    toutPetits: Prefs.lire('echecs.cases.tout-petits', false),
    orientation: lireOrientation('echecs.cases.orientation'),           // mode libre
    orientationDefi: lireOrientation('echecs.cases.orientation-defi'),  // défis
  };

  // ---------- État ----------
  const jeu = {
    mode: 'libre',     // 'libre' | 'defi'
    cote: null,        // 'blanc' | 'noir' : orientation affichée
    cible: null,       // ex. 'c4'
    verrou: false,     // pendant une animation, les clics sont ignorés
    erreurs: 0,        // erreurs sur la cible actuelle (mode libre)
    trouvees: 0,
    partie: 0,         // change à chaque nouvelle partie (annule les minuteries en cours)
  };
  const defi = { chrono: false, numero: 0, resultats: [], debut: 0, fin: 0, raf: 0, score: 0, erreurs: 0, dernierTic: 0, fini: false };

  const optionOrientation = () => (jeu.mode === 'defi' ? reglages.orientationDefi : reglages.orientation);
  const tirerCote = () => {
    const o = optionOrientation();
    return o === 'hasard' ? (Math.random() < 0.5 ? 'blanc' : 'noir') : o;
  };
  const plusTard = (fn, ms) => { const p = jeu.partie; setTimeout(() => { if (p === jeu.partie) fn(); }, ms); };

  // ---------- Contenus (lettres ou animaux) ----------
  function nomVisuel(c) {
    if (!reglages.toutPetits) return c;
    return `${TP.animal(c[0])}${c}`;
  }
  function contenuEtiquette(v, type) {
    if (!reglages.toutPetits) return `<span>${v}</span>`;
    if (type === 'colonne') return `${TP.animal(v)}<span class="lettre">${v}</span>`;
    return `<span class="chiffre">${v}</span>${TP.mains(v)}`;
  }

  // ---------- Échiquier ----------
  function construire() {
    const cadre = $('cadre');
    const cols = jeu.cote === 'blanc' ? [...COLONNES] : [...COLONNES].reverse();
    const rangs = jeu.cote === 'blanc' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
    const morceaux = document.createDocumentFragment();
    const etiquette = (valeur, type, ligne, colonne) => {
      const d = document.createElement('div');
      const bord = ligne === 1 ? 'haut' : ligne === 10 ? 'bas' : colonne === 1 ? 'gauche' : 'droite';
      d.className = `etiquette ${type} ${bord}`;
      d.style.gridRow = ligne;
      d.style.gridColumn = colonne;
      d.setAttribute('aria-hidden', 'true');
      d.innerHTML = contenuEtiquette(valeur, type);
      morceaux.appendChild(d);
    };
    cols.forEach((l, j) => { etiquette(l, 'colonne', 1, j + 2); etiquette(l, 'colonne', 10, j + 2); });
    rangs.forEach((r, i) => { etiquette(r, 'rangee', i + 2, 1); etiquette(r, 'rangee', i + 2, 10); });
    rangs.forEach((r, i) => cols.forEach((l, j) => {
      const nom = l + r;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'case ' + ((COLONNES.indexOf(l) + r) % 2 ? 'foncee' : 'claire'); // a1 est une case foncée
      b.dataset.case = nom;
      b.style.gridRow = i + 2;
      b.style.gridColumn = j + 2;
      b.setAttribute('aria-label', `Case ${nom}`);
      b.innerHTML = `<span class="nom-case" aria-hidden="true">${nomVisuel(nom)}</span>`;
      b.addEventListener('click', () => cliquer(b));
      morceaux.appendChild(b);
    }));
    cadre.replaceChildren(morceaux);
    cadre.classList.toggle('cote-blanc', jeu.cote === 'blanc');
    cadre.classList.toggle('cote-noir', jeu.cote === 'noir');
    cadre.setAttribute('aria-label', `Échiquier vu du côté des ${jeu.cote === 'blanc' ? 'blancs' : 'noirs'}`);
  }

  function orienter(cote, animer) {
    if (cote === jeu.cote) return;
    jeu.cote = cote;
    construire();
    if (animer && !reduireMouvement()) relancer($('cadre'), 'retourne');
  }

  function relancer(el, classe) {
    el.classList.remove(classe);
    void el.offsetWidth;
    el.classList.add(classe);
  }

  const caseDe = (nom) => $('cadre').querySelector(`[data-case="${nom}"]`);
  function nettoyer() {
    $('cadre').querySelectorAll('.case').forEach(c => c.classList.remove('juste', 'fausse', 'montre', 'indice'));
  }

  // ---------- Consigne ----------
  function afficherConsigne() {
    const c = $('consigne');
    const l = jeu.cible[0], r = +jeu.cible[1];
    c.className = `consigne cote-${jeu.cote}`;
    c.innerHTML = reglages.toutPetits
      ? `${TP.animal(l)}<span class="texte">${l}${r}</span>${TP.mains(r)}`
      : `<span class="texte">${l}${r}</span>`;
    c.setAttribute('aria-label', `Trouve la case ${jeu.cible}, côté ${jeu.cote === 'blanc' ? 'blancs' : 'noirs'}` +
      (reglages.toutPetits ? ` (${TP.ANIMAUX[l].nom} ${r})` : ''));
    if (!reduireMouvement()) relancer(c, 'nouvelle');
  }

  function nouvelleCible() {
    let c;
    do { c = COLONNES[hasard(8)] + (1 + hasard(8)); } while (c === jeu.cible);
    jeu.cible = c;
    jeu.erreurs = 0;
    jeu.verrou = false;
    const cote = tirerCote();
    if (cote !== jeu.cote) orienter(cote, jeu.cote !== null);
    else nettoyer();
    afficherConsigne();
  }

  // ---------- Clic sur une case ----------
  function marquer(el, classe, duree) {
    relancer(el, classe);
    if (duree) plusTard(() => el.classList.remove(classe), duree);
  }

  function cliquer(b) {
    if (jeu.verrou || defi.fini) return;
    const juste = b.dataset.case === jeu.cible;

    if (jeu.mode === 'libre') {
      if (juste) {
        jeu.verrou = true;
        marquer(b, 'juste');
        Sons.juste();
        jeu.trouvees++;
        $('trouvees').textContent = jeu.trouvees;
        plusTard(nouvelleCible, 600);
      } else {
        marquer(b, 'fausse', 1100);
        Sons.refus();
        jeu.erreurs++;
        if (jeu.erreurs >= 2) caseDe(jeu.cible).classList.add('indice');
      }
      return;
    }

    if (!defi.chrono) {
      // défi : un seul essai par case
      jeu.verrou = true;
      defi.resultats.push({ cible: jeu.cible, ok: juste, temps: (performance.now() - defi.debut) / 1000 });
      if (juste) { marquer(b, 'juste'); Sons.juste(); }
      else { marquer(b, 'fausse'); caseDe(jeu.cible).classList.add('montre'); Sons.echec(); }
      majPoints();
      plusTard(() => {
        defi.numero++;
        if (defi.numero >= NB_DEFIS) montrerResultats();
        else { nouvelleCible(); majTitre(); majPoints(); defi.debut = performance.now(); }
      }, juste ? 700 : 1600);
      return;
    }

    // défi chrono : on enchaîne le plus vite possible
    if (juste) {
      jeu.verrou = true;
      marquer(b, 'juste');
      Sons.juste();
      defi.score++;
      $('compteur').textContent = defi.score;
      plusTard(() => { if (!defi.fini) nouvelleCible(); }, 220);
    } else {
      marquer(b, 'fausse', 700);
      Sons.refus();
      defi.erreurs++;
    }
  }

  // ---------- Défis ----------
  function majTitre() {
    $('titre').textContent = jeu.mode === 'libre' ? 'Trouve la case'
      : defi.chrono ? 'Défi chrono' : `Case ${defi.numero + 1} sur ${NB_DEFIS}`;
  }
  function construirePoints() {
    $('points').innerHTML = Array.from({ length: NB_DEFIS }, (_, i) => `<li aria-label="Case ${i + 1}"></li>`).join('');
  }
  function majPoints() {
    $('points').querySelectorAll('li').forEach((li, i) => {
      const r = defi.resultats[i];
      li.className = r ? (r.ok ? 'ok' : 'rate') : (i === defi.numero ? 'actuel' : '');
    });
  }

  function demarrerChrono() {
    const barre = $('minuteur-barre');
    defi.fin = performance.now() + DUREE_CHRONO * 1000;
    defi.dernierTic = 0;
    const p = jeu.partie;
    const boucle = (t) => {
      if (p !== jeu.partie) return;
      const reste = Math.max(0, defi.fin - t) / 1000;
      barre.style.transform = `scaleX(${(reste / DUREE_CHRONO).toFixed(4)})`;
      document.body.classList.toggle('presse', reste <= 5);
      const s = Math.ceil(reste);
      if (reste <= 5 && s > 0 && s !== defi.dernierTic) { defi.dernierTic = s; Sons.tic(); }
      if (reste <= 0) { montrerResultats(); return; }
      defi.raf = requestAnimationFrame(boucle);
    };
    defi.raf = requestAnimationFrame(boucle);
  }
  function arreterChrono() {
    cancelAnimationFrame(defi.raf);
    document.body.classList.remove('presse');
  }

  function montrerResultats() {
    defi.fini = true;
    jeu.verrou = true;
    arreterChrono();
    let score, etoiles, titre;
    const liste = $('res-liste');
    const record = $('res-record');

    if (defi.chrono) {
      score = defi.score;
      etoiles = score >= 12 ? 3 : score >= 8 ? 2 : score >= 4 ? 1 : 0;
      titre = score >= 12 ? 'Incroyable !' : score >= 8 ? 'Bravo !' : score >= 4 ? 'Bien joué !' : 'Essaie encore !';
      $('res-sur').textContent = score > 1 ? 'cases' : 'case';
      liste.hidden = true;
      const cle = `echecs.cases.record.${reglages.orientationDefi}`;
      let ancien = 0;
      try { ancien = +localStorage.getItem(cle) || 0; } catch (e) { /* rien */ }
      const nouveau = score > ancien;
      if (nouveau) ecrireTexte(cle, String(score));
      record.hidden = false;
      record.classList.toggle('nouveau', nouveau && score > 0);
      record.textContent = nouveau && score > 0 ? 'Nouveau record !' : `Record : ${ancien}`;
      $('res-temps').textContent = `${defi.erreurs} erreur${defi.erreurs > 1 ? 's' : ''} en ${DUREE_CHRONO} secondes`;
    } else {
      score = defi.resultats.filter(r => r.ok).length;
      etoiles = score === NB_DEFIS ? 3 : score >= 7 ? 2 : score >= 4 ? 1 : 0;
      titre = score === NB_DEFIS ? 'Parfait !' : score >= 7 ? 'Bravo !' : score >= 4 ? 'Bien joué !' : 'Continue, tu progresses !';
      $('res-sur').textContent = `/ ${NB_DEFIS}`;
      liste.hidden = false;
      record.hidden = true;
      liste.innerHTML = defi.resultats.map((r, i) =>
        `<li class="${r.ok ? 'ok' : 'rate'}" style="animation-delay:${700 + i * 70}ms" aria-label="${r.cible} : ${r.ok ? 'trouvée' : 'ratée'}">` +
        `<span class="res-rond">${r.ok ? ICONES.ok : ICONES.rate}</span><span class="res-case">${nomVisuel(r.cible)}</span></li>`).join('');
      const total = defi.resultats.reduce((s, r) => s + r.temps, 0);
      $('res-temps').textContent = `Temps total : ${formaterDuree(total)}`;
    }

    $('res-titre').textContent = titre;
    allumerEtoiles($('etoiles'), etoiles);
    $('resultats').hidden = false;
    $('btn-rejouer').focus({ preventScroll: true });
    compterJusqua($('res-score'), score);
    lancerPluie($('pluie'), etoiles >= 1 ? 70 : 30);
    Sons.victoire();
  }

  // ---------- Changement de mode ----------
  function preparer(mode) {
    jeu.partie++;
    arreterChrono();
    $('resultats').hidden = true;
    $('pluie').innerHTML = '';
    jeu.mode = mode;
    jeu.verrou = false;
    defi.fini = false;
    document.body.dataset.mode = mode;
    appliquerReglages();
  }

  function lancerLibre() {
    preparer('libre');
    document.body.dataset.chrono = 'non';
    jeu.trouvees = 0;
    $('trouvees').textContent = '0';
    majTitre();
    nouvelleCible();
  }

  function lancerDefi(chrono) {
    fermerChoix();
    preparer('defi');
    defi.chrono = chrono;
    document.body.dataset.chrono = chrono ? 'oui' : 'non';
    defi.numero = 0;
    defi.resultats = [];
    defi.score = 0;
    defi.erreurs = 0;
    $('compteur').textContent = '0';
    $('minuteur-barre').style.transform = 'scaleX(1)';
    construirePoints();
    majTitre();
    nouvelleCible();
    majPoints();
    defi.debut = performance.now();
    if (chrono) demarrerChrono();
  }

  // ---------- Réglages ----------
  function appliquerReglages() {
    document.body.classList.toggle('sans-coordonnees', !reglages.coordonnees);
    document.body.classList.toggle('survol', reglages.survol);
    document.body.classList.toggle('tout-petits', reglages.toutPetits);
  }

  function brancherCamps(groupe, valeur, quandChange) {
    const boutons = [...groupe.querySelectorAll('button[data-orientation]')];
    const maj = (v) => boutons.forEach(b => b.setAttribute('aria-pressed', b.dataset.orientation === v ? 'true' : 'false'));
    maj(valeur);
    boutons.forEach(b => b.addEventListener('click', () => { maj(b.dataset.orientation); quandChange(b.dataset.orientation); }));
  }

  brancherBoutonTheme($('btn-theme'));
  brancherReglages($('btn-reglages'), $('panneau-reglages'));
  brancherInterrupteur($('reg-coordonnees'), reglages.coordonnees, (v) => {
    reglages.coordonnees = v; Prefs.ecrire('echecs.cases.coordonnees', v); appliquerReglages();
  });
  brancherInterrupteur($('reg-survol'), reglages.survol, (v) => {
    reglages.survol = v; Prefs.ecrire('echecs.cases.survol', v); appliquerReglages();
  });
  brancherInterrupteur($('reg-tout-petits'), reglages.toutPetits, (v) => {
    reglages.toutPetits = v; Prefs.ecrire('echecs.cases.tout-petits', v); appliquerReglages();
    construire(); afficherConsigne();
  });
  brancherInterrupteur($('reg-son'), Sons.actif, (v) => { Sons.actif = v; });
  brancherCamps($('reg-orientation'), reglages.orientation, (v) => {
    reglages.orientation = v; ecrireTexte('echecs.cases.orientation', v);
    if (jeu.mode === 'libre' && v !== 'hasard') { orienter(v, true); afficherConsigne(); }
  });
  brancherCamps($('choix-orientation'), reglages.orientationDefi, (v) => {
    reglages.orientationDefi = v; ecrireTexte('echecs.cases.orientation-defi', v);
  });

  // ---------- Fenêtre de choix du défi ----------
  function ouvrirChoix() { $('choix-defi').hidden = false; $('mode-defi').focus({ preventScroll: true }); }
  function fermerChoix() { $('choix-defi').hidden = true; }
  $('btn-defis').addEventListener('click', ouvrirChoix);
  $('btn-fermer-choix').addEventListener('click', () => { fermerChoix(); $('btn-defis').focus(); });
  $('choix-defi').addEventListener('click', (e) => { if (e.target === e.currentTarget) fermerChoix(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('choix-defi').hidden) fermerChoix(); });
  $('mode-defi').addEventListener('click', () => lancerDefi(false));
  $('mode-chrono').addEventListener('click', () => lancerDefi(true));
  $('btn-retour').addEventListener('click', lancerLibre);
  $('btn-menu').addEventListener('click', lancerLibre);
  $('btn-rejouer').addEventListener('click', () => lancerDefi(defi.chrono));

  // ---------- Démarrage : mode libre, côté blancs par défaut ----------
  TP.injecterSprite();
  lancerLibre();
})();
