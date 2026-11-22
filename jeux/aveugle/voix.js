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
  function ecouter() {
    if (!Reconnaissance) return Promise.reject(new Error('indisponible'));
    arreterEcoute();
    return new Promise((ok, ko) => {
      const r = new Reconnaissance();
      enCours = r;
      r.lang = LANGUE;
      r.interimResults = false;
      r.continuous = false;
      r.maxAlternatives = 5;
      let phrases = [];
      r.onresult = (e) => {
        const res = e.results[e.results.length - 1];
        phrases = Array.from(res, (a) => a.transcript);
      };
      r.onerror = (e) => { enCours = null; if (e.error === 'no-speech' || e.error === 'aborted') ok([]); else ko(new Error(e.error)); };
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

  window.VoixAveugle = {
    lire, enMots, versNotation, ecouter, arreterEcoute,
    get lecture() { return !!parole; },
    get dictee() { return !!Reconnaissance || !!window.SpeechRecognition; },
  };
})();
