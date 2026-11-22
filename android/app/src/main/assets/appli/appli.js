/* Ajouté par l'application Android dans le <head> de chaque page du site (voir MainActivity.java).
   - window.speechSynthesis et SpeechSynthesisUtterance : la synthèse vocale du navigateur n'existe pas dans une
     WebView ; on la remplace par la voix du téléphone (pont window.EchecsAndroid), avec la même interface.
   - La couleur du fond de la page est transmise à l'application, pour les barres du système (thème clair ou sombre).
   - Le bouton « EN » / « FR » change de langue dans l'application (sans le marquer comme lien externe). */
(function () {
  const pont = window.EchecsAndroid;
  if (!pont) return;
  document.documentElement.classList.add('appli-android');

  // ---------- La voix ----------
  if (!('speechSynthesis' in window)) {
    let numero = 0;
    const enCours = new Map();
    class Enonce {
      constructor(texte) { this.text = texte || ''; this.lang = ''; this.rate = 1; this.voice = null; this.onstart = this.onend = this.onerror = null; }
    }
    class Parole extends EventTarget {
      getVoices() {
        try { return JSON.parse(pont.voix()).map((v) => ({ lang: v.lang, name: v.name, voiceURI: v.name, localService: true, default: false })); }
        catch (e) { return []; }
      }
      speak(u) {
        const id = 'v' + (++numero);
        enCours.set(id, u);
        if (u.onstart) u.onstart({ type: 'start' });
        pont.parler(id, u.text, (u.voice && u.voice.lang) || u.lang || document.documentElement.lang, u.rate || 1);
      }
      cancel() {
        pont.arreter();
        for (const [id, u] of enCours) { enCours.delete(id); if (u.onend) u.onend({ type: 'end' }); }
      }
      pause() { } resume() { }
      get speaking() { return enCours.size > 0; }
      get pending() { return false; }
    }
    const parole = new Parole();
    window.speechSynthesis = parole;
    window.SpeechSynthesisUtterance = Enonce;
    window.__voixPretes = () => {
      const e = new Event('voiceschanged');
      parole.dispatchEvent(e);
      if (typeof parole.onvoiceschanged === 'function') parole.onvoiceschanged(e);
    };
    window.__voixFin = (id) => {
      const u = enCours.get(id);
      enCours.delete(id);
      if (u && u.onend) u.onend({ type: 'end' });
    };
  }

  // ---------- La couleur du fond, pour les barres du système ----------
  function envoyerFond() {
    if (!document.body) return;
    const m = getComputedStyle(document.body).backgroundColor.match(/\d+(\.\d+)?/g);
    if (!m || m.length < 3) return;
    const [r, g, b] = m.map(Number);
    const hex = '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
    pont.fond(hex, (r * 299 + g * 587 + b * 114) / 1000 < 128);
  }
  // (le fond change en douceur, en 0,25 s : on le relit une fois la transition finie)
  const apresTransition = () => { envoyerFond(); setTimeout(envoyerFond, 350); };
  document.addEventListener('DOMContentLoaded', () => {
    envoyerFond();
    new MutationObserver(apresTransition).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', apresTransition);
  });
  window.addEventListener('pageshow', envoyerFond);
})();
