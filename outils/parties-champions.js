/* Génère jeux/joue/parties.js : les parties du jeu « Joue le coup ».

   Source : outils/parties-champions.pgn (coups des parties seulement, sans commentaire).
   Chaque partie est rejouée et vérifiée avec chess.js. Le « champion » d'une partie est son vainqueur :
   c'est lui que l'enfant fait jouer. Les moments où l'enfant prend la main sont choisis parmi les coups
   du champion, à partir du 7e coup, grâce à l'analyse de Stockfish (outils/analyse-parties.json) :
   - les sacrifices que Stockfish confirme comme le meilleur coup (spectaculaires : toujours gardés) ;
   - les coups qu'il fallait trouver : le champion a joué le meilleur coup, et le 2e meilleur faisait perdre
     au moins 12 points de chances de gain (pas les reprises toutes simples) ;
   - une dizaine de moments par partie (au plus les deux tiers des coups du champion), qui peuvent se suivre ;
     on complète avec les meilleurs coups du champion, puis avec les coups tactiques (mat, sacrifice, gain, échec) ;
   - le mat final est toujours un moment.
   Sans analyse, on garde seulement les règles tactiques.
   Pour chaque moment, on garde la liste des coups légaux (pour montrer où la pièce peut aller).
   Le PGN source a été préparé à partir des parties fournies par Mathieu Pouillon (300 parties classiques),
   complétées par 4 parties de la base github.com/goatchess/goatchess.github.io.

   Lancement : NODE_PATH=…/node_modules node outils/parties-champions.js */
const fs = require('fs');
const path = require('path');
const { Chess } = require('chess.js');

// Les champions qui ont leur portrait (au moins 3 parties gagnées, plus Morphy et Euwe).
// Les autres vainqueurs sont regroupés sous « autres ».
const CHAMPIONS = {
  'Paul Morphy': 'morphy', 'Wilhelm Steinitz': 'steinitz', 'Mikhaïl Tchigorine': 'tchigorine', 'Siegbert Tarrasch': 'tarrasch',
  'Emanuel Lasker': 'lasker', 'Carl Schlechter': 'schlechter', 'Akiba Rubinstein': 'rubinstein', 'Aron Nimzowitsch': 'nimzowitsch',
  'José Raúl Capablanca': 'capablanca', 'Richard Réti': 'reti', 'Alexandre Alekhine': 'alekhine', 'Max Euwe': 'euwe',
  'Mikhaïl Botvinnik': 'botvinnik', 'Paul Keres': 'keres', 'Vassily Smyslov': 'smyslov', 'Isaac Boleslavski': 'boleslavski',
  'David Bronstein': 'bronstein', 'Miguel Najdorf': 'najdorf', 'Svetozar Gligorić': 'gligoric', 'Tigran Petrossian': 'petrossian',
  'Mikhaïl Tal': 'tal', 'Leonid Stein': 'stein', 'Lev Polougaïevski': 'polougaievski', 'Boris Spassky': 'spassky',
  'Bent Larsen': 'larsen', 'Bobby Fischer': 'fischer', 'Ulf Andersson': 'andersson', 'Anatoli Karpov': 'karpov', 'Garry Kasparov': 'kasparov',
};

const VALEUR = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const racine = path.join(__dirname, '..');
const texte = fs.readFileSync(path.join(__dirname, 'parties-champions.pgn'), 'utf8');

function lirePgn(bloc) {
  const h = {};
  bloc.replace(/^\[(\w+) "(.*)"\]$/gm, (_, k, v) => { h[k] = v; });
  const coups = bloc.replace(/^\[.*\]$/gm, '').replace(/\d+\./g, ' ').replace(/(1-0|0-1)\s*$/, '').split(/\s+/).filter(Boolean);
  return { h, coups };
}

// note d'un coup du champion : plus c'est haut, plus c'est un moment à jouer soi-même
function noter(avant, m, precedent) {
  const apres = new Chess(avant.fen());
  apres.move(m.san);
  const moi = m.color, lui = moi === 'w' ? 'b' : 'w';
  let note = 0, type = 'calme';
  if (m.san.includes('#')) return { note: 100, type: 'mat' };
  if (m.promotion) { note += 50; type = 'promotion'; }
  const gain = m.captured ? VALEUR[m.captured] : 0;
  const v = VALEUR[m.promotion || m.piece];
  const attaquants = apres.attackers(m.to, lui).map(c => VALEUR[apres.get(c).type]);
  const defenseurs = apres.attackers(m.to, moi).length;
  let risque = 0;
  if (attaquants.length && m.piece !== 'k') {
    const plusPetit = Math.min(...attaquants.map(a => a || 100));
    risque = defenseurs ? Math.max(0, v - plusPetit) : v;
  }
  const bilan = gain - risque;
  const reprise = precedent && precedent.captured && precedent.to === m.to;
  if (bilan <= -2) { note += 60 + 5 * Math.min(6, -bilan); type = 'sacrifice'; }
  else if (gain >= 3 && bilan >= 1 && !reprise) { note += 35; type = type === 'calme' ? 'gain' : type; }
  else if (gain >= 1 && bilan >= 1 && !reprise) { note += 15; type = type === 'calme' ? 'gain' : type; }
  if (m.san.includes('+')) { note += 22; if (type === 'calme') type = 'echec'; }
  if (reprise && type !== 'sacrifice') note -= 40;
  return { note, type };
}

// chances de gain (0 à 1) d'après l'évaluation en centièmes de pion
const chances = (cp) => 1 / (1 + Math.exp(-0.00368208 * cp));

function choisirMoments(coups, champion, analyse) {
  const notes = [];
  const j = new Chess();
  let precedent = null;
  coups.forEach((san, i) => {
    const m = j.moves({ verbose: true }).find(x => x.san === san);
    if (m.color === champion && i >= 12) {
      const n = { i, ...noter(j, m, precedent), m, ecart: 0 };
      const reprise = precedent && precedent.captured && precedent.to === m.to;
      // Stockfish : le champion a joué le meilleur coup, et le 2e meilleur était nettement moins bon
      const a = analyse && analyse[i];
      if (a) {
        n.ecart = chances(a[0]) - chances(a[1]);
        n.critique = n.ecart >= 0.12 && chances(a[0]) >= 0.3 && !reprise;
        if (n.critique && n.type === 'calme') n.type = 'unique';
        // un sacrifice que Stockfish confirme comme le meilleur coup : spectaculaire, toujours gardé
        n.spectaculaire = n.type === 'sacrifice' && chances(a[0]) >= 0.5;
      }
      notes.push(n);
    }
    j.move(san);
    precedent = m;
  });
  const pris = [];
  // une dizaine de moments, jamais plus des deux tiers des coups du champion ; les coups qui se suivent sont permis
  const VISE = Math.min(10, Math.ceil(notes.length * 2 / 3));
  const libre = (i, ecart) => pris.every(p => Math.abs(p.i - i) >= ecart);
  const prendre = (liste, max = VISE, ecart = 2) => { for (const n of liste) { if (pris.length >= max) break; if (libre(n.i, ecart)) pris.push(n); } };
  const dernier = notes[notes.length - 1];
  if (dernier && dernier.type === 'mat') pris.push(dernier);
  if (analyse) {
    // 1. les sacrifices confirmés, puis les coups qu'il fallait trouver (le plus grand écart d'abord)
    prendre(notes.filter(n => n.spectaculaire));
    prendre(notes.filter(n => n.critique).sort((a, b) => b.ecart - a.ecart));
    // 2. puis les meilleurs coups joués par le champion (pas les reprises toutes simples)
    prendre(notes.filter(n => !n.critique && n.ecart > 0.02 && n.note > -20).sort((a, b) => b.ecart - a.ecart));
  }
  // 3. sinon (ou pas d'analyse), les coups tactiques repérés par noter(), puis des coups calmes répartis
  prendre([...notes].sort((a, b) => b.note - a.note).filter(n => n.note >= 25), VISE, analyse ? 2 : 6);
  if (pris.length < 3) {
    const calmes = notes.filter(n => n.note >= 0 && n.m.piece !== 'k' && n.m.piece !== 'p');
    const pas = Math.max(1, Math.floor(calmes.length / 5));
    for (let k = Math.floor(pas / 2); k < calmes.length && pris.length < 3; k += pas) if (libre(calmes[k].i, 6)) pris.push(calmes[k]);
  }
  pris.sort((a, b) => a.i - b.i);
  return pris;
}

// analyse Stockfish (facultative) : { n° de partie : { demi-coup : [éval du meilleur coup, éval du 2e] } },
// seulement pour les demi-coups où le champion a joué le meilleur coup. Produite par outils/analyser-parties.js.
const fichierAnalyse = path.join(__dirname, 'analyse-parties.json');
const ANALYSE = fs.existsSync(fichierAnalyse) ? JSON.parse(fs.readFileSync(fichierAnalyse, 'utf8')) : {};

const parties = [];
const parChampion = {};
let numero = -1;
for (const bloc of texte.split(/\n(?=\[White )/)) {
  const { h, coups } = lirePgn(bloc);
  if (!h.White) continue;
  numero++;
  const champion = h.Result === '1-0' ? 'w' : 'b';
  const vainqueur = champion === 'w' ? h.White : h.Black;
  // vérification complète : chaque coup doit être légal
  const j = new Chess();
  const uci = [];
  for (const san of coups) { const m = j.move(san); uci.push(m.from + m.to + (m.promotion || '')); }
  const moments = choisirMoments(coups, champion, ANALYSE[numero]);
  // coups légaux à chaque moment (de + vers), pour montrer les cases possibles
  const legaux = {};
  const k = new Chess();
  coups.forEach((san, i) => {
    if (moments.some(m => m.i === i)) {
      // regroupés par case de départ : « g1f3h3 » = le cavalier g1 peut aller en f3 ou h3
      const groupes = {};
      for (const m of k.moves({ verbose: true })) (groupes[m.from] = groupes[m.from] || new Set()).add(m.to);
      legaux[i] = Object.entries(groupes).map(([de, vers]) => de + [...vers].join('')).join(' ');
    }
    k.move(san);
  });
  const cle = CHAMPIONS[vainqueur] || 'autres';
  parChampion[cle] = (parChampion[cle] || 0) + 1;
  parties.push({
    ch: cle, c: champion, bl: h.White, no: h.Black, l: h.Site || '', a: /\d{4}/.test(h.Date) ? +h.Date : 0, r: h.Result,
    u: uci.join(' '), s: coups.join(' '), m: moments.map(m => (m.critique ? [m.i, m.type, 1] : [m.i, m.type])), lg: legaux,
  });
}

const sortie = '/* Généré par outils/parties-champions.js — ne pas modifier à la main.\n' +
  '   Parties : coups seulement (faits historiques). u = coups (de-vers), s = notation anglaise,\n' +
  '   m = moments où l\'enfant joue [demi-coup, type, 1 si c\'était le seul bon coup], lg = coups légaux à ces moments\n   (groupés par case de départ : « g1f3h3 »). */\n' +
  'window.PARTIES_CHAMPIONS = ' + JSON.stringify(parties) + ';\n';
fs.writeFileSync(path.join(racine, 'jeux/joue/parties.js'), sortie);
const types = {};
parties.forEach(p => p.m.forEach(([, t]) => { types[t] = (types[t] || 0) + 1; }));
console.log(parties.length, 'parties ;', Object.keys(parChampion).length - 1, 'champions + autres ;', (sortie.length / 1024).toFixed(0), 'Ko');
console.log('moments :', types, '; par partie :', (parties.reduce((s, p) => s + p.m.length, 0) / parties.length).toFixed(1));
console.log(Object.entries(parChampion).sort((a, b) => b[1] - a[1]).map(e => e.join(':')).join(' '));
