/* Capture le roi : calcule les tables de toutes les équipes (et des équipes plus petites, quand le roi noir prend
   une pièce) et les écrit, compressées, dans jeux/roi/tables/<équipe>.bin.gz (les pièces triées : B fou, K roi,
   N cavalier, Q dame, R tour ; « BKN » = roi, fou et cavalier). Le jeu les lit au lieu de tout recalculer.
     node outils/tables-roi.js */
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const T = require('../jeux/roi/tables.js');
const EQUIPES = [['R', 'R'], ['R', 'B', 'B'], ['R', 'N', 'N'], ['B', 'B', 'B'], ['K', 'Q'], ['K', 'R'], ['K', 'B', 'B'], ['K', 'B', 'N']];
const dossier = path.join(__dirname, '..', 'jeux', 'roi', 'tables');
fs.mkdirSync(dossier, { recursive: true });
const faites = new Set();
let total = 0;
for (const e of EQUIPES) for (const t of T.sousEquipes(e)) {
  const k = T.cle(t);
  if (faites.has(k)) continue;
  faites.add(k);
  const t0 = Date.now();
  const tb = T.table(t);
  const gz = zlib.gzipSync(Buffer.from(tb.W), { level: 9 });
  fs.writeFileSync(path.join(dossier, k + '.bin.gz'), gz);
  total += gz.length;
  let max = 0; for (const v of tb.W) if (v !== 255 && v > max) max = v;
  console.log(k.padEnd(4), String(gz.length).padStart(7), 'octets', String(Date.now() - t0).padStart(6), 'ms', 'max', max);
}
console.log('total', total, 'octets');
