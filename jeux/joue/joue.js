/* Jeu : joue le coup
   On choisit un champion, une de ses parties se joue toute seule sur l'échiquier (vu du côté du champion),
   et aux moments importants, c'est l'enfant qui joue le coup du champion :
   - facile : le coup est écrit, il faut le jouer sur l'échiquier ;
   - difficile : il faut le trouver.
   L'indice montre la pièce qui doit bouger ; « Montre-moi » montre le coup. */
(function () {
  const { EN, t, Prefs, brancherBoutonTheme, brancherReglages, brancherInterrupteur } = window.Commun;
  // les parties sont rangées dans un fichier par champion (parties/<clé>.js), chargé quand on le choisit
  const INDEX = window.PARTIES_INDEX;
  const COACH = window.PARTIES_COACH || {};
  const somme = (o) => Object.values(o).reduce((a, b) => a + (Array.isArray(b) ? b.length : b), 0);
  const TOTAL = somme(INDEX);
  const SRC = (document.currentScript && document.currentScript.src) || '';
  const VERSION = SRC.split('?v=')[1] || '';
  // dossier de ce script : les pages anglaises (en/) chargent les mêmes fichiers
  const BASE = SRC ? SRC.split('?')[0].replace(/[^/]*$/, '') : '';
  // portrait : la photo (Wikimedia Commons) quand il y en a une, sinon le dessin
  const PHOTOS = window.PHOTOS_CHAMPIONS || {};
  const portrait = (cle) => (PHOTOS[cle]
    ? `<img class="portrait photo" src="${BASE}photos/${cle}.jpg${VERSION ? '?v=' + VERSION : ''}" alt="" loading="lazy" decoding="async">`
    : window.Portraits.svg(cle));
  const chargements = {};
  function charger(cle) {
    if (window.PARTIES_CH && window.PARTIES_CH[cle]) return Promise.resolve(window.PARTIES_CH[cle]);
    if (!chargements[cle]) chargements[cle] = new Promise((ok, ko) => {
      const sc = document.createElement('script');
      sc.src = `${BASE}parties/${cle}.js${VERSION ? '?v=' + VERSION : ''}`;
      sc.onload = () => ok(window.PARTIES_CH[cle]);
      sc.onerror = () => { delete chargements[cle]; ko(new Error('chargement')); };
      document.head.appendChild(sc);
    });
    return chargements[cle];
  }
  const CHAMPIONS = window.Portraits.CHAMPIONS;
  const $ = (id) => document.getElementById(id);
  const plateau = $('echiquier');

  const lireTexte = (cle, defaut) => { try { return localStorage.getItem(cle) || defaut; } catch (e) { return defaut; } };
  const ecrireTexte = (cle, v) => { try { localStorage.setItem(cle, v); } catch (e) { /* stockage indisponible */ } };
  const reglages = {
    langue: lireTexte('echecs.joue.langue', 'fr'),
    vitesse: lireTexte('echecs.joue.vitesse', 'normal'),
    niveau: lireTexte('echecs.joue.niveau', 'facile'),
    coordonnees: Prefs.lire('echecs.joue.coordonnees', true),
    coach: Prefs.lire('echecs.joue.coach', false),
  };
  const DELAI = { lent: 2300, normal: 1400, rapide: 750 };

  // ---------- Notation ----------
  const LETTRES = { fr: { K: 'R', Q: 'D', R: 'T', B: 'F', N: 'C' }, en: { K: 'K', Q: 'Q', R: 'R', B: 'B', N: 'N' } };
  const PIECE_LETTRE = { K: 'roi', Q: 'dame', R: 'tour', B: 'fou', N: 'cavalier' };
  const traduire = (san) => san.replace(/[KQRBN]/g, (c) => LETTRES[reglages.langue][c]);
  const echapper = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const figurine = (piece, couleur) => `<svg class="fig" viewBox="0 0 100 100" aria-hidden="true"><use href="#piece-${piece}-${couleur}"/></svg>`;
  // le coup écrit en grand : la pièce dessinée, puis la notation
  function coupEcrit(san, couleur) {
    const piece = /^[KQRBN]/.test(san) ? PIECE_LETTRE[san[0]] : /^O-O/.test(san) ? 'roi' : 'pion';
    return `${figurine(piece, couleur)}<span>${echapper(traduire(san))}</span>`;
  }

  // ---------- Positions ----------
  const TYPES = { p: 'pion', n: 'cavalier', b: 'fou', r: 'tour', q: 'dame', k: 'roi' };
  const LETTRE = { pion: 'p', cavalier: 'n', fou: 'b', tour: 'r', dame: 'q', roi: 'k' };
  const VALEUR = { pion: 1, cavalier: 3, fou: 3, tour: 5, dame: 9, roi: 4 };
  const DEPART = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
  function versFen(pos) {
    const lignes = [];
    for (let r = 8; r >= 1; r--) {
      let l = '', vide = 0;
      for (const c of 'abcdefgh') {
        const p = pos[c + r];
        if (!p) { vide++; continue; }
        if (vide) { l += vide; vide = 0; }
        const x = LETTRE[p.piece];
        l += p.couleur === 'blanc' ? x.toUpperCase() : x;
      }
      lignes.push(l + (vide || ''));
    }
    return lignes.join('/');
  }
  // joue un coup « e2e4 » (ou « e7e8q ») : nouvelle position, trajets à animer, case de la pièce prise
  function appliquer(pos, uci) {
    const de = uci.slice(0, 2), a = uci.slice(2, 4), promo = uci[4];
    const p = pos[de];
    const n = { ...pos };
    const trajets = [[de, a]];
    let prise = pos[a] ? a : null;
    delete n[de];
    if (p.piece === 'pion' && de[0] !== a[0] && !pos[a]) { prise = a[0] + de[1]; delete n[prise]; } // en passant
    if (p.piece === 'roi' && Math.abs(de.charCodeAt(0) - a.charCodeAt(0)) === 2) { // roque : la tour suit
      const r = de[1], [tde, ta] = a[0] === 'g' ? ['h' + r, 'f' + r] : ['a' + r, 'd' + r];
      n[ta] = n[tde]; delete n[tde]; trajets.push([tde, ta]);
    }
    n[a] = promo ? { piece: TYPES[promo], couleur: p.couleur } : p;
    return { pos: n, trajets, prise };
  }

  // ---------- État ----------
  const jeu = {
    partie: null, cle: null, couleur: 'blanc', orientation: 'blanc', coups: [], san: [], positions: [], moments: new Map(),
    ply: 0, etat: 'choix', erreurs: 0, indice: false, montre: false, resultats: {}, minuterie: 0, anim: 0,
    selection: null, legaux: new Map(), recentes: [], uniques: new Set(), vue: null,
  };
  const nomChampion = () => (jeu.cle !== 'autres' ? CHAMPIONS[jeu.cle].nom : jeu.couleur === 'blanc' ? jeu.partie.bl : jeu.partie.no);
  const nomAdversaire = () => (jeu.couleur === 'blanc' ? jeu.partie.no : jeu.partie.bl);
  // nom court : le nom de famille, sauf pour les noms où il vient en premier (Ju Wenjun) ou qu'on n'utilise pas (Humpy, Gukesh)
  const COURTS = { 'Ju Wenjun': 'Ju Wenjun', 'Tan Zhongyi': 'Tan Zhongyi', 'Lei Tingjie': 'Lei Tingjie', 'Zhu Jiner': 'Zhu Jiner', 'Ding Liren': 'Ding Liren',
    'Koneru Humpy': 'Humpy', 'Gukesh Dommaraju': 'Gukesh', 'Rameshbabu Praggnanandhaa': 'Praggnanandhaa', 'Vaishali Rameshbabu': 'Vaishali',
    'Divya Deshmukh': 'Divya', 'Arjun Erigaisi': 'Arjun', 'Duc de Brunswick et comte Isouard': 'le duc et le comte' };
  const NOM_EN_PREMIER = /^(Ju|Lei|Tan|Zhu|Ding|Wang|Wei|Yu|Li|Liu|Zhao|Hou|Ni|Bu|Xu|Song|Guo|Huang|Zhai|Lu|Ning|Shen|Zhang|Chen|Sun|Gu|Yip|Yan|Qi) /;
  const court = (nom) => COURTS[nom] || (NOM_EN_PREMIER.test(nom) ? nom : nom.split(' ').slice(-1)[0]);
  const nomCourt = () => court(nomChampion());

  // ---------- Écran de choix ----------
  const annee = (c) => +(c.epoque.match(/\d{4}/) || [0])[0];
  // avec le filtre « Commentées par le coach », on ne compte que ces parties-là
  const filtreCoach = () => reglages.coach && somme(COACH) > 0;
  const nbParties = (cle) => (filtreCoach() ? (COACH[cle] || []).length : INDEX[cle] || 0);
  function construireChoix() {
    // les plus récents d'abord ; seulement les champions qui ont des parties
    const cles = Object.keys(CHAMPIONS).filter(cle => nbParties(cle)).sort((a, b) => annee(CHAMPIONS[b]) - annee(CHAMPIONS[a]));
    const carte = (cle, portrait, nom, sous, n, monde) =>
      `<button type="button" class="carte-champion${cle === 'hasard' ? ' hasard' : ''}" data-cle="${cle}">` +
      `<span class="carte-portrait">${portrait}${monde ? `<span class="couronne" title="${CHAMPIONS[cle] && CHAMPIONS[cle].femme ? 'Championne' : 'Champion'} du monde">`+'<svg viewBox="0 0 24 24"><use href="#ico-couronne"/></svg></span>' : ''}</span>` +
      `<span class="carte-nom">${echapper(nom)}</span><span class="carte-sous">${echapper(sous)}</span>` +
      (n ? `<span class="carte-nb">${n} partie${n > 1 ? 's' : ''}</span>` : '') + '</button>';
    let h = carte('hasard', '<svg class="de-hasard" viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-hasard"/></svg>', 'Au hasard', 'Une partie au hasard', filtreCoach() ? somme(COACH) : TOTAL);
    for (const cle of cles) {
      const c = CHAMPIONS[cle];
      h += carte(cle, portrait(cle), c.nom, `${c.epoque} · ${c.pays}`, nbParties(cle), c.monde);
    }
    if (nbParties('autres')) h += carte('autres', window.Portraits.svg('autres'), 'Autres maîtres', 'D\'autres grands joueurs', nbParties('autres'));
    $('grille-champions').innerHTML = h;
  }
  $('grille-champions').addEventListener('click', (e) => {
    const b = e.target.closest('.carte-champion');
    if (b) choisirPartie(b.dataset.cle);
  });

  async function choisirPartie(cle) {
    let ch = cle;
    if (cle === 'hasard') {
      const parCle = filtreCoach() ? COACH : INDEX;
      let r = Math.random() * somme(parCle);
      for (const [k, n] of Object.entries(parCle)) { ch = k; if ((r -= Array.isArray(n) ? n.length : n) < 0) break; }
    }
    let liste;
    try { liste = await charger(ch); } catch (e) { return; }
    let choix = filtreCoach() && COACH[ch] ? COACH[ch].slice() : liste.map((p, i) => i);
    const neuves = choix.filter(i => !jeu.recentes.includes(ch + ':' + i));
    if (neuves.length) choix = neuves;
    const i = choix[Math.floor(Math.random() * choix.length)];
    jeu.recentes = [ch + ':' + i, ...jeu.recentes].slice(0, 40);
    jeu.choixCle = cle;
    lancerPartie(liste[i]);
  }

  // ---------- Partie ----------
  function lancerPartie(p) {
    arreter();
    jeu.partie = p;
    jeu.cle = p.ch;
    jeu.couleur = p.c === 'w' ? 'blanc' : 'noir';
    jeu.orientation = jeu.couleur;
    jeu.coups = p.u.split(' ');
    jeu.san = p.s.split(' ');
    jeu.moments = new Map(p.m.map(([i, t]) => [i, t]));
    jeu.uniques = new Set(p.m.filter(m => m[2]).map(m => m[0]));
    jeu.resultats = {};
    jeu.positions = [Echiquier.lireFen(DEPART)];
    for (const u of jeu.coups) jeu.positions.push(appliquer(jeu.positions[jeu.positions.length - 1], u).pos);
    jeu.ply = 0;
    jeu.vue = null;
    document.body.dataset.ecran = 'partie';
    $('titre').textContent = nomChampion();
    $('duel-portrait').innerHTML = portrait(jeu.cle === 'autres' ? 'autres' : jeu.cle);
    $('duel-champion').innerHTML = `${echapper(nomChampion())} <span class="camp ${jeu.couleur}">${jeu.couleur === 'blanc' ? 'Blancs' : 'Noirs'}</span>`;
    // partie célèbre : une introduction historique (jeux/joue/intros.js)
    const intro = (window.INTROS_PARTIES || []).find(i => p.bl.includes(i.blancs) && p.no.includes(i.noirs) && p.s.startsWith(i.debut) && (!i.seulement || p.a === i.seulement));
    $('intro-partie').hidden = !intro && !p.ci;
    if (intro) { $('intro-titre').textContent = intro.titre; $('intro-texte').textContent = intro.texte + (p.ci ? ' ' + p.ci : ''); }
    else if (p.ci) { $('intro-titre').textContent = 'Le mot du coach'; $('intro-texte').textContent = p.ci; }
    const lieu = p.l || (intro && intro.lieu) || '', an = p.a || (intro && intro.annee) || '';
    $('duel-adversaire').textContent = `contre ${nomAdversaire()}` + (lieu || an ? ` · ${[lieu, an].filter(Boolean).join(', ')}` : '');
    $('fin').hidden = true;
    $('actions-joue').hidden = false;
    $('consigne').hidden = false;
    dessinerPoints();
    dessinerFeuille();
    dessiner(0);
    window.scrollTo({ top: 0 });
    jeu.etat = 'lecture';
    consigne('Regarde la partie…', '', `Elle s'arrête ${jeu.moments.size} fois : à ces moments-là, c'est toi qui joues pour ${nomCourt()}.`);
    majBoutons();
    jeu.minuterie = setTimeout(planifier, 1200);
  }

  function arreter() {
    clearTimeout(jeu.minuterie);
    jeu.fleches = [];
    jeu.anim++;
    jeu.selection = null;
  }

  // la suite : prochain coup joué tout seul, ou moment où l'enfant joue
  function planifier() {
    clearTimeout(jeu.minuterie);
    if (jeu.etat !== 'lecture') return;
    if (jeu.vue !== null) direct();
    if (jeu.ply >= jeu.coups.length) { finir(); return; }
    if (jeu.moments.has(jeu.ply)) { debutMoment(); return; }
    jeu.minuterie = setTimeout(() => {
      if (jeu.etat !== 'lecture') return;
      const ply = jeu.ply;
      animer(ply, Math.min(520, DELAI[reglages.vitesse] * 0.45), () => {
        jeu.ply = ply + 1;
        dessinerFeuille();
        // un coup commenté par le coach sans être à jouer : on s'arrête pour lire le commentaire
        const co = (jeu.partie.co || {})[ply];
        if (co && co[0] && !jeu.moments.has(ply) && jeu.etat === 'lecture') {
          jeu.etat = 'anim';
          consigne('Regarde bien', coupEcrit(jeu.san[ply], ply % 2 ? 'noir' : 'blanc'), `<span class="mot-coach">Le mot du coach</span> ${echapper(co[0])}`, true);
          jeu.fleches = co[1];
          dessinerFleches();
          majBoutons();
          $('btn-continuer').hidden = false;
          return;
        }
        planifier();
      });
    }, DELAI[reglages.vitesse]);
  }

  // dessine la position avant le demi-coup `ply`, avec le coup précédent surligné
  function dessiner(ply) {
    Echiquier.dessiner(plateau, versFen(jeu.positions[ply]), { orientation: jeu.orientation });
    if (ply > 0) {
      const u = jeu.coups[ply - 1];
      Echiquier.marquer(plateau, [u.slice(0, 2)], 'depart');
      Echiquier.marquer(plateau, [u.slice(2, 4)], 'arrivee-calme');
    }
  }

  // anime le demi-coup `ply` (la pièce glisse), puis dessine la position d'après
  function animer(ply, duree, fin) {
    const jeton = ++jeu.anim;
    const { trajets, prise } = appliquer(jeu.positions[ply], jeu.coups[ply]);
    const piece = jeu.positions[ply][jeu.coups[ply].slice(0, 2)];
    const terminer = () => { if (jeton !== jeu.anim) return; dessiner(ply + 1); Sons.pose(VALEUR[piece.piece] + (prise ? 2 : 0)); fin && fin(); };
    if (!duree) { terminer(); return; }
    dessiner(ply);
    let anime = false;
    for (const [de, a] of trajets) {
      const caseDe = plateau.querySelector(`[data-case="${de}"]`), caseA = plateau.querySelector(`[data-case="${a}"]`);
      const svg = caseDe && caseDe.querySelector('.piece-e');
      if (!svg || !caseA || !svg.animate) continue;
      const r1 = caseDe.getBoundingClientRect(), r2 = caseA.getBoundingClientRect();
      caseDe.style.zIndex = 3;
      svg.animate([{ transform: 'translate(0, 0)' }, { transform: `translate(${r2.left - r1.left}px, ${r2.top - r1.top}px)` }],
        { duration: duree, easing: 'ease-in-out', fill: 'forwards' });
      anime = true;
    }
    const pris = prise && plateau.querySelector(`[data-case="${prise}"] .piece-e`);
    if (pris && pris.animate) pris.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(.5)' }], { duration: duree * .5, delay: duree * .6, fill: 'forwards' });
    setTimeout(terminer, anime ? duree + 30 : 0);
  }

  // ---------- Moment : l'enfant joue ----------
  function debutMoment() {
    jeu.etat = 'moment';
    jeu.erreurs = 0;
    jeu.indice = false;
    jeu.montre = false;
    jeu.selection = null;
    jeu.legaux = new Map();
    for (const g of (jeu.partie.lg[jeu.ply] || '').split(' ').filter(Boolean)) {
      const vers = new Set();
      for (let i = 2; i < g.length; i += 2) vers.add(g.slice(i, i + 2));
      jeu.legaux.set(g.slice(0, 2), vers);
    }
    dessiner(jeu.ply);
    consigneMoment();
    dessinerPoints();
    majBoutons();
  }

  function consigneMoment() {
    const san = jeu.san[jeu.ply];
    if (reglages.niveau === 'facile' || jeu.montre) consigne('À toi de jouer !', coupEcrit(san, jeu.couleur), jeu.montre ? 'Voici le coup : joue-le sur l\'échiquier.' : `Joue ce coup de ${nomCourt()} sur l'échiquier.`);
    else consigne('À toi de jouer !', '', `Trouve le coup joué par ${nomCourt()}.` + (jeu.uniques.has(jeu.ply) ? ' Attention : ici, un seul coup est vraiment bon !' : ' Touche une pièce pour voir où elle peut aller.'));
  }

  function tenter(de, a) {
    if (jeu.etat !== 'moment') return;
    const attendu = jeu.coups[jeu.ply];
    deselectionner();
    if (de + a === attendu.slice(0, 4)) { reussir(); return; }
    const legal = jeu.legaux.has(de) && jeu.legaux.get(de).has(a);
    flash(a);
    Sons.refus();
    if (!legal) { consigne('Ce coup n\'est pas possible.', reglages.niveau === 'facile' || jeu.montre ? coupEcrit(jeu.san[jeu.ply], jeu.couleur) : '', 'Essaie un autre coup.'); return; }
    jeu.erreurs++;
    if (reglages.niveau === 'facile' || jeu.montre) consigne('Ce n\'est pas ce coup-là.', coupEcrit(jeu.san[jeu.ply], jeu.couleur), 'Regarde bien la pièce et la case écrites.');
    else consigne(`Ce n'est pas le coup de ${nomCourt()}.`, '', jeu.erreurs >= 2 && !jeu.indice ? 'Un indice : la pièce qui doit bouger brille.' : 'Essaie encore !');
    if (jeu.erreurs >= 2 && !jeu.indice) donnerIndice();
  }

  function reussir() {
    const ply = jeu.ply;
    const type = jeu.moments.get(ply);
    const r = jeu.montre ? 'montre' : jeu.erreurs || jeu.indice ? 'aide' : 'premier';
    jeu.resultats[ply] = r;
    jeu.etat = 'anim';
    Sons.bravo();
    const titre = r === 'premier' ? 'Bravo, du premier coup !' : r === 'aide' ? 'Bravo !' : 'C\'est ça !';
    const ex = expliquer(ply);
    consigne(titre, coupEcrit(jeu.san[ply], jeu.couleur), ex.html, true);
    $('consigne').classList.add('reussi');
    animer(ply, 0, () => {
      Echiquier.marquer(plateau, [jeu.coups[ply].slice(2, 4)], 'trouve');
      jeu.ply = ply + 1;
      jeu.fleches = ex.fleches;
      dessinerFleches();
      dessinerPoints();
      dessinerFeuille();
      majBoutons();
      // on laisse le temps de lire : la partie reprend avec « Continuer »
      $('btn-continuer').hidden = false;
      $('btn-continuer').focus({ preventScroll: true });
    });
  }

  function continuer() {
    if (jeu.etat !== 'anim' || $('btn-continuer').hidden) return;
    if (jeu.vue !== null) direct();
    $('btn-continuer').hidden = true;
    $('consigne').classList.remove('reussi');
    jeu.fleches = [];
    dessinerFleches();
    jeu.etat = 'lecture';
    if (jeu.ply < jeu.coups.length) consigne('La partie continue…', '', '');
    majBoutons();
    planifier();
  }

  // ---------- Explications ----------
  const SA_PIECE = { pion: 'un pion', cavalier: 'son cavalier', fou: 'son fou', tour: 'sa tour', dame: 'sa dame', roi: 'son roi' };
  const gras = (san) => `<b>${echapper(traduire(san))}</b>`;
  // Ce que permet le coup du champion. On choisit d'abord l'idée principale (par ordre d'importance) :
  // mat, roi en échec, mat adverse empêché, motif tactique, sacrifice, menace adverse parée, gain de matériel,
  // motif de finale, idée de stratégie ; puis une phrase d'appui (menace, suite) et la comparaison avec un autre coup.
  const NOM_PIECE = { p: 'pion', n: 'cavalier', b: 'fou', r: 'tour', q: 'dame', k: 'roi' };
  const LE = { p: 'le pion', n: 'le cavalier', b: 'le fou', r: 'la tour', q: 'la dame', k: 'le roi' };
  const LA_PIECE = (t) => LE[t] || 'la pièce';
  const LES = { p: 'les deux pions', n: 'les deux cavaliers', b: 'les deux fous', r: 'les deux tours', q: 'les deux dames', k: 'le roi' };
  const FEMININ = (t) => t === 'q' || t === 'r';
  function listePieces(types) {
    const vus = {}; types.forEach(t => { vus[t] = (vus[t] || 0) + 1; });
    const ordre = ['k', 'q', 'r', 'b', 'n', 'p'].filter(t => vus[t]);
    const noms = ordre.map(t => (vus[t] > 1 ? LES[t] : LA_PIECE(t)));
    return noms.length === 1 ? noms[0] : noms.slice(0, -1).join(', ') + ' et ' + noms[noms.length - 1];
  }
  const typeSurAvance = (x, sq) => { const p = jeu.positions[jeu.ply] && jeu.positions[jeu.ply][sq]; return p && p.piece === 'roi'; };
  function expliquer(ply) {
    const co = (jeu.partie.co || {})[ply];
    if (co && co[0]) return { html: `<span class="mot-coach">Le mot du coach</span> ${echapper(co[0])}`, fleches: co[1] };
    const auto = expliquerAuto(ply);
    return co && co[1].length ? { html: auto.html, fleches: co[1] } : auto;
  }
  function expliquerAuto(ply) {
    const x = (jeu.partie.x || {})[ply] || {};
    const type = jeu.moments.get(ply);
    const N = echapper(nomCourt());
    const pos = jeu.positions[ply], apres = jeu.positions[ply + 1];
    const u = jeu.coups[ply];
    const piece = pos[u.slice(0, 2)].piece;
    const lettre = { pion: 'p', cavalier: 'n', fou: 'b', tour: 'r', dame: 'q', roi: 'k' };
    const typeSur = (sq) => (apres[sq] ? lettre[apres[sq].piece] : (pos[sq] ? lettre[pos[sq].piece] : ''));
    const mo = Object.fromEntries((x.mo || []).map(m => [m[0], m.slice(1)]));
    // un motif tactique n'est retenu que si l'analyse confirme qu'il rapporte (matériel gagné, menace ou mat)
    const rapporte = (x.g >= 2) || !!x.me || !!x.mt;
    for (const k of ['fourchette', 'decouverte', 'enfilade']) if (mo[k] && !rapporte) delete mo[k];
    if (mo.clouage && !(rapporte || typeSurAvance(x, mo.clouage[2]))) delete mo.clouage;
    const promo = u[4];
    const fleches = [];
    let principale = '', appui = '', dejaMenace = false;

    // 1. l'idée principale
    if (type === 'mat') principale = 'Échec et mat ! Le roi est attaqué et n\'a plus aucune case pour s\'échapper.';
    else if (x.ec) principale = `Le roi de ${N} était en échec : il fallait d'abord s'en occuper. ${piece === 'roi' ? 'Le roi s\'écarte vers une case sûre.' : pos[u.slice(2, 4)] ? 'Ce coup prend la pièce qui donnait échec.' : 'Ce coup se met en travers de l\'échec.'}`;
    if (!principale && x.am && x.am[2] === 'mat' && x.am[3] !== 'contre') {
      principale = `Attention : l'adversaire menaçait ${gras(x.am[0])}, ${(x.am[5] || 1) === 1 ? 'échec et mat' : `avec un mat en ${x.am[5]} coups`} ! ` +
        ({ prend: 'Ce coup prend la pièce dangereuse.', bloque: 'Ce coup se met en travers pour bloquer l\'attaque.', protege: 'Ce coup protège la case du mat.', roi: 'Le roi s\'écarte du danger.', abri: 'Ce coup met la pièce visée à l\'abri.' }[x.am[3]] || 'Ce coup empêche le mat.');
      fleches.push([x.am[1], 'danger']);
    }
    if (!principale && type === 'sacrifice') principale = `${N} donne ${SA_PIECE[piece]} exprès : c'est un sacrifice.` +
      (x.g >= 1 ? ` Au bout de la suite, ${N} récupère encore plus de matériel.` : x.g >= 0 ? ' Au bout de la suite, le matériel donné est récupéré.' : ' En échange, l\'attaque devient très dangereuse.');
    if (!principale && mo['double-echec']) principale = 'Échec double : deux pièces donnent échec en même temps, le roi est obligé de bouger.';
    if (!principale && mo.fourchette) {
      const [de, ...cibles] = mo.fourchette;
      principale = `C'est une fourchette : ${LE[lettre[piece]]} attaque ${listePieces(cibles.map(typeSur))} en même temps. L'adversaire ne pourra pas tout sauver.`;
      cibles.forEach(q => fleches.push([de + q, 'menace']));
    }
    if (!principale && mo.decouverte) {
      const [de, cible] = mo.decouverte;
      principale = `C'est une attaque à la découverte : en bougeant, ${LE[lettre[piece]]} ouvre la ligne de ${LA_PIECE(typeSur(de))}, qui attaque maintenant ${typeSur(cible) === 'k' ? 'le roi' : LA_PIECE(typeSur(cible))}.`;
      fleches.push([de + cible, 'menace']);
    }
    if (!principale && mo.clouage) {
      const [de, cloue, derriere] = mo.clouage;
      principale = `${LE[lettre[piece]].replace(/^./, c => c.toUpperCase())} cloue ${LA_PIECE(typeSur(cloue))} : ${FEMININ(typeSur(cloue)) ? 'elle' : 'il'} ne peut plus bouger sans laisser ${typeSur(derriere) === 'k' ? 'le roi en échec' : LA_PIECE(typeSur(derriere)) + ' se faire prendre'}.`;
      fleches.push([de + derriere, 'menace']);
    }
    if (!principale && mo.enfilade) {
      const [de, devant, derriere] = mo.enfilade;
      principale = `C'est une enfilade : ${LA_PIECE(typeSur(devant))} est attaqué${FEMININ(typeSur(devant)) ? 'e' : ''} et, quand ${FEMININ(typeSur(devant)) ? 'elle' : 'il'} bougera, ${LA_PIECE(typeSur(derriere))} derrière sera pris${FEMININ(typeSur(derriere)) ? 'e' : ''}.`;
      fleches.push([de + derriere, 'menace']);
    }
    if (!principale && type === 'promotion') principale = `Le pion arrive au bout de l'échiquier et devient ${promo === 'q' ? 'une dame' : promo === 'n' ? 'un cavalier' : promo === 'r' ? 'une tour' : 'un fou'} !`;
    if (!principale && x.am && x.am[2] !== 'mat') {
      const vise = LA_PIECE(x.am[4]);
      const intro = `L'adversaire menaçait ${gras(x.am[0])}, pour prendre ${vise}.`;
      principale = intro + ' ' + ({
        abri: `${N} met ${vise} à l'abri.`,
        protege: `Ce coup protège ${vise}.`,
        prend: 'Ce coup prend la pièce qui menaçait.',
        bloque: 'Ce coup se met en travers pour bloquer la menace.',
        roi: 'Le roi s\'écarte du danger.',
        contre: 'Mais au lieu de se défendre, ce coup contre-attaque encore plus fort !',
        pare: 'Ce coup empêche cette menace.',
      }[x.am[3]]);
      fleches.push([x.am[1], 'danger']);
    }
    const prise = pos[u.slice(2, 4)];
    if (!principale && x.g >= 1) principale = !prise ? 'Au bout de la suite, ce coup gagne du matériel.'
      : prise.piece === 'pion' ? 'Ce coup gagne un pion.' : `Ce coup prend ${LA_PIECE(lettre[prise.piece])}, et l'adversaire ne pourra pas regagner autant.`;
    if (!principale && mo.opposition) principale = 'Les deux rois se font face avec une seule case entre eux : c\'est l\'opposition. Le roi adverse doit céder le passage.';
    if (!principale && mo['roi-actif']) { principale = 'En fin de partie, le roi devient une pièce forte : il s\'avance pour aider ses pions et attaquer ceux de l\'adversaire.'; fleches.push([mo['roi-actif'][0], 'suite']); }
    if (!principale && mo['pion-passe']) { principale = 'Ce pion est passé : plus aucun pion adverse ne peut l\'arrêter, il fonce vers la promotion.'; fleches.push([mo['pion-passe'][0], 'suite']); }
    if (!principale && mo['echange-avance']) principale = 'Avec du matériel en plus, échanger les pièces est une bonne idée : moins il en reste, plus l\'avance compte.';
    if (!principale && mo.septieme) principale = 'La tour arrive sur l\'avant-dernière rangée de l\'adversaire, où elle attaque ses pions par le côté.';
    if (!principale && mo['colonne-ouverte']) principale = 'La tour s\'installe sur une colonne ouverte, sans aucun pion : de là, elle pourra entrer dans le camp adverse.';
    if (!principale && mo['colonne-semi']) principale = 'La tour se place sur une colonne sans pion de son camp : elle met la pression sur le pion adverse au bout.';
    if (!principale && mo['avant-poste']) principale = 'Le cavalier s\'installe sur une case forte : protégé par un pion, aucun pion adverse ne pourra le chasser.';
    if (!principale && mo.roque) principale = `${N} roque : le roi est à l'abri et la tour entre dans le jeu.`;
    if (!principale && mo.centre) principale = 'Ce pion prend sa place au centre de l\'échiquier, là où se joue la partie.';
    if (!principale && type === 'echec') principale = 'Échec au roi : l\'adversaire doit d\'abord s\'occuper de son roi.';
    if (!principale && type === 'unique') principale = 'Ici, c\'était le seul bon coup.';

    // 2. une phrase d'appui : la menace du champion, le mat qui arrive, ou un exemple de suite
    if (type !== 'mat') {
      if (x.mt) {
        appui = x.mt === 1 ? 'Maintenant, le mat ne peut plus être évité : il arrive au prochain coup.' : `Maintenant, le mat ne peut plus être évité : il arrive en ${x.mt} coups.`;
        if (x.su && x.su.length >= 2 && fleches.length < 2) { appui += ` Par exemple : ${gras(x.su[0][0])}, puis ${gras(x.su[1][0])}.`; fleches.push([x.su[0][1], 'adversaire'], [x.su[1][1], 'suite']); }
      } else if (x.me && !mo.fourchette) {
        dejaMenace = true;
        appui = x.me[2] !== 'mat' ? `Ce coup menace ${gras(x.me[0])}, qui prendrait ${LA_PIECE(x.me[2])}.`
          : (x.me[3] || 1) === 1 ? `Ce coup menace ${gras(x.me[0])}, échec et mat !`
          : `Ce coup prépare ${gras(x.me[0])} : si l'adversaire ne fait rien, l'attaque mène au mat en ${x.me[3]} coups.`;
        fleches.push([x.me[1], 'menace']);
      } else if (x.su && x.su.length >= 2 && fleches.length === 0) {
        appui = `Par exemple, si l'adversaire répond ${gras(x.su[0][0])}, ${N} continue avec ${gras(x.su[1][0])}.`;
        fleches.push([x.su[0][1], 'adversaire'], [x.su[1][1], 'suite']);
      }
    }

    // 3. pourquoi pas un autre coup
    let autre = '';
    if (mo['evite-echange'] && x.au) autre = `${gras(x.au[0])} aurait échangé des pièces : ici, il valait mieux les garder pour continuer à presser l'adversaire.`;
    else if (x.au && dejaMenace && x.me && x.au[0] === x.me[0]) autre = `Mais jouer ${gras(x.au[0])} tout de suite aurait été une erreur : il fallait d'abord le préparer.`;
    else if (x.au) autre = x.au[1] === 'perd' ? `Avec un autre coup, comme ${gras(x.au[0])}, ${N} aurait même pu perdre la partie !`
      : x.au[1] === 'egal' ? (ply % 2 ? `Avec ${gras(x.au[0])} à la place, la partie serait redevenue à peu près égale.` : `Le coup ${gras(x.au[0])}, par exemple, aurait laissé l'adversaire revenir dans la partie.`)
      : `${gras(x.au[0])} était moins fort : l'avantage aurait été bien plus petit.`;

    const phrases = [principale, appui, autre].filter(Boolean);
    if (!phrases.length) phrases.push(`C'est le coup qu'a joué ${N}.`);
    return { html: phrases.join(' '), fleches: fleches.slice(0, 3) };
  }
  // pourquoi l'adversaire abandonne
  function expliquerFin() {
    if (jeu.partie.cf) return { html: `<span class="mot-coach">Le mot du coach</span> ${echapper(jeu.partie.cf)}`, fleches: [] };
    const f = jeu.partie.f;
    const N = echapper(nomCourt()), A = echapper(court(nomAdversaire()));
    if (!f || f.fin === 'mat') return { html: 'Le roi est attaqué et ne peut plus s\'échapper : la partie est finie.', fleches: [] };
    const phrases = [], fleches = [];
    if (f.mt) phrases.push(`Quoi que ${A} fasse, ${N} va faire échec et mat${f.mt === 1 ? ' au prochain coup' : ` en ${f.mt} coups`}.`);
    else {
      if (f.d >= 2) phrases.push(f.d >= 5 ? `${N} a beaucoup plus de matériel.` : `${N} a plus de matériel.`);
      else if (f.d <= -2) phrases.push(f.cp >= 400 ? `${N} a donné du matériel, mais son attaque est imparable.` : `${N} a donné du matériel, mais sa position est bien meilleure.`);
      if (f.pr) phrases.push('Bientôt, un pion va devenir une dame.');
      if (f.d > -2) phrases.push(f.cp >= 400 ? `${f.d >= 2 ? 'Avec cette avance et les menaces' : 'Avec les menaces'}, il n'y a plus de bonne défense : la position de ${A} est perdue.` : `La position de ${A} est devenue très difficile.`);
    }
    if (f.su && f.su.length >= 2) {
      phrases.push(`Par exemple, si ${A} joue ${gras(f.su[0][0])}, ${N} répond ${gras(f.su[1][0])}.`);
      fleches.push([f.su[0][1], 'adversaire'], [f.su[1][1], 'suite']);
    }
    return { html: phrases.join(' '), fleches };
  }

  // flèches sur l'échiquier : menace (orange), réponse de l'adversaire (gris), suite du champion (vert)
  function dessinerFleches() {
    const vieux = plateau.querySelector('.fleches');
    if (vieux) vieux.remove();
    const liste = jeu.fleches || [];
    if (!liste.length) return;
    const r0 = plateau.getBoundingClientRect();
    let h = `<svg class="fleches" viewBox="0 0 ${f1(r0.width)} ${f1(r0.height)}" aria-hidden="true"><defs>`;
    for (const g of ['menace', 'adversaire', 'suite', 'danger']) h += `<marker id="pointe-${g}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="2.6" markerHeight="2.6" orient="auto"><path d="M0 0 10 5 0 10Z" class="pointe ${g}"/></marker>`;
    h += '</defs>';
    for (const [u, g] of liste) {
      const a = plateau.querySelector(`[data-case="${u.slice(0, 2)}"]`), b = plateau.querySelector(`[data-case="${u.slice(2, 4)}"]`);
      if (!a || !b) continue;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const x1 = ra.left + ra.width / 2 - r0.left, y1 = ra.top + ra.height / 2 - r0.top;
      let x2 = rb.left + rb.width / 2 - r0.left, y2 = rb.top + rb.height / 2 - r0.top;
      const d = Math.hypot(x2 - x1, y2 - y1) || 1, recul = ra.width * 0.28;
      x2 -= (x2 - x1) / d * recul; y2 -= (y2 - y1) / d * recul;
      h += `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" class="fleche ${g}" stroke-width="${f1(ra.width * 0.15)}" marker-end="url(#pointe-${g})"/>`;
    }
    plateau.insertAdjacentHTML('beforeend', h + '</svg>');
  }
  const f1 = (n) => Math.round(n * 10) / 10;
  window.addEventListener('resize', () => { if (jeu.fleches && jeu.fleches.length) dessinerFleches(); });

  function donnerIndice() {
    if (jeu.etat !== 'moment') return;
    jeu.indice = true;
    Echiquier.marquer(plateau, [jeu.coups[jeu.ply].slice(0, 2)], 'indice');
    majBoutons();
  }
  function montrer() {
    if (jeu.etat !== 'moment') return;
    jeu.montre = true;
    jeu.indice = true;
    const u = jeu.coups[jeu.ply];
    Echiquier.marquer(plateau, [u.slice(0, 2)], 'indice');
    Echiquier.marquer(plateau, [u.slice(2, 4)], 'cible');
    consigneMoment();
    majBoutons();
  }

  // ---------- Sélection, glisser-déposer ----------
  function selectionner(sq) {
    deselectionner();
    jeu.selection = sq;
    Echiquier.marquer(plateau, [sq], 'choisie');
    const vers = jeu.legaux.get(sq) || new Set();
    for (const a of vers) {
      const c = plateau.querySelector(`[data-case="${a}"]`);
      if (c) c.classList.add(c.querySelector('.piece-e') ? 'possible-prise' : 'possible');
    }
  }
  function deselectionner() {
    jeu.selection = null;
    Echiquier.effacer(plateau, 'choisie', 'possible', 'possible-prise');
  }
  function flash(sq) {
    const c = plateau.querySelector(`[data-case="${sq}"]`);
    if (!c) return;
    c.classList.remove('refus'); void c.offsetWidth; c.classList.add('refus');
  }

  let glisse = null;
  plateau.addEventListener('pointerdown', (e) => {
    if (jeu.etat !== 'moment' || e.button > 0 || jeu.vue !== null) return;
    const c = e.target.closest('.case-e');
    if (!c) return;
    const sq = c.dataset.case;
    const p = jeu.positions[jeu.ply][sq];
    if (jeu.selection && jeu.selection !== sq && !(p && p.couleur === jeu.couleur)) { tenter(jeu.selection, sq); return; }
    if (!p || p.couleur !== jeu.couleur) return;
    e.preventDefault();
    selectionner(sq);
    const svg = c.querySelector('.piece-e');
    glisse = { de: sq, x: e.clientX, y: e.clientY, svg, fantome: null, taille: c.getBoundingClientRect().width };
  });
  window.addEventListener('pointermove', (e) => {
    if (!glisse) return;
    if (!glisse.fantome) {
      if (Math.hypot(e.clientX - glisse.x, e.clientY - glisse.y) < 6) return;
      const f = glisse.svg.cloneNode(true);
      f.classList.add('piece-glissee');
      f.style.width = f.style.height = glisse.taille + 'px';
      document.body.appendChild(f);
      glisse.fantome = f;
      glisse.svg.classList.add('en-main');
    }
    glisse.fantome.style.transform = `translate(${e.clientX - glisse.taille / 2}px, ${e.clientY - glisse.taille / 2}px) scale(1.12)`;
  });
  function lacher(e) {
    if (!glisse) return;
    const g = glisse;
    glisse = null;
    if (!g.fantome) return; // simple toucher : la pièce reste choisie
    g.fantome.remove();
    g.svg.classList.remove('en-main');
    const sous = document.elementFromPoint(e.clientX, e.clientY);
    const c = sous && sous.closest('#echiquier .case-e');
    if (c && c.dataset.case !== g.de) tenter(g.de, c.dataset.case);
  }
  window.addEventListener('pointerup', lacher);
  window.addEventListener('pointercancel', () => { if (glisse && glisse.fantome) { glisse.fantome.remove(); glisse.svg.classList.remove('en-main'); } glisse = null; });

  // ---------- Fin ----------
  function finir() {
    jeu.etat = 'fin';
    const dernier = jeu.san[jeu.san.length - 1];
    const total = jeu.moments.size;
    const premiers = Object.values(jeu.resultats).filter(r => r === 'premier').length;
    $('fin-titre').textContent = dernier.endsWith('#') ? `Échec et mat ! ${nomChampion()} gagne.` : `${nomAdversaire()} abandonne : ${nomChampion()} gagne !`;
    $('fin-detail').textContent = `Tu as trouvé ${premiers} coup${premiers > 1 ? 's' : ''} sur ${total} du premier coup.`;
    const ex = expliquerFin();
    $('fin-explication').innerHTML = ex.html;
    jeu.fleches = ex.fleches;
    dessinerFleches();
    $('btn-autre-texte').textContent = jeu.choixCle === 'hasard' ? 'Une autre partie au hasard' : jeu.cle === 'autres' ? 'Une autre partie' : `Une autre partie de ${nomCourt()}`;
    $('fin').hidden = false;
    $('actions-joue').hidden = true;
    $('consigne').hidden = true;
    $('fin').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (premiers === total) Sons.bravo();
    $('btn-autre').focus({ preventScroll: true });
  }

  // ---------- Affichage ----------
  function consigne(titre, coup, detail, html) {
    $('consigne-titre').textContent = titre;
    $('consigne-coup').hidden = !coup;
    $('consigne-coup').innerHTML = coup || '';
    if (html) $('consigne-detail').innerHTML = detail || '';
    else $('consigne-detail').textContent = detail || '';
    if (!html) $('btn-continuer').hidden = true;
    $('consigne').classList.toggle('a-toi', jeu.etat === 'moment');
  }

  function majBoutons() {
    const moment = jeu.etat === 'moment';
    const pause = jeu.etat === 'pause';
    $('btn-lecture').disabled = moment || jeu.etat === 'anim';
    $('btn-lecture').classList.toggle('en-pause', pause);
    $('btn-lecture-texte').textContent = pause ? 'Lecture' : 'Pause';
    $('btn-lecture').setAttribute('aria-label', pause ? 'Reprendre la partie' : 'Mettre la partie en pause');
    $('btn-suivant').disabled = moment || jeu.etat === 'anim' || jeu.etat === 'fin';
    $('btn-suivant-texte').textContent = prochainMoment() < 0 ? 'Fin' : 'À moi !';
    $('btn-indice').disabled = !moment || jeu.indice;
    $('btn-montrer').disabled = !moment || jeu.montre;
  }
  const prochainMoment = () => [...jeu.moments.keys()].find(i => i >= jeu.ply) ?? -1;

  function dessinerPoints() {
    $('points-moments').innerHTML = [...jeu.moments.keys()].map((i, n) => {
      const r = jeu.resultats[i];
      const cls = r || (i === jeu.ply && jeu.etat === 'moment' ? 'en-cours' : '');
      const lab = r === 'premier' ? 'trouvé du premier coup' : r === 'aide' ? 'trouvé avec de l\'aide' : r === 'montre' ? 'montré' : 'à venir';
      return `<li class="${cls}" aria-label="Coup ${n + 1} : ${lab}">${r === 'premier' ? '<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.4 5.9.7-4.4 4 1.2 5.9L12 16.6l-5.3 2.9 1.2-5.9-4.4-4 5.9-.7Z"/></svg>' : ''}</li>`;
    }).join('');
  }

  function dessinerFeuille() {
    const n = jeu.ply;
    let h = '';
    for (let i = 0; i < n; i += 2) {
      const cell = (j) => {
        if (j >= n) return '<span></span>';
        const r = jeu.resultats[j];
        const vu = jeu.vue !== null && j === jeu.vue - 1 ? ' vu' : '';
        return `<button type="button" class="coup-f${r ? ' a-toi ' + r : ''}${vu}" data-ply="${j}">${echapper(traduire(jeu.san[j]))}</button>`;
      };
      h += `<li><span class="num">${i / 2 + 1}.</span>${cell(i)}${cell(i + 1)}</li>`;
    }
    const f = $('feuille');
    f.innerHTML = h;
    const vu = f.querySelector('.vu');
    if (vu) vu.scrollIntoView({ block: 'nearest' }); else f.scrollTop = f.scrollHeight;
    majNavigation();
  }

  // ---------- Navigation dans la partie ----------
  // on peut revoir les coups déjà joués (jamais les suivants) ; la partie se met en pause
  function voir(n) {
    if (document.body.dataset.ecran !== 'partie') return;
    n = Math.max(0, Math.min(jeu.ply, n));
    if (n === jeu.ply) { direct(); return; }
    if (jeu.etat === 'lecture') { jeu.etat = 'pause'; clearTimeout(jeu.minuterie); consigne('Partie en pause', '', ''); majBoutons(); }
    jeu.anim++;
    deselectionner();
    jeu.vue = n;
    dessiner(n);
    const vieux = plateau.querySelector('.fleches');
    if (vieux) vieux.remove();
    dessinerFeuille();
  }
  // retour à la position en cours (avec ce qui était affiché : indice, flèches…)
  function direct() {
    const etaitVue = jeu.vue !== null;
    jeu.vue = null;
    if (etaitVue) {
      dessiner(jeu.ply);
      if (jeu.etat === 'moment') {
        if (jeu.indice) Echiquier.marquer(plateau, [jeu.coups[jeu.ply].slice(0, 2)], 'indice');
        if (jeu.montre) Echiquier.marquer(plateau, [jeu.coups[jeu.ply].slice(2, 4)], 'cible');
      }
      if (jeu.etat === 'anim' && jeu.ply > 0) Echiquier.marquer(plateau, [jeu.coups[jeu.ply - 1].slice(2, 4)], 'trouve');
      dessinerFleches();
    }
    dessinerFeuille();
  }
  function majNavigation() {
    const n = jeu.vue === null ? jeu.ply : jeu.vue;
    $('nav-debut').disabled = $('nav-prec').disabled = n === 0;
    $('nav-suiv').disabled = $('nav-direct').disabled = jeu.vue === null;
    $('nav-pos').textContent = jeu.vue === null ? '' : jeu.vue === 0 ? 'Début de la partie' : `Coup ${Math.ceil(jeu.vue / 2)}${jeu.vue % 2 ? '' : '…'} ${traduire(jeu.san[jeu.vue - 1])}`;
    document.body.classList.toggle('en-arriere', jeu.vue !== null);
  }
  $('nav-debut').addEventListener('click', () => voir(0));
  $('nav-prec').addEventListener('click', () => voir((jeu.vue === null ? jeu.ply : jeu.vue) - 1));
  $('nav-suiv').addEventListener('click', () => { if (jeu.vue !== null) voir(jeu.vue + 1); });
  $('nav-direct').addEventListener('click', direct);
  $('feuille').addEventListener('click', (e) => { const b = e.target.closest('.coup-f'); if (b) voir(+b.dataset.ply + 1); });

  // ---------- Boutons ----------
  $('btn-lecture').addEventListener('click', () => {
    if (jeu.vue !== null && jeu.etat === 'pause') direct();
    if (jeu.etat === 'lecture') { jeu.etat = 'pause'; clearTimeout(jeu.minuterie); consigne('Partie en pause', '', ''); }
    else if (jeu.etat === 'pause') { jeu.etat = 'lecture'; consigne('La partie continue…', '', ''); planifier(); }
    majBoutons();
  });
  // « À moi ! » : on avance directement jusqu'au prochain moment (ou jusqu'à la fin s'il n'y en a plus)
  $('btn-suivant').addEventListener('click', () => {
    if (jeu.etat === 'moment' || jeu.etat === 'anim' || jeu.etat === 'fin') return;
    jeu.vue = null;
    let cible = prochainMoment();
    if (cible < 0) cible = jeu.coups.length;
    arreter();
    jeu.ply = cible;
    dessinerFeuille();
    dessiner(cible);
    jeu.etat = 'lecture';
    planifier();
  });
  $('btn-indice').addEventListener('click', () => { donnerIndice(); if (reglages.niveau === 'difficile' && !jeu.montre) consigne('Un indice', '', 'La pièce qui doit bouger brille.'); });
  $('btn-montrer').addEventListener('click', montrer);
  $('btn-continuer').addEventListener('click', continuer);
  $('btn-retourner').addEventListener('click', () => {
    jeu.orientation = jeu.orientation === 'blanc' ? 'noir' : 'blanc';
    if (jeu.etat === 'anim' && $('btn-continuer').hidden) return;
    const sel = jeu.selection;
    dessiner(jeu.ply);
    if (jeu.indice) Echiquier.marquer(plateau, [jeu.coups[jeu.ply].slice(0, 2)], 'indice');
    if (jeu.montre) Echiquier.marquer(plateau, [jeu.coups[jeu.ply].slice(2, 4)], 'cible');
    if (sel) selectionner(sel);
    dessinerFleches();
  });
  $('btn-champions').addEventListener('click', retourChoix);
  $('btn-changer').addEventListener('click', retourChoix);
  $('btn-autre').addEventListener('click', () => choisirPartie(jeu.choixCle === 'hasard' ? 'hasard' : jeu.cle));
  function retourChoix() {
    arreter();
    jeu.etat = 'choix';
    document.body.dataset.ecran = 'choix';
    $('titre').textContent = 'Joue le coup';
    window.scrollTo({ top: 0 });
  }

  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea') || document.body.dataset.ecran !== 'partie') return;
    if ((e.key === ' ' || e.key === 'Enter') && !$('btn-continuer').hidden) { e.preventDefault(); continuer(); return; }
    if (e.key === ' ' && (jeu.etat === 'lecture' || jeu.etat === 'pause')) { e.preventDefault(); $('btn-lecture').click(); }
    if (e.key === 'Escape') deselectionner();
    if (e.key === 'ArrowLeft') { e.preventDefault(); voir((jeu.vue === null ? jeu.ply : jeu.vue) - 1); }
    if (e.key === 'ArrowRight' && jeu.vue !== null) { e.preventDefault(); voir(jeu.vue + 1); }
    if (e.key === 'Home') { e.preventDefault(); voir(0); }
    if (e.key === 'End') { e.preventDefault(); direct(); }
  });

  // ---------- Réglages ----------
  function brancherSegments(groupe, attr, valeur, quandChange) {
    const boutons = [...groupe.querySelectorAll('button')];
    const maj = (v) => boutons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset[attr] === v)));
    maj(valeur);
    boutons.forEach(b => b.addEventListener('click', () => { maj(b.dataset[attr]); quandChange(b.dataset[attr]); }));
  }
  brancherSegments($('reg-niveau'), 'niveau', reglages.niveau, (v) => {
    reglages.niveau = v; ecrireTexte('echecs.joue.niveau', v);
    if (jeu.etat === 'moment') consigneMoment();
  });
  brancherSegments($('reg-langue'), 'langue', reglages.langue, (v) => {
    reglages.langue = v; ecrireTexte('echecs.joue.langue', v);
    dessinerFeuille();
    if (jeu.etat === 'moment') consigneMoment();
  });
  brancherSegments($('reg-vitesse'), 'vitesse', reglages.vitesse, (v) => { reglages.vitesse = v; ecrireTexte('echecs.joue.vitesse', v); });
  const appliquerCoordonnees = () => document.body.classList.toggle('sans-coordonnees', !reglages.coordonnees);
  brancherInterrupteur($('reg-coordonnees'), reglages.coordonnees, (v) => { reglages.coordonnees = v; Prefs.ecrire('echecs.joue.coordonnees', v); appliquerCoordonnees(); });
  brancherInterrupteur($('reg-son'), Sons.actif, (v) => { Sons.actif = v; });
  brancherBoutonTheme($('btn-theme'));
  brancherReglages($('btn-reglages'), $('panneau-reglages'));

  // ---------- Démarrage ----------
  window.Echecs.injecterSprite();
  appliquerCoordonnees();
  construireChoix();
  // crédits des photos (auteur, licence, lien vers la page Commons)
  const credits = Object.entries(PHOTOS).sort((a, b) => CHAMPIONS[a[0]].nom.localeCompare(CHAMPIONS[b[0]].nom));
  if (credits.length) {
    $('credits-photos').hidden = false;
    $('liste-credits').innerHTML = credits.map(([cle, ph]) =>
      `<li><b>${echapper(CHAMPIONS[cle].nom)}</b> : <a href="${echapper(ph.url)}" target="_blank" rel="noopener">${echapper(ph.titre)}</a>` +
      ` — ${echapper(ph.auteur)}, ${echapper(ph.licence)}</li>`).join('');
  }
  if (somme(COACH)) {
    $('filtre-coach').hidden = false;
    brancherInterrupteur($('reg-coach'), reglages.coach, (v) => {
      reglages.coach = v; Prefs.ecrire('echecs.joue.coach', v);
      construireChoix();
    });
  }
  // pour les tests
  window.JoueLeCoup = { jeu, choisirPartie, lancerPartie, tenter, continuer, charger, voir, direct, INDEX };
})();
