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

  // ---------- Thème ----------
  const racine = document.documentElement;
  const requeteSombre = window.matchMedia('(prefers-color-scheme: dark)');
  try {
    const t = localStorage.getItem('echecs.theme');
    if (t === 'dark' || t === 'light') racine.setAttribute('data-theme', t);
  } catch (e) { /* rien */ }

  function themeEffectif() {
    const t = racine.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
    return requeteSombre.matches ? 'dark' : 'light';
  }

  function brancherBoutonTheme(bouton) {
    const maj = () => {
      const sombre = themeEffectif() === 'dark';
      const label = sombre ? 'Passer en mode clair' : 'Passer en mode sombre';
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

  // ---------- Panneau de réglages (s'ouvre sous un bouton) ----------
  function brancherReglages(bouton, panneau) {
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

  window.Commun = { Prefs, themeEffectif, brancherBoutonTheme, brancherReglages, brancherInterrupteur };
})();
