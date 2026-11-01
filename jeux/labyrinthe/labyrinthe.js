/* Le labyrinthe
   Une seule pièce (cavalier, fou, tour ou dame) doit rentrer à sa maison en contournant des obstacles
   (pierres, eau, lave ou buissons). Seuls les coups réguliers sont acceptés : les pièces qui glissent
   s'arrêtent devant un obstacle ; le cavalier saute par-dessus mais ne peut pas s'y poser.
   Les obstacles sont posés au hasard ; un parcours en largeur garantit qu'un chemin existe, donne
   sa longueur (le plus court) et vérifie que les obstacles obligent à faire un détour.
   Niveaux facile / moyen / difficile, mode libre, défi (10 labyrinthes) et défi chrono (30 s chacun).
   La pièce se déplace en touchant une case ou en la faisant glisser (glisser-déposer). */
(function () {
  const { Prefs, brancherBoutonTheme, brancherReglages, brancherInterrupteur } = window.Commun;
  const { lancerPluie, allumerEtoiles, compterJusqua, formaterDuree, ICONES } = window.UI;
  const Sons = window.Sons;
  const $ = (id) => document.getElementById(id);
  const plateau = $('echiquier');

  const NB_DEFIS = 10;
  const DUREE = 30;

  // ---------- Échiquier et déplacements ----------
  const COL = 'abcdefgh';
  const nom = (f, r) => COL[f] + (r + 1);
  const coord = (c) => [COL.indexOf(c[0]), +c[1] - 1];
  const dedans = (f, r) => f >= 0 && f < 8 && r >= 0 && r < 8;
  const DIRECTIONS = { tour: [[1, 0], [-1, 0], [0, 1], [0, -1]], fou: [[1, 1], [1, -1], [-1, 1], [-1, -1]] };
  DIRECTIONS.dame = [...DIRECTIONS.tour, ...DIRECTIONS.fou];
  const SAUTS = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
  const PIECES = ['cavalier', 'fou', 'tour', 'dame'];
  const THEMES = ['pierre', 'eau', 'lave', 'buisson'];
  const NOMS = { cavalier: 'le cavalier', fou: 'le fou', tour: 'la tour', dame: 'la dame' };
  const DE = { cavalier: 'du cavalier', fou: 'du fou', tour: 'de la tour', dame: 'de la dame' };
  const majuscule = (s) => s[0].toUpperCase() + s.slice(1);

  // cases où la pièce peut aller depuis `c`
  function coups(piece, c, obstacles) {
    const [f, r] = coord(c);
    const res = [];
    if (piece === 'cavalier') {
      for (const [df, dr] of SAUTS) {
        const g = f + df, s = r + dr;
        if (dedans(g, s) && !obstacles.has(nom(g, s))) res.push(nom(g, s));
      }
      return res;
    }
    for (const [df, dr] of DIRECTIONS[piece]) {
      let g = f + df, s = r + dr;
      while (dedans(g, s) && !obstacles.has(nom(g, s))) { res.push(nom(g, s)); g += df; s += dr; }
    }
    return res;
  }
  // parcours en largeur : distance (en coups) et case précédente pour chaque case atteignable
  function parcourir(piece, depart, obstacles) {
    const dist = { [depart]: 0 };
    const avant = {};
    const file = [depart];
    while (file.length) {
      const c = file.shift();
      for (const n of coups(piece, c, obstacles)) {
        if (n in dist) continue;
        dist[n] = dist[c] + 1;
        avant[n] = c;
        file.push(n);
      }
    }
    return { dist, avant };
  }
  function chemin(piece, depart, arrivee, obstacles) {
    const { avant, dist } = parcourir(piece, depart, obstacles);
    if (!(arrivee in dist)) return null;
    const res = [arrivee];
    while (res[0] !== depart) res.unshift(avant[res[0]]);
    return res;
  }

  // ---------- Génération ----------
  const entre = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const auHasard = (t) => t[Math.floor(Math.random() * t.length)];
  // nombre d'obstacles et longueur du plus court chemin, selon le niveau et la pièce
  const NIVEAUX = {
    facile: { detour: false, cavalier: [[6, 10], [2, 3]], fou: [[8, 12], [2, 3]], tour: [[8, 12], [2, 3]], dame: [[10, 16], [2, 3]] },
    moyen: { detour: true, cavalier: [[12, 18], [3, 5]], fou: [[16, 22], [3, 5]], tour: [[16, 24], [3, 5]], dame: [[20, 28], [3, 4]] },
    difficile: { detour: true, cavalier: [[16, 24], [5, 7]], fou: [[20, 28], [5, 7]], tour: [[22, 30], [5, 7]], dame: [[24, 32], [4, 6]] },
  };
  function generer(piece, niveau = 'moyen') {
    const N = NIVEAUX[niveau];
    const [nbObstacles, longueur] = N[piece];
    for (let essai = 0; essai < 4000; essai++) {
      // des petits murs (1 à 4 cases, en ligne ou en colonne), comme sur une fiche d'exercices
      const obstacles = new Set();
      const voulu = entre(...nbObstacles);
      while (obstacles.size < voulu) {
        let f = entre(0, 7), r = entre(0, 7);
        const horizontal = Math.random() < 0.5;
        for (let i = entre(1, 4); i > 0 && dedans(f, r); i--) { obstacles.add(nom(f, r)); horizontal ? f++ : r++; }
      }
      const libres = [];
      for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) if (!obstacles.has(nom(f, r))) libres.push(nom(f, r));
      const depart = auHasard(libres);
      const avec = parcourir(piece, depart, obstacles).dist;
      const sans = parcourir(piece, depart, new Set()).dist;
      // la maison : à la bonne distance et (sauf cavalier et niveau facile) les obstacles obligent à un détour
      const relache = essai > 3500;
      const maisons = Object.keys(avec).filter(c => avec[c] >= (relache ? 2 : longueur[0]) && avec[c] <= longueur[1] &&
        (!N.detour || piece === 'cavalier' || relache || avec[c] > sans[c]));
      if (maisons.length) {
        const maison = auHasard(maisons);
        return { piece, obstacles, depart, maison, optimal: avec[maison], graine: entre(1, 999) };
      }
    }
    return null;
  }

  // ---------- Dessin des obstacles ----------
  // Tous les obstacles sont dessinés dans une seule image posée sur les 64 cases (800 × 800 unités,
  // 100 par case) : pas de raccord entre les cases, et un décor continu. Chaque case d'obstacle donne
  // un rectangle dont les côtés touchant un autre obstacle vont jusqu'au bord : coins arrondis à
  // l'extérieur, coins rentrants creusés en arc. Les obstacles voisins forment un seul mur, une seule
  // mare, une seule coulée, une seule haie.
  const MARGE = 5, BORD = 6, RAYON = 24;
  // hasard fixé par la position (le décor ne bouge pas d'un affichage à l'autre)
  const bruit = (i, j, k = 0) => { const x = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return x - Math.floor(x); };
  const n1 = (v) => Math.round(v * 10) / 10;

  // rectangle (x0, y0, x1, y1) ; chaque coin : ['arrondi', r] | ['rentrant', r] | ['droit']
  function contour(x0, y0, x1, y1, [hg, hd, bd, bg]) {
    let d = hg[0] === 'droit' ? `M${x0} ${y0}` : `M${x0 + hg[1]} ${y0}`;
    const coin = (c, px, py, ax, ay, bx, by) => { // (px,py) coin ; on arrive par (ax,ay), on repart vers (bx,by)
      if (c[0] === 'droit') return `L${px} ${py}`;
      const r = c[1];
      return `L${px + ax * r} ${py + ay * r}A${r} ${r} 0 0 ${c[0] === 'arrondi' ? 1 : 0} ${px + bx * r} ${py + by * r}`;
    };
    d += coin(hd, x1, y0, -1, 0, 0, 1);
    d += coin(bd, x1, y1, 0, -1, -1, 0);
    d += coin(bg, x0, y1, 1, 0, 0, -1);
    d += coin(hg, x0, y0, 0, 1, 1, 0);
    return d + 'Z';
  }

  function dessinCalque(theme, obstacles, graine = 7) {
    const occ = (f, r) => dedans(f, r) && obstacles.has(nom(f, r));
    const cases = [...obstacles].map(c => { const [f, r] = coord(c); return { f, r, X: f * 100, Y: (7 - r) * 100 }; });
    // m : retrait depuis le bord de la case (côtés libres)
    const forme = (m) => cases.map(({ f, r, X, Y }) => {
      const n = occ(f, r + 1), s = occ(f, r - 1), e = occ(f + 1, r), o = occ(f - 1, r);
      const D = 0.8; // léger chevauchement entre cases voisines
      const coin = (a, b, diag) => (!a && !b ? ['arrondi', RAYON - (m - MARGE)] : a && b && !diag ? ['rentrant', m] : ['droit']);
      return contour(X + (o ? -D : m), Y + (n ? -D : m), X + 100 + (e ? D : -m), Y + 100 + (s ? D : -m),
        [coin(n, o, occ(f - 1, r + 1)), coin(n, e, occ(f + 1, r + 1)), coin(s, e, occ(f + 1, r - 1)), coin(s, o, occ(f - 1, r - 1))]);
    }).join('');
    const exterieur = forme(MARGE);
    const interieur = forme(MARGE + BORD);
    // un point du décor est utile s'il touche une case d'obstacle
    const utile = (X, Y, rayon) => {
      for (let f = Math.floor((X - rayon) / 100); f <= Math.floor((X + rayon) / 100); f++)
        for (let l = Math.floor((Y - rayon) / 100); l <= Math.floor((Y + rayon) / 100); l++) if (occ(f, 7 - l)) return true;
      return false;
    };
    // un point est « dedans » s'il est dans la partie pleine d'une case d'obstacle
    const dedansObstacle = (X, Y, retrait) => {
      const f = Math.floor(X / 100), l = Math.floor(Y / 100), r = 7 - l;
      if (!occ(f, r)) return false;
      const x = X - f * 100, y = Y - l * 100;
      return (occ(f - 1, r) || x > retrait) && (occ(f + 1, r) || x < 100 - retrait) && (occ(f, r + 1) || y > retrait) && (occ(f, r - 1) || y < 100 - retrait);
    };
    // grille décalée (comme des briques), avec un peu de désordre
    const grille = (pasX, pasY, fn) => {
      let t = '';
      for (let j = -1; j * pasY < 820; j++) for (let i = -1; i * pasX < 820; i++) {
        const X = i * pasX + (j % 2 ? pasX / 2 : 0) + (bruit(i, j, 1) - 0.5) * pasX * 0.25;
        const Y = j * pasY + (bruit(i, j, 2) - 0.5) * pasY * 0.25;
        t += fn(X, Y, i, j);
      }
      return t;
    };

    // Rendu réaliste avec les filtres SVG : bruit (feTurbulence) pour le grain, les vagues et la lave,
    // éclairage (feDiffuseLighting / feSpecularLighting) pour le relief, ombres intérieures pour la profondeur.
    const G = graine;
    const zone = 'filterUnits="userSpaceOnUse" x="-30" y="-30" width="860" height="860" color-interpolation-filters="sRGB"';
    const lumiere = (az = 235, el = 50) => `<feDistantLight azimuth="${az}" elevation="${el}"/>`;
    // alpha d'un résultat -> image en niveaux d'alpha seulement (pour s'en servir comme relief)
    const alphaDe = (entree, sortie) => `<feColorMatrix in="${entree}" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="${sortie}"/>`;
    // ombre à l'intérieur de la forme (bord qui fait de l'ombre), ajoutée par-dessus `entree`
    const ombreInterieure = (entree, flou, dy, couleur, force, sortie) =>
      `<feComponentTransfer in="SourceAlpha" result="${sortie}-inv"><feFuncA type="table" tableValues="1 0"/></feComponentTransfer>` +
      `<feGaussianBlur in="${sortie}-inv" stdDeviation="${flou}" result="${sortie}-flou"/>` +
      `<feOffset in="${sortie}-flou" dy="${dy}" result="${sortie}-dec"/>` +
      `<feFlood flood-color="${couleur}" flood-opacity="${force}"/>` +
      `<feComposite in2="${sortie}-dec" operator="in" result="${sortie}-ombre"/>` +
      `<feComposite in="${sortie}-ombre" in2="SourceAlpha" operator="in" result="${sortie}-dedans"/>` +
      `<feMerge result="${sortie}"><feMergeNode in="${entree}"/><feMergeNode in="${sortie}-dedans"/></feMerge>`;
    // grain d'une matière minérale (sable, roche, mortier)
    const filtreGrain = (id, frequence, relief, clair) =>
      `<filter id="${id}" ${zone}><feTurbulence type="fractalNoise" baseFrequency="${frequence}" numOctaves="4" seed="${G + 3}" result="g"/>` +
      `<feDiffuseLighting in="g" surfaceScale="${relief}" diffuseConstant="1" lighting-color="#fff" result="l">${lumiere(235, 55)}</feDiffuseLighting>` +
      `<feComposite in="SourceGraphic" in2="l" operator="arithmetic" k1="${clair}" k2="${1 - clair * 0.75}" result="c"/>` +
      `<feComposite in="c" in2="SourceAlpha" operator="in"/></filter>`;
    const ombrePortee = `<filter id="f-ombre" ${zone}><feGaussianBlur stdDeviation="7"/></filter>`;

    // contour : seulement le bord extérieur (sinon chaque case aurait son trait)
    const masqueBord = `<mask id="m-bord" maskUnits="userSpaceOnUse" x="-30" y="-30" width="860" height="860"><rect x="-30" y="-30" width="860" height="860" fill="#fff"/><path d="${exterieur}" fill="#000"/></mask>`;
    const bordExterieur = (couleur, opacite) => `<path d="${exterieur}" fill="none" stroke="${couleur}" stroke-opacity="${opacite}" stroke-width="4" mask="url(#m-bord)"/>`;
    let defs = ombrePortee + masqueBord, corps = '';
    // déformation irrégulière d'une forme (rives, bords de trou…) ; même graine = même déformation
    const filtreDeforme = (id, frequence, ampleur, graineD) =>
      `<filter id="${id}" ${zone}><feTurbulence type="fractalNoise" baseFrequency="${frequence}" numOctaves="2" seed="${graineD}" result="t"/>` +
      `<feDisplacementMap in="SourceGraphic" in2="t" scale="${ampleur}" xChannelSelector="R" yChannelSelector="G"/></filter>`;
    // ombre portée qui suit la silhouette d'un groupe
    const filtreOmbreGroupe = (id, flou, dx, dy, force) =>
      `<filter id="${id}" ${zone}><feGaussianBlur in="SourceAlpha" stdDeviation="${flou}"/><feOffset dx="${dx}" dy="${dy}" result="o"/>` +
      `<feFlood flood-color="#141820" flood-opacity="${force}"/><feComposite in2="o" operator="in" result="ombre"/>` +
      `<feMerge><feMergeNode in="ombre"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

    if (theme === 'pierre') {
      // mur de pierres sèches : la silhouette suit les pierres (elles dépassent plus ou moins),
      // le mortier reste en retrait entre elles
      const teintes = ['#BDB2A0', '#C8BEAB', '#AFA492', '#D2C8B6', '#B6AB98', '#A49A89', '#C2B5A0'];
      // maçonnerie : 4 assises par case, alignées d'une case à l'autre ; sur chaque assise, des pierres de
      // largeurs variées posées bout à bout sur toute la longueur de la rangée d'obstacles ; sur les côtés
      // libres, chaque pierre s'arrête un peu plus tôt ou plus tard : le bord du mur suit les pierres.
      const ASSISE = 25, JOINT = 3;
      let pierres = '';
      for (let l = 0; l < 8; l++) {
        const r = 7 - l;
        for (let k = 0; k < 4; k++) {
          // rangées continues d'obstacles sur cette ligne
          for (let f = 0; f < 8; f++) {
            if (!occ(f, r) || occ(f - 1, r)) continue;
            let fin = f;
            while (occ(fin + 1, r)) fin++;
            const y0 = l * 100 + k * ASSISE;
            let x = f * 100 + 2 + bruit(f, l * 4 + k, 30) * 6;
            const xFin = (fin + 1) * 100 - 2 - bruit(fin, l * 4 + k, 31) * 6;
            let n = 0;
            while (x < xFin - 4) {
              let w = 30 + bruit(f * 13 + n, l * 4 + k, 32) * 22;
              if (xFin - (x + w) < 20) w = xFin - x; // pas de petit bout à la fin
              // haut et bas de la pierre : en retrait si le côté est libre (bord irrégulier)
              const fx = Math.floor((x + w / 2) / 100);
              const hautLibre = k === 0 && !occ(fx, r + 1), basLibre = k === 3 && !occ(fx, r - 1);
              const yh = y0 + JOINT / 2 + (hautLibre ? 2 + bruit(n, l * 4 + k, 33) * 7 : 0);
              const yb = y0 + ASSISE - JOINT / 2 - (basLibre ? 2 + bruit(n, l * 4 + k, 34) * 7 : 0);
              pierres += `<rect x="${n1(x)}" y="${n1(yh)}" width="${n1(w - JOINT)}" height="${n1(yb - yh)}" rx="${n1(5 + bruit(n, k, 35) * 5)}" fill="${teintes[Math.floor(bruit(f * 7 + n, l * 4 + k, 36) * teintes.length)]}"/>`;
              x += w;
              n++;
            }
          }
        }
      }
      defs += filtreGrain('f-mortier', '.35', 1.4, 0.9) + filtreDeforme('f-mortier-bord', '.06', 10, G + 6) +
        filtreOmbreGroupe('f-ombre-mur', 5, 3, 9, 0.45) +
        `<filter id="f-pierres" ${zone}>` +
        `<feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves="4" seed="${G}" result="grain"/>` +
        `<feDisplacementMap in="SourceGraphic" in2="grain" scale="5" xChannelSelector="R" yChannelSelector="G" result="forme"/>` +
        alphaDe('forme', 'a') + `<feGaussianBlur in="a" stdDeviation="3" result="bosse"/>` +
        `<feDiffuseLighting in="bosse" surfaceScale="4.5" diffuseConstant="1" lighting-color="#fff" result="ombrage">${lumiere(235, 55)}</feDiffuseLighting>` +
        `<feSpecularLighting in="bosse" surfaceScale="4.5" specularConstant=".22" specularExponent="22" lighting-color="#FFF6E8" result="brillant">${lumiere(235, 50)}</feSpecularLighting>` +
        `<feTurbulence type="fractalNoise" baseFrequency=".5" numOctaves="3" seed="${G + 1}" result="fin"/>` +
        `<feDiffuseLighting in="fin" surfaceScale="1.3" diffuseConstant="1" lighting-color="#fff" result="rugueux">${lumiere(235, 62)}</feDiffuseLighting>` +
        `<feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="${G + 4}" result="taches"/>` +
        `<feColorMatrix in="taches" type="matrix" values="0 0 0 .35 .65  0 0 0 .35 .63  0 0 0 .35 .6  0 0 0 0 1" result="nuances"/>` +
        `<feComposite in="forme" in2="ombrage" operator="arithmetic" k1="1.05" k2=".12" result="x1"/>` +
        `<feComposite in="x1" in2="rugueux" operator="arithmetic" k1=".55" k2=".5" result="x2"/>` +
        `<feComposite in="x2" in2="nuances" operator="arithmetic" k1="1.12" result="x2b"/>` +
        `<feComposite in="x2b" in2="brillant" operator="arithmetic" k2="1" k3=".25" result="x3"/>` +
        `<feComposite in="x3" in2="forme" operator="in" result="pierres"/>` +
        `<feGaussianBlur in="a" stdDeviation="2.4" result="af"/><feOffset in="af" dx="2" dy="3" result="ad"/>` +
        `<feFlood flood-color="#1E1A15" flood-opacity=".65"/><feComposite in2="ad" operator="in" result="ombreP"/>` +
        `<feMerge><feMergeNode in="ombreP"/><feMergeNode in="pierres"/></feMerge></filter>`;
      corps = `<g filter="url(#f-ombre-mur)">` +
        `<g filter="url(#f-mortier-bord)"><path d="${forme(MARGE + 6)}" fill="#5F574C" filter="url(#f-mortier)"/></g>` +
        `<g filter="url(#f-pierres)">${pierres}</g></g>`;
    } else if (theme === 'eau') {
      // étang : rive irrégulière (herbe puis sable), eau profonde, roseaux et nénuphars
      const bordsLibres = [];
      cases.forEach(({ f, r, X, Y }) => {
        const cotes = [[!occ(f, r + 1), 'n'], [!occ(f, r - 1), 's'], [!occ(f - 1, r), 'o'], [!occ(f + 1, r), 'e']];
        for (const [libre, cote] of cotes) if (libre) bordsLibres.push({ f, r, X, Y, cote });
      });
      const roseaux = bordsLibres.filter(b => bruit(b.f, b.r, b.cote.charCodeAt(0)) > 0.5).map(b => {
        const t = 22 + bruit(b.f, b.r, b.cote.charCodeAt(0) + 1) * 56;
        const [x, y] = { n: [b.X + t, b.Y + 13], s: [b.X + t, b.Y + 92], o: [b.X + 11, b.Y + t + 10], e: [b.X + 89, b.Y + t + 10] }[b.cote];
        let g = '';
        for (let k = 0; k < 5; k++) {
          const dx = (k - 2) * 3.2 + (bruit(b.f, k, 3) - 0.5) * 3, h = 20 + bruit(b.r, k, 4) * 16, pench = (k - 2) * 2.5;
          g += `<path d="M${n1(x + dx)} ${n1(y)}q${n1(pench * 0.4)} ${n1(-h * 0.5)} ${n1(pench)} ${n1(-h)}" fill="none" stroke="${k % 2 ? '#5C7E35' : '#6E9442'}" stroke-width="1.8" stroke-linecap="round"/>`;
          if (k === 1 || k === 3) g += `<rect x="${n1(x + dx + pench - 2.6)}" y="${n1(y - h - 5)}" width="5.2" height="12" rx="2.6" fill="#6B3F22"/><path d="M${n1(x + dx + pench)} ${n1(y - h - 5)}v-5" stroke="#5C7E35" stroke-width="1.2"/>`;
        }
        g += `<path d="M${n1(x - 3)} ${n1(y)}q-9-10-13-24" fill="none" stroke="#7FA44E" stroke-width="2.6" stroke-linecap="round"/>` +
          `<path d="M${n1(x + 4)} ${n1(y)}q8-9 10-21" fill="none" stroke="#6E9442" stroke-width="2.4" stroke-linecap="round"/>`;
        return `<g>${g}</g>`;
      }).join('');
      const nenuphars = grille(70, 62, (X, Y, i, j) => {
        if (!dedansObstacle(X, Y, 30) || bruit(i, j, 20) < 0.8) return '';
        const a = bruit(i, j, 21) * 360;
        return `<g transform="rotate(${n1(a)} ${n1(X)} ${n1(Y)})"><path d="M${n1(X)} ${n1(Y)}L${n1(X + 10)} ${n1(Y - 3)}A10.5 10.5 0 1 1 ${n1(X + 10)} ${n1(Y + 3)}Z" fill="#4E8F3A" stroke="#36692A" stroke-width="1.2"/>` +
          (bruit(i, j, 22) > 0.5 ? `<circle cx="${n1(X - 3)}" cy="${n1(Y)}" r="4.2" fill="#F4B8CF"/><circle cx="${n1(X - 3)}" cy="${n1(Y)}" r="1.8" fill="#FFE07A"/>` : '') + `</g>`;
      });
      defs += filtreGrain('f-herbe', '.5', 1.6, 0.85).replace('<feTurbulence', `<feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves="2" seed="${G + 8}" result="d0"/><feDisplacementMap in="SourceGraphic" in2="d0" scale="26" xChannelSelector="R" yChannelSelector="G" result="src"/><feTurbulence`).replace('in="SourceGraphic" in2="l"', 'in="src" in2="l"').replace('in="c" in2="SourceAlpha"', 'in="c" in2="src"') +
        filtreGrain('f-sable', '.6', 1.2, 0.85).replace('<feTurbulence', `<feTurbulence type="fractalNoise" baseFrequency=".025" numOctaves="2" seed="${G + 9}" result="d0"/><feDisplacementMap in="SourceGraphic" in2="d0" scale="22" xChannelSelector="R" yChannelSelector="G" result="src"/><feTurbulence`).replace('in="SourceGraphic" in2="l"', 'in="src" in2="l"').replace('in="c" in2="SourceAlpha"', 'in="c" in2="src"') +
        filtreDeforme('f-rive-eau', '.028', 18, G + 10) +
        `<linearGradient id="g-profond" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="800" y2="800"><stop offset="0" stop-color="#3496D8"/><stop offset="1" stop-color="#1C64A6"/></linearGradient>` +
        `<filter id="f-eau" ${zone}>` +
        `<feTurbulence type="fractalNoise" baseFrequency=".011 .032" numOctaves="3" seed="${G}" result="vagues"/>` +
        `<feDiffuseLighting in="vagues" surfaceScale="5" diffuseConstant="1" lighting-color="#fff" result="relief">${lumiere(250, 60)}</feDiffuseLighting>` +
        `<feSpecularLighting in="vagues" surfaceScale="6" specularConstant="1.1" specularExponent="30" lighting-color="#fff" result="reflets">${lumiere(250, 38)}</feSpecularLighting>` +
        `<feComposite in="SourceGraphic" in2="relief" operator="arithmetic" k1=".75" k2=".42" result="x1"/>` +
        `<feComposite in="x1" in2="reflets" operator="arithmetic" k2="1" k3=".65" result="x2"/>` +
        ombreInterieure('x2', 7, 6, '#0A3157', 0.8, 'x3') +
        `<feComposite in="x3" in2="SourceAlpha" operator="in"/></filter>`;
      corps = `<path d="${forme(MARGE - 5)}" fill="#6F9A45" filter="url(#f-herbe)"/>` +
        `<path d="${forme(MARGE + 3)}" fill="#D3C08E" filter="url(#f-sable)"/>` +
        `<g filter="url(#f-rive-eau)"><path d="${forme(MARGE + 12)}" fill="url(#g-profond)" filter="url(#f-eau)"/></g>` +
        nenuphars + roseaux;
    } else if (theme === 'lave') {
      // trou de lave dans un sol craquelé : bord irrégulier, fissures, parois sombres, lueur
      defs += `<filter id="f-sol" ${zone}>` +
        `<feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="${G + 9}" result="t"/>` +
        `<feDisplacementMap in="SourceGraphic" in2="t" scale="26" xChannelSelector="R" yChannelSelector="G" result="d"/>` +
        `<feTurbulence type="fractalNoise" baseFrequency=".3" numOctaves="3" seed="${G + 3}" result="g"/>` +
        `<feDiffuseLighting in="g" surfaceScale="2.2" diffuseConstant="1" lighting-color="#fff" result="l">${lumiere(235, 55)}</feDiffuseLighting>` +
        `<feComposite in="d" in2="l" operator="arithmetic" k1=".95" k2=".3" result="sol"/>` +
        `<feTurbulence type="turbulence" baseFrequency=".05" numOctaves="2" seed="${G + 10}" result="fis"/>` +
        `<feColorMatrix in="fis" type="matrix" values="0 0 0 0 .08  0 0 0 0 .04  0 0 0 0 .03  -9 0 0 0 1.5" result="fissures"/>` +
        `<feMerge result="m"><feMergeNode in="sol"/><feMergeNode in="fissures"/></feMerge>` +
        `<feComposite in="m" in2="d" operator="in"/></filter>` +
        filtreDeforme('f-trou', '.035', 20, G + 11) +
        `<filter id="f-lueur" ${zone}><feGaussianBlur stdDeviation="10"/></filter>` +
        `<filter id="f-lave" ${zone}>` +
        `<feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="4" seed="${G}" result="b1"/>` +
        `<feColorMatrix in="b1" type="matrix" values="2.8 0 0 0 -.9  2.8 0 0 0 -.9  2.8 0 0 0 -.9  0 0 0 0 1" result="gris"/>` +
        `<feComponentTransfer in="gris" result="fusion">` +
        `<feFuncR type="table" tableValues=".42 .72 .93 1 1"/><feFuncG type="table" tableValues=".05 .14 .33 .62 .9"/><feFuncB type="table" tableValues=".02 .03 .05 .12 .45"/></feComponentTransfer>` +
        `<feTurbulence type="fractalNoise" baseFrequency=".032" numOctaves="3" seed="${G + 5}" result="b2"/>` +
        `<feColorMatrix in="b2" type="matrix" values="0 0 0 0 .2  0 0 0 0 .08  0 0 0 0 .06  -11 0 0 0 4.8" result="plaques"/>` +
        `<feTurbulence type="fractalNoise" baseFrequency=".3" numOctaves="3" seed="${G + 7}" result="rugo"/>` +
        `<feDiffuseLighting in="rugo" surfaceScale="2" diffuseConstant="1.1" lighting-color="#fff" result="lrugo">${lumiere()}</feDiffuseLighting>` +
        `<feComposite in="plaques" in2="lrugo" operator="arithmetic" k1="1" k2=".2" result="plaquesR"/>` +
        `<feComposite in="plaquesR" in2="plaques" operator="in" result="plaquesF"/>` +
        `<feMerge result="x1"><feMergeNode in="fusion"/><feMergeNode in="plaquesF"/></feMerge>` +
        ombreInterieure('x1', 9, 7, '#140502', 0.92, 'x2') +
        `<feComposite in="x2" in2="SourceAlpha" operator="in"/></filter>`;
      corps = `<path d="${forme(MARGE - 5)}" fill="#53443A" filter="url(#f-sol)"/>` +
        `<g filter="url(#f-trou)">` +
        `<path d="${forme(MARGE + 12)}" fill="#FF6A1A" opacity=".9" filter="url(#f-lueur)"/>` +
        `<path d="${forme(MARGE + 15)}" fill="#1E0E08"/>` +
        `<path d="${forme(MARGE + 20)}" fill="#000" filter="url(#f-lave)"/></g>`;
    } else { // buisson : haie de touffes bombées (chacune éclairée en haut à gauche), contour feuillu, baies
      const teintes = [['#7DCB6F', '#3E9A4A', '#1D5A2A'], ['#8AD27A', '#47A453', '#22652F'], ['#6FBF64', '#358E43', '#184F24'], ['#94D884', '#4FAD59', '#286E34']];
      let gradients = '';
      teintes.forEach(([a, b, c], k) => {
        gradients += `<radialGradient id="g-touffe-${k}" cx=".5" cy=".5" r=".55" fx=".34" fy=".3">` +
          `<stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`;
      });
      const liste = [];
      grille(30, 26, (X, Y, i, j) => {
        if (dedansObstacle(X, Y, 13)) liste.push({ X, Y, r: 18 + bruit(i, j, 14) * 7, k: Math.floor(bruit(i, j, 15) * teintes.length), i, j });
        return '';
      });
      liste.sort((a, b) => a.Y - b.Y); // celles du bas recouvrent celles du haut
      const touffes = liste.map(t => `<circle cx="${n1(t.X)}" cy="${n1(t.Y)}" r="${n1(t.r)}" fill="url(#g-touffe-${t.k})"/>`).join('');
      const baies = liste.filter(t => bruit(t.i, t.j, 16) > 0.84).map(t => {
        const x = t.X + (bruit(t.i, t.j, 17) - 0.2) * 10, y = t.Y + (bruit(t.i, t.j, 18) - 0.2) * 10;
        return `<circle cx="${n1(x)}" cy="${n1(y)}" r="3.8" fill="#C42F2A"/><circle cx="${n1(x + 5.5)}" cy="${n1(y + 2.5)}" r="3.4" fill="#A9231E"/>` +
          `<circle cx="${n1(x - 1.2)}" cy="${n1(y - 1.3)}" r="1.2" fill="#FFFFFF" opacity=".85"/>`;
      }).join('');
      defs += gradients + `<filter id="f-haie" ${zone}>` +
        `<feTurbulence type="fractalNoise" baseFrequency=".11" numOctaves="3" seed="${G}" result="contour"/>` +
        `<feDisplacementMap in="SourceGraphic" in2="contour" scale="13" xChannelSelector="R" yChannelSelector="G" result="forme"/>` +
        `<feTurbulence type="fractalNoise" baseFrequency=".2" numOctaves="2" seed="${G + 2}" result="feuilles"/>` +
        `<feDiffuseLighting in="feuilles" surfaceScale="2.6" diffuseConstant="1" lighting-color="#fff" result="lfeuilles">${lumiere(235, 58)}</feDiffuseLighting>` +
        `<feComposite in="forme" in2="lfeuilles" operator="arithmetic" k1=".75" k2=".4" result="x1"/>` +
        `<feComposite in="x1" in2="forme" operator="in"/></filter>`;
      corps = `<path d="${exterieur}" transform="translate(4 11)" fill="#0E2414" opacity=".5" filter="url(#f-ombre)"/>` +
        `<g filter="url(#f-haie)"><path d="${interieur}" fill="#1B4F26"/>${touffes}</g>${baies}`;
    }
    return `<defs>${defs}</defs>${corps}`;
  }

  // ---------- État ----------
  const lireTexte = (cle, defaut) => { try { return localStorage.getItem(cle) || defaut; } catch (e) { return defaut; } };
  const ecrireTexte = (cle, v) => { try { localStorage.setItem(cle, v); } catch (e) { /* stockage indisponible */ } };
  const choix = { piece: 'hasard', obstacle: 'hasard' }; // au hasard par défaut, à chaque visite
  const reglages = {
    niveau: lireTexte('echecs.laby.niveau', 'moyen'),
    possibles: Prefs.lire('echecs.laby.possibles', false),
    coordonnees: Prefs.lire('echecs.laby.coordonnees', true),
  };
  if (!NIVEAUX[reglages.niveau]) reglages.niveau = 'moyen';
  const jeu = { mode: 'libre', laby: null, theme: 'pierre', parcours: [], fini: false, aide: false, voir: false, anim: false, solution: null, partie: 0 };
  const defi = { chrono: false, numero: 0, resultats: [], debut: 0, fin: 0, raf: 0, dernierTic: 0, niveau: 'moyen' };
  const ici = () => jeu.parcours[jeu.parcours.length - 1];

  // ---------- Affichage ----------
  const cellule = (c) => plateau.querySelector(`[data-case="${c}"]`);
  function dessiner() {
    const L = jeu.laby;
    Echiquier.dessiner(plateau, '8/8/8/8/8/8/8/8');
    for (const c of L.obstacles) {
      cellule(c).classList.add('bloquee');
      cellule(c).setAttribute('aria-label', `${c} : obstacle`);
    }
    dessinerObstacles();
    const maison = cellule(L.maison);
    maison.classList.add('maison');
    maison.insertAdjacentHTML('beforeend',
      `<svg class="maison-dessin" viewBox="0 0 100 100" aria-hidden="true">` +
      `<path d="M50 9 93 47H81v44H19V47H7Z" class="maison-trace"/>` +
      `<use href="#piece-${L.piece}-noir" x="24" y="38" width="52" height="52" class="maison-fantome"/></svg>`);
    maison.setAttribute('aria-label', `${L.maison} : maison ${DE[L.piece]}`);
    poserPiece(ici());
    majMarques();
  }
  // on ne redessine que les obstacles (changer de matière ne change pas la partie)
  function dessinerObstacles() {
    const ancien = plateau.querySelector('.calque-obstacles');
    if (ancien) ancien.remove();
    plateau.insertAdjacentHTML('beforeend',
      `<svg class="calque-obstacles" viewBox="0 0 800 800" aria-hidden="true">${dessinCalque(jeu.theme, jeu.laby.obstacles, jeu.laby.graine)}</svg>`);
    majBulle();
  }
  // petite image d'un obstacle seul (boutons, bulle du cavalier), avec ses propres identifiants
  function imageObstacle(theme, suffixe) {
    const contenu = dessinCalque(theme, new Set(['d4']), 11)
      .replace(/id="([^"]+)"/g, `id="$1-${suffixe}"`).replace(/url\(#([^)]+)\)/g, `url(#$1-${suffixe})`);
    return contenu;
  }
  // bulle d'explication pour le cavalier (avec la matière en cours)
  function majBulle() {
    const cavalier = jeu.laby.piece === 'cavalier';
    $('bulle-cavalier').hidden = !cavalier;
    if (cavalier && $('bulle-obstacle').dataset.theme !== jeu.theme) {
      $('bulle-obstacle').innerHTML = imageObstacle(jeu.theme, 'bulle');
      $('bulle-obstacle').dataset.theme = jeu.theme;
    }
  }
  function poserPiece(c) {
    const ancienne = plateau.querySelector('.piece-laby');
    if (ancienne) ancienne.remove();
    cellule(c).insertAdjacentHTML('beforeend',
      `<svg class="piece-e piece-laby" viewBox="0 0 100 100" aria-hidden="true"><use href="#piece-${jeu.laby.piece}-noir"/></svg>`);
  }
  // numéros du chemin parcouru, cases possibles, solution, compteurs
  function majMarques() {
    plateau.querySelectorAll('.etape').forEach(e => e.remove());
    Echiquier.effacer(plateau, 'possible', 'chemin');
    jeu.parcours.slice(1).forEach((c, i) => {
      cellule(c).insertAdjacentHTML('beforeend', `<span class="etape" aria-hidden="true">${i + 1}</span>`);
      cellule(c).classList.add('chemin');
    });
    if (jeu.solution) {
      jeu.solution.slice(jeu.parcours.length).forEach((c, i) => {
        cellule(c).insertAdjacentHTML('beforeend', `<span class="etape solution" aria-hidden="true">${jeu.parcours.length + i}</span>`);
      });
    }
    if (!jeu.fini && (reglages.possibles || jeu.voir)) montrerPossibles();
    const joues = jeu.parcours.length - 1;
    $('nb-coups').textContent = joues;
    $('nb-coups').parentElement.classList.toggle('depasse', joues > jeu.laby.optimal);
    $('btn-annuler').disabled = joues < 1 || jeu.fini;
    $('btn-recommencer').disabled = joues < 1 && !jeu.solution;
    $('btn-solution').disabled = jeu.fini;
    $('btn-passer').disabled = jeu.fini;
  }
  const montrerPossibles = () => Echiquier.marquer(plateau, coups(jeu.laby.piece, ici(), jeu.laby.obstacles), 'possible');

  // ---------- Partie ----------
  function nouveau() {
    const piece = choix.piece === 'hasard' ? auHasard(PIECES) : choix.piece;
    if (choix.obstacle === 'hasard') jeu.theme = auHasard(THEMES);
    jeu.laby = generer(piece, jeu.mode === 'defi' ? defi.niveau : reglages.niveau);
    demarrer();
  }
  function demarrer() {
    jeu.partie++;
    jeu.parcours = [jeu.laby.depart];
    jeu.fini = false;
    jeu.aide = false;
    jeu.voir = false;
    jeu.anim = false;
    jeu.solution = null;
    $('resultats').hidden = true;
    $('pluie').innerHTML = '';
    $('retour').hidden = true;
    $('consigne').textContent = `Ramène ${NOMS[jeu.laby.piece]} à sa maison`;
    $('nb-optimal').textContent = jeu.laby.optimal;
    dessiner();
  }

  function toucher(c) {
    if (jeu.fini || jeu.anim) return;
    if (c === ici()) { // la pièce : on montre (ou cache) où elle peut aller
      jeu.voir = !jeu.voir;
      majMarques();
      return;
    }
    if (!coups(jeu.laby.piece, ici(), jeu.laby.obstacles).includes(c)) { refuser(c); return; }
    jouer(c, true);
  }
  function refuser(c) {
    Sons.refus();
    const el = cellule(c);
    if (el) { el.classList.remove('refus'); void el.offsetWidth; el.classList.add('refus'); }
    // sur un obstacle, la case clignote dans l'image des obstacles
    const calque = plateau.querySelector('.calque-obstacles');
    if (calque && jeu.laby.obstacles.has(c)) {
      const [f, r] = coord(c);
      calque.insertAdjacentHTML('beforeend', `<rect class="flash" x="${f * 100}" y="${(7 - r) * 100}" width="100" height="100" rx="18"/>`);
      setTimeout(() => { const fl = calque.querySelector('.flash'); if (fl) fl.remove(); }, 500);
    }
    jeu.voir = true; // on montre les cases possibles
    majMarques();
  }
  function jouer(c, animer) {
    const de = ici();
    const fin = () => {
      jeu.anim = false;
      jeu.parcours.push(c);
      if (jeu.solution && jeu.solution[jeu.parcours.length - 1] !== c) jeu.solution = null; // on a quitté la solution
      Sons.pose(3);
      poserPiece(c);
      if (c === jeu.laby.maison) arriver();
      majMarques();
    };
    jeu.voir = false;
    Echiquier.effacer(plateau, 'possible');
    if (!animer) { fin(); return; }
    jeu.anim = true;
    glisser(de, c, fin);
  }
  // la pièce glisse jusqu'à sa nouvelle case
  function glisser(de, a, fin) {
    const piece = plateau.querySelector('.piece-laby');
    const r1 = cellule(de).getBoundingClientRect();
    const r2 = cellule(a).getBoundingClientRect();
    const dx = r2.left - r1.left, dy = r2.top - r1.top;
    if (!piece || !piece.animate) { fin(); return; }
    const cases = Math.max(Math.abs(dx), Math.abs(dy)) / r1.width;
    cellule(de).style.zIndex = 3;
    const p = jeu.partie;
    const anim = piece.animate([
      { transform: 'translate(0, 0) scale(1)' },
      { transform: `translate(${dx / 2}px, ${dy / 2}px) scale(1.12)`, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(1)` },
    ], { duration: Math.min(650, 260 + cases * 70), easing: 'ease-in-out', fill: 'forwards' });
    anim.onfinish = () => {
      const el = cellule(de);
      if (el) el.style.zIndex = '';
      if (p === jeu.partie) fin();
    };
  }

  // ---------- Glisser-déposer ----------
  // Un appui sur la pièce suivi d'un déplacement : une copie suit le doigt, les cases possibles s'affichent,
  // et la pièce est posée là où on lâche (si le coup est permis). Un simple toucher reste un clic.
  const glisse = { actif: false, parti: false, x: 0, y: 0, id: null, fantome: null, ignorerClic: false };
  const caseSous = (x, y) => {
    const el = document.elementFromPoint(x, y);
    const c = el && el.closest ? el.closest('#echiquier .case-e') : null;
    return c ? c.dataset.case : null;
  };
  plateau.addEventListener('pointerdown', (e) => {
    if (jeu.fini || jeu.anim || !e.target.closest('.piece-laby')) return;
    e.preventDefault();
    Object.assign(glisse, { actif: true, parti: false, x: e.clientX, y: e.clientY, id: e.pointerId });
  });
  window.addEventListener('pointermove', (e) => {
    if (!glisse.actif || e.pointerId !== glisse.id) return;
    if (!glisse.parti) {
      if (Math.hypot(e.clientX - glisse.x, e.clientY - glisse.y) < 6) return;
      glisse.parti = true;
      const piece = plateau.querySelector('.piece-laby');
      const taille = cellule(ici()).getBoundingClientRect().width * 1.15;
      glisse.fantome = piece.cloneNode(true);
      glisse.fantome.classList.add('piece-glissee');
      glisse.fantome.style.width = glisse.fantome.style.height = `${taille}px`;
      document.body.appendChild(glisse.fantome);
      piece.classList.add('en-main');
      jeu.voir = true;
      majMarques();
    }
    const t = glisse.fantome.getBoundingClientRect().width;
    glisse.fantome.style.transform = `translate(${e.clientX - t / 2}px, ${e.clientY - t * 0.62}px)`;
    Echiquier.effacer(plateau, 'visee');
    const sous = caseSous(e.clientX, e.clientY);
    if (sous && sous !== ici()) cellule(sous).classList.add('visee');
  });
  function lacher(e) {
    if (!glisse.actif || e.pointerId !== glisse.id) return;
    glisse.actif = false;
    if (!glisse.parti) return; // simple toucher : géré par le clic
    glisse.ignorerClic = true;
    setTimeout(() => { glisse.ignorerClic = false; }, 0);
    glisse.fantome.remove();
    Echiquier.effacer(plateau, 'visee');
    const piece = plateau.querySelector('.piece-laby');
    if (piece) piece.classList.remove('en-main');
    if (jeu.fini) return;
    const c = e.type === 'pointercancel' ? null : caseSous(e.clientX, e.clientY);
    if (!c || c === ici()) { jeu.voir = false; majMarques(); return; }
    if (!coups(jeu.laby.piece, ici(), jeu.laby.obstacles).includes(c)) { refuser(c); return; }
    jouer(c, false);
  }
  window.addEventListener('pointerup', lacher);
  window.addEventListener('pointercancel', lacher);

  // ---------- Arrivée ----------
  const etoilesPour = (n, opt) => (n === opt ? 3 : n <= opt + 2 ? 2 : 1);
  function arriver() {
    jeu.fini = true;
    const n = jeu.parcours.length - 1;
    const opt = jeu.laby.optimal;
    if (jeu.mode === 'defi') { finLabyrintheDefi(n, false); return; }
    let etoiles = etoilesPour(n, opt);
    if (jeu.aide) etoiles = Math.min(etoiles, 1);
    const p = jeu.partie;
    setTimeout(() => {
      if (p !== jeu.partie) return;
      $('res-titre').textContent = n === opt && !jeu.aide ? 'Parfait !' : 'Bravo !';
      $('res-detail').innerHTML =
        `${majuscule(NOMS[jeu.laby.piece])} est rentré${jeu.laby.piece === 'tour' || jeu.laby.piece === 'dame' ? 'e' : ''} en <b>${n} coup${n > 1 ? 's' : ''}</b>.<br>` +
        (n === opt ? 'C\'est le chemin le plus court !' : `Le chemin le plus court se fait en <b>${opt} coups</b>.`) +
        (jeu.aide ? '<br><small>Avec l\'aide de la solution.</small>' : '');
      allumerEtoiles($('etoiles'), etoiles);
      $('resultats').hidden = false;
      $('btn-res-nouveau').focus({ preventScroll: true });
      lancerPluie($('pluie'), etoiles === 3 ? 70 : 35);
      if (etoiles === 3) Sons.victoire(); else Sons.bravo();
    }, 450);
  }

  function annuler() {
    if (jeu.mode !== 'libre' || jeu.parcours.length < 2 || jeu.fini || jeu.anim) return;
    jeu.parcours.pop();
    poserPiece(ici());
    Sons.retire();
    majMarques();
  }
  function montrerSolution() {
    if (jeu.mode !== 'libre' || jeu.fini || jeu.anim) return;
    jeu.solution = [...jeu.parcours.slice(0, -1), ...chemin(jeu.laby.piece, ici(), jeu.laby.maison, jeu.laby.obstacles)];
    jeu.aide = true;
    majMarques();
  }

  // ---------- Défis ----------
  const ICONE_JUSTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const ICONE_FAUX = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';
  function construirePoints() {
    $('points').innerHTML = Array.from({ length: NB_DEFIS }, (_, i) => `<li aria-label="Labyrinthe ${i + 1}"></li>`).join('');
  }
  function majPoints() {
    $('points').querySelectorAll('li').forEach((li, i) => {
      const r = defi.resultats[i];
      li.className = r ? (r.ok ? 'ok' : 'rate') : (i === defi.numero ? 'actuel' : '');
    });
  }
  function lancerDefi(chrono) {
    fermerChoix();
    preparer('defi');
    defi.chrono = chrono;
    defi.niveau = reglages.niveau;
    document.body.dataset.chrono = chrono ? 'oui' : 'non';
    defi.numero = 0;
    defi.resultats = [];
    $('minuteur-barre').style.transform = 'scaleX(1)';
    construirePoints();
    lancerLabyrintheDefi();
  }
  function lancerLabyrintheDefi() {
    $('titre').textContent = `Labyrinthe ${defi.numero + 1} sur ${NB_DEFIS}`;
    nouveau();
    majPoints();
    defi.debut = performance.now();
    if (defi.chrono) demarrerChrono();
  }
  // n : coups joués (null si passé ou temps écoulé). Réussi = arrivé par le chemin le plus court.
  function finLabyrintheDefi(n, tempsEcoule) {
    arreterChrono();
    jeu.fini = true;
    const opt = jeu.laby.optimal;
    const ok = n === opt;
    defi.resultats.push({ ok, n, opt, temps: (performance.now() - defi.debut) / 1000 });
    majPoints();
    if (ok) Sons.juste(); else Sons.echec();
    $('verdict').innerHTML = (ok ? ICONE_JUSTE : ICONE_FAUX) +
      `<span>${tempsEcoule ? 'Temps écoulé !' : n === null ? 'Passé' : ok ? 'Le plus court !' : 'Arrivé !'}</span>`;
    $('retour-detail').innerHTML = n === null
      ? `Le chemin le plus court se faisait en <b>${opt} coups</b> (en pointillé).`
      : ok ? `${opt} coup${opt > 1 ? 's' : ''} : impossible de faire mieux.` : `${n} coups, mais on pouvait le faire en <b>${opt}</b>.`;
    $('retour').className = `retour ${ok ? 'juste' : 'faux'}`;
    $('retour').hidden = false;
    // pas arrivé : on montre le chemin le plus court
    if (n === null) jeu.solution = [...jeu.parcours.slice(0, -1), ...chemin(jeu.laby.piece, ici(), jeu.laby.maison, jeu.laby.obstacles)];
    majMarques();
    $('btn-suivant').firstChild.textContent = defi.numero === NB_DEFIS - 1 ? 'Voir le résultat ' : 'Suivant ';
    $('btn-suivant').focus({ preventScroll: true });
  }
  function suivant() {
    if (jeu.mode !== 'defi' || !jeu.fini) return;
    defi.numero++;
    if (defi.numero >= NB_DEFIS) { montrerResultats(); return; }
    lancerLabyrintheDefi();
  }
  function demarrerChrono() {
    arreterChrono();
    const barre = $('minuteur-barre');
    defi.fin = performance.now() + DUREE * 1000;
    defi.dernierTic = 0;
    const p = jeu.partie;
    const boucle = (t) => {
      if (p !== jeu.partie || jeu.fini) return;
      const reste = Math.max(0, defi.fin - t) / 1000;
      barre.style.transform = `scaleX(${(reste / DUREE).toFixed(4)})`;
      document.body.classList.toggle('presse', reste <= 5);
      const s = Math.ceil(reste);
      if (reste <= 5 && s > 0 && s !== defi.dernierTic) { defi.dernierTic = s; Sons.tic(); }
      if (reste <= 0) { finLabyrintheDefi(null, true); return; }
      defi.raf = requestAnimationFrame(boucle);
    };
    defi.raf = requestAnimationFrame(boucle);
  }
  function arreterChrono() {
    cancelAnimationFrame(defi.raf);
    document.body.classList.remove('presse');
  }
  function montrerResultats() {
    arreterChrono();
    const score = defi.resultats.filter(r => r.ok).length;
    const etoiles = score === NB_DEFIS ? 3 : score >= 7 ? 2 : score >= 4 ? 1 : 0;
    $('resd-titre').textContent = score === NB_DEFIS ? 'Parfait !' : score >= 7 ? 'Bravo !' : score >= 4 ? 'Bien joué !' : 'Continue, tu progresses !';
    allumerEtoiles($('etoiles-defi'), etoiles);
    $('res-liste').innerHTML = defi.resultats.map((r, i) =>
      `<li class="${r.ok ? 'ok' : 'rate'}" style="animation-delay:${700 + i * 70}ms" aria-label="Labyrinthe ${i + 1} : ${r.n === null ? 'pas fini' : `${r.n} coups, le plus court ${r.opt}`}">` +
      `<span class="res-rond">${r.ok ? ICONES.ok : ICONES.rate}</span><span class="res-t">${r.n === null ? '–' : r.n} / ${r.opt}</span></li>`).join('');
    const total = defi.resultats.reduce((s, r) => s + r.temps, 0);
    $('res-temps').textContent = `Temps total : ${formaterDuree(total)}`;
    $('resultats-defi').hidden = false;
    $('btn-rejouer-defi').focus({ preventScroll: true });
    compterJusqua($('res-score'), score);
    lancerPluie($('pluie-defi'), etoiles >= 1 ? 70 : 30);
    Sons.victoire();
  }

  // ---------- Modes ----------
  function preparer(mode) {
    jeu.partie++;
    arreterChrono();
    $('resultats').hidden = true;
    $('resultats-defi').hidden = true;
    $('pluie').innerHTML = '';
    $('pluie-defi').innerHTML = '';
    jeu.mode = mode;
    document.body.dataset.mode = mode;
  }
  function lancerLibre() {
    preparer('libre');
    document.body.dataset.chrono = 'non';
    $('titre').textContent = 'Le labyrinthe';
    nouveau();
  }
  function ouvrirChoix() {
    $('choix-niveau').textContent = `niveau ${reglages.niveau}`;
    $('choix-defi').hidden = false;
    $('mode-defi').focus({ preventScroll: true });
  }
  function fermerChoix() { $('choix-defi').hidden = true; }

  // ---------- Choix de la pièce et des obstacles ----------
  function brancherChoix(id, cle, quandChange) {
    const boutons = [...$(id).querySelectorAll('button')];
    const maj = () => boutons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.valeur === choix[cle])));
    boutons.forEach(b => b.addEventListener('click', () => { choix[cle] = b.dataset.valeur; maj(); quandChange(); }));
    maj();
  }
  // autre pièce : nouveau labyrinthe (il dépend de la pièce)
  brancherChoix('choix-piece', 'piece', () => { if (jeu.mode === 'libre') nouveau(); });
  // autre matière : on redessine seulement les obstacles, la partie continue
  brancherChoix('choix-obstacle', 'obstacle', () => {
    jeu.theme = choix.obstacle === 'hasard' ? auHasard(THEMES.filter(t => t !== jeu.theme)) : choix.obstacle;
    dessinerObstacles();
  });

  // ---------- Branchements ----------
  plateau.addEventListener('click', (e) => {
    if (glisse.ignorerClic) return;
    const c = e.target.closest('.case-e');
    if (c) toucher(c.dataset.case);
  });
  $('btn-annuler').addEventListener('click', annuler);
  $('btn-recommencer').addEventListener('click', () => { if (!jeu.anim) demarrer(); });
  $('btn-solution').addEventListener('click', montrerSolution);
  $('btn-nouveau').addEventListener('click', nouveau);
  $('btn-res-nouveau').addEventListener('click', nouveau);
  $('btn-res-rejouer').addEventListener('click', demarrer);
  $('btn-passer').addEventListener('click', () => { if (jeu.mode === 'defi' && !jeu.fini && !jeu.anim) finLabyrintheDefi(null, false); });
  $('btn-suivant').addEventListener('click', suivant);
  $('btn-defis').addEventListener('click', ouvrirChoix);
  $('btn-fermer-choix').addEventListener('click', () => { fermerChoix(); $('btn-defis').focus(); });
  $('choix-defi').addEventListener('click', (e) => { if (e.target === e.currentTarget) fermerChoix(); });
  $('mode-defi').addEventListener('click', () => lancerDefi(false));
  $('mode-chrono').addEventListener('click', () => lancerDefi(true));
  $('btn-retour').addEventListener('click', lancerLibre);
  $('btn-menu').addEventListener('click', lancerLibre);
  $('btn-rejouer-defi').addEventListener('click', () => lancerDefi(defi.chrono));
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest('input, textarea')) return;
    if (!$('choix-defi').hidden) { if (e.key === 'Escape') fermerChoix(); return; }
    if (!$('resultats').hidden || !$('resultats-defi').hidden) return;
    if (e.key === 'Backspace' || e.key.toLowerCase() === 'z') { e.preventDefault(); annuler(); }
    if (e.key === 'Enter' && jeu.mode === 'defi' && jeu.fini && !e.target.closest('button')) { e.preventDefault(); suivant(); }
  });

  // ---------- Réglages ----------
  brancherBoutonTheme($('btn-theme'));
  brancherReglages($('btn-reglages'), $('panneau-reglages'));
  const segNiveau = [...$('reg-niveau').querySelectorAll('button')];
  const majNiveau = () => segNiveau.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.niveau === reglages.niveau)));
  segNiveau.forEach(b => b.addEventListener('click', () => {
    if (reglages.niveau === b.dataset.niveau) return;
    reglages.niveau = b.dataset.niveau;
    ecrireTexte('echecs.laby.niveau', reglages.niveau);
    majNiveau();
    if (jeu.mode === 'libre') nouveau();
  }));
  brancherInterrupteur($('reg-possibles'), reglages.possibles, (v) => { reglages.possibles = v; Prefs.ecrire('echecs.laby.possibles', v); majMarques(); });
  const appliquerCoord = () => document.body.classList.toggle('sans-coordonnees', !reglages.coordonnees);
  brancherInterrupteur($('reg-coordonnees'), reglages.coordonnees, (v) => { reglages.coordonnees = v; Prefs.ecrire('echecs.laby.coordonnees', v); appliquerCoord(); });
  brancherInterrupteur($('reg-son'), Sons.actif, (v) => { Sons.actif = v; });

  // ---------- Démarrage ----------
  window.Echecs.injecterSprite();
  // boutons des obstacles : même rendu que sur l'échiquier
  $('choix-obstacle').querySelectorAll('button[data-valeur]:not([data-valeur="hasard"])').forEach(b => {
    b.querySelector('svg').outerHTML = `<svg viewBox="298 398 104 104" aria-hidden="true">${imageObstacle(b.dataset.valeur, `bouton-${b.dataset.valeur}`)}</svg>`;
  });
  majNiveau();
  appliquerCoord();
  lancerLibre();
  // pour les tests
  window.Labyrinthe = { generer, parcourir, coups, chemin, etat: () => jeu, defi: () => defi, dessinCalque };
})();
