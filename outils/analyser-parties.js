/* Analyse les parties de « Joue le coup » avec Stockfish et écrit outils/analyse-parties.json.

   Pour chaque coup du champion (à partir du 7e coup), Stockfish cherche les 2 meilleurs coups (profondeur 16).
   On ne garde que les demi-coups où le champion a joué le meilleur coup : [éval du meilleur, éval du 2e],
   en centièmes de pion du point de vue du champion (un mat compte pour ±10 000).
   outils/parties-champions.js s'en sert ensuite pour choisir les moments où l'enfant joue.

   Lancement (4 moteurs en parallèle, une vingtaine de minutes) :
   NODE_PATH=…/node_modules node outils/analyser-parties.js <chemin du binaire stockfish> */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { Chess } = require('chess.js');

const BIN = process.argv[2];
if (!BIN) { console.error('Usage : node outils/analyser-parties.js <binaire stockfish>'); process.exit(1); }
const PROFONDEUR = 16, MOTEURS = 4;

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
      ['Threads value 1', 'Hash value 64', 'MultiPV value 2'].forEach(o => envoyer('setoption name ' + o));
      envoyer('isready'); await jusqua(l => l === 'readyok');
    },
    async analyser(fen) {
      const lignes = {};
      envoyer('position fen ' + fen); envoyer('go depth ' + PROFONDEUR);
      await jusqua(l => l.startsWith('bestmove'), (l) => {
        const m = l.match(/^info .*?\bmultipv (\d+) .*?\bscore (cp|mate) (-?\d+).*? pv (\S+)/);
        if (m) lignes[m[1]] = { coup: m[4], cp: m[2] === 'cp' ? +m[3] : (+m[3] > 0 ? 10000 - +m[3] * 10 : -10000 - +m[3] * 10) };
      });
      return [lignes[1], lignes[2]];
    },
    quitter() { envoyer('quit'); },
  };
}

const texte = fs.readFileSync(path.join(__dirname, 'parties-champions.pgn'), 'utf8');
const taches = [];
texte.split(/\n(?=\[White )/).forEach((bloc, n) => {
  const h = {};
  bloc.replace(/^\[(\w+) "(.*)"\]$/gm, (_, k, v) => { h[k] = v; });
  const coups = bloc.replace(/^\[.*\]$/gm, '').replace(/\d+\./g, ' ').replace(/(1-0|0-1)\s*$/, '').split(/\s+/).filter(Boolean);
  const champion = h.Result === '1-0' ? 'w' : 'b';
  const j = new Chess();
  coups.forEach((san, i) => {
    const m = j.moves({ verbose: true }).find(x => x.san === san);
    if (j.turn() === champion && i >= 12 && j.moves().length > 1) taches.push({ n, i, fen: j.fen(), joue: m.from + m.to + (m.promotion || '') });
    j.move(san);
  });
});

(async () => {
  console.log(taches.length, 'positions à analyser');
  const sortie = {};
  let fait = 0;
  await Promise.all(Array.from({ length: MOTEURS }, async () => {
    const m = moteur();
    await m.pret();
    while (taches.length) {
      const t = taches.shift();
      const [l1, l2] = await m.analyser(t.fen);
      if (l1 && l2 && l1.coup === t.joue) (sortie[t.n] = sortie[t.n] || {})[t.i] = [l1.cp, l2.cp];
      if (++fait % 500 === 0) console.log(fait, 'positions analysées');
    }
    m.quitter();
  }));
  fs.writeFileSync(path.join(__dirname, 'analyse-parties.json'), JSON.stringify(sortie));
  console.log('analyse-parties.json écrit');
})();
