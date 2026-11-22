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

  window.Commun = { EN, t, Prefs, PLATEAUX, choisirPlateau, brancherPlateau, themeEffectif, brancherBoutonTheme, brancherTheme, brancherReglages, brancherInterrupteur };
})();
