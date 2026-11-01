/* Petits sons synthétisés (aucun fichier audio à télécharger).
   Le son ne démarre qu'après un premier geste de l'enfant, comme l'exigent les navigateurs. */
(function () {
  let ctx = null;
  let actif = true;
  try { actif = localStorage.getItem('echecs.son') !== 'non'; } catch (e) { /* stockage indisponible */ }

  function contexte() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function note(freq, debut, duree, type = 'sine', volume = 0.2) {
    const c = contexte();
    if (!c) return;
    const t = c.currentTime + debut;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volume, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + duree + 0.05);
  }

  window.Sons = {
    get actif() { return actif; },
    set actif(v) {
      actif = !!v;
      try { localStorage.setItem('echecs.son', actif ? 'oui' : 'non'); } catch (e) { /* rien */ }
    },
    // plus la pièce est lourde, plus le son est grave
    pose(valeur) { if (actif) note(700 - valeur * 48, 0, 0.2, 'triangle', 0.25); },
    retire() { if (actif) { note(520, 0, 0.08, 'sine', 0.15); note(390, 0.06, 0.1, 'sine', 0.12); } },
    bravo() { if (actif) [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.09, 0.32, 'triangle', 0.2)); },
    refus() { if (actif) note(170, 0, 0.16, 'square', 0.06); },
    echec() { if (actif) { note(392, 0, 0.2, 'triangle', 0.18); note(311, 0.17, 0.32, 'triangle', 0.18); } },
    // bruit de dés qui roulent : petits chocs filtrés
    des() {
      if (!actif) return;
      const c = contexte();
      if (!c) return;
      for (let i = 0; i < 7; i++) {
        const t = c.currentTime + i * 0.065 + Math.random() * 0.03;
        const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.035), c.sampleRate);
        const d = buf.getChannelData(0);
        for (let k = 0; k < d.length; k++) d[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / d.length, 3);
        const src = c.createBufferSource();
        src.buffer = buf;
        const f = c.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 1800 + Math.random() * 2200;
        f.Q.value = 1.4;
        const g = c.createGain();
        g.gain.value = 0.5 - i * 0.05;
        src.connect(f).connect(g).connect(c.destination);
        src.start(t);
      }
    },
    juste() { if (actif) { note(784, 0, 0.12, 'triangle', 0.18); note(1175, 0.07, 0.22, 'triangle', 0.16); } },
    tic() { if (actif) note(1250, 0, 0.04, 'square', 0.035); },
    victoire() { if (actif) [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => note(f, i * 0.11, 0.38, 'triangle', 0.17)); },
  };
})();
