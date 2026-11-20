/* Pom', le coach du site : une pièce d'échecs avec une pomme pour tête, qui accompagne les jeux et réagit.
   Son dessin et ses animations sont dans js/pom-moteur.js (fabriqué à partir de l'atelier outils/pom/), chargé après
   la page pour ne pas la ralentir.

   Dans les jeux, Pom' se place tout seul :
   - sur un grand écran, il se tient dans la marge, en bas à gauche, flotte doucement, dit bonjour, s'endort quand on
     ne joue plus depuis un moment et se réveille dès qu'on revient ;
   - sur un écran plus étroit (téléphone, tablette), il surgit en bas à gauche le temps de réagir, puis repart.
   Il ne prend jamais les clics (on joue à travers lui) et passe devant la fenêtre des résultats.
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
  let mode = null;        // 'pose' (dans la marge), 'surgit' (le temps de réagir) ou 'accueil'
  let cacher = 0, dodo = 0, derniereActivite = Date.now();

  // ---------- Couleur : noir sur fond clair, blanc en mode sombre ----------
  function themeSombre() {
    const t = racine.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  const peindre = () => moteur && moteur.peindre(themeSombre() ? 'blanc' : 'noir');

  // ---------- Placement dans les jeux ----------
  // la marge libre à gauche du jeu (le <main class="ecran"> est centré)
  function margeLibre() {
    const main = document.querySelector('main.ecran');
    if (!main) return 0;
    const r = main.getBoundingClientRect();
    return r.left + parseFloat(getComputedStyle(main).paddingLeft || 0);
  }
  function placer() {
    if (!boite || mode === 'accueil') return;
    const marge = margeLibre();
    // le dessin fait 900 × 1300 unités ; le corps de Pom' (340 unités de large) se tient au milieu
    if (marge >= 92 && window.innerHeight >= 560) {
      const h = Math.min(300, marge * 2.3);
      mode = 'pose';
      boite.style.height = h + 'px';
      boite.style.left = (marge / 2 - h * 900 / 1300 / 2) + 'px';
    } else {
      mode = 'surgit';
      boite.style.height = '';
      boite.style.left = '';
    }
    boite.dataset.mode = mode;
    if (mode === 'pose') { boite.classList.add('visible'); moteur.demarrer(); }
    else if (!moteur.enCours) { boite.classList.remove('visible'); moteur.arreter(); }
  }

  // ---------- Jouer une animation ----------
  function jouer(nom, suite) {
    if (!moteur || !nom) return;
    clearTimeout(cacher);
    if (mode === 'surgit') { boite.classList.add('visible'); moteur.demarrer(); }
    moteur.jouer(nom, suite);
  }
  // quand une animation se termine : sur un écran étroit, il repart
  function quandChange(nom) {
    document.dispatchEvent(new CustomEvent('pom-change', { detail: nom }));
    if (nom || mode !== 'surgit') return;
    clearTimeout(cacher);
    cacher = setTimeout(() => {
      if (moteur.enCours) return;
      boite.classList.remove('visible');
      setTimeout(() => { if (!moteur.enCours && mode === 'surgit') moteur.arreter(); }, 500);
    }, 350);
  }
  const niveauEnCours = () => (moteur && moteur.enCours ? moteur.NIVEAUX[moteur.enCours] || 0 : 0);
  const erreurEnCours = () => !!(moteur && moteur.enCours && moteur.ERREURS.includes(moteur.enCours));

  // une réussite : si une réussite au moins aussi belle est déjà en cours, on la laisse finir (défi chrono : les
  // bonnes réponses s'enchaînent vite) ; forcer : la fin d'une partie ou d'un défi passe avant tout
  function bravo(niveau, forcer) {
    if (!forcer && niveauEnCours() >= niveau) return;
    jouer(moteur.auHasard(niveau));
  }
  function oups() {
    if (erreurEnCours()) return;
    jouer(moteur.auHasard());
  }

  // ---------- Il s'endort quand on ne joue plus (grand écran) ----------
  function activite() {
    derniereActivite = Date.now();
    if (moteur && (moteur.enCours === 'endort' || moteur.enCours === 'dort')) jouer('reveil');
  }
  function surveillerSommeil() {
    clearInterval(dodo);
    dodo = setInterval(() => {
      if (!moteur || mode === 'surgit' || moteur.enCours || document.hidden) return;
      if (Date.now() - derniereActivite > 90000) jouer('endort', ['dort']);
    }, 5000);
    ['pointerdown', 'keydown', 'wheel'].forEach((t) => window.addEventListener(t, activite, { passive: true, capture: true }));
  }

  // ---------- Style ----------
  const STYLE = `
    .pom-compagnon { position: fixed; z-index: 60; left: 0; bottom: 0; height: 190px; aspect-ratio: 900 / 1300;
      pointer-events: none; opacity: 0; transform: translateY(60%); transition: opacity .3s, transform .45s cubic-bezier(.2, 1.3, .4, 1); }
    .pom-compagnon[data-mode="surgit"] { left: -12px; bottom: env(safe-area-inset-bottom, 0px); }
    .pom-compagnon.visible { opacity: 1; transform: none; }
    .pom-compagnon .pom-svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .pom-compagnon .pom-svg #pom-ombre, #pom-accueil .pom-svg #pom-ombre { fill: rgba(0, 0, 0, .14); }
    .pom-compagnon .pom-svg *, #pom-accueil .pom-svg * { pointer-events: none; }
    @media (max-width: 560px) { .pom-compagnon { height: 180px; } }`;

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
      surveillerSommeil();
      // bonjour ! (sur un grand écran, en arrivant dans le jeu ; il entre par le bord gauche, le plus proche)
      if (mode === 'pose' && !reduit.matches && !enAttente) setTimeout(() => { if (!moteur.enCours) jouer('bonjourGauche'); }, 700);
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
    etoiles: (n) => quandPret(() => { if (n >= 1) bravo(Math.min(3, n), true); else { serie = 0; jouer(moteur.auHasard()); } })(),
    resultat: (n) => quandPret(() => (n >= 1 ? bravo(Math.min(3, n), true) : jouer('pouce')))(),
    hmm: quandPret(() => jouer('reflechit')),
    eureka: quandPret(() => jouer('eureka')),
    jouer: (nom, suite) => quandPret(() => jouer(nom, suite))(),
    auHasard: (niveau) => (moteur ? moteur.auHasard(niveau) : null),
    t: (fr, en) => (EN ? en : fr),
  };

  if (document.readyState === 'complete') demarrer();
  else window.addEventListener('load', demarrer);
})();
