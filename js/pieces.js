/* Pièces d'échecs partagées par tous les jeux : valeurs, noms et dessins.
   Deux dessins au choix (réglage « Pièces », retenu pour tout le site) :
   - « classiques » : le jeu de Colin M. L. Burnett (Cburnett, Wikimedia Commons), sous licence BSD
     (il est aussi publié sous GFDL et GPL) ; copie des fichiers SVG de lichess-org/lila, couleurs reliées au thème ;
   - « simples » : les pièces dessinées pour le site.
   Script classique (pas de module) pour que le site marche aussi en ouvrant
   les fichiers directement depuis le disque.
   Les couleurs viennent des variables CSS --piece-* (thème clair ou sombre). */
(function () {
  const EN = document.documentElement.lang === 'en';
  const PIECES = [
    { id: 'pion',     valeur: 1, nom: EN ? { blanc: 'a white pawn', noir: 'a black pawn' } : { blanc: 'un pion blanc',     noir: 'un pion noir' } },
    { id: 'cavalier', valeur: 3, nom: EN ? { blanc: 'a white knight', noir: 'a black knight' } : { blanc: 'un cavalier blanc', noir: 'un cavalier noir' } },
    { id: 'fou',      valeur: 3, nom: EN ? { blanc: 'a white bishop', noir: 'a black bishop' } : { blanc: 'un fou blanc',      noir: 'un fou noir' } },
    { id: 'tour',     valeur: 5, nom: EN ? { blanc: 'a white rook', noir: 'a black rook' } : { blanc: 'une tour blanche',  noir: 'une tour noire' } },
    { id: 'dame',     valeur: 9, nom: EN ? { blanc: 'a white queen', noir: 'a black queen' } : { blanc: 'une dame blanche',  noir: 'une dame noire' } },
  ];

  const TEINTES = {
    blanc: { corps: 'var(--piece-blanc)', trait: 'var(--piece-blanc-trait)', detail: 'var(--piece-blanc-trait)' },
    noir:  { corps: 'var(--piece-noir)',  trait: 'var(--piece-noir-trait)',  detail: 'var(--piece-noir-detail)' },
  };

  // Pièces simples : dessins dans une boîte de 100 × 100, socle commun en bas.
  const SOCLE = '<path d="M18 92 H82 A4 4 0 0 0 86 88 V84 A6 6 0 0 0 80 78 H20 A6 6 0 0 0 14 84 V88 A4 4 0 0 0 18 92 Z"/>';
  const SIMPLES = {
    pion: () =>
      '<path d="M33 78 C33 66 39 58 43 52 H57 C61 58 67 66 67 78 Z"/>' +
      '<rect x="35" y="44" width="30" height="9" rx="4.5"/>' +
      '<circle cx="50" cy="29" r="15"/>',
    tour: () =>
      '<path d="M30 78 L33 46 H67 L70 78 Z"/>' +
      '<path d="M25 46 V18 H37 V27 H44.5 V18 H55.5 V27 H63 V18 H75 V46 Z"/>',
    fou: (t) =>
      '<path d="M33 78 C35 67 41 61 43 57 H57 C59 61 65 67 67 78 Z"/>' +
      '<rect x="35" y="49" width="30" height="9" rx="4.5"/>' +
      '<path d="M50 15 C38 24 32 34 34 41 C36 47 42 50 50 50 C58 50 64 47 66 41 C68 34 62 24 50 15 Z"/>' +
      '<circle cx="50" cy="10" r="5.5"/>' +
      `<path d="M57 26 L47 38" style="fill:none;stroke:${t.detail}" stroke-width="4"/>`,
    cavalier: (t) =>
      '<path d="M29 78 C29 66 34 58 41 52 C35 52 30 54 25 56 C17 59 12 52 16 46 L33 26 C35 22 37 17 40 14 L44 8 L49 17 C66 20 76 35 75 54 C75 63 72 70 71 78 Z"/>' +
      `<circle cx="37" cy="32" r="3.5" style="fill:${t.detail};stroke:none"/>` +
      `<path d="M52 22 C63 28 68 40 67 58" style="fill:none;stroke:${t.detail}" stroke-width="3"/>`,
    dame: () =>
      '<path d="M30 78 L36 52 H64 L70 78 Z"/>' +
      '<rect x="32" y="44" width="36" height="9" rx="4.5"/>' +
      '<path d="M31 45 L23 20 L38 32 L50 14 L62 32 L77 20 L69 45 Z"/>' +
      '<circle cx="23" cy="18" r="5"/><circle cx="50" cy="11" r="5"/><circle cx="77" cy="18" r="5"/>',
    // le roi n'a pas de valeur (il n'est pas dans PIECES) mais il est dessiné pour les jeux qui en ont besoin
    roi: () =>
      '<path d="M30 78 L35 51 H65 L70 78 Z"/>' +
      '<rect x="31" y="43" width="38" height="9" rx="4.5"/>' +
      '<path d="M34 44 C26 35 32 23 43 27 L50 31 L57 27 C68 23 74 35 66 44 Z"/>' +
      '<path d="M46.5 5 H53.5 V12 H60 V18.5 H53.5 V27 H46.5 V18.5 H40 V12 H46.5 Z"/>',
  };

  // Pièces classiques (Cburnett), boîte de 45 × 45. {C} corps, {T} trait, {D} détails clairs des pièces noires.
  const CLASSIQUES = {
    roi: {
      blanc: '<g style="fill:none;stroke:{T}" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path stroke-linejoin="miter" d="M22.5 11.63V6M20 8h5"/><path style="fill:{C}" stroke-linecap="butt" stroke-linejoin="miter" d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/><path style="fill:{C}" d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10z"/><path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/></g>',
      noir: '<g style="fill:none;stroke:{T}" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path stroke-linejoin="miter" d="M22.5 11.6V6"/><path style="fill:{C}" stroke-linecap="butt" stroke-linejoin="miter" d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/><path style="fill:{C}" d="M11.5 37a22.3 22.3 0 0 0 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10z"/><path stroke-linejoin="miter" d="M20 8h5"/><path style="stroke:{D}" d="M32 29.5s8.5-4 6-9.7C34.1 14 25 18 22.5 24.6v2.1-2.1C20 18 9.9 14 7 19.9c-2.5 5.6 4.8 9 4.8 9"/><path style="stroke:{D}" d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/></g>',
    },
    dame: {
      blanc: '<g style="fill:{C};stroke:{T}" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0m16.5-4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0M41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0M16 8.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0M33 9a2 2 0 1 1-4 0 2 2 0 1 1 4 0"/><path stroke-linecap="butt" d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14V25L7 14z"/><path stroke-linecap="butt" d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><path style="fill:none" d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0"/></g>',
      noir: '<g style="stroke:{T}" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><g style="stroke:none"><circle cx="6" cy="12" r="2.75"/><circle cx="14" cy="9" r="2.75"/><circle cx="22.5" cy="8" r="2.75"/><circle cx="31" cy="9" r="2.75"/><circle cx="39" cy="12" r="2.75"/></g><path stroke-linecap="butt" d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5z"/><path stroke-linecap="butt" d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><path style="fill:none" stroke-linecap="butt" d="M11 38.5a35 35 1 0 0 23 0"/><path style="fill:none;stroke:{D}" d="M11 29a35 35 1 0 1 23 0m-21.5 2.5h20m-21 3a35 35 1 0 0 22 0m-23 3a35 35 1 0 0 24 0"/></g>',
    },
    tour: {
      blanc: '<g style="fill:{C};stroke:{T}" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path stroke-linecap="butt" d="M9 39h27v-3H9zm3-3v-4h21v4zm-1-22V9h4v2h5V9h5v2h5V9h4v5"/><path d="m34 14-3 3H14l-3-3"/><path stroke-linecap="butt" stroke-linejoin="miter" d="M31 17v12.5H14V17"/><path d="m31 29.5 1.5 2.5h-20l1.5-2.5"/><path style="fill:none" stroke-linejoin="miter" d="M11 14h23"/></g>',
      noir: '<g style="stroke:{T}" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path stroke-linecap="butt" d="M9 39h27v-3H9zm3.5-7 1.5-2.5h17l1.5 2.5zm-.5 4v-4h21v4z"/><path stroke-linecap="butt" stroke-linejoin="miter" d="M14 29.5v-13h17v13z"/><path stroke-linecap="butt" d="M14 16.5 11 14h23l-3 2.5zM11 14V9h4v2h5V9h5v2h5V9h4v5z"/><path style="fill:none;stroke:{D}" stroke-linejoin="miter" stroke-width="1" d="M12 35.5h21m-20-4h19m-18-2h17m-17-13h17M11 14h23"/></g>',
    },
    fou: {
      blanc: '<g style="fill:none;stroke:{T}" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><g style="fill:{C}" stroke-linecap="butt"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.94 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g><path stroke-linejoin="miter" d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5"/></g>',
      noir: '<g style="fill:none;stroke:{T}" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><g style="fill:{C}" stroke-linecap="butt"><path d="M9 36c3.4-1 10.1.4 13.5-2 3.4 2.4 10.1 1 13.5 2 0 0 1.6.5 3 2-.7 1-1.6 1-3 .5-3.4-1-10.1.5-13.5-1-3.4 1.5-10.1 0-13.5 1-1.4.5-2.3.5-3-.5 1.4-2 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g><path style="stroke:{D}" stroke-linejoin="miter" d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5"/></g>',
    },
    cavalier: {
      blanc: '<g style="fill:none;stroke:{T}" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path style="fill:{C}" d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"/><path style="fill:{C}" d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3"/><path style="fill:{T}" d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0m5.433-9.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5"/></g>',
      noir: '<g style="fill:none;stroke:{T}" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path style="fill:{C}" d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"/><path style="fill:{C}" d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.04-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-1-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-2 2.5-3c1 0 1 3 1 3"/><path style="fill:{D};stroke:{D}" d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0m5.43-9.75a.5 1.5 30 1 1-.86-.5.5 1.5 30 1 1 .86.5"/><path style="fill:{D};stroke:none" d="m24.55 10.4-.45 1.45.5.15c3.15 1 5.65 2.49 7.9 6.75S35.75 29.06 35.25 39l-.05.5h2.25l.05-.5c.5-10.06-.88-16.85-3.25-21.34s-5.79-6.64-9.19-7.16z"/></g>',
    },
    pion: {
      blanc: '<path style="fill:{C};stroke:{T}" stroke-linecap="round" stroke-width="1.5" d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"/>',
      noir: '<path style="stroke:{T}" stroke-linecap="round" stroke-width="1.5" d="M22.5 9a4 4 0 0 0-3.22 6.38 6.48 6.48 0 0 0-.87 10.65c-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47a6.46 6.46 0 0 0-.87-10.65A4.01 4.01 0 0 0 22.5 9z"/>',
    },
  };

  // Petit pion des icônes (symbole #mini-pion des pages, boîte de 10 × 12) : même dessin que les pièces choisies.
  const MINI_PION = {
    classiques: '<path d="M5 .8a1.36 1.36 0 0 0-1.1 2.18 2.21 2.21 0 0 0-.3 3.63c-1.02.36-2.53 1.89-2.53 4.59h7.84c0-2.7-1.5-4.23-2.53-4.59a2.2 2.2 0 0 0-.3-3.63A1.37 1.37 0 0 0 5 .8z"/>',
    simples: '<circle cx="5" cy="3.2" r="2.4"/><path d="M2 11.2h6L7 7.3H3Z"/>',
  };
  function majMiniPion() {
    const symbole = document.getElementById('mini-pion');
    if (symbole) symbole.innerHTML = MINI_PION[jeu];
  }

  const CLE = 'echecs.pieces.classiques';
  const JEUX = {
    classiques: { boite: 45, dessin: (id, t) => CLASSIQUES[id][t.couleur].replace(/\{C\}/g, t.corps).replace(/\{T\}/g, t.trait).replace(/\{D\}/g, t.detail) },
    simples: { boite: 100, dessin: (id, t) => `<g style="fill:${t.corps};stroke:${t.trait}" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">${SIMPLES[id](t)}${SOCLE}</g>` },
  };
  const lirePref = () => (window.Commun ? Commun.Prefs.lire(CLE, true) : true);
  let jeu = lirePref() ? 'classiques' : 'simples';

  // Dessin d'une pièce (contenu SVG) ; boite() donne la taille du viewBox du dessin choisi.
  function dessin(id, couleur, nomJeu = jeu) {
    return JEUX[nomJeu].dessin(id, { couleur, ...TEINTES[couleur] });
  }
  const boite = (nomJeu = jeu) => JEUX[nomJeu].boite;

  function symboles() {
    let html = '';
    for (const id of Object.keys(SIMPLES)) {
      for (const c of ['blanc', 'noir']) {
        html += `<symbol id="piece-${id}-${c}" viewBox="0 0 ${boite()} ${boite()}">${dessin(id, c)}</symbol>`;
      }
    }
    return html;
  }

  // Ajoute une fois pour toutes les symboles SVG des pièces dans la page.
  // On les utilise ensuite avec <use href="#piece-dame-blanc"/>.
  function injecterSprite() {
    if (document.getElementById('sprite-pieces')) return;
    const conteneur = document.createElement('div');
    conteneur.innerHTML = `<svg id="sprite-pieces" width="0" height="0" style="position:absolute" aria-hidden="true">${symboles()}</svg>`;
    document.body.prepend(conteneur.firstChild);
    majMiniPion();
    ajouterReglage();
  }

  // Change de dessin : les <use> de la page se mettent à jour tout seuls.
  function choisirJeu(nomJeu) {
    jeu = nomJeu;
    if (window.Commun) Commun.Prefs.ecrire(CLE, nomJeu === 'classiques');
    const sprite = document.getElementById('sprite-pieces');
    if (sprite) sprite.innerHTML = symboles();
    majMiniPion();
    document.querySelectorAll('#reg-pieces button').forEach(b => b.setAttribute('aria-pressed', b.dataset.pieces === jeu ? 'true' : 'false'));
  }

  // Réglage « Pièces » ajouté au bas du panneau de réglages des jeux (s'il y en a un).
  function ajouterReglage() {
    const panneau = document.getElementById('panneau-reglages');
    if (!panneau || document.getElementById('reg-pieces')) return;
    const EN = document.documentElement.lang === 'en';
    const apercu = (nomJeu) => `<svg viewBox="0 0 ${2 * boite(nomJeu)} ${boite(nomJeu)}" width="52" height="26" aria-hidden="true">` +
      `<g>${dessin('cavalier', 'blanc', nomJeu)}</g><g transform="translate(${boite(nomJeu)} 0)">${dessin('dame', 'noir', nomJeu)}</g></svg>`;
    const bloc = document.createElement('div');
    bloc.className = 'ligne-reglage-bloc';
    bloc.innerHTML =
      '<span class="ligne-titre"><svg viewBox="0 0 24 24"><use href="#piece-cavalier-blanc" width="24" height="24"/></svg>' +
      (EN ? 'Pieces' : 'Pièces') + '</span>' +
      `<div class="segments" id="reg-pieces" role="group" aria-label="${EN ? 'Piece style' : 'Dessin des pièces'}">` +
      `<button type="button" data-pieces="classiques">${apercu('classiques')}<small>${EN ? 'Classic' : 'Classiques'}</small></button>` +
      `<button type="button" data-pieces="simples">${apercu('simples')}<small>${EN ? 'Simple' : 'Simples'}</small></button></div>`;
    panneau.append(bloc);
    bloc.querySelectorAll('button').forEach(b => b.addEventListener('click', () => choisirJeu(b.dataset.pieces)));
    choisirJeu(jeu);
  }

  // Points façon dé pour lire une valeur sans savoir lire les nombres (1, 3, 5, 9).
  const MOTIFS = { 1: [4], 3: [0, 4, 8], 5: [0, 2, 4, 6, 8], 9: [0, 1, 2, 3, 4, 5, 6, 7, 8] };
  function pastilles(valeur) {
    return (MOTIFS[valeur] || []).map(i =>
      `<circle cx="${5 + (i % 3) * 10}" cy="${5 + Math.floor(i / 3) * 10}" r="3.4"/>`).join('');
  }

  window.Echecs = Object.assign(window.Echecs || {}, { PIECES, dessin, boite, injecterSprite, choisirJeu, pastilles });
})();
