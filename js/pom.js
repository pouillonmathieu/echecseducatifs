/* Pom', le coach du site : une pièce d'échecs avec une pomme pour tête, qui accompagne les jeux et réagit.
   Son dessin et ses animations sont dans js/pom-moteur.js (fabriqué à partir de l'atelier outils/pom/), chargé après
   la page pour ne pas la ralentir.

   Dans les jeux, Pom' se place tout seul :
   - sur un écran assez large, il se tient à gauche de l'échiquier, flotte doucement, dit bonjour, réagit à chaque
     réponse, s'endort quand on ne joue plus depuis un moment et se réveille dès qu'on revient ; il passe devant la
     fenêtre des résultats ;
   - sur un écran plus étroit (téléphone, tablette en hauteur), il surgit au milieu de l'échiquier le temps d'une
     petite réaction à chaque réponse (il s'efface dès qu'on touche l'écran) ; à la fin d'une partie ou d'un défi, il
     apparaît dans la fenêtre des résultats, sous les étoiles.
   Il ne prend jamais les clics (on joue à travers lui).
   Sur la page d'accueil, il est le personnage principal : il prend la place de l'élément #pom-accueil, et on peut le toucher.

   Les jeux l'appellent ainsi :
     Pom.bonneReponse()  une bonne réponse (1 étoile ; une série de 5 bonnes réponses : 2 étoiles, de 10 : 3 étoiles)
     Pom.erreur()        une erreur (la série repart de zéro)
     Pom.etoiles(n)      une partie gagnée avec n étoiles (1 à 3) ; 0 : perdue
     Pom.resultat(n)     la fin d'un défi, avec n étoiles (0 à 3 ; à 0, il encourage)
     Pom.hmm() / Pom.eureka()   il réfléchit (un indice), il a trouvé (la solution)
   Le réglage « Pom' » de la page d'accueil (clé echecs.pom) le retire des jeux. */
(function () {
  const EN = document.documentElement.lang === 'en';
  const racine = document.documentElement;
  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)');
  const script = document.currentScript;
  const SRC_MOTEUR = script ? script.src.replace(/pom\.js(\?|$)/, 'pom-moteur.js$1') : 'pom-moteur.js';

  let present = true;
  try { present = localStorage.getItem('echecs.pom') !== 'non'; } catch (e) { /* stockage indisponible */ }

  let moteur = null;      // le moteur, une fois chargé
  let boite = null;       // l'élément qui contient le dessin
  let accueil = null;     // sur la page d'accueil : l'emplacement de Pom'
  let enAttente = null;   // ce qu'on lui a demandé avant qu'il soit prêt
  let serie = 0;          // les bonnes réponses d'affilée
  let mode = null;        // 'pose' (à côté de l'échiquier), 'fenetre' (dans la fenêtre des résultats) ou 'accueil'
  let dodo = 0, derniereActivite = Date.now();

  // ---------- Couleur : noir sur fond clair, blanc en mode sombre ----------
  function themeSombre() {
    const t = racine.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  const peindre = () => moteur && moteur.peindre(themeSombre() ? 'blanc' : 'noir');

  // ---------- Placement dans les jeux ----------
  // Sur un écran assez large, Pom' se tient à gauche de l'échiquier (ou de ce qui en tient lieu), les pieds au niveau
  // de son bas, aussi grand que la place le permet. Sinon (téléphone, tablette en hauteur), il n'apparaît que dans la
  // fenêtre des résultats, sous les étoiles.
  // Le dessin fait 900 × 1300 unités : le corps est centré en x = 510, ses bras au repos tiennent dans 430 unités de
  // large, et son ombre (ses pieds) est à y = 968, soit 1268 unités sous le haut du dessin.
  const ANCRES = ['#echiquier', '#cadre', '#balance', '.colonne-illus', '.ecran-des .milieu', '.jeu-mots', 'main.ecran'];
  const ECART = 14, HAUTEUR_MAX = 470, HAUTEUR_MIN = 200;
  function ancre() {
    for (const sel of ANCRES) {
      const a = document.querySelector(sel);
      if (a && a.getClientRects().length) return a;
    }
    return null;
  }
  function placer() {
    if (!boite || mode === 'accueil') return;
    const a = ancre();
    const r = a && a.getBoundingClientRect();
    // la place libre à gauche de l'ancre ; l'échelle du dessin (en pixels par unité)
    const libre = r ? r.left - ECART - 6 : 0;
    const e = Math.min(HAUTEUR_MAX / 1300, Math.max(r ? r.height : 0, 300) * 1.05 / 1268, libre / 430);
    if (r && 1300 * e >= HAUTEUR_MIN && window.innerHeight >= 560) {
      mode = 'pose';
      if (boite.parentNode !== document.body) document.body.appendChild(boite);
      const centre = r.left - ECART - 215 * e; // le milieu du corps
      boite.style.height = 1300 * e + 'px';
      boite.style.left = centre - 450 * e + 'px';
      boite.style.top = r.bottom - 1268 * e + 'px';
      boite.classList.add('visible');
      moteur.demarrer();
    } else {
      if (mode === 'pose' || !mode) { boite.classList.remove('visible'); moteur.arreter(); }
      mode = 'fenetre';
      if (boite.classList.contains('sur-tapis')) placerSurLeTapis();
      else boite.style.height = boite.style.left = boite.style.top = '';
    }
    boite.dataset.mode = mode;
  }

  // ---------- Dans la fenêtre des résultats (petit écran) ----------
  const visible = (el) => !!el && el.getClientRects().length > 0;
  let attenteFenetre = 0, surveillance = 0;
  // la fenêtre s'ouvre souvent un peu après la fin de la partie : on l'attend (1,5 s au plus)
  function dansLaFenetre(f) {
    clearInterval(attenteFenetre);
    let n = 0;
    const essayer = () => {
      const carte = [...document.querySelectorAll('.carte-resultats')].find(visible);
      if (!carte && ++n <= 15) return;
      clearInterval(attenteFenetre);
      if (!carte) { surLeTapis(f); return; } // pas de fenêtre (une partie d'un défi) : au milieu de l'échiquier
      cacherDuTapis(true);
      boite.classList.remove('sur-tapis');
      // sous les étoiles (ou, sans étoiles, avant le titre)
      const etoiles = [...carte.querySelectorAll('.etoiles')].find(visible);
      const titre = [...carte.querySelectorAll('.res-titre')].find(visible);
      if (etoiles) etoiles.after(boite);
      else if (titre) titre.before(boite);
      else carte.prepend(boite);
      boite.classList.add('visible');
      moteur.demarrer();
      f();
      // la fenêtre fermée, il s'arrête
      clearInterval(surveillance);
      surveillance = setInterval(() => { if (!visible(boite)) { moteur.arreter(); clearInterval(surveillance); } }, 1000);
    };
    attenteFenetre = setInterval(essayer, 100);
    essayer();
  }

  // ---------- Au milieu de l'échiquier (petit écran) : une petite réaction à chaque réponse ----------
  // Pom' surgit, centré sur l'échiquier, fait son animation et repart ; il s'efface dès qu'on touche l'écran, pour ne
  // jamais empêcher de voir le jeu.
  let finTapis = 0;
  function placerSurLeTapis() {
    const a = ancre();
    if (!a) return false;
    const r = a.getBoundingClientRect();
    // le corps (du haut de la croix aux pieds : 970 unités, son milieu à x = 510, y = 484) fait 70 % de l'échiquier
    const e = Math.min(r.width, r.height, window.innerHeight * .8) * .7 / 970;
    boite.style.height = 1300 * e + 'px';
    boite.style.left = r.left + r.width / 2 - 450 * e + 'px';
    boite.style.top = r.top + r.height / 2 - 784 * e + 'px';
    return true;
  }
  function surLeTapis(f) {
    clearTimeout(finTapis);
    if (boite.parentNode !== document.body) document.body.appendChild(boite);
    boite.classList.add('sur-tapis');
    if (!placerSurLeTapis()) { boite.classList.remove('sur-tapis'); return; }
    void boite.offsetWidth;
    boite.classList.add('visible');
    moteur.demarrer();
    f();
  }
  function cacherDuTapis(vite) {
    if (!boite || !boite.classList.contains('sur-tapis')) return;
    boite.classList.remove('visible');
    clearTimeout(finTapis);
    finTapis = setTimeout(() => {
      if (boite.classList.contains('visible')) return;
      boite.classList.remove('sur-tapis');
      boite.style.height = boite.style.left = boite.style.top = '';
      moteur.arreter();
    }, vite ? 0 : 350);
  }
  const surLeTapisVisible = () => !!boite && boite.classList.contains('sur-tapis') && boite.classList.contains('visible');

  // ---------- Jouer une animation ----------
  // fenetre : une réaction de fin de partie ou de défi, qui a sa place dans la fenêtre des résultats ; sur petit
  // écran, les autres réactions n'ont pas lieu
  function jouer(nom, suite, fenetre) {
    if (!moteur || !nom) return;
    if (mode === 'fenetre') {
      if (fenetre) dansLaFenetre(() => moteur.jouer(nom, suite));
      else surLeTapis(() => moteur.jouer(nom, suite));
      return;
    }
    moteur.jouer(nom, suite);
  }
  function quandChange(nom) {
    document.dispatchEvent(new CustomEvent('pom-change', { detail: nom }));
    if (!nom) cacherDuTapis(); // l'animation est finie : il repart de l'échiquier
  }
  // (sur l'échiquier, une animation qu'on a fait disparaître en touchant l'écran ne compte plus)
  const enCours = () => (moteur && moteur.enCours && (mode !== 'fenetre' || surLeTapisVisible() || !boite.classList.contains('sur-tapis')) ? moteur.enCours : null);
  const niveauEnCours = () => (enCours() ? moteur.NIVEAUX[enCours()] || 0 : 0);
  const erreurEnCours = () => !!(enCours() && moteur.ERREURS.includes(enCours()));

  // une réussite : si une réussite au moins aussi belle est déjà en cours, on la laisse finir (défi chrono : les
  // bonnes réponses s'enchaînent vite) ; forcer : la fin d'une partie ou d'un défi passe avant tout
  function bravo(niveau, forcer) {
    if (!forcer && niveauEnCours() >= niveau) return;
    jouer(moteur.auHasard(niveau), [], forcer);
  }
  function oups() {
    if (erreurEnCours()) return;
    jouer(moteur.auHasard());
  }

  // ---------- Il s'endort quand on ne joue plus (grand écran) ----------
  function activite(ev) {
    derniereActivite = Date.now();
    if (ev && ev.type !== 'wheel' && surLeTapisVisible()) cacherDuTapis();
    if (moteur && (moteur.enCours === 'endort' || moteur.enCours === 'dort')) jouer('reveil');
  }
  function surveillerSommeil() {
    clearInterval(dodo);
    dodo = setInterval(() => {
      if (!moteur || mode === 'fenetre' || moteur.enCours || document.hidden) return;
      if (Date.now() - derniereActivite > 90000) jouer('endort', ['dort']);
    }, 5000);
    ['pointerdown', 'keydown', 'wheel'].forEach((t) => window.addEventListener(t, activite, { passive: true, capture: true }));
  }

  // ---------- Style ----------
  const STYLE = `
    .pom-compagnon { position: fixed; z-index: 60; left: 0; top: 0; height: 300px; aspect-ratio: 900 / 1300;
      pointer-events: none; opacity: 0; transition: opacity .3s; }
    .pom-compagnon.visible { opacity: 1; }
    .pom-compagnon.sur-tapis { position: fixed; z-index: 40; margin: 0; transform: scale(.4) translateY(30%); transform-origin: 50% 70%;
      transition: opacity .25s, transform .4s cubic-bezier(.2, 1.4, .4, 1); }
    .pom-compagnon.sur-tapis.visible { transform: none; }
    .pom-compagnon[data-mode="fenetre"]:not(.sur-tapis) { position: relative; z-index: 2; flex: none; height: 170px; margin: -36px auto -12px; } /* (le haut du dessin est la place du chapeau lancé) */
    @media (max-height: 640px) { .pom-compagnon[data-mode="fenetre"]:not(.sur-tapis) { height: 130px; } }
    .pom-compagnon .pom-svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .pom-compagnon .pom-svg #pom-ombre, #pom-accueil .pom-svg #pom-ombre { fill: rgba(0, 0, 0, .14); }
    .pom-compagnon .pom-svg *, #pom-accueil .pom-svg * { pointer-events: none; }
`;

  // ---------- Chargement ----------
  function demarrer() {
    const st = document.createElement('style');
    st.textContent = STYLE;
    document.head.appendChild(st);
    accueil = document.getElementById('pom-accueil');
    if (!accueil && !present) return;
    const s = document.createElement('script');
    s.src = SRC_MOTEUR;
    s.onload = installer;
    document.head.appendChild(s);
  }
  function installer() {
    if (!window.creerPom || !window.POM_DESSIN) return;
    if (accueil) {
      boite = accueil;
      mode = 'accueil';
    } else {
      boite = document.createElement('div');
      boite.className = 'pom-compagnon';
      boite.setAttribute('aria-hidden', 'true');
      document.body.appendChild(boite);
    }
    boite.insertAdjacentHTML('beforeend', window.POM_DESSIN);
    moteur = window.creerPom(boite.querySelector('.pom-svg'), { quandChange });
    peindre();
    new MutationObserver(peindre).observe(racine, { attributes: true, attributeFilter: ['data-theme'] });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', peindre);
    if (mode === 'accueil') {
      moteur.demarrer();
      surveillerSommeil();
    } else {
      moteur.arreter();
      placer();
      window.addEventListener('resize', placer);
      // (il est fixe à l'écran, pour que ses étoiles ne fassent jamais défiler la page : il suit l'échiquier qui défile)
      window.addEventListener('scroll', () => { if (mode === 'pose') placer(); else if (surLeTapisVisible()) placerSurLeTapis(); }, { passive: true });
      // la page bouge (un panneau qui s'ouvre, l'échiquier qui se redimensionne) : il suit l'échiquier
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => placer());
        ro.observe(document.body);
        const a = ancre();
        if (a) ro.observe(a);
      }
      surveillerSommeil();
      // bonjour ! (sur un grand écran, en arrivant dans le jeu ; il entre par le bord gauche, le plus proche). Tout de
      // suite, avant la première image : on ne le voit pas debout avant qu'il arrive (et l'animation part sans fondu)
      if (mode === 'pose' && !reduit.matches && !enAttente) jouer('bonjourGauche');
    }
    if (enAttente) { const f = enAttente; enAttente = null; f(); }
    document.dispatchEvent(new CustomEvent('pom-pret'));
  }

  // chaque demande attend que Pom' soit prêt (seule la dernière compte) ; rien si on préfère moins d'animations
  const quandPret = (f) => () => {
    if (reduit.matches) return;
    if (moteur) f(); else enAttente = f;
  };

  window.Pom = {
    get present() { return present; },
    set present(v) {
      present = !!v;
      try { localStorage.setItem('echecs.pom', present ? 'oui' : 'non'); } catch (e) { /* rien */ }
    },
    get moteur() { return moteur; },
    bonneReponse: quandPret(() => { serie++; bravo(serie % 10 === 0 ? 3 : serie % 5 === 0 ? 2 : 1); }),
    erreur: quandPret(() => { serie = 0; oups(); }),
    etoiles: (n) => quandPret(() => { if (n >= 1) bravo(Math.min(3, n), true); else { serie = 0; jouer(moteur.auHasard(), [], true); } })(),
    resultat: (n) => quandPret(() => (n >= 1 ? bravo(Math.min(3, n), true) : jouer('pouce', [], true)))(),
    hmm: quandPret(() => jouer('reflechit')),
    eureka: quandPret(() => jouer('eureka')),
    jouer: (nom, suite) => quandPret(() => jouer(nom, suite))(),
    auHasard: (niveau) => (moteur ? moteur.auHasard(niveau) : null),
    t: (fr, en) => (EN ? en : fr),
  };

  if (document.readyState === 'complete') demarrer();
  else window.addEventListener('load', demarrer);
})();
