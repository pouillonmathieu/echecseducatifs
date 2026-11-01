/* Note le coup
   L'échiquier montre le dernier coup joué (case de départ et d'arrivée en jaune). La feuille de partie
   reprend les 3 coups d'avant et laisse une case vide : il faut y écrire le dernier coup.
   Niveaux : facile (coups simples, prises) ou difficile (échec, mat, pièce à préciser, roque,
   promotion, prise en passant). Notation en français ou en anglais.
   Mode tout-petits : clavier avec les pièces (dessinées), les animaux (lettres) et les doigts (chiffres).
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
  };
  const langue = () => (reglages.anglais ? 'en' : 'fr');
  const niveau = () => (reglages.difficile ? 'difficile' : 'facile');

  const jeu = { mode: 'libre', coup: null, repondu: false, pioche: [], dernier: null, justes: 0, total: 0, partie: 0, jetons: [] };
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

  // Ce qu'on accepte en plus de la notation exacte : espaces, 0-0 pour O-O, « e.p. », e8D pour e8=D, !?.
  function normaliser(s) {
    let r = s.trim().replace(/\s+/g, '').replace(/[!?]/g, '').replace(/[–—−]/g, '-').replace(/×/g, 'x');
    r = r.replace(/^[0oO]-[0oO]-[0oO]/, 'O-O-O').replace(/^[0oO]-[0oO](?!-)/, 'O-O');
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
    // l'échiquier est vu du côté de celui qui vient de jouer
    Echiquier.dessiner(plateau, coup.fen, { orientation: coup.trait });
    Echiquier.marquer(plateau, [coup.de], 'depart');
    Echiquier.marquer(plateau, [coup.a], 'arrivee');
    $('roi-question').setAttribute('href', `#piece-roi-${coup.trait}`);
    $('question-texte').textContent = coup.trait === 'blanc' ? 'Écris le coup des Blancs' : 'Écris le coup des Noirs';
    const q = $('question');
    q.classList.remove('nouvelle'); void q.offsetWidth; q.classList.add('nouvelle');
    dessinerFeuille();
    $('retour').hidden = true;
    $('form-saisie').hidden = false;
    $('clavier').hidden = !reglages.toutPetits;
    majClavier();
    const saisie = $('saisie');
    if (saisie && matchMedia('(hover: hover)').matches) saisie.focus({ preventScroll: true });
  }

  // Feuille de partie : numéro, coup des Blancs, coup des Noirs.
  function dessinerFeuille() {
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
  }
  // la case vide : un champ texte, ou l'affichage du clavier des tout-petits
  function champ() {
    if (reglages.toutPetits) return `<span class="saisie-tp" id="saisie-tp" aria-live="polite">${dessinerJetons()}</span>`;
    return `<input id="saisie" class="champ" type="text" form="form-saisie" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" maxlength="12" aria-label="Ta notation du dernier coup" placeholder="?">`;
  }
  function dessinerJetons() {
    if (!jeu.jetons.length) return '<span class="curseur" aria-hidden="true"></span>';
    return formater(jeu.jetons.join(''), jeu.coup.trait) + '<span class="curseur" aria-hidden="true"></span>';
  }
  function majAffichageTp() { const el = $('saisie-tp'); if (el) el.innerHTML = dessinerJetons(); }

  // ---------- Clavier tout-petits ----------
  // Les touches ajoutent la notation anglaise ; la pièce est dessinée, donc la langue ne compte pas.
  function construireClavier() {
    const touche = (val, contenu, label, classe = '') =>
      `<button type="button" class="touche ${classe}" data-val="${val}" aria-label="${label}">${contenu}</button>`;
    const pieces = ['K', 'Q', 'R', 'B', 'N'].map(l => touche(l, `<svg class="fig-touche" viewBox="0 0 100 100" aria-hidden="true"><use class="fig-camp" href="#piece-${PIECES[l]}-blanc"/></svg>`, PIECES[l], 'piece')).join('');
    const colonnes = Object.keys(ANIMAUX).map(l => touche(l, `${animal(l)}<b>${l}</b>`, `${l} comme ${ANIMAUX[l].nom}`, 'lettre')).join('');
    const chiffres = [1, 2, 3, 4, 5, 6, 7, 8].map(n => touche(String(n), `${mains(n)}<b>${n}</b>`, String(n), 'chiffre')).join('');
    const symboles =
      touche('x', '<b>x</b><small>prend</small>', 'x : prend', 'symbole') +
      touche('+', '<b>+</b><small>échec</small>', '+ : échec', 'symbole seulement-difficile') +
      touche('#', '<b>#</b><small>mat</small>', '# : échec et mat', 'symbole seulement-difficile') +
      touche('O-O', '<b>O-O</b><small>petit roque</small>', 'petit roque', 'symbole seulement-difficile') +
      touche('O-O-O', '<b>O-O-O</b><small>grand roque</small>', 'grand roque', 'symbole seulement-difficile') +
      touche('=', '<b>=</b><small>promotion</small>', '= : promotion', 'symbole seulement-difficile');
    const effacer = `<button type="button" class="touche effacer" data-val="effacer" aria-label="Effacer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h11v14H9l-6-7Z"/><path d="M12 9.5l5 5M17 9.5l-5 5"/></svg></button>`;
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
    if (jeu.repondu || !reglages.toutPetits) return;
    if (val === 'effacer') jeu.jetons.pop();
    else if (jeu.jetons.join('').length < 10) jeu.jetons.push(val);
    Sons.tic();
    majAffichageTp();
  }

  // ---------- Réponse ----------
  function lireReponse() {
    if (reglages.toutPetits) return jeu.jetons.join('');
    const s = $('saisie');
    return s ? s.value : '';
  }
  // reponse : texte tapé, ou null quand le temps est écoulé
  function valider(reponse) {
    if (jeu.repondu || !jeu.coup) return;
    const c = jeu.coup;
    const l = reglages.toutPetits ? 'en' : langue(); // le clavier des tout-petits écrit en anglais
    const brute = reponse === null ? '' : reponse;
    if (reponse !== null && !normaliser(brute)) { secouer(); return; }
    jeu.repondu = true;
    const ecrit = normaliser(brute);
    const juste = ecrit === traduire(c.san, l);
    jeu.reponse = [c, juste, reponse === null, ecrit, l];
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

  function montrerExplication(c, juste, tempsEcoule, ecrit, l) {
    const bonne = formater(c.san, c.trait);
    // la case de la feuille montre la bonne notation
    const cible = $('cible');
    cible.className = `a-remplir ${juste ? 'juste' : 'faux'}`;
    cible.innerHTML = bonne;
    $('verdict').innerHTML = (juste ? ICONE_JUSTE : ICONE_FAUX) +
      `<span>${tempsEcoule ? 'Temps écoulé !' : juste ? 'Bravo !' : 'Pas tout à fait…'}</span>`;
    const ta = $('ta-reponse');
    ta.hidden = juste || !ecrit;
    if (!ta.hidden) ta.innerHTML = `Tu as écrit <s>${reglages.toutPetits ? formater(ecrit, c.trait) : echapper(ecrit)}</s>, il fallait <b>${bonne}</b>.`;
    const conseil = juste ? '' : trouverConseil(c, ecrit, l);
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
    const autreL = l === 'fr' ? 'en' : 'fr';
    if (!reglages.toutPetits && ecrit === traduire(c.san, autreL)) {
      const L = (c.san.match(/[KQRBN]/) || [])[0];
      return L ? `En ${l === 'fr' ? 'français' : 'anglais'}, ${le(PIECES[L])} ${PIECES[L]} s'écrit ${LETTRES[l][L]}, pas ${LETTRES[autreL][L]}.` : '';
    }
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
  $('clavier').addEventListener('click', (e) => { const t = e.target.closest('.touche'); if (t) taper(t.dataset.val); });
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!$('choix-defi').hidden || !$('resultats').hidden) {
      if (e.key === 'Escape' && !$('choix-defi').hidden) fermerChoix();
      return;
    }
    if (e.target.closest('input, textarea, .panneau')) return;
    if (e.key === 'Enter') {
      if (e.target.closest('button')) return; // le bouton fait son travail
      if (jeu.repondu) { e.preventDefault(); suivant(); }
      else if (!jeu.repondu && reglages.toutPetits) { e.preventDefault(); valider(lireReponse()); }
      return;
    }
    // le clavier de l'ordinateur marche aussi en mode tout-petits
    if (!reglages.toutPetits || jeu.repondu) return;
    if (e.key === 'Backspace') { e.preventDefault(); taper('effacer'); return; }
    const L = DEPUIS[langue()][e.key];
    if (L) taper(L);
    else if (/^[a-h1-8x+#=]$/.test(e.key)) taper(e.key);
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
    if (jeu.repondu) {
      // la feuille et l'explication suivent la nouvelle langue
      dessinerFeuille();
      montrerExplication(...jeu.reponse);
      return;
    }
    const tape = reglages.toutPetits ? null : ($('saisie') ? $('saisie').value : '');
    dessinerFeuille();
    if (tape && $('saisie')) $('saisie').value = tape;
    $('clavier').hidden = !reglages.toutPetits;
  }

  const segLangue = [...$('reg-langue').querySelectorAll('button')];
  const majLangue = () => segLangue.forEach(b => b.setAttribute('aria-pressed', String((b.dataset.langue === 'en') === reglages.anglais)));
  segLangue.forEach(b => b.addEventListener('click', () => {
    reglages.anglais = b.dataset.langue === 'en';
    Prefs.ecrire('echecs.note.anglais', reglages.anglais);
    majLangue();
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
    jeu.jetons = [];
    redessiner();
  });
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
  lancerLibre();
})();
