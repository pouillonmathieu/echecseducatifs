/* À l'aveugle
   Une partie complète contre l'ordinateur (Stockfish, moteur.js), sans voir l'échiquier : il est caché en
   permanence, et le bouton « Coup d'œil » le montre tant qu'on le garde appuyé (ou la barre d'espace).
   Les coups s'écrivent sur la feuille de partie, comme dans « Note le coup » : clavier à l'écran, clavier de
   l'appareil, ou dictée (voix.js). Les coups de l'ordinateur sont lus à voix haute (réglage).
   Les règles (coups possibles, fin de partie) viennent de chess.js (lib/chess.js). */
(function () {
  const { EN, t, Prefs, brancherReglages, brancherInterrupteur } = window.Commun;
  const { lancerPluie, allumerEtoiles } = window.UI;
  const Sons = window.Sons;
  const Voix = window.VoixAveugle;
  const { Chess } = window.ChessJS;
  const $ = (id) => document.getElementById(id);
  const plateau = $('echiquier');

  // dossier de ce script (les pages anglaises chargent les mêmes fichiers) : le moteur est à côté
  const SRC = (document.currentScript && document.currentScript.src) || '';
  const BASE = SRC ? SRC.split('?')[0].replace(/[^/]*$/, '') : '';
  const VERSION = SRC.split('?v=')[1] || '';
  const moteur = new window.MoteurAveugle.Moteur(`${BASE}stockfish/stockfish-18-lite-single.js${VERSION ? '?v=' + VERSION : ''}`);
  const PAUSE_ORDI = 700; // l'ordinateur ne répond pas instantanément : on a le temps de voir que c'est son tour

  const reglages = {
    anglais: EN || Prefs.lire('echecs.aveugle.anglais', false),
    niveau: Prefs.lire('echecs.aveugle.niveau', 1),
    couleur: Prefs.lire('echecs.aveugle.couleur', 'blanc'),
    lire: Prefs.lire('echecs.aveugle.lire', true),
    adaptatif: Prefs.lire('echecs.aveugle.adaptatif', false),
    clavier: Prefs.lire('echecs.aveugle.clavier', true),
    coordonnees: Prefs.lire('echecs.aveugle.coordonnees', true),
  };
  const langue = () => (reglages.anglais ? 'en' : 'fr');

  const jeu = {
    chess: new Chess(), joueur: 'w', gen: 0, fin: null, reflechit: false,
    jetons: [], oeil: 0, oeilEnCours: false, dernierOrdi: null, erreurs: 0,
  };

  // ---------- Notation (comme « Note le coup ») ----------
  const PIECES = { K: 'roi', Q: 'dame', R: 'tour', B: 'fou', N: 'cavalier' };
  const NOM = EN ? { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight' } : PIECES;
  const LETTRES = { fr: { K: 'R', Q: 'D', R: 'T', B: 'F', N: 'C' }, en: { K: 'K', Q: 'Q', R: 'R', B: 'B', N: 'N' } };
  const DEPUIS = { fr: Object.fromEntries(Object.entries(LETTRES.fr).map(([a, b]) => [b, a])), en: { K: 'K', Q: 'Q', R: 'R', B: 'B', N: 'N' } };
  const traduire = (san) => san.replace(/[KQRBN]/g, (c) => LETTRES[langue()][c]);
  const echapper = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const couleurDe = (c) => (c === 'w' ? 'blanc' : 'noir');

  // ce qu'on accepte en plus de la notation exacte : espaces, 0-0, e.p., ++, e8D…
  function normaliser(s) {
    let r = s.trim().replace(/\s+/g, '').replace(/[!?]/g, '').replace(/[–—−]/g, '-').replace(/×/g, 'x').replace(/:/g, 'x');
    r = r.replace(/^[0oO]-?[0oO]-?[0oO]$/, 'O-O-O').replace(/^[0oO]-?[0oO]$/, 'O-O');
    r = r.replace(/^[0oO]-[0oO]-[0oO](?=[+#])/, 'O-O-O').replace(/^[0oO]-[0oO](?=[+#])/, 'O-O');
    r = r.replace(/e\.?p\.?(?=[+#]?$)/, '');
    return r;
  }

  // Le coup voulu, d'après ce qui est écrit (notation anglaise). Rend { coup } ou { erreur, options }.
  function trouverCoup(texte) {
    const t0 = normaliser(texte);
    if (!t0) return { erreur: 'vide' };
    const essai = analyser(t0);
    if (essai.coup || essai.erreur === 'ambigu' || essai.erreur === 'promotion') return essai;
    // « cf3 » en minuscules : on essaie avec la lettre de pièce en majuscule
    const maj = t0[0].toUpperCase();
    const L = DEPUIS[langue()][maj] || (reglages.anglais ? null : DEPUIS.en[maj]);
    if (/^[a-z]/.test(t0) && L && t0.length >= 3) {
      const e2 = analyser(L + t0.slice(1));
      if (e2.coup || e2.erreur === 'ambigu') return e2;
    }
    return essai;
  }
  function analyser(t0) {
    const legaux = jeu.chess.moves({ verbose: true });
    const sansSignes = t0.replace(/[+#]/g, '');
    if (sansSignes === 'roque') {
      const r = legaux.filter((m) => /^O-O/.test(m.san));
      return r.length === 1 ? { coup: r[0] } : r.length ? { erreur: 'ambigu', options: r } : { erreur: 'impossible' };
    }
    if (/^O-O(-O)?$/.test(sansSignes)) {
      const r = legaux.find((m) => m.san.replace(/[+#]/g, '') === sansSignes);
      return r ? { coup: r } : { erreur: 'impossible' };
    }
    const m = sansSignes.match(/^([KQRBN])?([a-h])?([1-8])?(x)?-?([a-h][1-8])(?:=?([QRBN]))?$/);
    if (!m) return { erreur: 'illisible' };
    const [, piece, col, rang, prise, arrivee, promo] = m;
    const depuisCase = !piece && col && rang; // « e2e4 », « g1f3 » : n'importe quelle pièce de cette case
    let c = legaux.filter((x) => x.to === arrivee
      && (depuisCase || x.piece === (piece ? piece.toLowerCase() : 'p'))
      && (!col || x.from[0] === col) && (!rang || x.from[1] === rang)
      && (!promo || x.promotion === promo.toLowerCase()));
    if (!c.length) return { erreur: 'impossible' };
    // un pion sans colonne de départ : « d5 » est le pion qui avance, « xd5 » celui qui prend
    if (c.length > 1 && !piece && !col) {
      const p = c.filter((x) => (prise ? x.from[0] !== arrivee[0] : x.from[0] === arrivee[0]));
      if (p.length) c = p;
    }
    if (c.length > 1 && c.every((x) => x.promotion) && new Set(c.map((x) => x.from)).size === 1) return { erreur: 'promotion', options: c };
    if (c.length > 1) return { erreur: 'ambigu', options: c };
    return { coup: c[0] };
  }

  // ---------- L'échiquier (caché) ----------
  function dessinerPlateau() {
    Echiquier.dessiner(plateau, jeu.chess.fen(), { orientation: couleurDe(jeu.joueur) });
    const h = jeu.chess.history({ verbose: true });
    const d = h[h.length - 1];
    if (d) { Echiquier.marquer(plateau, [d.from], 'depart'); Echiquier.marquer(plateau, [d.to], 'arrivee'); }
  }
  function coupDOeil(v) {
    if (v === jeu.oeilEnCours) return;
    jeu.oeilEnCours = v;
    // sur un petit écran, la case de l'échiquier caché est petite : le coup d'œil le montre en grand, par-dessus
    if (v) document.body.classList.toggle('oeil-grand', window.innerWidth <= 760 && $('cadre-aveugle').getBoundingClientRect().width < Math.min(300, window.innerWidth - 40));
    document.body.classList.toggle('oeil', v);
    $('btn-oeil').setAttribute('aria-pressed', String(v));
    if (v && !jeu.fin) {
      jeu.oeil++;
      $('compte-oeil').textContent = jeu.oeil;
      Sons.tic();
    }
  }

  // ---------- La feuille de partie ----------
  function dessinerFeuille() {
    const h = jeu.chess.history();
    const rangees = [];
    for (let i = 0; i < h.length; i++) {
      const n = Math.floor(i / 2);
      if (!rangees[n]) rangees[n] = { num: n + 1, w: null, b: null };
      rangees[n][i % 2 ? 'b' : 'w'] = { san: h[i], ordi: (i % 2 ? 'b' : 'w') !== jeu.joueur };
    }
    // la case du coup à venir : à toi (case à remplir), ou l'ordinateur qui réfléchit
    if (!jeu.fin) {
      const i = h.length;
      const n = Math.floor(i / 2);
      if (!rangees[n]) rangees[n] = { num: n + 1, w: null, b: null };
      rangees[n][i % 2 ? 'b' : 'w'] = jeu.reflechit ? { attente: true } : { cible: true };
    }
    if (!rangees.length) rangees.push({ num: 1, w: null, b: null });
    const cellule = (d, cote) => {
      if (!d) return '<td class="vide"></td>';
      if (d.attente) return `<td class="attente" aria-label="${t('L\'ordinateur réfléchit', 'The computer is thinking')}"><span class="points-attente"><i></i><i></i><i></i></span></td>`;
      if (d.cible) return `<td class="a-remplir" id="cible">${champ(cote)}</td>`;
      return `<td class="${d.ordi ? 'coup-ordi' : 'coup-joueur'}">${echapper(traduire(d.san))}</td>`;
    };
    $('feuille').innerHTML = rangees.map((r) => `<tr><th class="num" scope="row">${r.num}.</th>${cellule(r.w, 'w')}${cellule(r.b, 'b')}</tr>`).join('');
    const cadre = $('cadre-feuille');
    cadre.scrollTop = cadre.scrollHeight;
    const saisie = $('saisie');
    if (saisie) {
      saisie.addEventListener('input', () => { jeu.jetons = lireChamp(saisie.value); });
      if (matchMedia('(hover: hover)').matches) saisie.focus({ preventScroll: true });
    }
    majBoutons();
  }
  function champ() {
    const label = t('Ton coup', 'Your move');
    if (reglages.clavier) return `<span class="saisie-tp" id="saisie-tp" aria-live="polite" aria-label="${label}">${dessinerJetons()}</span>`;
    return `<input id="saisie" class="champ" type="text" form="form-saisie" value="${echapper(traduire(jeu.jetons.join('')))}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" maxlength="14" aria-label="${label}" placeholder="?">`;
  }
  const lireChamp = (texte) => [...texte].map((ch) => DEPUIS[langue()][ch] || ch);
  function dessinerJetons() {
    return echapper(traduire(jeu.jetons.join(''))) + '<span class="curseur" aria-hidden="true"></span>';
  }
  function majSaisie() {
    $('cible')?.classList.toggle('a-remplacer', !!jeu.remplacer);
    const tp = $('saisie-tp');
    if (tp) tp.innerHTML = dessinerJetons();
    const s = $('saisie');
    if (s) s.value = traduire(jeu.jetons.join(''));
  }

  // ---------- Clavier à l'écran ----------
  function construireClavier() {
    const touche = (val, contenu, label, classe = '') =>
      `<button type="button" class="touche ${classe}" data-val="${val}" aria-label="${label}">${contenu}</button>`;
    const pieces = ['K', 'Q', 'R', 'B', 'N'].map((l) => touche(l, `<b>${LETTRES[langue()][l]}</b><small>${NOM[l]}</small>`, NOM[l], 'piece')).join('');
    const colonnes = 'abcdefgh'.split('').map((l) => touche(l, `<b>${l}</b>`, l, 'lettre')).join('');
    const chiffres = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => touche(String(n), `<b>${n}</b>`, String(n), 'chiffre')).join('');
    const prise = touche('x', `<b>x</b><small>${t('prend', 'takes')}</small>`, t('x : prend', 'x: takes'), 'symbole');
    const symboles =
      touche('+', `<b>+</b><small>${t('échec', 'check')}</small>`, t('+ : échec', '+: check'), 'symbole') +
      touche('#', `<b>#</b><small>${t('mat', 'mate')}</small>`, t('# : échec et mat', '#: checkmate'), 'symbole') +
      touche('O-O', `<b>O-O</b><small>${t('petit roque', 'short castling')}</small>`, t('petit roque', 'short castling'), 'symbole') +
      touche('O-O-O', `<b>O-O-O</b><small>${t('grand roque', 'long castling')}</small>`, t('grand roque', 'long castling'), 'symbole') +
      touche('=', '<b>=</b><small>promotion</small>', t('= : promotion', '=: promotion'), 'symbole');
    const effacer = `<button type="button" class="touche effacer" data-val="effacer" aria-label="${t('Effacer', 'Delete')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h11v14H9l-6-7Z"/><path d="M12 9.5l5 5M17 9.5l-5 5"/></svg></button>`;
    $('clavier').innerHTML =
      `<div class="rangee-touches pieces">${pieces}${prise}${effacer}</div>` +
      `<div class="rangee-touches huit">${colonnes}</div>` +
      `<div class="rangee-touches huit">${chiffres}</div>` +
      `<div class="rangee-touches symboles">${symboles}</div>`;
  }
  const aMoi = () => !jeu.fin && !jeu.reflechit && jeu.chess.turn() === jeu.joueur;
  function taper(val) {
    if (!aMoi()) return;
    // après un coup refusé, la première touche remplace ce qui était écrit (comme un texte sélectionné)
    if (jeu.remplacer && val !== 'effacer') jeu.jetons = [];
    jeu.remplacer = false;
    if (val === 'effacer') jeu.jetons.pop();
    else if (jeu.jetons.join('').length < 10) jeu.jetons.push(val);
    Sons.tic();
    effacerMessage();
    majSaisie();
  }

  // ---------- Messages ----------
  // choix : des coups à proposer en boutons (dictée hésitante) ; toucher un bouton l'écrit dans la case
  function message(texte, genre = '', choix = []) {
    const m = $('message');
    m.textContent = texte;
    if (choix.length) {
      const boutons = document.createElement('span');
      boutons.className = 'choix-dictee';
      for (const c of choix) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'bouton-secondaire';
        b.textContent = traduire(c.san);
        b.addEventListener('click', () => { proposer(c); message(t(`${traduire(c.san)} : appuie sur « Jouer ».`, `${traduire(c.san)}: press "Play".`)); $('btn-valider').focus({ preventScroll: true }); });
        boutons.appendChild(b);
      }
      m.appendChild(boutons);
    }
    m.className = `message ${genre}`;
    m.hidden = !texte;
  }
  // écrit un coup dans la case (les jetons sont en notation anglaise, comme ceux du clavier à l'écran)
  function proposer(coup) {
    jeu.jetons = [...coup.san.replace(/[+#]/g, '')];
    jeu.remplacer = false;
    majSaisie();
  }
  const effacerMessage = () => { if (!$('message').classList.contains('fixe')) message(''); };
  function secouer() {
    const el = $('cible');
    if (!el) return;
    el.classList.remove('secoue'); void el.offsetWidth; el.classList.add('secoue');
    Sons.refus();
  }
  const listeCoups = (options) => [...new Set(options.map((o) => traduire(o.san.replace(/[+#]/g, ''))))].join(t(' ou ', ' or '));

  // ---------- Tour du joueur ----------
  function valider() {
    if (!aMoi()) return;
    const texte = jeu.jetons.join('');
    const r = trouverCoup(texte);
    if (r.coup) { jouerCoupJoueur(r.coup); return; }
    secouer();
    jeu.remplacer = true;
    const champTexte = $('saisie');
    if (champTexte) champTexte.select();
    $('cible')?.classList.add('a-remplacer');
    if (r.erreur === 'vide') { message(t('Écris ton coup d\'abord (par exemple e4 ou Cf3).', 'Write your move first (for example e4 or Nf3).')); return; }
    jeu.erreurs++;
    if (r.erreur === 'illisible') message(t('Je ne comprends pas cette notation. Exemples : e4, Cf3, Fxc4, O-O.', 'I don\'t understand this notation. Examples: e4, Nf3, Bxc4, O-O.'), 'erreur');
    else if (r.erreur === 'ambigu') message(t(`Plusieurs coups possibles : ${listeCoups(r.options)}. Précise lequel.`, `Several moves are possible: ${listeCoups(r.options)}. Say which one.`), 'erreur');
    else if (r.erreur === 'promotion') message(t(`Le pion devient quelle pièce ? Ajoute = et la lettre : ${listeCoups(r.options)}.`, `Which piece does the pawn become? Add = and the letter: ${listeCoups(r.options)}.`), 'erreur');
    else {
      message(t('Ce coup n\'est pas possible dans cette position. Un coup d\'œil ?', 'This move isn\'t possible in this position. Take a peek?'), 'erreur');
      window.Pom?.erreur();
    }
  }
  function jouerCoupJoueur(m) {
    const fait = jeu.chess.move(m.san);
    jeu.jetons = [];
    jeu.remplacer = false;
    message('');
    Sons.pose(fait.captured ? 5 : 3);
    if (fait.captured || /[+#]/.test(fait.san)) window.Pom?.bonneReponse();
    apresCoup();
  }
  function apresCoup() {
    dessinerPlateau();
    if (verifierFin()) return;
    if (jeu.chess.turn() !== jeu.joueur) tourOrdi();
    else dessinerFeuille();
  }

  // ---------- Tour de l'ordinateur ----------
  async function tourOrdi() {
    const gen = jeu.gen;
    jeu.reflechit = true;
    dessinerFeuille();
    const debut = performance.now();
    let r;
    try {
      r = await moteur.jouer(jeu.chess.fen(), reglages.niveau, reglages.adaptatif);
    } catch (e) {
      if (gen !== jeu.gen) return;
      jeu.reflechit = false;
      message(t('L\'ordinateur ne peut pas jouer sur cet appareil (navigateur trop ancien ?).', 'The computer can\'t play on this device (browser too old?).'), 'erreur fixe');
      dessinerFeuille();
      return;
    }
    const reste = PAUSE_ORDI - (performance.now() - debut);
    if (reste > 0) await new Promise((ok) => setTimeout(ok, reste));
    if (gen !== jeu.gen || !r.coup) return;
    const fait = jeu.chess.move({ from: r.coup.slice(0, 2), to: r.coup.slice(2, 4), promotion: r.coup[4] });
    jeu.reflechit = false;
    jeu.dernierOrdi = fait.san;
    Sons.pose(fait.captured ? 5 : 3);
    if (reglages.lire) Voix.lire(fait.san);
    apresCoup();
  }

  // ---------- Fin de partie ----------
  function verifierFin() {
    const c = jeu.chess;
    if (!c.isGameOver()) return false;
    let gagnant = null, raison;
    if (c.isCheckmate()) { gagnant = c.turn() === 'w' ? 'b' : 'w'; raison = 'mat'; }
    else if (c.isStalemate()) raison = 'pat';
    else if (c.isThreefoldRepetition()) raison = 'repetition';
    else if (c.isInsufficientMaterial()) raison = 'materiel';
    else raison = 'cinquante';
    terminer(gagnant, raison);
    return true;
  }
  const RAISONS = {
    mat: [t('Échec et mat !', 'Checkmate!')],
    pat: [t('Pat : le roi n\'est pas en échec, mais il n\'y a plus aucun coup possible.', 'Stalemate: the king is not in check, but there is no legal move left.')],
    repetition: [t('La même position est revenue trois fois.', 'The same position came back three times.')],
    materiel: [t('Il ne reste pas assez de pièces pour faire mat.', 'There aren\'t enough pieces left to checkmate.')],
    cinquante: [t('50 coups sans prise ni pion avancé.', '50 moves without a capture or a pawn move.')],
    abandon: [t('Tu as abandonné.', 'You resigned.')],
  };
  function terminer(gagnant, raison) {
    jeu.fin = { gagnant, raison };
    jeu.reflechit = false;
    document.body.classList.add('fini');
    dessinerPlateau();
    dessinerFeuille();
    const gagne = gagnant === jeu.joueur, nulle = !gagnant;
    const etoiles = gagne ? 3 : nulle ? 2 : 1;
    message(gagne ? t('Tu as gagné !', 'You won!') : nulle ? t('Match nul.', 'Draw.') : t('L\'ordinateur a gagné.', 'The computer won.'), `fin fixe ${gagne ? 'gagne' : ''}`);
    setTimeout(() => {
      if (!jeu.fin) return;
      $('res-titre').textContent = gagne ? t('Victoire !', 'Victory!') : nulle ? t('Match nul !', 'It\'s a draw!') : t('Perdu… mais bravo !', 'Lost… but well done!');
      $('res-detail').textContent = RAISONS[raison][0] + (gagne || nulle ? '' : ' ' + t('Jouer sans voir l\'échiquier, c\'est très difficile : continue !', 'Playing without seeing the board is very hard: keep going!'));
      const coups = Math.ceil(jeu.chess.history().length / 2);
      $('res-stats').innerHTML = [
        [t('Coups', 'Moves'), coups],
        [t('Coups d\'œil', 'Peeks'), jeu.oeil],
        [t('Niveau', 'Level'), reglages.niveau + (reglages.adaptatif ? t(' (adaptatif)', ' (adaptive)') : '')],
      ].map(([a, b]) => `<li><b>${b}</b><span>${a}</span></li>`).join('');
      allumerEtoiles($('etoiles'), etoiles);
      $('resultats').hidden = false;
      $('btn-res-nouvelle').focus({ preventScroll: true });
      if (gagne) { lancerPluie($('pluie'), 70); Sons.victoire(); } else if (nulle) Sons.juste(); else Sons.echec();
      window.Pom?.resultat(etoiles);
    }, raison === 'abandon' ? 200 : 1300);
  }

  // ---------- Parties ----------
  function nouvellePartie() {
    jeu.gen++;
    moteur.arreter();
    Voix.arreterEcoute();
    window.speechSynthesis?.cancel();
    jeu.chess = new Chess();
    jeu.joueur = reglages.couleur === 'hasard' ? (Math.random() < 0.5 ? 'w' : 'b') : reglages.couleur === 'noir' ? 'b' : 'w';
    jeu.fin = null; jeu.reflechit = false; jeu.jetons = []; jeu.oeil = 0; jeu.erreurs = 0; jeu.dernierOrdi = null;
    $('compte-oeil').textContent = '0';
    $('resultats').hidden = true;
    $('pluie').innerHTML = '';
    document.body.classList.remove('fini');
    message('');
    moteur.nouvellePartie().catch(() => {});
    dessinerPlateau();
    if (jeu.joueur === 'b') tourOrdi();
    else dessinerFeuille();
  }
  // une partie commencée (le joueur a déjà joué) et pas finie
  const enCours = () => !jeu.fin && jeu.chess.history().length >= (jeu.joueur === 'w' ? 1 : 2);
  function demander(titre, texte, oui, quoi) {
    if (!enCours()) { quoi(); return; }
    $('confirmation-titre').textContent = titre;
    $('confirmation-texte').textContent = texte;
    $('btn-confirmer').textContent = oui;
    $('confirmation').hidden = false;
    $('btn-annuler-confirmation').focus({ preventScroll: true });
    confirmer = quoi;
  }
  let confirmer = null;
  const fermerConfirmation = () => { $('confirmation').hidden = true; confirmer = null; };
  $('btn-confirmer').addEventListener('click', () => { const f = confirmer; fermerConfirmation(); if (f) f(); });
  $('btn-annuler-confirmation').addEventListener('click', fermerConfirmation);
  $('confirmation').addEventListener('click', (e) => { if (e.target === e.currentTarget) fermerConfirmation(); });

  const demanderNouvelle = (apres) => demander(t('Nouvelle partie ?', 'New game?'), t('La partie en cours sera perdue.', 'The current game will be lost.'), t('Oui, nouvelle partie', 'Yes, new game'), () => { if (apres) apres(); nouvellePartie(); });
  $('btn-nouvelle').addEventListener('click', () => demanderNouvelle());
  $('btn-res-nouvelle').addEventListener('click', nouvellePartie);
  $('btn-res-voir').addEventListener('click', () => { $('resultats').hidden = true; });
  $('btn-abandonner').addEventListener('click', () => {
    if (jeu.fin) return;
    demander(t('Abandonner ?', 'Resign?'), t('L\'ordinateur gagnera la partie.', 'The computer will win the game.'), t('Oui, j\'abandonne', 'Yes, I resign'), () => {
      jeu.gen++; moteur.arreter();
      terminer(jeu.joueur === 'w' ? 'b' : 'w', 'abandon');
    });
  });
  // reprendre son dernier coup (et la réponse de l'ordinateur)
  $('btn-reprendre').addEventListener('click', () => {
    const h = jeu.chess.history().length;
    if (h === 0) return;
    jeu.gen++;
    moteur.arreter();
    jeu.reflechit = false;
    if (jeu.fin) { jeu.fin = null; document.body.classList.remove('fini'); $('resultats').hidden = true; }
    // on défait jusqu'à revenir avant le dernier coup du joueur
    let defait = 0;
    while (jeu.chess.history().length) {
      const dernier = jeu.chess.undo();
      defait++;
      if (dernier.color === jeu.joueur) break;
    }
    if (!defait || jeu.chess.turn() !== jeu.joueur) {
      // (le joueur noir n'a pas encore joué : l'ordinateur rejoue son premier coup)
      apresCoup();
      return;
    }
    jeu.jetons = [];
    message(t('Coup repris : à toi de rejouer.', 'Move taken back: your turn again.'));
    dessinerPlateau();
    dessinerFeuille();
  });
  function majBoutons() {
    $('btn-reprendre').disabled = !jeu.chess.history().some((m, i) => (i % 2 ? 'b' : 'w') === jeu.joueur);
    $('btn-abandonner').disabled = !!jeu.fin;
    $('btn-reecouter').disabled = !jeu.dernierOrdi || !Voix.lecture;
    $('btn-valider').disabled = !aMoi();
    $('btn-dictee').disabled = !aMoi();
  }

  // ---------- Coup d'œil ----------
  const oeil = $('btn-oeil');
  oeil.addEventListener('pointerdown', (e) => { e.preventDefault(); oeil.setPointerCapture?.(e.pointerId); coupDOeil(true); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((n) => oeil.addEventListener(n, () => coupDOeil(false)));
  oeil.addEventListener('contextmenu', (e) => e.preventDefault());
  oeil.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); coupDOeil(true); } });
  oeil.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') coupDOeil(false); });
  oeil.addEventListener('blur', () => coupDOeil(false));
  window.addEventListener('blur', () => coupDOeil(false));

  $('btn-reecouter').addEventListener('click', () => { if (jeu.dernierOrdi) Voix.lire(jeu.dernierOrdi); });

  // ---------- Dictée ----------
  const dictee = $('btn-dictee');
  dictee.hidden = !Voix.dictee;
  dictee.addEventListener('click', async () => {
    if (document.body.classList.contains('ecoute')) { Voix.arreterEcoute(); return; }
    if (!aMoi()) return;
    window.speechSynthesis?.cancel();
    document.body.classList.add('ecoute');
    dictee.setAttribute('aria-pressed', 'true');
    message(t('Je t\'écoute : dis ton coup (par exemple « cavalier f3 »).', 'I\'m listening: say your move (for example "knight f3").'), 'ecoute');
    let phrases = [];
    const gen = jeu.gen;
    const legaux = jeu.chess.moves({ verbose: true });
    try { phrases = await Voix.ecouter(Voix.phrasesAttendues(legaux)); }
    catch (e) {
      document.body.classList.remove('ecoute');
      dictee.setAttribute('aria-pressed', 'false');
      message(/not-allowed|service-not-allowed/.test(e.message)
        ? t('Le micro n\'est pas autorisé : autorise-le dans les réglages du navigateur.', 'The microphone isn\'t allowed: allow it in the browser settings.')
        : t('La dictée ne marche pas ici (il faut parfois une connexion Internet).', 'Dictation doesn\'t work here (it sometimes needs an Internet connection).'), 'erreur');
      return;
    }
    document.body.classList.remove('ecoute');
    dictee.setAttribute('aria-pressed', 'false');
    if (gen !== jeu.gen || !aMoi()) return;
    // 1) la phrase est déjà un coup clair (« cavalier f3 ») ; 2) sinon, le coup possible qui se prononce le plus
    // pareil (« je prends des six » -> e prend d6, voix.js)
    let meilleur = null, ambigu = null, autre = null;
    for (const p of phrases) {
      const n = Voix.versNotation(p);
      if (!n) continue;
      const r = trouverCoup(n);
      if (r.coup) { meilleur = r.coup; break; }
      if (!ambigu && (r.erreur === 'ambigu' || r.erreur === 'promotion')) ambigu = r;
    }
    if (!meilleur && phrases.length) {
      const c = Voix.choisirCoup(phrases, legaux);
      if (c && c.score <= 0.45) { meilleur = c.coup; autre = c.autre; ambigu = null; }
    }
    if (meilleur) {
      proposer(meilleur);
      const entendu = phrases[0] ? t(`J'ai entendu « ${phrases[0]} » : `, `I heard "${phrases[0]}": `) : '';
      if (autre) message(entendu + t(`${traduire(meilleur.san)} ou ${traduire(autre.san)} ?`, `${traduire(meilleur.san)} or ${traduire(autre.san)}?`), '', [meilleur, autre]);
      else message(entendu + t(`${traduire(meilleur.san)}. Appuie sur « Jouer ».`, `${traduire(meilleur.san)}. Press "Play".`));
      $('btn-valider').focus({ preventScroll: true });
    } else if (ambigu) {
      message(t(`Plusieurs coups possibles : ${listeCoups(ambigu.options)}. Précise lequel.`, `Several moves are possible: ${listeCoups(ambigu.options)}. Say which one.`), 'erreur');
    } else {
      message(phrases.length
        ? t(`Je n'ai pas compris un coup possible dans « ${phrases[0]} ».`, `I didn't understand a legal move in "${phrases[0]}".`)
        : t('Je n\'ai rien entendu. Réessaie en parlant près du micro.', 'I didn\'t hear anything. Try again, close to the microphone.'), 'erreur');
    }
  });

  // ---------- Saisie ----------
  $('form-saisie').addEventListener('submit', (e) => { e.preventDefault(); valider(); });
  $('clavier').addEventListener('click', (e) => { const b = e.target.closest('.touche'); if (b) taper(b.dataset.val); });
  $('clavier').addEventListener('mousedown', (e) => e.preventDefault());
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!$('confirmation').hidden) { if (e.key === 'Escape') fermerConfirmation(); return; }
    if (!$('resultats').hidden) return;
    if (e.target.closest('textarea, .panneau, select')) return;
    const dansChamp = !!e.target.closest('input');
    // la barre d'espace, gardée appuyée : coup d'œil
    if (e.key === ' ' && !dansChamp && !e.target.closest('button')) { e.preventDefault(); if (!e.repeat) coupDOeil(true); return; }
    if (dansChamp) return;
    if (e.key === 'Enter') {
      if (e.target.closest('button:not(.touche)')) return;
      e.preventDefault(); valider(); return;
    }
    if (e.key === 'Backspace') { e.preventDefault(); taper('effacer'); return; }
    const L = DEPUIS[langue()][e.key];
    if (L) taper(L);
    else if (/^[a-h1-8x+#=O0o-]$/.test(e.key)) taper(e.key === 'o' || e.key === '0' ? 'O' : e.key);
  });
  document.addEventListener('keyup', (e) => { if (e.key === ' ') coupDOeil(false); });

  // ---------- Réglages ----------
  brancherReglages($('btn-reglages'), $('panneau-reglages'));

  if (EN) $('reg-langue').closest('.ligne-reglage-bloc').hidden = true;
  const segLangue = [...$('reg-langue').querySelectorAll('button')];
  const majLangue = () => segLangue.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.langue === 'en') === reglages.anglais)));
  segLangue.forEach((b) => b.addEventListener('click', () => {
    reglages.anglais = b.dataset.langue === 'en';
    Prefs.ecrire('echecs.aveugle.anglais', reglages.anglais);
    majLangue();
    construireClavier();
    dessinerFeuille();
  }));

  const segNiveau = [...$('reg-niveau').querySelectorAll('button')];
  const majNiveau = () => segNiveau.forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.niveau === reglages.niveau)));
  segNiveau.forEach((b) => b.addEventListener('click', () => {
    reglages.niveau = +b.dataset.niveau;
    Prefs.ecrire('echecs.aveugle.niveau', reglages.niveau);
    majNiveau();
    // (le nouveau niveau compte dès le prochain coup de l'ordinateur)
  }));
  const segCouleur = [...$('reg-couleur').querySelectorAll('button')];
  const majCouleur = () => segCouleur.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.couleur === reglages.couleur)));
  segCouleur.forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.couleur === reglages.couleur && !jeu.fin) return;
    demanderNouvelle(() => {
      reglages.couleur = b.dataset.couleur;
      Prefs.ecrire('echecs.aveugle.couleur', reglages.couleur);
      majCouleur();
    });
  }));

  brancherInterrupteur($('reg-lire'), reglages.lire, (v) => { reglages.lire = v; Prefs.ecrire('echecs.aveugle.lire', v); if (!v) window.speechSynthesis?.cancel(); });
  brancherInterrupteur($('reg-adaptatif'), reglages.adaptatif, (v) => { reglages.adaptatif = v; Prefs.ecrire('echecs.aveugle.adaptatif', v); });
  function appliquerClavier() {
    document.body.classList.toggle('sans-clavier', !reglages.clavier);
    $('clavier').hidden = !reglages.clavier;
    $('btn-clavier').setAttribute('aria-pressed', String(reglages.clavier));
  }
  function changerClavier(v) {
    reglages.clavier = v; Prefs.ecrire('echecs.aveugle.clavier', v);
    interrupteurClavier.definir(v);
    appliquerClavier();
    dessinerFeuille();
    const s = $('saisie');
    if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
  }
  const interrupteurClavier = brancherInterrupteur($('reg-clavier'), reglages.clavier, changerClavier);
  $('btn-clavier').addEventListener('click', () => changerClavier(!reglages.clavier));
  const appliquerCoord = () => document.body.classList.toggle('sans-coordonnees', !reglages.coordonnees);
  brancherInterrupteur($('reg-coordonnees'), reglages.coordonnees, (v) => { reglages.coordonnees = v; Prefs.ecrire('echecs.aveugle.coordonnees', v); appliquerCoord(); });
  brancherInterrupteur($('reg-son'), Sons.actif, (v) => { Sons.actif = v; });

  // ---------- Démarrage ----------
  window.Echecs.injecterSprite();
  construireClavier();
  majLangue();
  majNiveau();
  majCouleur();
  appliquerClavier();
  appliquerCoord();
  nouvellePartie();
  // pour les tests : l'état de la partie
  window.__aveugle = { jeu, trouverCoup, reglages };
})();
