/* À l'aveugle : la voix.
   - lire(san) : dit un coup à voix haute (synthèse vocale du navigateur ; dans l'application Android, la voix du
     téléphone, voir android/…/appli.js) : « Cavalier F 3 », « Pion E prend D 5, échec », « Petit roque »…
   - ecouter() : la dictée (reconnaissance vocale du navigateur, ou du téléphone dans l'application) ; rend les
     phrases entendues (plusieurs possibilités, de la plus probable à la moins probable).
   - versNotation(phrase) : une phrase entendue -> une notation à essayer, en lettres anglaises (« Nf3 », « exd5 »,
     « e2e4 », « O-O ») ; c'est aveugle.js qui la compare aux coups possibles. */
(function () {
  const { EN } = window.Commun;
  const LANGUE = EN ? 'en-GB' : 'fr-FR';

  // ---------- Lecture ----------
  const NOMS = EN
    ? { K: 'King', Q: 'Queen', R: 'Rook', B: 'Bishop', N: 'Knight', P: 'Pawn' }
    : { K: 'Roi', Q: 'Dame', R: 'Tour', B: 'Fou', N: 'Cavalier', P: 'Pion' };
  const PROMO = EN ? { Q: 'a queen', R: 'a rook', B: 'a bishop', N: 'a knight' } : { Q: 'en dame', R: 'en tour', B: 'en fou', N: 'en cavalier' };
  const caseDite = (c) => `${c[0].toUpperCase()} ${c[1]}`;
  function enMots(san) {
    const fin = san.endsWith('#') ? (EN ? ', checkmate' : ', échec et mat') : san.endsWith('+') ? (EN ? ', check' : ', échec') : '';
    const s = san.replace(/[+#]/g, '');
    if (s === 'O-O') return (EN ? 'Castles kingside' : 'Petit roque') + fin;
    if (s === 'O-O-O') return (EN ? 'Castles queenside' : 'Grand roque') + fin;
    const m = s.match(/^([KQRBN])?([a-h])?([1-8])?(x)?([a-h][1-8])(?:=([QRBN]))?$/);
    if (!m) return san;
    const [, piece, col, rang, prise, arrivee, promo] = m;
    const mots = [NOMS[piece || 'P']];
    if (col || rang) mots.push(((col || '').toUpperCase() + (rang ? ' ' + rang : '')).trim() + ',');
    if (prise) mots.push(EN ? 'takes' : 'prend');
    mots.push(caseDite(arrivee));
    let phrase = mots.join(' ');
    if (promo) phrase += EN ? `, promotes to ${PROMO[promo]}` : `, promotion ${PROMO[promo]}`;
    return phrase + fin;
  }

  const parole = 'speechSynthesis' in window ? window.speechSynthesis : null;
  function voixFrancaise() {
    const voix = parole ? parole.getVoices() : [];
    const nom = (v) => v.lang.replace('_', '-').toLowerCase();
    return voix.find((v) => nom(v) === LANGUE.toLowerCase()) || voix.find((v) => nom(v).split('-')[0] === LANGUE.slice(0, 2)) || null;
  }
  function lire(san) {
    if (!parole) return;
    parole.cancel();
    const u = new SpeechSynthesisUtterance(enMots(san));
    u.lang = LANGUE;
    const v = voixFrancaise();
    if (v) u.voice = v;
    u.rate = 0.9;
    parole.speak(u);
  }

  // ---------- Dictée ----------
  const Reconnaissance = window.SpeechRecognition || window.webkitSpeechRecognition;
  let enCours = null;
  // rend une promesse : la liste des phrases entendues (vide si rien n'a été compris)
  // indices : les phrases attendues (les coups possibles, dits à voix haute) ; la reconnaissance les favorise quand
  // elle sait le faire (Chrome récent : SpeechRecognition.phrases ; application Android 13+ : EXTRA_BIASING_STRINGS)
  function ecouter(indices = []) {
    if (!Reconnaissance) return Promise.reject(new Error('indisponible'));
    arreterEcoute();
    return new Promise((ok, ko) => {
      const r = new Reconnaissance();
      enCours = r;
      r.lang = LANGUE;
      r.interimResults = false;
      r.continuous = false;
      r.maxAlternatives = 5;
      if (indices.length) {
        try {
          if (window.SpeechRecognitionPhrase && 'phrases' in r) r.phrases = indices.slice(0, 200).map((t) => new window.SpeechRecognitionPhrase(t, 4));
          else if (r.indices !== undefined) r.indices = indices; // (application Android : voir appli.js)
        } catch (e) { /* pas de phrases favorisées : tant pis, la comparaison des sons suffit souvent */ }
      }
      let phrases = [];
      r.onresult = (e) => {
        const res = e.results[e.results.length - 1];
        phrases = Array.from(res, (a) => a.transcript);
      };
      r.onerror = (e) => {
        enCours = null;
        // (une reconnaissance qui refuse les phrases favorisées : on recommence sans elles)
        if (e.error === 'phrases-not-supported' && indices.length) { r.onend = null; ecouter([]).then(ok, ko); return; }
        if (e.error === 'no-speech' || e.error === 'aborted') ok([]); else ko(new Error(e.error));
      };
      r.onend = () => { enCours = null; ok(phrases); };
      try { r.start(); } catch (e) { enCours = null; ko(e); }
    });
  }
  function arreterEcoute() { if (enCours) { try { enCours.stop(); } catch (e) { /* déjà arrêtée */ } enCours = null; } }

  // ---------- Phrase entendue -> notation ----------
  const PIECES = {
    roi: 'K', rois: 'K', dame: 'Q', dames: 'Q', reine: 'Q', tour: 'R', tours: 'R', fou: 'B', fous: 'B', cavalier: 'N', cavaliers: 'N', cheval: 'N',
    pion: 'P', pions: 'P', king: 'K', queen: 'Q', rook: 'R', rock: 'R', bishop: 'B', knight: 'N', night: 'N', horse: 'N', pawn: 'P', pond: 'P',
  };
  const PRISE = new Set(['prend', 'prends', 'pren', 'prent', 'mange', 'manges', 'x', 'takes', 'take', 'captures', 'capture', 'takes.', 'by']);
  const LETTRES = {
    a: 'a', ah: 'a', b: 'b', be: 'b', 'bé': 'b', bee: 'b', c: 'c', ce: 'c', 'cé': 'c', se: 'c', 'sé': 'c', see: 'c', sea: 'c', "c'est": 'c',
    d: 'd', de: 'd', 'dé': 'd', dee: 'd', e: 'e', eu: 'e', euh: 'e', 'é': 'e', f: 'f', ef: 'f', eff: 'f', effe: 'f', g: 'g', 'gé': 'g', ge: 'g', gee: 'g', "j'ai": 'g',
    h: 'h', ache: 'h', hache: 'h', ash: 'h', aitch: 'h', each: 'h',
  };
  const CHIFFRES = {
    1: '1', un: '1', une: '1', one: '1', won: '1', 2: '2', deux: '2', two: '2', to: '2', too: '2', 3: '3', trois: '3', three: '3', tree: '3',
    4: '4', quatre: '4', four: '4', for: '4', 5: '5', cinq: '5', five: '5', 6: '6', six: '6', 7: '7', sept: '7', seven: '7', set: '7', cette: '7',
    8: '8', huit: '8', eight: '8', ate: '8',
  };
  // les mots qui sont sûrement une lettre, même sans chiffre après (« cavalier bé d2 ») ; les autres (« de », « se »,
  // « be »…) seulement devant un chiffre
  const SURES = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'bé', 'cé', 'sé', 'dé', 'é', 'effe', 'gé', 'ache', 'hache', 'aitch']);
  const PROMOTION = new Set(['promotion', 'promeut', 'promu', 'devient', 'transforme', 'promotes', 'promote', 'becomes', 'equals', '=']);

  function versNotation(phrase) {
    let s = ` ${phrase.toLowerCase()} `.replace(/[’']/g, "'").replace(/[-,.;:!?]/g, ' ');
    // roques
    const petit = /petit roque|roque court|kingside|king side|short castl|castles? short|o o(?! o)/.test(s);
    const grand = /grand roque|roque long|queenside|queen side|long castl|castles? long|o o o/.test(s);
    if (grand) return 'O-O-O';
    if (petit) return 'O-O';
    if (/\broque\b|\bcastles?\b|\bcastling\b/.test(s)) return 'roque';
    // « e4 », « F3 », « cf3 » : les lettres et les chiffres collés sont séparés
    s = s.replace(/([a-h])([1-8])/g, ' $1 $2 ');
    const mots = s.split(/\s+/).filter(Boolean);
    let piece = '', prise = '', promo = '';
    const cases = [];
    let lettre = null;
    for (let i = 0; i < mots.length; i++) {
      const m = mots[i];
      if (PROMOTION.has(m)) { const p = PIECES[mots[i + 1]] || PIECES[mots[i + 2]]; if (p && p !== 'K' && p !== 'P') promo = p; continue; }
      if (PIECES[m]) {
        // une pièce après une case d'arrivée : c'est une promotion (« e8 dame »)
        if (cases.length && cases[cases.length - 1].length === 2 && !promo && PIECES[m] !== 'P' && PIECES[m] !== 'K' && (piece === '' || piece === 'P')) promo = PIECES[m];
        else if (!piece) piece = PIECES[m];
        continue;
      }
      if (PRISE.has(m)) { prise = 'x'; continue; }
      if (lettre && CHIFFRES[m] !== undefined) { cases.push(lettre + CHIFFRES[m]); lettre = null; continue; }
      if (LETTRES[m] !== undefined && (SURES.has(m) || CHIFFRES[mots[i + 1]] !== undefined)) {
        if (lettre) cases.push(lettre); // une colonne seule (« e prend d5 »)
        lettre = LETTRES[m];
        continue;
      }
      if (lettre && /^[a-h]$/.test(lettre)) { cases.push(lettre); lettre = null; }
    }
    if (lettre) cases.push(lettre);
    if (!cases.length) return '';
    const P = piece && piece !== 'P' ? piece : '';
    const arrivee = cases[cases.length - 1];
    const depart = cases.slice(0, -1).join('');
    return `${P}${depart}${prise}${arrivee}${promo ? '=' + promo : ''}`;
  }

  // ---------- Phrase entendue -> le coup possible qui « sonne » le plus pareil ----------
  // La reconnaissance vocale écrit des phrases ordinaires : « e prend d6 » devient « je prends des six ». Au lieu de
  // lire un coup dans ce texte, on part des coups possibles dans la position (une trentaine), on écrit comment chacun
  // se dit (« e prend dé six », « pion prend dé six »…), et on garde celui dont la prononciation ressemble le plus à
  // ce qui a été entendu (distance entre deux « clés phonétiques » simplifiées).
  const NOM_LETTRE = EN
    ? { a: 'ay', b: 'bee', c: 'see', d: 'dee', e: 'ee', f: 'eff', g: 'gee', h: 'aitch' }
    : { a: 'a', b: 'bé', c: 'cé', d: 'dé', e: 'e', f: 'effe', g: 'gé', h: 'hache' };
  const NOM_CHIFFRE = EN
    ? ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']
    : ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit'];
  const NOM_PIECE = EN
    ? { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }
    : { p: 'pion', n: 'cavalier', b: 'fou', r: 'tour', q: 'dame', k: 'roi' };
  const PREND = EN ? 'takes' : 'prend';
  const dite = (c) => `${NOM_LETTRE[c[0]]} ${NOM_CHIFFRE[+c[1]]}`;

  // les façons de dire un coup (objet « verbose » de chess.js)
  function formesDites(m) {
    if (m.flags.includes('k') || m.flags.includes('q')) {
      const petit = m.flags.includes('k');
      return EN ? (petit ? ['castles kingside', 'castle kingside', 'short castle', 'castle short'] : ['castles queenside', 'castle queenside', 'long castle', 'castle long'])
        : (petit ? ['petit roque', 'roque côté roi'] : ['grand roque', 'roque côté dame']);
    }
    const P = NOM_PIECE[m.piece], arrivee = dite(m.to), prise = !!m.captured;
    let f = [];
    if (m.piece === 'p') {
      if (prise) f.push(`${NOM_LETTRE[m.from[0]]} ${PREND} ${arrivee}`, `${P} ${PREND} ${arrivee}`, `${P} ${NOM_LETTRE[m.from[0]]} ${PREND} ${arrivee}`, `${NOM_LETTRE[m.from[0]]} ${arrivee}`);
      else f.push(arrivee, `${P} ${arrivee}`);
    } else {
      f.push(`${P} ${arrivee}`);
      if (prise) f.push(`${P} ${PREND} ${arrivee}`);
      f.push(`${P} ${NOM_LETTRE[m.from[0]]} ${arrivee}`, `${P} ${dite(m.from)} ${arrivee}`);
    }
    f.push(`${dite(m.from)} ${arrivee}`);
    if (m.promotion) {
      const Q = NOM_PIECE[m.promotion];
      f = f.flatMap((x) => [`${x} ${Q}`, EN ? `${x} promotes to ${Q}` : `${x} promotion ${Q}`]);
    }
    return f;
  }

  // ce qui est entendu : chiffres et cases (« D6 », « 6 ») en mots, petits mots inutiles enlevés
  function preparer(phrase) {
    let s = ` ${phrase.toLowerCase()} `.replace(/[’`]/g, "'").replace(/[-,.;:!?"«»]/g, ' ');
    s = s.replace(/(^|\s)([a-h])\s*([1-8])\b/g, (_, a, l, c) => `${a}${NOM_LETTRE[l]} ${NOM_CHIFFRE[+c]} `);
    s = s.replace(/\b([1-8])\b/g, (_, c) => ` ${NOM_CHIFFRE[+c]} `);
    s = s.replace(/(^|\s)([a-h])(?=\s)/g, (_, a, l) => `${a}${NOM_LETTRE[l]}`);
    const inutiles = EN ? /\b(to|on|the|square|moves?|goes|check(mate)?|mate)\b/g : /\b(en|va|vers|sur|la case|case|le|échec et mat|échec|et mat|mat)\b/g;
    return s.replace(inutiles, ' ').replace(/\s+/g, ' ').trim();
  }

  // clé phonétique simplifiée : ce qui se prononce pareil s'écrit pareil (à peu près)
  function cleFr(texte) {
    return texte.split(' ').map((m) => {
      let w = m.replace(/'/g, '');
      w = ({ six: 'sis', dix: 'dis', huit: 'uit', sept: 'set', cinq: 'sink', est: 'é', et: 'é', es: 'é', ai: 'é', 'j’ai': 'jé' })[w] || w;
      w = w.replace(/[éèêëe]/g, (c) => (c === 'e' ? 'e' : 'é'));
      w = w.replace(/eau|au/g, 'o').replace(/oi|oy/g, 'wa').replace(/ou|où/g, 'u').replace(/qu/g, 'k').replace(/ch/g, 'x').replace(/ph/g, 'f').replace(/gn/g, 'n');
      w = w.replace(/g(?=[eéiy])/g, 'j').replace(/c(?=[eéiy])/g, 's').replace(/[cq]/g, 'k').replace(/ç/g, 's').replace(/z/g, 's').replace(/y/g, 'i').replace(/w(?!a)/g, 'v').replace(/h/g, '');
      w = w.replace(/(ai|ei|ê|è|ë)/g, 'é').replace(/(?:an|am|en|em)(?![aeiouéy])/g, 'A').replace(/(?:ain|ein|in|im|un|um)(?![aeiouéy])/g, 'I').replace(/(?:on|om)(?![aeiouéy])/g, 'O');
      w = w.replace(/eu|œu|œ/g, 'e');
      if (w.length > 1) w = w.replace(/[sdtxzp]+$/, '');
      if (w.length > 2) w = w.replace(/e$/, '');
      w = w.replace(/é/g, 'e').replace(/(.)\1+/g, '$1');
      return w;
    }).join('');
  }
  function cleEn(texte) {
    return texte.split(' ').map((m) => {
      let w = m.replace(/'/g, '');
      w = w.replace(/ph/g, 'f').replace(/ck/g, 'k').replace(/^kn/, 'n').replace(/^wr/, 'r').replace(/gh/g, '').replace(/c(?=[eiy])/g, 's').replace(/[cq]/g, 'k').replace(/x/g, 'ks').replace(/z/g, 's');
      w = w.replace(/(ee|ea|ie|ey)/g, 'i').replace(/(ay|ai|ei)/g, 'A').replace(/(oo|ou|ow)/g, 'u').replace(/y$/, 'i');
      if (w.length > 2) w = w.replace(/e$/, '');
      w = w.replace(/h/g, '').replace(/(.)\1+/g, '$1');
      return w;
    }).join('');
  }
  const cle = EN ? cleEn : cleFr;

  function distance(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }

  // phrases : ce que la reconnaissance a entendu (plusieurs possibilités) ; legaux : les coups possibles (chess.js,
  // verbose). Rend { coup, score, autre } : le coup le plus proche, sa ressemblance (0 = pareil, 1 = rien à voir) et
  // le deuxième coup le plus proche s'il est presque aussi proche (alors, on demande lequel).
  function choisirCoup(phrases, legaux) {
    const formes = legaux.map((m) => ({ m, cles: formesDites(m).map((f) => cle(preparer(f))) }));
    const scores = new Map();
    phrases.forEach((p, rang) => {
      const k = cle(preparer(p));
      if (!k) return;
      for (const { m, cles } of formes) {
        let meilleur = Infinity;
        for (const c of cles) meilleur = Math.min(meilleur, distance(k, c) / Math.max(k.length, c.length));
        meilleur += rang * 0.03; // la première phrase entendue est la plus probable
        if (meilleur < (scores.get(m) ?? Infinity)) scores.set(m, meilleur);
      }
    });
    const tries = [...scores.entries()].sort((a, b) => a[1] - b[1]);
    if (!tries.length) return null;
    const [coup, score] = tries[0];
    const suivant = tries.find(([m]) => m.san !== coup.san);
    return { coup, score, autre: suivant && suivant[1] - score < 0.06 ? suivant[0] : null, cle: cle(preparer(phrases[0] || '')) };
  }
  // toutes les façons de dire les coups possibles (pour favoriser ces phrases dans la reconnaissance)
  const phrasesAttendues = (legaux) => [...new Set(legaux.flatMap((m) => formesDites(m).slice(0, 3)))];

  window.VoixAveugle = {
    choisirCoup, phrasesAttendues, formesDites, cle, preparer,
    lire, enMots, versNotation, ecouter, arreterEcoute,
    get lecture() { return !!parole; },
    get dictee() { return !!Reconnaissance || !!window.SpeechRecognition; },
  };
})();
