/* Outils communs à toutes les pages : préférences, thème clair/sombre, panneau de réglages.
   À charger dans le <head> pour appliquer le thème choisi avant l'affichage. */
(function () {
  const Prefs = {
    lire(cle, defaut = true) {
      try { const v = localStorage.getItem(cle); return v === null ? defaut : v === 'oui'; }
      catch (e) { return defaut; }
    },
    ecrire(cle, valeur) {
      try { localStorage.setItem(cle, valeur ? 'oui' : 'non'); } catch (e) { /* stockage indisponible */ }
    },
  };

  // ---------- Langue : les pages anglaises (dossier en/) ont lang="en" ----------
  const racine = document.documentElement;
  const EN = racine.lang === 'en';
  const t = (fr, en) => (EN ? en : fr);

  // ---------- Thème ----------
  const requeteSombre = window.matchMedia('(prefers-color-scheme: dark)');
  try {
    const t = localStorage.getItem('echecs.theme');
    if (t === 'dark' || t === 'light') racine.setAttribute('data-theme', t);
  } catch (e) { /* rien */ }

  // ---------- Couleur de l'échiquier (réglage de la page d'accueil, pour tout le site) ----------
  const PLATEAUX = ['vert', 'bleu', 'rouge', 'bois'];
  function appliquerPlateau(nom) {
    if (nom && nom !== 'vert' && PLATEAUX.includes(nom)) racine.setAttribute('data-plateau', nom);
    else racine.removeAttribute('data-plateau');
  }
  try { appliquerPlateau(localStorage.getItem('echecs.plateau')); } catch (e) { /* rien */ }
  const plateauActuel = () => racine.getAttribute('data-plateau') || 'vert';
  function choisirPlateau(nom) {
    appliquerPlateau(nom);
    try { localStorage.setItem('echecs.plateau', plateauActuel()); } catch (e) { /* rien */ }
  }
  // boutons <button data-plateau="bleu"> d'un groupe : aria-pressed sur celui choisi
  function brancherPlateau(groupe) {
    const boutons = groupe.querySelectorAll('button[data-plateau]');
    const maj = () => boutons.forEach(b => b.setAttribute('aria-pressed', b.dataset.plateau === plateauActuel() ? 'true' : 'false'));
    boutons.forEach(b => b.addEventListener('click', () => { choisirPlateau(b.dataset.plateau); maj(); }));
    maj();
  }

  function themeEffectif() {
    const t = racine.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
    return requeteSombre.matches ? 'dark' : 'light';
  }

  function brancherBoutonTheme(bouton) {
    if (!bouton) return; // (le thème se choisit dans les réglages de la page d'accueil)
    const maj = () => {
      const sombre = themeEffectif() === 'dark';
      const label = sombre ? t('Passer en mode clair', 'Switch to light mode') : t('Passer en mode sombre', 'Switch to dark mode');
      bouton.dataset.theme = sombre ? 'dark' : 'light';
      bouton.setAttribute('aria-label', label);
      bouton.title = label;
    };
    bouton.addEventListener('click', () => {
      const t = themeEffectif() === 'dark' ? 'light' : 'dark';
      racine.setAttribute('data-theme', t);
      try { localStorage.setItem('echecs.theme', t); } catch (e) { /* rien */ }
      maj();
    });
    requeteSombre.addEventListener?.('change', maj);
    new MutationObserver(maj).observe(racine, { attributes: true, attributeFilter: ['data-theme'] });
    maj();
  }

  // le choix du thème dans les réglages de l'accueil : boutons data-theme-choix="auto" | "light" | "dark"
  function brancherTheme(groupe) {
    if (!groupe) return;
    const boutons = groupe.querySelectorAll('[data-theme-choix]');
    const actuel = () => racine.getAttribute('data-theme') || 'auto';
    const maj = () => boutons.forEach((b) => b.setAttribute('aria-pressed', b.dataset.themeChoix === actuel() ? 'true' : 'false'));
    boutons.forEach((b) => b.addEventListener('click', () => {
      const v = b.dataset.themeChoix;
      if (v === 'auto') racine.removeAttribute('data-theme'); else racine.setAttribute('data-theme', v);
      try { if (v === 'auto') localStorage.removeItem('echecs.theme'); else localStorage.setItem('echecs.theme', v); } catch (e) { /* rien */ }
      maj();
    }));
    maj();
  }

  // ---------- Panneau de réglages (s'ouvre sous un bouton) ----------
  function brancherReglages(bouton, panneau) {
    if (!bouton || !panneau) return;
    const ouvrir = (oui) => {
      panneau.hidden = !oui;
      bouton.setAttribute('aria-expanded', oui ? 'true' : 'false');
    };
    bouton.addEventListener('click', (e) => { e.stopPropagation(); ouvrir(panneau.hidden); });
    document.addEventListener('click', (e) => {
      if (!panneau.hidden && !panneau.contains(e.target)) ouvrir(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panneau.hidden) { ouvrir(false); bouton.focus(); }
    });
    ouvrir(false);
  }

  // ---------- Interrupteur (bouton role="switch") ----------
  function brancherInterrupteur(el, valeur, quandChange) {
    el.setAttribute('role', 'switch');
    const maj = (v) => el.setAttribute('aria-checked', v ? 'true' : 'false');
    maj(valeur);
    el.addEventListener('click', () => {
      const v = el.getAttribute('aria-checked') !== 'true';
      maj(v);
      quandChange(v);
    });
    return { definir: maj };
  }

  // ---------- « Suivant » toujours à portée ----------
  // Après une réussite, on doit pouvoir passer à la suite sans faire défiler la page. Quand le bouton qui fait passer à
  // la suite (Suivant, Partie suivante, Continuer) est affiché mais hors de l'écran (sous l'explication, sur un
  // téléphone), une copie de ce bouton flotte en bas de l'écran ; elle disparaît dès que le vrai bouton est visible.
  const SUIVANTS = ['#btn-suivant:not(.outil)', '#btn-suivante', '#btn-continuer'];
  function suivantToujoursVisible() {
    let copie = null, source = null, attente = 0;
    const affiche = (el) => el.getClientRects().length > 0 && !el.disabled;
    const hors = (el) => { const r = el.getBoundingClientRect(); return r.bottom > window.innerHeight - 4 || r.top < 0; };
    const fenetreOuverte = () => [...document.querySelectorAll('.voile')].some((v) => !v.hidden && v.getClientRects().length);
    function maj() {
      attente = 0;
      const el = SUIVANTS.map((sel) => document.querySelector(sel)).find((b) => b && affiche(b));
      const montrer = !!el && hors(el) && !fenetreOuverte();
      if (!montrer) { if (copie) copie.hidden = true; return; }
      if (!copie) {
        copie = document.createElement('button');
        copie.type = 'button';
        copie.className = 'bouton-principal suivant-flottant';
        copie.addEventListener('click', () => { if (source) source.click(); });
        document.body.appendChild(copie);
      }
      source = el;
      if (copie.innerHTML !== el.innerHTML) copie.innerHTML = el.innerHTML;
      copie.hidden = false;
    }
    const plusTard = () => { if (!attente) attente = requestAnimationFrame(maj); };
    new MutationObserver(plusTard).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'class', 'disabled'] });
    window.addEventListener('scroll', plusTard, { passive: true });
    window.addEventListener('resize', plusTard);
    plusTard();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', suivantToujoursVisible);
  else suivantToujoursVisible();

  // ---------- Les choix au-dessus de l'échiquier, sur une seule ligne ----------
  // Dans un <div class="choix-jeu" data-une-ligne>, si les groupes de boutons (.choix-ligne) ne tiennent pas sur une
  // ligne, les plus larges se replient un à un : un groupe replié ne montre que le choix en cours (et une petite
  // flèche) ; le toucher ouvre un menu avec tous les choix, par-dessus la page. Le jeu, lui, ne voit que des boutons.
  function choixSurUneLigne() {
    document.querySelectorAll('.choix-jeu[data-une-ligne]').forEach((zone) => {
      const groupes = [...zone.querySelectorAll(':scope > .choix-ligne')];
      let ouvert = null, place = null;
      const visibles = () => groupes.filter((g) => g.getClientRects().length);
      const tientSurUneLigne = () => {
        const v = visibles();
        // tous sur la même ligne, aucun qui déborde, et aucun groupe qui passe lui-même à la ligne (plus haut que les autres)
        const surUneLigne = (g) => { const b = [...g.querySelectorAll('button')].find((x) => x.getClientRects().length); return !b || g.getBoundingClientRect().height < b.getBoundingClientRect().height * 1.6; };
        return v.every((g) => Math.abs(g.offsetTop - v[0].offsetTop) < 4) && zone.scrollWidth <= zone.clientWidth + 1 && v.every(surUneLigne);
      };
      function fermer() {
        if (!ouvert) return;
        ouvert.classList.remove('ouvert');
        ouvert.style.left = ouvert.style.top = ouvert.style.maxWidth = '';
        if (place) place.remove();
        ouvert = place = null;
      }
      function ouvrir(g) {
        fermer();
        const r = g.getBoundingClientRect(), z = zone.getBoundingClientRect();
        place = document.createElement('span');
        place.className = 'choix-place';
        place.style.width = r.width + 'px';
        place.style.height = r.height + 'px';
        g.before(place);
        g.classList.add('ouvert');
        g.style.maxWidth = Math.min(window.innerWidth - 24, 420) + 'px';
        // le menu s'ouvre sous le choix, sans sortir de l'écran
        const largeur = g.getBoundingClientRect().width;
        const gauche = Math.max(12 - z.left, Math.min(r.left - z.left, window.innerWidth - 12 - z.left - largeur));
        g.style.left = gauche + 'px';
        g.style.top = (r.top - z.top) + 'px';
        ouvert = g;
      }
      function ajuster() {
        fermer();
        groupes.forEach((g) => g.classList.remove('replie'));
        if (tientSurUneLigne()) return;
        // les plus larges d'abord
        const parTaille = visibles().sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width);
        for (const g of parTaille) {
          g.classList.add('replie');
          if (tientSurUneLigne()) break;
        }
      }
      groupes.forEach((g) => {
        // groupe replié et fermé : le toucher ouvre le menu (le jeu ne reçoit pas ce clic)
        g.addEventListener('click', (e) => {
          if (!g.classList.contains('replie')) return;
          if (g !== ouvert) { e.stopImmediatePropagation(); e.preventDefault(); ouvrir(g); return; }
          // un choix dans le menu : le jeu le reçoit, puis le menu se referme
          setTimeout(fermer, 0);
        }, true);
      });
      document.addEventListener('click', (e) => { if (ouvert && !ouvert.contains(e.target)) fermer(); });
      document.addEventListener('keydown', (e) => { if (ouvert && e.key === 'Escape') fermer(); });
      window.addEventListener('resize', ajuster);
      // (un groupe peut apparaître ou disparaître : mode libre ou défi, réglé par une classe du <body>)
      new MutationObserver(() => { if (!ouvert) requestAnimationFrame(ajuster); }).observe(document.body, { attributes: true, attributeFilter: ['class', 'data-mode'] });
      ajuster();
      document.fonts?.ready.then(ajuster);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', choixSurUneLigne);
  else choixSurUneLigne();

  // ---------- Sur un téléphone, le jeu tient dans l'écran ----------
  // Si la page dépasse de l'écran, l'échiquier (ou l'illustration : l'élément [data-ajuste] de la page) rétrécit
  // juste ce qu'il faut, sans descendre sous 210 px. Réglé au chargement, quand l'écran change de taille et quand le
  // mode change (libre, défi) ; pas pendant le jeu (une explication qui s'ajoute après une réponse ne le fait pas
  // rétrécir : le bouton « Suivant » reste à portée, voir plus haut).
  function ajusterAuTelephone() {
    const el = document.querySelector('[data-ajuste]');
    if (!el) return;
    let attente = 0;
    function ajuster() {
      attente = 0;
      el.style.maxWidth = '';
      if (window.innerWidth > 760 || !el.getClientRects().length) return;
      // (trois passes au plus : la page ne rétrécit pas toujours d'autant que l'échiquier)
      for (let i = 0; i < 3; i++) {
        const trop = document.documentElement.scrollHeight - window.innerHeight;
        if (trop <= 0) return;
        // (la largeur du contenu : sans les marges intérieures, si l'élément en a)
        const st = getComputedStyle(el), largeur = parseFloat(st.width);
        const contenu = st.boxSizing === 'border-box' ? largeur : largeur;
        if (el.getBoundingClientRect().width <= 210) return;
        el.style.maxWidth = Math.max(st.boxSizing === 'border-box' ? 210 : 190, Math.floor(contenu - trop - 1)) + 'px';
      }
    }
    const plusTard = () => { if (!attente) attente = requestAnimationFrame(ajuster); };
    // seulement quand la largeur change (rotation, fenêtre) : sur téléphone, la barre d'adresse qui apparaît ou disparaît
    // change la hauteur à tout moment, et une explication affichée sous l'échiquier ferait alors rétrécir l'échiquier
    let largeur = window.innerWidth;
    window.addEventListener('resize', () => { if (window.innerWidth !== largeur) { largeur = window.innerWidth; plusTard(); } });
    // l'échiquier peut n'apparaître qu'après un choix (le champion, dans « Joue le coup ») : on règle quand il apparaît
    let visible = false;
    if (window.ResizeObserver) new ResizeObserver(() => {
      const v = el.getClientRects().length > 0;
      if (v && !visible) plusTard();
      visible = v;
    }).observe(el);
    new MutationObserver(plusTard).observe(document.body, { attributes: true, attributeFilter: ['data-mode'] });
    document.fonts?.ready.then(plusTard);
    window.addEventListener('load', plusTard);
    plusTard();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ajusterAuTelephone);
  else ajusterAuTelephone();

  window.Commun = { EN, t, Prefs, PLATEAUX, choisirPlateau, brancherPlateau, themeEffectif, brancherBoutonTheme, brancherTheme, brancherReglages, brancherInterrupteur };
})();
