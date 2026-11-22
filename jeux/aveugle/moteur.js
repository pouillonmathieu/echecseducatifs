/* À l'aveugle : l'ordinateur.
   Stockfish 18 (version « lite », un seul fil), dans un Web Worker : stockfish/stockfish-18-lite-single.js et son .wasm
   (Stockfish.js de Nathan Rugg / Chess.com, licence GPL v3, voir stockfish/LISEZMOI.md). On lui parle en UCI.

   Niveaux : le « Skill Level » de Stockfish (0 à 20) : 3, 6, 9 et 12 pour les niveaux 1 à 4. Avec un Skill Level,
   Stockfish choisit volontairement un coup moins bon parmi ses meilleurs ; la recherche est aussi limitée en
   profondeur et en temps, pour rester rapide sur un téléphone.

   Adaptatif : avant de jouer, l'ordinateur évalue la position (recherche courte, à pleine force). S'il gagne
   nettement, il joue moins bien (Skill Level plus bas) ; s'il perd, il se défend mieux (Skill Level plus haut,
   recherche plus profonde). */
(function () {
  const NIVEAUX = { 1: 3, 2: 6, 3: 9, 4: 12 };

  // Le Skill Level à utiliser, selon l'évaluation (en centipions, du point de vue de l'ordinateur).
  function niveauAdaptatif(base, evaluation) {
    if (evaluation == null) return base;
    if (evaluation > 150) return Math.max(0, base - Math.min(base, 1 + Math.floor((evaluation - 150) / 150)));
    if (evaluation < -150) return Math.min(20, base + Math.min(8, 2 + Math.floor((-evaluation - 150) / 100)));
    return base;
  }
  // profondeur et temps de la recherche, selon le Skill Level
  const recherche = (skill) => ({ profondeur: Math.min(18, skill + 3), temps: 300 + skill * 60 });

  class Moteur {
    constructor(url) {
      this.ecouteurs = [];
      this.file = Promise.resolve();
      this.panne = null;
      try {
        this.w = new Worker(url);
      } catch (e) { this.panne = e; }
      if (this.w) {
        this.w.onmessage = (e) => { const l = typeof e.data === 'string' ? e.data : ''; this.ecouteurs.slice().forEach((f) => f(l)); };
        this.w.onerror = (e) => { this.panne = e; this.ecouteurs.slice().forEach((f) => f('__panne')); };
      }
      this.pret = this.panne ? Promise.reject(this.panne)
        : this.attendre('uci', 'uciok').then(() => this.attendre('isready', 'readyok'));
      this.pret.catch(() => {});
    }
    envoyer(c) { if (this.w) this.w.postMessage(c); }
    // envoie une commande et attend la ligne qui commence par « fin » (ou une panne)
    attendre(commande, fin, pendant) {
      return new Promise((ok, ko) => {
        const f = (l) => {
          if (l === '__panne') { this.ecouteurs = this.ecouteurs.filter((x) => x !== f); ko(this.panne); return; }
          if (pendant) pendant(l);
          if (l.startsWith(fin)) { this.ecouteurs = this.ecouteurs.filter((x) => x !== f); ok(l); }
        };
        this.ecouteurs.push(f);
        if (commande) this.envoyer(commande);
      });
    }
    // une recherche à la fois : les demandes attendent leur tour
    enFile(f) {
      const p = this.file.then(f, f);
      this.file = p.catch(() => {});
      return p;
    }
    // { coup: 'e2e4', score } ; score en centipions du point de vue du joueur au trait (mat : ±10000)
    chercher(fen, skill, profondeur, temps) {
      return this.enFile(async () => {
        await this.pret;
        this.envoyer(`setoption name Skill Level value ${skill}`);
        this.envoyer(`position fen ${fen}`);
        let score = null;
        const lire = (l) => {
          if (!l.startsWith('info') || / multipv [2-9]/.test(l)) return;
          const m = l.match(/ score (cp|mate) (-?\d+)/);
          if (m) score = m[1] === 'cp' ? +m[2] : (+m[2] > 0 ? 10000 : -10000);
        };
        const l = await this.attendre(`go depth ${profondeur} movetime ${temps}`, 'bestmove', lire);
        const coup = l.split(/\s+/)[1];
        return { coup: coup && coup !== '(none)' ? coup : null, score };
      });
    }
    // le coup de l'ordinateur : niveau 1 à 4, adaptatif ou non
    async jouer(fen, niveau, adaptatif) {
      const base = NIVEAUX[niveau] || NIVEAUX[2];
      let skill = base, evaluation = null;
      if (adaptatif) {
        evaluation = (await this.chercher(fen, 20, 10, 250)).score;
        skill = niveauAdaptatif(base, evaluation);
      }
      const { profondeur, temps } = recherche(skill);
      const r = await this.chercher(fen, skill, profondeur, temps);
      return { coup: r.coup, skill, evaluation };
    }
    nouvellePartie() { return this.enFile(async () => { await this.pret; this.envoyer('ucinewgame'); await this.attendre('isready', 'readyok'); }); }
    arreter() { this.envoyer('stop'); }
  }

  window.MoteurAveugle = { Moteur, NIVEAUX, niveauAdaptatif };
})();
