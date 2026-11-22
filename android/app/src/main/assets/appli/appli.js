/* Ajouté par l'application Android dans le <head> de chaque page du site (voir MainActivity.java).
   - window.speechSynthesis et SpeechSynthesisUtterance : la synthèse vocale du navigateur n'existe pas dans une
     WebView ; on la remplace par la voix du téléphone (pont window.EchecsAndroid), avec la même interface.
   - window.SpeechRecognition : de même, la dictée du téléphone (pour « À l'aveugle »).
   - La couleur du fond de la page est transmise à l'application, pour les barres du système (thème clair ou sombre).
   - Le pied de page de l'accueil dit « Les réglages restent sur ce téléphone ». */
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

  // ---------- La dictée (« À l'aveugle ») ----------
  // La WebView n'a pas la reconnaissance vocale du navigateur : celle du téléphone la remplace (Dictee.java).
  let dicteePossible = false;
  try { dicteePossible = pont.dicteePossible && pont.dicteePossible(); } catch (e) { /* ancienne application */ }
  if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window) && dicteePossible) {
    let numero = 0;
    const ecoutes = new Map();
    class Reconnaissance {
      constructor() { this.lang = ''; this.maxAlternatives = 1; this.continuous = false; this.interimResults = false; this.onresult = this.onerror = this.onend = this.onstart = null; this.id = null; this.indices = []; }
      start() {
        this.id = 'd' + (++numero);
        ecoutes.set(this.id, this);
        // indices : les phrases attendues (les coups possibles), que la reconnaissance du téléphone favorise
        pont.ecouter(this.id, this.lang || document.documentElement.lang, this.maxAlternatives || 1, JSON.stringify(this.indices || []));
        if (this.onstart) this.onstart({ type: 'start' });
      }
      stop() { pont.arreterEcoute(); }
      abort() { pont.arreterEcoute(); }
    }
    window.SpeechRecognition = Reconnaissance;
    window.__dictee = (quoi, id, valeur) => {
      const r = ecoutes.get(id);
      if (!r) return;
      if (quoi === 'resultats') {
        const alternatives = (valeur || []).map((t) => ({ transcript: t, confidence: 1 }));
        const resultat = Object.assign(alternatives, { isFinal: true });
        if (r.onresult) r.onresult({ type: 'result', resultIndex: 0, results: [resultat] });
      } else if (quoi === 'erreur') {
        if (r.onerror) r.onerror({ type: 'error', error: valeur });
      } else if (quoi === 'fin') {
        ecoutes.delete(id);
        if (r.onend) r.onend({ type: 'end' });
      }
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
    // dans l'application, les réglages restent sur le téléphone (et non « dans ce navigateur »)
    document.querySelectorAll('.pied p').forEach((p) => {
      if (p.children.length || !/ce navigateur|this browser/.test(p.textContent)) return; // (seulement cette phrase-là, sans lien)
      p.textContent = p.textContent.replace('restent dans ce navigateur', 'restent sur ce téléphone').replace('stay in this browser', 'stay on this phone');
    });
    envoyerFond();
    new MutationObserver(apresTransition).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', apresTransition);
  });
  window.addEventListener('pageshow', envoyerFond);
})();
