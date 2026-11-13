/* Capture le roi — calcul des tables (analyse rétrograde).
   Pour une équipe blanche donnée (par exemple ['K', 'B', 'N'] : roi, fou, cavalier) contre le roi noir seul,
   calcule pour chaque position, les Blancs ayant le trait, le nombre de coups blancs nécessaires pour capturer le roi
   noir si les deux camps jouent parfaitement (255 = impossible : le roi noir s'en sort toujours).
   Règles : le roi noir doit bouger à chaque coup ; il peut prendre une pièce blanche voisine (sauf le roi) ; il peut
   aller sur une case attaquée, mais il est alors capturé au coup suivant (un pat le condamne donc aussi) ; il ne va
   jamais à côté du roi blanc (il y serait pris). Le roi blanc ne va jamais à côté du roi noir.
   Pas de pions : l'échiquier a 8 symétries ; on ramène toujours le roi noir dans le triangle a1-d1-d4 (10 cases),
   ce qui divise la taille des tables par 6,4.
   Utilisable dans le navigateur (self.TablesRoi, aussi dans un Worker) et avec Node (module.exports). */
(function (racine) {
  const INF = 255;
  const X = (c) => c & 7, Y = (c) => c >> 3;

  // ---------- géométrie ----------
  const SYM = [];                       // les 8 symétries de l'échiquier
  for (let s = 0; s < 8; s++) {
    SYM[s] = new Uint8Array(64);
    for (let c = 0; c < 64; c++) {
      let x = X(c), y = Y(c);
      if (s & 1) x = 7 - x;
      if (s & 2) y = 7 - y;
      if (s & 4) { const t = x; x = y; y = t; }
      SYM[s][c] = y * 8 + x;
    }
  }
  const DIAG = new Uint8Array(64);      // symétrie par rapport à la diagonale a1-h8
  for (let c = 0; c < 64; c++) DIAG[c] = X(c) * 8 + Y(c);
  const TRIANGLE = [];                  // a1 b1 c1 d1 b2 c2 d2 c3 d3 d4
  for (let y = 0; y < 4; y++) for (let x = y; x < 4; x++) TRIANGLE.push(y * 8 + x);
  const RANG_TRI = new Int8Array(64).fill(-1);
  TRIANGLE.forEach((c, i) => { RANG_TRI[c] = i; });
  const SYM_DE = new Uint8Array(64);    // pour chaque case du roi noir : une symétrie qui l'amène dans le triangle
  for (let c = 0; c < 64; c++) for (let s = 0; s < 8; s++) if (RANG_TRI[SYM[s][c]] >= 0) { SYM_DE[c] = s; break; }

  const ROI = [], CAVALIER = [];
  for (let c = 0; c < 64; c++) {
    ROI[c] = []; CAVALIER[c] = [];
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      if (!dx && !dy) continue;
      const x = X(c) + dx, y = Y(c) + dy;
      if (x >= 0 && x < 8 && y >= 0 && y < 8) ROI[c].push(y * 8 + x);
    }
    for (const [dx, dy] of [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]) {
      const x = X(c) + dx, y = Y(c) + dy;
      if (x >= 0 && x < 8 && y >= 0 && y < 8) CAVALIER[c].push(y * 8 + x);
    }
  }
  // rayons des pièces glissantes : RAYONS[c] = liste de rayons (listes de cases, de la plus proche à la plus loin)
  const DIRS = { R: [[1, 0], [-1, 0], [0, 1], [0, -1]], B: [[1, 1], [1, -1], [-1, 1], [-1, -1]] };
  DIRS.Q = DIRS.R.concat(DIRS.B);
  const RAYONS = { R: [], B: [], Q: [] };
  for (const t of ['R', 'B', 'Q']) for (let c = 0; c < 64; c++) {
    RAYONS[t][c] = DIRS[t].map(([dx, dy]) => {
      const r = [];
      let x = X(c) + dx, y = Y(c) + dy;
      while (x >= 0 && x < 8 && y >= 0 && y < 8) { r.push(y * 8 + x); x += dx; y += dy; }
      return r;
    }).filter(r => r.length);
  }
  const voisins = (a, b) => a !== b && Math.abs(X(a) - X(b)) <= 1 && Math.abs(Y(a) - Y(b)) <= 1;

  // cases où la pièce t en c peut aller (la case d'arrivée peut être occupée : c'est l'appelant qui trie) ;
  // occ : tableau de 64 cases (non nul = occupée), qui arrête les pièces glissantes
  function cibles(t, c, occ, out) {
    out.length = 0;
    if (t === 'N') { for (const d of CAVALIER[c]) out.push(d); return out; }
    if (t === 'K') { for (const d of ROI[c]) out.push(d); return out; }
    for (const r of RAYONS[t][c]) for (const d of r) { out.push(d); if (occ[d]) break; }
    return out;
  }
  // la pièce t en c attaque-t-elle la case cible ?
  function attaque(t, c, cible, occ) {
    if (t === 'N') return CAVALIER[c].includes(cible);
    if (t === 'K') return voisins(c, cible);
    for (const r of RAYONS[t][c]) for (const d of r) { if (d === cible) return true; if (occ[d]) break; }
    return false;
  }

  const memo = {};
  const cle = (types) => [...types].sort().join('');
  // position (roi noir, pièces blanches) -> indice unique dans la table d'une équipe de n pièces, après symétrie ;
  // roi noir sur la diagonale a1-d4 : la symétrie par rapport à cette diagonale donne la même position,
  // on garde la plus petite des deux écritures
  function indexeur(n) {
    return (s) => {
      const sym = SYM[SYM_DE[s[0]]];
      const kb = sym[s[0]];
      let i = RANG_TRI[kb];
      for (let j = 1; j <= n; j++) i = i * 64 + sym[s[j]];
      if (X(kb) === Y(kb)) {
        let i2 = RANG_TRI[kb];
        for (let j = 1; j <= n; j++) i2 = i2 * 64 + DIAG[sym[s[j]]];
        if (i2 < i) i = i2;
      }
      return i;
    };
  }
  // une table déjà calculée (W, Blancs au trait), par exemple lue dans un fichier
  function charger(typesDonnes, W) {
    const types = [...typesDonnes].sort();
    const n = types.length, indexDe = indexeur(n), s1 = new Uint8Array(n + 1);
    const res = {
      types, W,
      valeur(kb, pieces) { s1[0] = kb; for (let j = 0; j < n; j++) s1[j + 1] = pieces[j]; return W[indexDe(s1)]; },
    };
    memo[cle(types)] = res;
    return res;
  }
  const dejaLa = (types) => memo[cle(types)] || null;

  // calcule (et garde en mémoire) la table d'une équipe ; renvoie { types, W, valeur(kb, pieces) }
  function table(typesDonnes, progres) {
    const types = [...typesDonnes].sort();
    const k = cle(types);
    if (memo[k]) return memo[k];
    const n = types.length;
    // tables des équipes plus petites (quand le roi noir prend une pièce) ; le roi blanc ne se prend pas
    const sous = types.map((t, i) => (t === 'K' ? null : table(types.filter((_, j) => j !== i), progres)));
    const roiBlanc = types.includes('K') ? types.indexOf('K') + 1 : -1;
    const taille = 10 * Math.pow(64, n);
    const W = new Uint8Array(taille).fill(INF); // Blancs au trait
    const reste = new Int8Array(taille);        // coups noirs pas encore résolus (-1 : un coup sauve le roi ; -2 : position absente)
    const pire = new Uint8Array(taille);        // le plus long des coups noirs déjà résolus

    const sq = new Uint8Array(n + 1);           // sq[0] = roi noir, sq[1..n] = pièces blanches
    const tmp = new Uint8Array(n + 1);
    const occ = new Uint8Array(64);
    const liste = [];
    const poser = (s) => { for (let j = 0; j <= n; j++) occ[s[j]] = j + 1; };
    const lever = (s) => { for (let j = 0; j <= n; j++) occ[s[j]] = 0; };
    const indexDe = indexeur(n);
    const decoder = (i, s) => {
      for (let j = n; j >= 1; j--) { s[j] = i & 63; i = Math.floor(i / 64); }
      s[0] = TRIANGLE[i];
    };
    const valide = (s) => {
      for (let a = 0; a <= n; a++) for (let b = a + 1; b <= n; b++) if (s[a] === s[b]) return false;
      return roiBlanc < 0 || !voisins(s[roiBlanc], s[0]);
    };

    // 1. positions de départ : les Blancs prennent tout de suite (W = 1) ; les coups noirs à résoudre
    const seauW = [], seauB = [];               // positions classées par valeur, traitées dans l'ordre croissant
    const ranger = (seau, v, i) => { (seau[v] || (seau[v] = [])).push(i); };
    const p2 = [], vus = [];
    for (let i = 0; i < taille; i++) {
      decoder(i, sq);
      if (!valide(sq) || indexDe(sq) !== i) { W[i] = 0; reste[i] = -2; continue; }
      poser(sq);
      let prend = false;
      for (let j = 1; j <= n && !prend; j++) prend = attaque(types[j - 1], sq[j], sq[0], occ);
      if (prend) { W[i] = 1; ranger(seauW, 1, i); }
      // Noirs au trait
      // les coups noirs ordinaires sont comptés par position d'arrivée distincte : quand la position est symétrique,
      // deux coups peuvent mener à la même position (après symétrie), qui ne sera résolue qu'une fois
      let compte = 0, max = 0, sauve = false;
      vus.length = 0;
      for (const m of ROI[sq[0]]) {
        const j = occ[m] ? occ[m] - 1 : 0;
        if (j && types[j - 1] === 'K') continue;
        if (roiBlanc > 0 && voisins(m, sq[roiBlanc])) { if (max < 1) max = 1; continue; }
        if (j) {                                          // il prend une pièce : table plus petite
          p2.length = 0;
          for (let p = 1; p <= n; p++) if (p !== j) p2.push(sq[p]);
          const val = sous[j - 1].valeur(m, p2);
          if (val === INF) sauve = true; else if (val > max) max = val;
        } else {
          tmp.set(sq); tmp[0] = m;
          const s = indexDe(tmp);
          if (!vus.includes(s)) { vus.push(s); compte++; }
        }
      }
      lever(sq);
      pire[i] = max;
      if (sauve) reste[i] = -1;
      else if (compte === 0) { reste[i] = 0; ranger(seauB, max, i); }
      else reste[i] = compte;
    }
    // 2. rétrograde, valeurs croissantes :
    //    W = v -> on retire ce coup des positions noires qui y menaient ; quand une position noire n'a plus de coup
    //    à résoudre, elle vaut le pire de ses coups (B) ; B = v -> les positions blanches qui y mènent valent v + 1
    for (let v = 1; v < 250; v++) {
      let encore = false;
      for (let u = v; u < Math.max(seauW.length, seauB.length); u++) if (seauW[u] || seauB[u]) { encore = true; break; }
      if (!encore) break;
      if (progres) progres(k, v);
      for (const i of seauW[v] || []) {
        decoder(i, sq);
        poser(sq);
        vus.length = 0;
        for (const de of ROI[sq[0]]) {                    // le roi noir venait d'une case voisine libre
          if (occ[de]) continue;
          tmp.set(sq); tmp[0] = de;
          if (!valide(tmp)) continue;
          const p = indexDe(tmp);
          if (vus.includes(p)) continue;                  // chaque position noire n'est comptée qu'une fois
          vus.push(p);
          if (reste[p] <= 0) continue;
          if (v > pire[p]) pire[p] = v;
          if (--reste[p] === 0) ranger(seauB, pire[p], p);
        }
        lever(sq);
      }
      for (const p of seauB[v] || []) {
        decoder(p, sq);
        poser(sq);
        for (let j = 1; j <= n; j++) {                    // une pièce blanche venait d'une autre case
          for (const de of cibles(types[j - 1], sq[j], occ, liste)) {
            if (occ[de]) continue;
            tmp.set(sq); tmp[j] = de;
            if (!valide(tmp)) continue;
            const q = indexDe(tmp);
            if (W[q] <= v + 1) continue;
            W[q] = v + 1;
            ranger(seauW, v + 1, q);
          }
        }
        lever(sq);
      }
      seauW[v] = seauB[v] = null;
    }
    return charger(types, W);
  }

  // les équipes plus petites qu'une table utilise (quand le roi noir prend une pièce), elle comprise
  function sousEquipes(typesDonnes) {
    const types = [...typesDonnes].sort();
    const toutes = {};
    const visiter = (t) => {
      const k = cle(t);
      if (toutes[k]) return;
      toutes[k] = t;
      t.forEach((p, i) => { if (p !== 'K' && t.length > 1) visiter(t.filter((_, j) => j !== i)); });
    };
    visiter(types);
    return Object.values(toutes).sort((a, b) => a.length - b.length);
  }

  const api = { table, charger, dejaLa, sousEquipes, INF, ROI, CAVALIER, RAYONS, cibles, attaque, voisins, cle };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else racine.TablesRoi = api;
})(typeof self !== 'undefined' ? self : this);
