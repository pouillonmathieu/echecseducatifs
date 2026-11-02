/* Jeu : joue le coup
   On choisit un champion, une de ses parties se joue toute seule sur l'échiquier (vu du côté du champion),
   et aux moments importants, c'est l'enfant qui joue le coup du champion :
   - facile : le coup est écrit, il faut le jouer sur l'échiquier ;
   - difficile : il faut le trouver.
   L'indice montre la pièce qui doit bouger ; « Montre-moi » montre le coup. */
(function () {
  const { Prefs, brancherBoutonTheme, brancherReglages, brancherInterrupteur } = window.Commun;
  const PARTIES = window.PARTIES_CHAMPIONS;
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
    selection: null, legaux: new Map(), recentes: [], uniques: new Set(),
  };
  const nomChampion = () => (jeu.cle !== 'autres' ? CHAMPIONS[jeu.cle].nom : jeu.couleur === 'blanc' ? jeu.partie.bl : jeu.partie.no);
  const nomAdversaire = () => (jeu.couleur === 'blanc' ? jeu.partie.no : jeu.partie.bl);
  const nomCourt = () => nomChampion().split(' ').slice(-1)[0];

  // ---------- Écran de choix ----------
  const annee = (c) => +(c.epoque.match(/\d{4}/) || [0])[0];
  const nbParties = (cle) => PARTIES.filter(p => p.ch === cle).length;
  function construireChoix() {
    // les plus récents d'abord ; seulement les champions qui ont des parties
    const cles = Object.keys(CHAMPIONS).filter(cle => nbParties(cle)).sort((a, b) => annee(CHAMPIONS[b]) - annee(CHAMPIONS[a]));
    const carte = (cle, portrait, nom, sous, n, monde) =>
      `<button type="button" class="carte-champion${cle === 'hasard' ? ' hasard' : ''}" data-cle="${cle}">` +
      `<span class="carte-portrait">${portrait}${monde ? `<span class="couronne" title="${CHAMPIONS[cle] && CHAMPIONS[cle].femme ? 'Championne' : 'Champion'} du monde">`+'<svg viewBox="0 0 24 24"><use href="#ico-couronne"/></svg></span>' : ''}</span>` +
      `<span class="carte-nom">${echapper(nom)}</span><span class="carte-sous">${echapper(sous)}</span>` +
      (n ? `<span class="carte-nb">${n} partie${n > 1 ? 's' : ''}</span>` : '') + '</button>';
    let h = carte('hasard', '<svg class="de-hasard" viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-hasard"/></svg>', 'Au hasard', 'Une partie au hasard', PARTIES.length);
    for (const cle of cles) {
      const c = CHAMPIONS[cle];
      h += carte(cle, window.Portraits.svg(cle), c.nom, `${c.epoque} · ${c.pays}`, nbParties(cle), c.monde);
    }
    h += carte('autres', window.Portraits.svg('autres'), 'Autres maîtres', 'D\'autres grands joueurs', nbParties('autres'));
    $('grille-champions').innerHTML = h;
  }
  $('grille-champions').addEventListener('click', (e) => {
    const b = e.target.closest('.carte-champion');
    if (b) choisirPartie(b.dataset.cle);
  });

  function choisirPartie(cle) {
    let liste = PARTIES.map((p, i) => i).filter(i => cle === 'hasard' || PARTIES[i].ch === cle);
    const neuves = liste.filter(i => !jeu.recentes.includes(i));
    if (neuves.length) liste = neuves;
    const i = liste[Math.floor(Math.random() * liste.length)];
    jeu.recentes = [i, ...jeu.recentes].slice(0, 30);
    jeu.choixCle = cle;
    lancerPartie(PARTIES[i]);
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
    document.body.dataset.ecran = 'partie';
    $('titre').textContent = nomChampion();
    $('duel-portrait').innerHTML = window.Portraits.svg(jeu.cle === 'autres' ? 'autres' : jeu.cle);
    $('duel-champion').innerHTML = `${echapper(nomChampion())} <span class="camp ${jeu.couleur}">${jeu.couleur === 'blanc' ? 'Blancs' : 'Noirs'}</span>`;
    $('duel-adversaire').textContent = `contre ${nomAdversaire()}` + (p.l || p.a ? ` · ${[p.l, p.a || ''].filter(Boolean).join(', ')}` : '');
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
    jeu.anim++;
    jeu.selection = null;
  }

  // la suite : prochain coup joué tout seul, ou moment où l'enfant joue
  function planifier() {
    clearTimeout(jeu.minuterie);
    if (jeu.etat !== 'lecture') return;
    if (jeu.ply >= jeu.coups.length) { finir(); return; }
    if (jeu.moments.has(jeu.ply)) { debutMoment(); return; }
    jeu.minuterie = setTimeout(() => {
      if (jeu.etat !== 'lecture') return;
      const ply = jeu.ply;
      animer(ply, Math.min(520, DELAI[reglages.vitesse] * 0.45), () => {
        jeu.ply = ply + 1;
        dessinerFeuille();
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
    const promo = jeu.coups[ply][4];
    const BRAVO = {
      mat: `Échec et mat ! ${nomCourt()} gagne comme ça.`,
      sacrifice: `${nomCourt()} ose donner une pièce : c'est un sacrifice !`,
      gain: 'Ce coup gagne du matériel.',
      echec: 'Échec au roi !',
      promotion: `Le pion devient ${promo === 'q' ? 'une dame' : promo === 'n' ? 'un cavalier' : promo === 'r' ? 'une tour' : 'un fou'} !`,
      calme: `C'est bien le coup de ${nomCourt()}.`,
      unique: `C'était le seul bon coup, et ${nomCourt()} l'a trouvé : toi aussi !`,
    };
    const titre = r === 'premier' ? 'Bravo, du premier coup !' : r === 'aide' ? 'Bravo !' : 'C\'est ça !';
    consigne(titre, coupEcrit(jeu.san[ply], jeu.couleur), BRAVO[type] || BRAVO.calme);
    $('consigne').classList.add('reussi');
    animer(ply, 0, () => {
      Echiquier.marquer(plateau, [jeu.coups[ply].slice(2, 4)], 'trouve');
      jeu.ply = ply + 1;
      dessinerPoints();
      dessinerFeuille();
      majBoutons();
      jeu.minuterie = setTimeout(() => {
        $('consigne').classList.remove('reussi');
        if (jeu.etat !== 'anim') return;
        jeu.etat = 'lecture';
        if (jeu.ply < jeu.coups.length) consigne('La partie continue…', '', '');
        majBoutons();
        planifier();
      }, 2200);
    });
  }

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
    if (jeu.etat !== 'moment' || e.button > 0) return;
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
    $('btn-autre-texte').textContent = jeu.choixCle === 'hasard' ? 'Une autre partie au hasard' : jeu.cle === 'autres' ? 'Une autre partie' : `Une autre partie de ${nomCourt()}`;
    $('fin').hidden = false;
    $('actions-joue').hidden = true;
    $('consigne').hidden = true;
    $('fin').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (premiers === total) Sons.bravo();
    $('btn-autre').focus({ preventScroll: true });
  }

  // ---------- Affichage ----------
  function consigne(titre, coup, detail) {
    $('consigne-titre').textContent = titre;
    $('consigne-coup').hidden = !coup;
    $('consigne-coup').innerHTML = coup || '';
    $('consigne-detail').textContent = detail || '';
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
        return `<span class="${r ? 'a-toi ' + r : ''}">${echapper(traduire(jeu.san[j]))}</span>`;
      };
      h += `<li><span class="num">${i / 2 + 1}.</span>${cell(i)}${cell(i + 1)}</li>`;
    }
    const f = $('feuille');
    f.innerHTML = h;
    f.scrollTop = f.scrollHeight;
  }

  // ---------- Boutons ----------
  $('btn-lecture').addEventListener('click', () => {
    if (jeu.etat === 'lecture') { jeu.etat = 'pause'; clearTimeout(jeu.minuterie); consigne('Partie en pause', '', ''); }
    else if (jeu.etat === 'pause') { jeu.etat = 'lecture'; consigne('La partie continue…', '', ''); planifier(); }
    majBoutons();
  });
  // « À moi ! » : on avance directement jusqu'au prochain moment (ou jusqu'à la fin s'il n'y en a plus)
  $('btn-suivant').addEventListener('click', () => {
    if (jeu.etat === 'moment' || jeu.etat === 'anim' || jeu.etat === 'fin') return;
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
  $('btn-retourner').addEventListener('click', () => {
    jeu.orientation = jeu.orientation === 'blanc' ? 'noir' : 'blanc';
    if (jeu.etat === 'anim') return;
    const sel = jeu.selection;
    dessiner(jeu.ply);
    if (jeu.indice) Echiquier.marquer(plateau, [jeu.coups[jeu.ply].slice(0, 2)], 'indice');
    if (jeu.montre) Echiquier.marquer(plateau, [jeu.coups[jeu.ply].slice(2, 4)], 'cible');
    if (sel) selectionner(sel);
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
    if (e.key === ' ' && (jeu.etat === 'lecture' || jeu.etat === 'pause')) { e.preventDefault(); $('btn-lecture').click(); }
    if (e.key === 'Escape') deselectionner();
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
  // pour les tests
  window.JoueLeCoup = { jeu, choisirPartie, lancerPartie, tenter, PARTIES };
})();
