/* Prépare les explications de « Joue le coup » avec Stockfish : écrit outils/explications.json.

   Pour chaque moment où l'enfant joue (lu dans outils/moments.json) :
   - la suite : position après le coup du champion, meilleure suite de l'adversaire (profondeur 14) ;
   - la menace : on laisse le champion rejouer tout de suite (comme si l'adversaire passait son tour),
     son meilleur coup est ce que menace le coup joué (profondeur 12) ;
   - l'autre coup : le 2e meilleur coup de la position, repris de l'analyse brute d'outils/analyser-parties.js
     (fichier { partie: { demi-coup: [meilleur, éval, 2e coup, éval] } }).
   Pour la fin de chaque partie : la position finale (profondeur 16), pour expliquer l'abandon.

   Lancement : NODE_PATH=…/node_modules node outils/analyser-explications.js <binaire stockfish> <analyse brute.json> */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { Chess } = require('chess.js');

const BIN = process.argv[2];
if (!BIN || !process.argv[3]) { console.error('Usage : node outils/analyser-explications.js <binaire stockfish> <analyse brute.json>'); process.exit(1); }
const racine = path.join(__dirname, '..');

function moteur() {
  const p = spawn(BIN, [], { stdio: ['pipe', 'pipe', 'inherit'] });
  let tampon = '', attente = null;
  p.stdout.on('data', (d) => {
    tampon += d;
    let i;
    while ((i = tampon.indexOf('\n')) >= 0) { const l = tampon.slice(0, i).trim(); tampon = tampon.slice(i + 1); if (attente) attente(l); }
  });
  const envoyer = (s) => p.stdin.write(s + '\n');
  const jusqua = (test, sur) => new Promise((res) => { attente = (l) => { if (sur) sur(l); if (test(l)) { attente = null; res(l); } }; });
  return {
    async pret() {
      envoyer('uci'); await jusqua(l => l === 'uciok');
      ['Threads value 1', 'Hash value 64', 'MultiPV value 1'].forEach(o => envoyer('setoption name ' + o));
      envoyer('isready'); await jusqua(l => l === 'readyok');
    },
    // { cp (du point de vue du camp au trait, mat = ±10 000), pv: [coups de-vers] }
    async analyser(fen, profondeur) {
      let res = null;
      envoyer('ucinewgame'); envoyer('position fen ' + fen); envoyer('go depth ' + profondeur);
      await jusqua(l => l.startsWith('bestmove'), (l) => {
        const m = l.match(/^info .*?\bscore (cp|mate) (-?\d+).*? pv (.+)$/);
        if (m) res = { cp: m[1] === 'cp' ? +m[2] : (+m[2] > 0 ? 10000 - +m[2] * 10 : -10000 - +m[2] * 10), mat: m[1] === 'mate' ? +m[2] : 0, pv: m[3].split(' ').slice(0, 8) };
      });
      return res;
    },
    quitter() { envoyer('quit'); },
  };
}

// les parties (outils/parties-champions.pgn) et leurs moments (outils/moments.json, écrit par parties-champions.js)
const MOMENTS = JSON.parse(fs.readFileSync(path.join(__dirname, 'moments.json'), 'utf8'));
const PARTIES = fs.readFileSync(path.join(__dirname, 'parties-champions.pgn'), 'utf8').split(/\n(?=\[White )/).filter(b => /\[White /.test(b)).map((b, n) => ({
  s: b.replace(/^\[.*\]$/gm, '').replace(/\d+\./g, ' ').replace(/(1-0|0-1)\s*$/, '').split(/\s+/).filter(Boolean).join(' '),
  m: (MOMENTS[n] || []).map(i => [i]),
}));
const brut = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));

const taches = [];
PARTIES.forEach((p, n) => {
  const coups = p.s.split(' ');
  const j = new Chess();
  const fens = [j.fen()];
  for (const s of coups) { j.move(s); fens.push(j.fen()); }
  for (const [i] of p.m) {
    taches.push({ n, i, genre: 'suite', fen: fens[i + 1] });
    // la menace : le même camp rejoue (on change le trait), sauf si l'adversaire est en échec
    const apres = new Chess(fens[i + 1]);
    if (!apres.inCheck() && !apres.isGameOver()) {
      const champs = fens[i + 1].split(' ');
      champs[1] = champs[1] === 'w' ? 'b' : 'w'; champs[3] = '-';
      try { new Chess(champs.join(' ')); taches.push({ n, i, genre: 'menace', fen: champs.join(' ') }); } catch (e) { /* position impossible */ }
    }
  }
  if (!j.isGameOver()) taches.push({ n, i: coups.length, genre: 'fin', fen: j.fen() });
});

(async () => {
  console.log(taches.length, 'positions à analyser');
  const sortie = {};
  let fait = 0;
  const t0 = Date.now();
  await Promise.all(Array.from({ length: 4 }, async () => {
    const m = moteur();
    await m.pret();
    while (taches.length) {
      const t = taches.shift();
      const r = await m.analyser(t.fen, t.genre === 'fin' ? 16 : t.genre === 'menace' ? 12 : 14);
      const e = ((sortie[t.n] = sortie[t.n] || {})[t.i] = sortie[t.n][t.i] || {});
      if (r) e[t.genre] = r;
      if (t.genre === 'suite' && brut[t.n] && brut[t.n][t.i]) e.autre = { coup: brut[t.n][t.i][2], cp: brut[t.n][t.i][3], cp1: brut[t.n][t.i][1] };
      if (++fait % 500 === 0) console.log(fait, 'faites,', Math.round((Date.now() - t0) / fait * taches.length / 60000), 'min restantes');
    }
    m.quitter();
  }));
  fs.writeFileSync(path.join(__dirname, 'explications.json'), JSON.stringify(sortie));
  console.log('terminé :', fait, 'positions en', Math.round((Date.now() - t0) / 60000), 'min');
})();
