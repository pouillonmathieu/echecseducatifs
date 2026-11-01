/* Note le coup
   L'échiquier montre le dernier coup joué (case de départ et d'arrivée en jaune). La feuille de partie
   reprend les 3 coups d'avant et laisse une case vide : il faut y écrire le dernier coup.
   Niveaux : facile (coups simples, prises) ou difficile (échec, mat, pièce à préciser, roque,
   promotion, prise en passant). Notation en français ou en anglais.
   On écrit avec un clavier à l'écran (ou celui de l'ordinateur). En mode tout-petits, ce clavier montre
   les pièces dessinées, les animaux (lettres) et les doigts (chiffres).
   Les coups viennent de coups.js (généré et vérifié par outils/coups-notation.js), en anglais. */
(function () {
  const { Prefs, brancherBoutonTheme, brancherReglages, brancherInterrupteur } = window.Commun;
  const { lancerPluie, compterJusqua, formaterDuree, allumerEtoiles, ICONES } = window.UI;
  const Sons = window.Sons;
  const COUPS = window.COUPS_NOTATION;
  const { ANIMAUX, animal, mains } = window.ToutPetits;
  const $ = (id) => document.getElementById(id);
  const plateau = $('echiquier');

  const NB_DEFIS = 10;
  const DUREE = 20;

  const reglages = {
    anglais: Prefs.lire('echecs.note.anglais', false),
    difficile: Prefs.lire('echecs.note.difficile', false),
    toutPetits: Prefs.lire('echecs.note.tout-petits', false),
    coordonnees: Prefs.lire('echecs.note.coordonnees', true),
    clavier: Prefs.lire('echecs.note.clavier', true),
  };
  const langue = () => (reglages.anglais ? 'en' : 'fr');
  const niveau = () => (reglages.difficile ? 'difficile' : 'facile');

  const jeu = { mode: 'libre', coup: null, repondu: false, pioche: [], dernier: null, justes: 0, total: 0, partie: 0, jetons: [], anim: 0 };
  const defi = { chrono: false, niveau: 'facile', liste: [], numero: 0, resultats: [], debut: 0, fin: 0, raf: 0, dernierTic: 0 };

  // ---------- Notation ----------
  const PIECES = { K: 'roi', Q: 'dame', R: 'tour', B: 'fou', N: 'cavalier' };
  const LETTRES = { fr: { K: 'R', Q: 'D', R: 'T', B: 'F', N: 'C' }, en: { K: 'K', Q: 'Q', R: 'R', B: 'B', N: 'N' } };
  const DEPUIS = { fr: Object.fromEntries(Object.entries(LETTRES.fr).map(([a, b]) => [b, a])), en: { K: 'K', Q: 'Q', R: 'R', B: 'B', N: 'N' } };
  const FEMININ = { dame: true, tour: true };
  const le = (p) => (FEMININ[p] ? 'la' : 'le');
  const un = (p) => (FEMININ[p] ? 'une' : 'un');

  // notation anglaise -> langue choisie (seules les lettres des pièces changent)
  const traduire = (san, l = langue()) => san.replace(/[KQRBN]/g, (c) => LETTRES[l][c]);

  // Écriture d'un coup : en lettres, ou avec les pièces dessinées (tout-petits).
  function formater(san, couleur) {
    if (!reglages.toutPetits) return echapper(traduire(san));
    return echapper(san).replace(/[KQRBN]/g, (c) => figurine(PIECES[c], couleur));
  }
  const figurine = (piece, couleur) =>
    `<svg class="fig" viewBox="0 0 100 100" aria-label="${piece}"><use href="#piece-${piece}-${couleur}"/></svg>`;
  const echapper = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Ce qu'on accepte en plus de la notation exacte : espaces, 0-0 pour O-O, « e.p. », e8D pour e8=D, !?,
  // et ++ pour le mat (ancienne notation française, équivalente à #).
  function normaliser(s) {
    let r = s.trim().replace(/\s+/g, '').replace(/[!?]/g, '').replace(/[–—−]/g, '-').replace(/×/g, 'x');
    r = r.replace(/^[0oO]-[0oO]-[0oO]/, 'O-O-O').replace(/^[0oO]-[0oO](?!-)/, 'O-O');
    r = r.replace(/\+\+$/, '#');
    r = r.replace(/e\.?p\.?(?=[+#]?$)/, '');
    r = r.replace(/([a-h][18])\(?([A-Z])\)?/, '$1=$2');
    return r;
  }

  // ---------- Tirage ----------
  function melanger(t) {
    const a = [...t];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function piocher() {
    const liste = COUPS[niveau()];
    if (!jeu.pioche.length || jeu.pioche.niveau !== niveau()) {
      jeu.pioche = melanger(liste.map((_, i) => i)).filter(i => i !== jeu.dernier);
      jeu.pioche.niveau = niveau();
    }
    jeu.dernier = jeu.pioche.pop();
    return liste[jeu.dernier];
  }
  // défi difficile : un peu de chaque particularité
  function tirerDefi() {
    if (!reglages.difficile) return melanger(COUPS.facile).slice(0, NB_DEFIS);
    const parCat = {};
    for (const c of melanger(COUPS.difficile)) (parCat[c.cat] = parCat[c.cat] || []).push(c);
    const choix = [];
    for (const [cat, n] of [['mat', 2], ['echec', 2], ['precision', 2], ['roque', 1], ['promotion', 1]]) choix.push(...(parCat[cat] || []).slice(0, n));
    const reste = melanger(COUPS.difficile.filter(c => !choix.includes(c)));
    return melanger([...choix, ...reste.slice(0, NB_DEFIS - choix.length)]);
  }

  // ---------- Affichage ----------
  function afficher(coup) {
    jeu.coup = coup;
    jeu.repondu = false;
    jeu.jetons = [];
    animerCoup();
    $('roi-question').setAttribute('href', `#piece-roi-${coup.trait}`);
    $('question-texte').textContent = coup.trait === 'blanc' ? 'Écris le coup des Blancs' : 'Écris le coup des Noirs';
    const q = $('question');
    q.classList.remove('nouvelle'); void q.offsetWidth; q.classList.add('nouvelle');
    dessinerFeuille();
    $('retour').hidden = true;
    $('form-saisie').hidden = false;
    $('clavier').hidden = !reglages.clavier;
    majClavier();
    // le bouton « Suivant » disparaît : on rend le clavier de l'ordinateur à la page
    if ($('retour').contains(document.activeElement)) document.activeElement.blur();
    if (!reglages.clavier && matchMedia('(hover: hover)').matches) $('saisie').focus({ preventScroll: true });
  }

  // L'échiquier est vu du côté de celui qui vient de jouer ; en mode tout-petits, les marges sont dessinées.
  const optionsPlateau = () => ({ orientation: jeu.coup.trait, dessins: reglages.toutPetits });
  function dessinerPlateau() {
    jeu.anim++; // arrête une animation en cours
    const c = jeu.coup;
    Echiquier.dessiner(plateau, c.fen, optionsPlateau());
    Echiquier.marquer(plateau, [c.de], 'depart');
    Echiquier.marquer(plateau, [c.a], 'arrivee');
    if (jeu.repondu && c.autres) Echiquier.marquer(plateau, c.autres, 'attaquant');
  }

  // Le dernier coup est rejoué : position d'avant, la pièce glisse jusqu'à sa case et la pièce prise
  // disparaît (la tour bouge aussi pour un roque). On peut le revoir avec le bouton à côté de la question.
  function animerCoup() {
    const c = jeu.coup;
    const jeton = ++jeu.anim;
    Echiquier.dessiner(plateau, c.fenAvant, optionsPlateau());
    Echiquier.marquer(plateau, [c.de], 'depart');
    const trajets = [[c.de, c.a]];
    if (c.tags.includes('roque')) {
      const r = c.de[1];
      trajets.push(c.a[0] === 'g' ? ['h' + r, 'f' + r] : ['a' + r, 'd' + r]);
    }
    const prise = c.tags.includes('passant') ? c.a[0] + c.de[1] : c.tags.includes('prise') ? c.a : null;
    // Toujours animé, même si l'appareil demande moins d'animations : ici, le mouvement est l'information.
    const PAUSE = 700;      // on montre d'abord la position d'avant
    const TRAJET = 900;     // la pièce glisse
    const DISPARITION = 350; // puis la pièce prise disparaît
    const fin = () => { if (jeton === jeu.anim) dessinerPlateau(); };
    setTimeout(() => {
      if (jeton !== jeu.anim) return;
      for (const [de, a] of trajets) {
        const caseDe = plateau.querySelector(`[data-case="${de}"]`);
        const caseA = plateau.querySelector(`[data-case="${a}"]`);
        const piece = caseDe && caseDe.querySelector('.piece-e');
        if (!piece || !caseA || !piece.animate) continue;
        const r1 = caseDe.getBoundingClientRect();
        const r2 = caseA.getBoundingClientRect();
        const dx = r2.left - r1.left, dy = r2.top - r1.top;
        caseDe.style.zIndex = 3;
        piece.style.filter = 'drop-shadow(0 6px 6px rgba(0, 0, 0, .35))';
        piece.animate([
          { transform: 'translate(0, 0) scale(1)' },
          { transform: `translate(${dx / 2}px, ${dy / 2}px) scale(1.18)`, offset: 0.5 },
          { transform: `translate(${dx}px, ${dy}px) scale(1)` },
        ], { duration: TRAJET, easing: 'ease-in-out', fill: 'forwards' });
      }
      const prisePiece = prise && plateau.querySelector(`[data-case="${prise}"] .piece-e`);
      if (prisePiece && prisePiece.animate) {
        prisePiece.animate([
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(.4) rotate(-20deg)' },
        ], { duration: DISPARITION, delay: TRAJET * 0.8, easing: 'ease-in', fill: 'forwards' });
      }
      setTimeout(() => Sons.pose(prise ? 5 : 3), TRAJET * 0.9);
      setTimeout(fin, TRAJET * 0.8 + DISPARITION + 150);
    }, PAUSE);
  }

  // Feuille de partie : numéro, coup des Blancs, coup des Noirs.
  function dessinerFeuille() {
    jeu.jetons = jeu.jetons || [];
    const c = jeu.coup;
    const demis = [...c.avant.map(san => ({ san })), { san: c.san, cible: true }];
    let num = c.num;
    let noir = c.noir;
    const rangees = [];
    let rangee = null;
    for (const d of demis) {
      d.couleur = noir ? 'noir' : 'blanc';
      if (!rangee || !noir) { rangee = { num, blanc: null, noir: null }; rangees.push(rangee); }
      rangee[d.couleur] = d;
      if (noir) num++;
      noir = !noir;
    }
    const cellule = (d, premiere) => {
      if (!d) return `<td class="vide">${premiere ? '…' : ''}</td>`;
      if (!d.cible) return `<td>${formater(d.san, d.couleur)}</td>`;
      return `<td class="a-remplir" id="cible">${champ()}</td>`;
    };
    $('feuille').innerHTML = rangees.map((r, i) =>
      `<tr><th class="num" scope="row">${r.num}.</th>${cellule(r.blanc, i === 0)}${cellule(r.noir)}</tr>`).join('');
    const saisie = $('saisie');
    if (saisie) saisie.addEventListener('input', () => { jeu.jetons = lireChamp(saisie.value); });
  }
  // la case vide : ce qui a été tapé avec le clavier à l'écran, ou un champ texte (clavier de l'appareil)
  function champ() {
    if (reglages.clavier) return `<span class="saisie-tp" id="saisie-tp" aria-live="polite" aria-label="Ta notation du dernier coup">${dessinerJetons()}</span>`;
    return `<input id="saisie" class="champ" type="text" form="form-saisie" value="${echapper(traduire(jeu.jetons.join('')))}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" maxlength="14" aria-label="Ta notation du dernier coup" placeholder="?">`;
  }
  // texte du champ -> jetons en notation anglaise (seules les lettres des pièces changent)
  const lireChamp = (texte) => [...texte].map(ch => DEPUIS[langue()][ch] || ch);
  function dessinerJetons() {
    if (!jeu.jetons.length) return '<span class="curseur" aria-hidden="true"></span>';
    return formater(jeu.jetons.join(''), jeu.coup.trait) + '<span class="curseur" aria-hidden="true"></span>';
  }
  function majAffichageTp() { const el = $('saisie-tp'); if (el) el.innerHTML = dessinerJetons(); }

  // ---------- Clavier à l'écran ----------
  // Les touches ajoutent la notation anglaise (traduite à l'affichage). En mode tout-petits,
  // les pièces sont dessinées et les lettres et chiffres accompagnés des animaux et des doigts.
  function construireClavier() {
    const tp = reglages.toutPetits;
    const touche = (val, contenu, label, classe = '') =>
      `<button type="button" class="touche ${classe}" data-val="${val}" aria-label="${label}">${contenu}</button>`;
    const pieces = ['K', 'Q', 'R', 'B', 'N'].map(l => touche(l, tp
      ? `<svg class="fig-touche" viewBox="0 0 100 100" aria-hidden="true"><use class="fig-camp" href="#piece-${PIECES[l]}-blanc"/></svg>`
      : `<b>${LETTRES[langue()][l]}</b><small>${PIECES[l]}</small>`, PIECES[l], 'piece')).join('');
    const colonnes = Object.keys(ANIMAUX).map(l => touche(l, tp ? `${animal(l)}<b>${l}</b>` : `<b>${l}</b>`, tp ? `${l} comme ${ANIMAUX[l].nom}` : l, 'lettre')).join('');
    const chiffres = [1, 2, 3, 4, 5, 6, 7, 8].map(n => touche(String(n), tp ? `${mains(n)}<b>${n}</b>` : `<b>${n}</b>`, String(n), 'chiffre')).join('');
    const symboles =
      touche('x', '<b>x</b><small>prend</small>', 'x : prend', 'symbole') +
      touche('+', '<b>+</b><small>échec</small>', '+ : échec', 'symbole seulement-difficile') +
      touche('#', '<b>#</b><small>mat</small>', '# : échec et mat', 'symbole seulement-difficile') +
      touche('O-O', '<b>O-O</b><small>petit roque</small>', 'petit roque', 'symbole seulement-difficile') +
      touche('O-O-O', '<b>O-O-O</b><small>grand roque</small>', 'grand roque', 'symbole seulement-difficile') +
      touche('=', '<b>=</b><small>promotion</small>', '= : promotion', 'symbole seulement-difficile');
    const effacer = `<button type="button" class="touche effacer" data-val="effacer" aria-label="Effacer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h11v14H9l-6-7Z"/><path d="M12 9.5l5 5M17 9.5l-5 5"/></svg></button>`;
    $('clavier').classList.toggle('dessins', tp);
    $('clavier').innerHTML =
      `<div class="rangee-touches pieces">${pieces}${effacer}</div>` +
      `<div class="rangee-touches huit">${colonnes}</div>` +
      `<div class="rangee-touches huit">${chiffres}</div>` +
      `<div class="rangee-touches symboles">${symboles}</div>`;
  }
  function majClavier() {
    if (!jeu.coup) return;
    $('clavier').querySelectorAll('.fig-camp').forEach(u => u.setAttribute('href', u.getAttribute('href').replace(/-(blanc|noir)$/, `-${jeu.coup.trait}`)));
  }
  function taper(val) {
    if (jeu.repondu) return;
    if (val === 'effacer') jeu.jetons.pop();
    else if (jeu.jetons.join('').length < 10) jeu.jetons.push(val);
    Sons.tic();
    majAffichageTp();
  }

  // ---------- Réponse ----------
  const lireReponse = () => jeu.jetons.join('');
  // reponse : texte tapé, ou null quand le temps est écoulé
  function valider(reponse) {
    if (jeu.repondu || !jeu.coup) return;
    const c = jeu.coup;
    // le clavier écrit en anglais : on compare à la notation anglaise
    const ecrit = normaliser(reponse === null ? '' : reponse);
    if (reponse !== null && !ecrit) { secouer(); return; }
    jeu.repondu = true;
    const juste = ecrit === c.san;
    jeu.reponse = [c, juste, reponse === null, ecrit];
    montrerExplication(...jeu.reponse);
    if (juste) Sons.juste(); else Sons.echec();

    if (jeu.mode === 'libre') {
      jeu.total++;
      if (juste) jeu.justes++;
      $('score-libre').textContent = `${jeu.justes} / ${jeu.total}`;
      return;
    }
    arreterChrono();
    defi.resultats.push({ ok: juste, san: c.san, trait: c.trait, temps: (performance.now() - defi.debut) / 1000 });
    majPoints();
    if (defi.numero === NB_DEFIS - 1) $('btn-suivant').firstChild.textContent = 'Voir le résultat ';
  }
  function secouer() {
    const el = $('cible');
    if (!el) return;
    el.classList.remove('secoue'); void el.offsetWidth; el.classList.add('secoue');
    Sons.refus();
  }

  const ICONE_JUSTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const ICONE_FAUX = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';

  // ecrit : la réponse en notation anglaise ; tout s'affiche dans la langue choisie
  function montrerExplication(c, juste, tempsEcoule, ecrit) {
    const bonne = formater(c.san, c.trait);
    // la case de la feuille montre la bonne notation
    const cible = $('cible');
    cible.className = `a-remplir ${juste ? 'juste' : 'faux'}`;
    cible.innerHTML = bonne;
    $('verdict').innerHTML = (juste ? ICONE_JUSTE : ICONE_FAUX) +
      `<span>${tempsEcoule ? 'Temps écoulé !' : juste ? 'Bravo !' : 'Pas tout à fait…'}</span>`;
    const ta = $('ta-reponse');
    ta.hidden = juste || !ecrit;
    if (!ta.hidden) ta.innerHTML = `Tu as écrit <s>${formater(ecrit, c.trait)}</s>, il fallait <b>${bonne}</b>.`;
    const conseil = juste ? '' : trouverConseil(c, traduire(ecrit), langue());
    $('conseil').hidden = !conseil;
    $('conseil').textContent = conseil;
    $('morceaux').innerHTML = decomposer(c).map(m =>
      `<span class="morceau ${m.classe || ''}"><b>${m.html}</b><small>${m.label}</small></span>`).join('');
    const phrase = expliquer(c);
    $('explication').hidden = !phrase;
    $('explication').textContent = phrase;
    // sur l'échiquier : l'autre pièce qui pouvait venir sur la même case
    Echiquier.effacer(plateau, 'attaquant');
    if (c.autres) Echiquier.marquer(plateau, c.autres, 'attaquant');
    $('form-saisie').hidden = true;
    $('clavier').hidden = true;
    if (document.activeElement && document.activeElement.id === 'saisie') document.activeElement.blur();
    $('retour').hidden = false;
    $('btn-suivant').firstChild.textContent = 'Suivant ';
    $('btn-suivant').focus({ preventScroll: true });
  }

  // Découpe la notation en morceaux expliqués : C | x | f3 | +
  function decomposer(c) {
    const san = c.san;
    const m = [];
    const lettre = (L) => (reglages.toutPetits ? figurine(PIECES[L], c.trait) : LETTRES[langue()][L]);
    const roque = san.match(/^(O-O(?:-O)?)([+#])?$/);
    if (roque) {
      m.push({ html: roque[1], label: roque[1] === 'O-O' ? 'petit roque' : 'grand roque' });
      if (roque[2]) m.push(signe(roque[2]));
      return m;
    }
    const [, piece, col, rang, prise, arrivee, promo, fin] = san.match(/^([KQRBN])?([a-h])?([1-8])?(x)?([a-h][1-8])(?:=([QRBN]))?([+#])?$/);
    if (piece) m.push({ html: lettre(piece), label: PIECES[piece] });
    else if (col) m.push({ html: col, label: 'le pion de la colonne ' + col });
    else m.push({ html: figurine('pion', c.trait), label: 'pion : pas de lettre', classe: 'fantome' });
    if (piece && (col || rang)) m.push({ html: (col || '') + (rang || ''), label: col && rang ? `celui de ${col}${rang}` : col ? `celui de la colonne ${col}` : `celui de la rangée ${rang}` });
    if (prise) m.push({ html: 'x', label: 'prend' });
    m.push({ html: arrivee, label: 'case d\'arrivée' });
    if (promo) m.push({ html: '=' + lettre(promo), label: `devient ${un(PIECES[promo])} ${PIECES[promo]}` });
    if (fin) m.push(signe(fin));
    if (c.tags.includes('passant')) m.push({ html: 'e.p.', label: 'en passant (facultatif)', classe: 'facultatif' });
    return m;
  }
  const signe = (s) => (s === '#' ? { html: '#', label: 'échec et mat' } : { html: '+', label: 'échec' });

  // Une phrase pour ce qui est particulier (rien pour un coup simple).
  function expliquer(c) {
    const camp = c.trait === 'blanc' ? 'blanc' : 'noir';
    if (c.tags.includes('roque')) {
      const petit = c.san.startsWith('O-O') && !c.san.startsWith('O-O-O');
      return `Le roi ${camp} fait le ${petit ? 'petit' : 'grand'} roque : il va en ${c.a} et la tour saute par-dessus. On écrit ${petit ? 'O-O (deux O)' : 'O-O-O (trois O)'}.`;
    }
    if (c.tags.includes('passant')) return 'Prise en passant : le pion prend celui qui venait d\'avancer de deux cases à côté de lui. On écrit la case où il arrive.';
    if (c.tags.includes('precision') && c.autres) {
      const p = PIECES[c.san[0]];
      const autres = c.autres.join(' et ');
      return `Il y a ${c.autres.length > 1 ? 'plusieurs' : 'deux'} ${p}s qui peuvent aller en ${c.a} (l'autre est en ${autres}, entouré en orange) : il faut dire lequel a joué.`;
    }
    if (c.tags.includes('promotion')) return 'Le pion arrive au bout de l\'échiquier : il se transforme. On écrit la case puis = et la nouvelle pièce.';
    return '';
  }

  // Un conseil ciblé quand la réponse est presque juste.
  function trouverConseil(c, ecrit, l) {
    if (!ecrit) return '';
    const bonne = traduire(c.san, l);
    const sans = (s, re) => s.replace(re, '');
    if (sans(ecrit, /[+#]/g) === sans(bonne, /[+#]/g)) {
      if (bonne.endsWith('#')) return ecrit.endsWith('+') ? 'C\'est même échec et mat : on écrit # (et pas +).' : 'Le roi est échec et mat : on ajoute # à la fin.';
      if (bonne.endsWith('+')) return ecrit.endsWith('#') ? 'Le roi est en échec, mais il peut s\'en sortir : on écrit +, pas #.' : 'Le roi est en échec : on ajoute + à la fin.';
      return 'Il n\'y a pas d\'échec : pas de + ni de #.';
    }
    if (sans(ecrit, /x/g) === sans(bonne, /x/g)) return bonne.includes('x') ? 'Une pièce est prise : on écrit x avant la case d\'arrivée.' : 'Rien n\'est pris : pas de x.';
    if (/^[a-h]x/.test(bonne) && (ecrit === bonne.slice(1) || ecrit === bonne.slice(2))) return `Quand un pion prend, on écrit d'abord sa colonne de départ : ${bonne[0]}.`;
    const sansPrecision = bonne.replace(/^([A-Z])[a-h1-8]{1,2}(x?[a-h][1-8])/, '$1$2');
    if (c.tags.includes('precision') && ecrit === sansPrecision) return `Deux ${PIECES[c.san[0]]}s peuvent aller en ${c.a} : il faut écrire ${bonne.slice(1, bonne.length - sansPrecision.length + 1)} pour dire lequel a joué.`;
    if (!c.tags.includes('precision') && ecrit.replace(/^([A-Z])[a-h1-8]{1,2}(x?[a-h][1-8])/, '$1$2') === bonne) return `Un seul ${PIECES[c.san[0]]} peut aller en ${c.a} : pas besoin de préciser d'où il vient.`;
    if (/^[a-h]/.test(bonne) && /^[PA-Z]/.test(ecrit) && ecrit.slice(1) === bonne) return 'Le pion n\'a pas de lettre : on écrit seulement la case.';
    if (/^[a-h]/.test(bonne) && ecrit.replace(/^[A-Z]/, '') === bonne) return 'C\'est un pion qui a joué : pas de lettre devant.';
    if (/^[A-Z]/.test(bonne) && ecrit === bonne.slice(1)) return `C'est ${le(PIECES[c.san[0]])} ${PIECES[c.san[0]]} qui a joué : on écrit d'abord sa lettre, ${bonne[0]}.`;
    if (/^[A-Z]/.test(bonne) && ecrit.slice(1) === bonne.slice(1) && /^[A-Z]/.test(ecrit)) return `Ce n'est pas la bonne pièce : c'est ${le(PIECES[c.san[0]])} ${PIECES[c.san[0]]} (${bonne[0]}) qui a joué.`;
    if (!ecrit.includes(c.a) && !c.tags.includes('roque')) return `Regarde bien la case d'arrivée, en jaune foncé : c'est ${c.a}.`;
    return '';
  }

  function suivant() {
    if (!jeu.repondu) return;
    if (jeu.mode === 'libre') { afficher(piocher()); return; }
    defi.numero++;
    if (defi.numero >= NB_DEFIS) { montrerResultats(); return; }
    lancerCoup();
  }

  // ---------- Défis ----------
  function construirePoints() {
    $('points').innerHTML = Array.from({ length: NB_DEFIS }, (_, i) => `<li aria-label="Coup ${i + 1}"></li>`).join('');
  }
  function majPoints() {
    $('points').querySelectorAll('li').forEach((li, i) => {
      const r = defi.resultats[i];
      li.className = r ? (r.ok ? 'ok' : 'rate') : (i === defi.numero ? 'actuel' : '');
    });
  }
  function lancerCoup() {
    $('titre').textContent = `Coup ${defi.numero + 1} sur ${NB_DEFIS}`;
    afficher(defi.liste[defi.numero]);
    majPoints();
    defi.debut = performance.now();
    if (defi.chrono) demarrerChrono();
  }
  function demarrerChrono() {
    arreterChrono();
    const barre = $('minuteur-barre');
    defi.fin = performance.now() + DUREE * 1000;
    defi.dernierTic = 0;
    const p = jeu.partie;
    const boucle = (t) => {
      if (p !== jeu.partie || jeu.repondu) return;
      const reste = Math.max(0, defi.fin - t) / 1000;
      barre.style.transform = `scaleX(${(reste / DUREE).toFixed(4)})`;
      document.body.classList.toggle('presse', reste <= 5);
      const s = Math.ceil(reste);
      if (reste <= 5 && s > 0 && s !== defi.dernierTic) { defi.dernierTic = s; Sons.tic(); }
      if (reste <= 0) { valider(null); return; }
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
    $('res-titre').textContent = score === NB_DEFIS ? 'Parfait !' : score >= 7 ? 'Bravo !' : score >= 4 ? 'Bien joué !' : 'Continue, tu progresses !';
    allumerEtoiles($('etoiles'), etoiles);
    $('res-liste').innerHTML = defi.resultats.map((r, i) =>
      `<li class="${r.ok ? 'ok' : 'rate'}" style="animation-delay:${700 + i * 70}ms" aria-label="Coup ${i + 1} (${traduire(r.san)}) : ${r.ok ? 'réussi' : 'raté'}">` +
      `<span class="res-rond">${r.ok ? ICONES.ok : ICONES.rate}</span><span class="res-t res-coup">${formater(r.san, r.trait)}</span></li>`).join('');
    const total = defi.resultats.reduce((s, r) => s + r.temps, 0);
    $('res-temps').textContent = `Temps total : ${formaterDuree(total)}`;
    $('resultats').hidden = false;
    $('btn-rejouer').focus({ preventScroll: true });
    compterJusqua($('res-score'), score);
    lancerPluie($('pluie'), etoiles >= 1 ? 70 : 30);
    Sons.victoire();
  }

  // ---------- Modes ----------
  function preparer(mode) {
    jeu.partie++;
    arreterChrono();
    $('resultats').hidden = true;
    $('pluie').innerHTML = '';
    jeu.mode = mode;
    document.body.dataset.mode = mode;
  }
  function lancerLibre() {
    preparer('libre');
    document.body.dataset.chrono = 'non';
    $('titre').textContent = 'Note le coup';
    jeu.justes = 0; jeu.total = 0;
    $('score-libre').textContent = '0 / 0';
    afficher(piocher());
  }
  function lancerDefi(chrono) {
    fermerChoix();
    preparer('defi');
    defi.chrono = chrono;
    document.body.dataset.chrono = chrono ? 'oui' : 'non';
    defi.liste = tirerDefi();
    defi.numero = 0;
    defi.resultats = [];
    $('minuteur-barre').style.transform = 'scaleX(1)';
    construirePoints();
    lancerCoup();
  }

  // ---------- Branchements ----------
  $('form-saisie').addEventListener('submit', (e) => { e.preventDefault(); valider(lireReponse()); });
  $('btn-suivant').addEventListener('click', suivant);
  $('btn-revoir').addEventListener('click', () => { if (jeu.coup) animerCoup(); });
  $('btn-revoir').addEventListener('mousedown', (e) => e.preventDefault()); // Entrée doit toujours valider
  $('clavier').addEventListener('click', (e) => { const t = e.target.closest('.touche'); if (t) taper(t.dataset.val); });
  // les touches de l'écran ne prennent pas le focus : Entrée valide toujours
  $('clavier').addEventListener('mousedown', (e) => e.preventDefault());
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!$('choix-defi').hidden || !$('resultats').hidden) {
      if (e.key === 'Escape' && !$('choix-defi').hidden) fermerChoix();
      return;
    }
    if (e.target.closest('input, textarea, .panneau')) return;
    if (e.key === 'Enter') {
      if (e.target.closest('button:not(.touche)')) return; // le bouton fait son travail
      if (jeu.repondu) { e.preventDefault(); suivant(); }
      else { e.preventDefault(); valider(lireReponse()); }
      return;
    }
    // le clavier de l'ordinateur marche aussi (lettres des pièces dans la langue choisie)
    if (jeu.repondu) return;
    if (e.key === 'Backspace') { e.preventDefault(); taper('effacer'); return; }
    const L = DEPUIS[langue()][e.key];
    if (L) taper(L);
    else if (/^[a-h1-8x+#=O0o-]$/.test(e.key)) taper(e.key === 'o' || e.key === '0' ? 'O' : e.key);
  });

  function ouvrirChoix() {
    $('choix-niveau').textContent = reglages.difficile ? 'niveau difficile' : 'niveau facile';
    $('choix-defi').hidden = false;
    $('mode-defi').focus({ preventScroll: true });
  }
  function fermerChoix() { $('choix-defi').hidden = true; }
  $('btn-defis').addEventListener('click', ouvrirChoix);
  $('btn-fermer-choix').addEventListener('click', () => { fermerChoix(); $('btn-defis').focus(); });
  $('choix-defi').addEventListener('click', (e) => { if (e.target === e.currentTarget) fermerChoix(); });
  $('mode-defi').addEventListener('click', () => lancerDefi(false));
  $('mode-chrono').addEventListener('click', () => lancerDefi(true));
  $('btn-retour').addEventListener('click', lancerLibre);
  $('btn-menu').addEventListener('click', lancerLibre);
  $('btn-rejouer').addEventListener('click', () => lancerDefi(defi.chrono));

  // ---------- Réglages ----------
  brancherBoutonTheme($('btn-theme'));
  brancherReglages($('btn-reglages'), $('panneau-reglages'));

  // redessine la question en cours sans perdre ce qui a été tapé
  function redessiner() {
    if (!jeu.coup) return;
    dessinerPlateau();
    if (jeu.repondu) {
      // la feuille et l'explication suivent la nouvelle langue
      dessinerFeuille();
      montrerExplication(...jeu.reponse);
      return;
    }
    dessinerFeuille();
  }

  const segLangue = [...$('reg-langue').querySelectorAll('button')];
  const majLangue = () => segLangue.forEach(b => b.setAttribute('aria-pressed', String((b.dataset.langue === 'en') === reglages.anglais)));
  segLangue.forEach(b => b.addEventListener('click', () => {
    reglages.anglais = b.dataset.langue === 'en';
    Prefs.ecrire('echecs.note.anglais', reglages.anglais);
    majLangue();
    construireClavier();
    majClavier();
    redessiner();
  }));

  const segNiveau = [...$('reg-niveau').querySelectorAll('button')];
  const majNiveau = () => {
    segNiveau.forEach(b => b.setAttribute('aria-pressed', String((b.dataset.niveau === 'difficile') === reglages.difficile)));
    document.body.classList.toggle('difficile', reglages.difficile);
  };
  segNiveau.forEach(b => b.addEventListener('click', () => {
    const avant = reglages.difficile;
    reglages.difficile = b.dataset.niveau === 'difficile';
    Prefs.ecrire('echecs.note.difficile', reglages.difficile);
    majNiveau();
    if (avant !== reglages.difficile && jeu.mode === 'libre') afficher(piocher());
  }));

  const appliquerToutPetits = () => document.body.classList.toggle('tout-petits', reglages.toutPetits);
  brancherInterrupteur($('reg-tout-petits'), reglages.toutPetits, (v) => {
    reglages.toutPetits = v; Prefs.ecrire('echecs.note.tout-petits', v);
    appliquerToutPetits();
    construireClavier();
    majClavier();
    redessiner();
  });
  // clavier à l'écran : réglage et bouton à côté de « Valider »
  function appliquerClavier() {
    document.body.classList.toggle('sans-clavier', !reglages.clavier);
    $('btn-clavier').setAttribute('aria-pressed', String(reglages.clavier));
  }
  function changerClavier(v) {
    reglages.clavier = v; Prefs.ecrire('echecs.note.clavier', v);
    interrupteurClavier.definir(v);
    appliquerClavier();
    if (!jeu.coup || jeu.repondu) return;
    $('clavier').hidden = !v;
    dessinerFeuille();
    const saisie = $('saisie');
    if (saisie) { saisie.focus(); saisie.setSelectionRange(saisie.value.length, saisie.value.length); }
  }
  const interrupteurClavier = brancherInterrupteur($('reg-clavier'), reglages.clavier, changerClavier);
  $('btn-clavier').addEventListener('click', () => changerClavier(!reglages.clavier));
  const appliquerCoord = () => document.body.classList.toggle('sans-coordonnees', !reglages.coordonnees);
  brancherInterrupteur($('reg-coordonnees'), reglages.coordonnees, (v) => { reglages.coordonnees = v; Prefs.ecrire('echecs.note.coordonnees', v); appliquerCoord(); });
  brancherInterrupteur($('reg-son'), Sons.actif, (v) => { Sons.actif = v; });

  // ---------- Démarrage ----------
  window.Echecs.injecterSprite();
  window.ToutPetits.injecterSprite();
  construireClavier();
  majLangue();
  majNiveau();
  appliquerToutPetits();
  appliquerCoord();
  appliquerClavier();
  lancerLibre();
})();
