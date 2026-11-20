/* Comment ça s'appelle ?
   Une illustration s'affiche (une pièce, un échiquier, un coup…) : on écrit son nom, lettre par lettre,
   dans la langue choisie (9 langues, chacune avec son clavier). Le déterminant est déjà écrit.
   - une lettre fausse n'est pas posée (la case tremble) ; après 3 erreurs sur la même lettre, elle apparaît en pâle ;
   - « Indice » ne garde sur le clavier que les lettres du mot ;
   - « Solution » montre le mot.
   Niveau facile : les pièces, l'échiquier, la case, échec, mat, les camps ; difficile : en plus, les coups et
   les idées (roque, fourchette, clouage…), chacun avec un exemple sur l'échiquier. Les termes sont dans termes.js. */
(function () {
  const { EN, t, brancherBoutonTheme, brancherReglages, brancherInterrupteur } = window.Commun;
  const { lancerPluie, compterJusqua, allumerEtoiles, formaterDuree, ICONES } = window.UI;
  const Sons = window.Sons;
  const TERMES = window.TERMES_MOTS;
  const LANGUES = window.LANGUES_MOTS;
  const $ = (id) => document.getElementById(id);
  const LETTRE = /[\p{L}\p{M}]/u; // ce qui se tape ; le reste (espace, tiret, « ! »…) est déjà écrit
  const NFC = (s) => s.normalize('NFC');

  // nom de la langue dans la phrase de consigne (langue de l'interface)
  const EN_LANGUE = {
    fr: ['en français', 'in French'], en: ['en anglais', 'in English'], es: ['en espagnol', 'in Spanish'],
    pt: ['en portugais', 'in Portuguese'], nl: ['en néerlandais', 'in Dutch'], ru: ['en russe', 'in Russian'],
    ar: ['en arabe', 'in Arabic'], hi: ['en hindi', 'in Hindi'], zh: ['en chinois (mandarin)', 'in Chinese (Mandarin)'],
  };

  const lire = (cle, defaut) => { try { return localStorage.getItem(cle) || defaut; } catch (e) { return defaut; } };
  const ecrire = (cle, v) => { try { localStorage.setItem(cle, v); } catch (e) { /* stockage indisponible */ } };
  const reglages = {
    langue: LANGUES[lire('echecs.mots.langue', '')] ? lire('echecs.mots.langue', '') : (EN ? 'en' : 'fr'),
    niveau: lire('echecs.mots.niveau', 'facile') === 'difficile' ? 'difficile' : 'facile',
  };

  // défis : 10 mots du niveau choisi ; chrono : 30 secondes par mot
  const NB_DEFIS = 10;
  const DUREE = 30;
  const defi = { chrono: false, resultats: [], debut: 0, fin: 0, raf: 0, dernierTic: 0 };

  const jeu = {
    mode: 'libre', partie: 0,
    serie: [], numero: 0, terme: null, cars: [], pos: 0, fini: false, indice: false, erreursIci: 0, erreursMot: 0,
    // bilan de la série : du premier coup, trouvés avec de l'aide (erreurs ou indice), solutions montrées
    parfaits: 0, aides: 0, solutions: 0,
  };

  function melanger(tab) {
    const a = [...tab];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const pool = () => TERMES.filter(x => reglages.niveau === 'difficile' || x.niveau === 'facile');
  const egal = (a, b) => a.toLocaleLowerCase(reglages.langue) === b.toLocaleLowerCase(reglages.langue);

  // ---------- Illustration ----------
  // la pendule d'échecs : deux cadrans, deux boutons (celui des Blancs enfoncé), un drapeau
  const DESSINS = {
    pendule: `<svg viewBox="0 0 100 100" class="pendule">
      <ellipse cx="50" cy="86" rx="40" ry="4" fill="#000" opacity=".12"/>
      <rect x="31" y="22" width="12" height="6" rx="2" fill="#5A6474"/>
      <rect x="57" y="18" width="12" height="10" rx="2" fill="#5A6474"/>
      <path d="M12 30Q12 26 16 26H84Q88 26 88 30L91 80Q91 84 87 84H13Q9 84 9 80Z" fill="#8B5A33" stroke="#4A2E18" stroke-width="2"/>
      <path d="M14 30H86L88 78H12Z" fill="#A86E40" opacity=".55"/>
      <circle cx="31" cy="55" r="16" fill="#FBFBF8" stroke="#2A2E38" stroke-width="2.5"/>
      <circle cx="69" cy="55" r="16" fill="#FBFBF8" stroke="#2A2E38" stroke-width="2.5"/>
      <g stroke="#2A2E38" stroke-width="1.6" stroke-linecap="round">
        <path d="M31 42v2M31 66v2M18 55h2M42 55h2M69 42v2M69 66v2M56 55h2M80 55h2"/>
        <path d="M31 55V45.5M31 55l6 3" stroke-width="2.2"/>
        <path d="M69 55l-4-8M69 55l7 1" stroke-width="2.2"/>
      </g>
      <path d="M74 44.5l5-6 1.2 4z" fill="#C8323C"/>
      <circle cx="31" cy="55" r="1.8" fill="#2A2E38"/><circle cx="69" cy="55" r="1.8" fill="#2A2E38"/>
    </svg>`,
  };

  const illus = $('illus');
  let annotEnCours = null;
  function dessinerIllus(il) {
    annotEnCours = null;
    illus.replaceChildren();
    const badge = $('badge');
    badge.hidden = !il.badge && !il.badgePiece;
    badge.classList.toggle('avec-piece', !!il.badgePiece);
    badge.innerHTML = il.badgePiece ? `<svg viewBox="0 0 100 100"><use href="#piece-${il.badgePiece}"/></svg>` : '';
    if (il.badge) badge.textContent = il.badge;
    if (il.dessin) {
      illus.className = 'illus-mots illus-piece';
      illus.innerHTML = DESSINS[il.dessin];
      return;
    }
    if (il.piece) {
      illus.className = 'illus-mots illus-piece';
      illus.innerHTML = `<svg viewBox="0 0 100 100"><use href="#piece-${il.piece}-${il.couleur}"/></svg>`;
      return;
    }
    if (il.camp) {
      illus.className = `illus-mots illus-camp camp-${il.camp}`;
      illus.innerHTML = ['roi', 'dame', 'tour', 'fou', 'cavalier', 'pion']
        .map(p => `<svg viewBox="0 0 100 100"><use href="#piece-${p}-${il.camp}"/></svg>`).join('');
      return;
    }
    illus.className = 'illus-mots illus-plateau';
    const plateau = document.createElement('div');
    plateau.className = 'plateau-mots';
    illus.appendChild(plateau);
    Echiquier.dessiner(plateau, il.fen);
    if (il.roi) Echiquier.marquer(plateau, [il.roi], 'roi-attaque');
    if (il.cadre) Echiquier.marquer(plateau, il.cadre, 'case-montree');
    if (il.annot) {
      annotEnCours = () => Echiquier.dessinerAnnotations(plateau, il.annot);
      requestAnimationFrame(annotEnCours);
    }
  }
  window.addEventListener('resize', () => { if (annotEnCours) annotEnCours(); });

  // ---------- Le mot à écrire ----------
  function afficherMot() {
    const L = LANGUES[reglages.langue];
    const [det, mot] = jeu.terme[reglages.langue];
    const zone = $('mot');
    zone.lang = reglages.langue;
    zone.dir = L.rtl ? 'rtl' : 'ltr';
    zone.replaceChildren();
    // les lettres, groupées par mot pour que les retours à la ligne se fassent entre les mots ;
    // le déterminant reste collé au premier mot
    const lettres = document.createElement('span');
    lettres.className = 'lettres';
    let groupe = null, premier = true;
    jeu.cars.forEach((c, i) => {
      if (c.c === ' ') { groupe = null; return; }
      if (!groupe) {
        groupe = document.createElement('span'); groupe.className = 'groupe'; lettres.appendChild(groupe);
        if (premier && det) {
          const d = document.createElement('span');
          d.className = 'det' + (/'$/.test(det) || L.rtl ? ' colle' : '');
          d.textContent = det;
          groupe.appendChild(d);
        }
        premier = false;
      }
      const b = document.createElement('span');
      b.className = c.tape ? 'boite' : 'fixe';
      b.dataset.i = i;
      if (!c.tape) b.textContent = c.c;
      groupe.appendChild(b);
    });
    zone.appendChild(lettres);
    const n = jeu.cars.filter(c => c.tape).length;
    zone.style.setProperty('--n', n);
    zone.classList.toggle('long', n > 11);
    zone.classList.toggle('tres-long', n > 17);
    zone.classList.toggle('ideogrammes', reglages.langue === 'zh');
    ajusterTaille();
    marquerCourante();
  }
  // taille des cases : le mot le plus long (avec le déterminant) doit tenir sur une ligne de la carte
  function ajusterTaille() {
    const zone = $('mot');
    zone.style.removeProperty('--taille');
    const dispo = zone.clientWidth;
    const besoin = () => Math.max(0, ...[...zone.querySelectorAll('.groupe')].map(g => g.scrollWidth));
    let taille = parseFloat(getComputedStyle(zone).getPropertyValue('--taille')) || 44;
    // on réduit pas à pas (les écarts entre les cases ne rétrécissent pas avec elles)
    for (let k = 0; k < 8 && dispo && besoin() > dispo && taille > 15; k++) {
      taille = Math.max(15, Math.floor(taille * Math.min(0.95, dispo / besoin())));
      zone.style.setProperty('--taille', `${taille}px`);
    }
  }
  window.addEventListener('resize', () => { if (jeu.terme) ajusterTaille(); });
  const boite = (i) => $('mot').querySelector(`[data-i="${i}"]`);
  function marquerCourante() {
    $('mot').querySelectorAll('.boite.courante').forEach(b => b.classList.remove('courante'));
    if (!jeu.fini && jeu.pos < jeu.cars.length) boite(jeu.pos).classList.add('courante');
  }
  // arabe et hindi : les lettres se lient entre elles ; on montre le mot tel qu'il s'écrit vraiment
  function majApercu() {
    const a = $('apercu');
    const L = reglages.langue;
    if (L === 'zh') {
      a.hidden = !jeu.fini;
      a.textContent = jeu.terme.zh[2];
      a.lang = 'zh-Latn-pinyin';
      a.dir = 'ltr';
      return;
    }
    if (L !== 'ar' && L !== 'hi') { a.hidden = true; return; }
    const [det] = jeu.terme[L];
    const ecrit = jeu.cars.slice(0, jeu.fini ? jeu.cars.length : jeu.pos).map(c => c.c).join('');
    a.hidden = false;
    a.lang = L;
    a.dir = L === 'ar' ? 'rtl' : 'ltr';
    a.textContent = (det && L === 'ar' ? det : det ? det + ' ' : '') + ecrit;
  }

  // ---------- Lecture du mot (synthèse vocale du navigateur) ----------
  const VOIX = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', pt: 'pt-PT', nl: 'nl-NL', ru: 'ru-RU', ar: 'ar-SA', hi: 'hi-IN', zh: 'zh-CN' };
  const parole = 'speechSynthesis' in window ? window.speechSynthesis : null;
  // la voix de la langue : d'abord le bon pays (fr-FR), sinon la même langue (fr-CA…)
  function voixPour(l) {
    const voix = parole ? parole.getVoices() : [];
    const nom = (v) => v.lang.replace('_', '-').toLowerCase();
    return voix.find(v => nom(v) === VOIX[l].toLowerCase()) || voix.find(v => nom(v).split('-')[0] === l) || null;
  }
  const texteALire = () => {
    const [det, mot] = jeu.terme[reglages.langue];
    return !det ? mot : /'$/.test(det) || reglages.langue === 'ar' ? det + mot : `${det} ${mot}`;
  };
  function lireMot() {
    if (!parole || !jeu.terme) return;
    parole.cancel();
    const u = new SpeechSynthesisUtterance(texteALire());
    u.lang = VOIX[reglages.langue];
    const v = voixPour(reglages.langue);
    if (v) u.voice = v;
    u.rate = 0.85;
    const b = $('btn-lire');
    u.onstart = () => b.classList.add('parle');
    u.onend = u.onerror = () => b.classList.remove('parle');
    parole.speak(u);
  }
  // le bouton : caché sans synthèse vocale ; grisé si l'appareil n'a pas de voix pour cette langue
  function majBoutonLire() {
    const b = $('btn-lire');
    b.hidden = !parole;
    if (!parole) return;
    const voix = parole.getVoices();
    const aucune = voix.length > 0 && !voixPour(reglages.langue);
    b.disabled = aucune;
    b.title = aucune ? t('Pas de voix pour cette langue sur cet appareil', 'No voice for this language on this device') : t('Écouter le mot', 'Listen to the word');
  }
  if (parole) parole.addEventListener?.('voiceschanged', majBoutonLire);
  $('btn-lire').addEventListener('click', lireMot);

  // ---------- Le clavier ----------
  function construireClavier() {
    const L = LANGUES[reglages.langue];
    const clavier = $('clavier');
    clavier.lang = reglages.langue;
    clavier.dir = L.rtl ? 'rtl' : 'ltr';
    clavier.classList.toggle('tuiles', !!L.tuiles);
    clavier.classList.toggle('devanagari', reglages.langue === 'hi');
    let rangees;
    if (L.tuiles) {
      // mandarin : les caractères du mot, mélangés avec des caractères d'autres mots
      const besoin = [...new Set(jeu.cars.filter(c => c.tape).map(c => c.c))];
      const autres = melanger([...new Set(pool().flatMap(x => [...x.zh[1]]).filter(c => LETTRE.test(c) && !besoin.includes(c)))]);
      const tuiles = melanger([...besoin, ...autres.slice(0, Math.max(6, 12 - besoin.length))]);
      rangees = [tuiles.slice(0, Math.ceil(tuiles.length / 2)), tuiles.slice(Math.ceil(tuiles.length / 2))];
    } else {
      rangees = L.clavier.map(r => [...NFC(r)]);
      // sécurité : une lettre du mot absente du clavier est ajoutée à la dernière rangée
      const presentes = new Set(rangees.flat().map(c => c.toLocaleLowerCase(reglages.langue)));
      for (const c of jeu.cars) {
        const m = c.c.toLocaleLowerCase(reglages.langue);
        if (c.tape && !presentes.has(m)) { rangees[rangees.length - 1].push(m); presentes.add(m); }
      }
    }
    clavier.replaceChildren(...rangees.map(r => {
      const div = document.createElement('div');
      div.className = 'rangee-touches';
      for (const c of r) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'touche';
        b.dataset.car = c;
        // signes du hindi (voyelles accrochées, virama…) : posés sur un cercle pointillé pour être lisibles
        b.textContent = /\p{M}/u.test(c) ? '◌' + c : c;
        div.appendChild(b);
      }
      return div;
    }));
  }
  $('clavier').addEventListener('click', (e) => {
    const b = e.target.closest('.touche');
    if (b && !b.disabled) taper(b.dataset.car, b);
  });
  function appliquerIndice() {
    const utiles = new Set(jeu.cars.filter(c => c.tape).map(c => c.c.toLocaleLowerCase(reglages.langue)));
    $('clavier').querySelectorAll('.touche').forEach(b => {
      const inutile = jeu.indice && !utiles.has(b.dataset.car.toLocaleLowerCase(reglages.langue));
      b.disabled = inutile;
      b.classList.toggle('inutile', inutile);
    });
  }

  // ---------- Partie ----------
  function preparer(mode) {
    jeu.partie++;
    arreterChrono();
    jeu.mode = mode;
    document.body.dataset.mode = mode;
    jeu.numero = 0;
    jeu.parfaits = 0; jeu.aides = 0; jeu.solutions = 0;
    $('resultats').hidden = true;
    $('pluie').innerHTML = '';
  }
  // mode libre : tous les mots du niveau, dans le désordre
  function nouvelleSerie() {
    preparer('libre');
    document.body.dataset.chrono = 'non';
    $('titre').textContent = t('Comment ça s\'appelle ?', 'What\'s it called?');
    jeu.serie = melanger(pool());
    afficher();
  }
  function lancerDefi(chrono) {
    fermerChoix();
    preparer('defi');
    defi.chrono = chrono;
    defi.resultats = [];
    document.body.dataset.chrono = chrono ? 'oui' : 'non';
    jeu.serie = melanger(pool()).slice(0, NB_DEFIS);
    $('minuteur-barre').style.transform = 'scaleX(1)';
    $('points').innerHTML = jeu.serie.map((_, i) => `<li aria-label="${t('Mot', 'Word')} ${i + 1}"></li>`).join('');
    afficher();
  }
  function majPoints() {
    $('points').querySelectorAll('li').forEach((li, i) => {
      const r = defi.resultats[i];
      li.className = r ? (r.ok ? 'ok' : 'rate') : (i === jeu.numero ? 'actuel' : '');
    });
  }
  function noterDefi(ok) {
    if (jeu.mode !== 'defi') return;
    arreterChrono();
    defi.resultats.push({ ok, mot: texteALire(), temps: (performance.now() - defi.debut) / 1000 });
    majPoints();
  }

  // ---------- Chrono ----------
  function demarrerChrono() {
    arreterChrono();
    const barre = $('minuteur-barre');
    defi.fin = performance.now() + DUREE * 1000;
    defi.dernierTic = 0;
    const p = jeu.partie, n = jeu.numero;
    const boucle = (temps) => {
      if (p !== jeu.partie || n !== jeu.numero || jeu.fini) return;
      const reste = Math.max(0, defi.fin - temps) / 1000;
      barre.style.transform = `scaleX(${(reste / DUREE).toFixed(4)})`;
      document.body.classList.toggle('presse', reste <= 5);
      const sec = Math.ceil(reste);
      if (reste <= 5 && sec > 0 && sec !== defi.dernierTic) { defi.dernierTic = sec; Sons.tic(); }
      if (reste <= 0) { montrerSolution(true); return; }
      defi.raf = requestAnimationFrame(boucle);
    };
    defi.raf = requestAnimationFrame(boucle);
  }
  function arreterChrono() {
    cancelAnimationFrame(defi.raf);
    document.body.classList.remove('presse');
  }
  function afficher() {
    const terme = jeu.serie[jeu.numero];
    jeu.terme = terme;
    jeu.cars = [...NFC(terme[reglages.langue][1])].map(c => ({ c, tape: LETTRE.test(c) }));
    jeu.pos = jeu.cars.findIndex(c => c.tape);
    jeu.fini = false;
    jeu.indice = false;
    jeu.erreursIci = 0;
    jeu.erreursMot = 0;
    if (parole) parole.cancel();
    majBoutonLire();
    dessinerIllus(terme.illus);
    afficherMot();
    construireClavier();
    appliquerIndice();
    majApercu();
    $('consigne').textContent = t(`Comment ça s'appelle ${EN_LANGUE[reglages.langue][0]} ?`, `What's it called ${EN_LANGUE[reglages.langue][1]}?`);
    $('progres').textContent = `${jeu.numero + 1} / ${jeu.serie.length}`;
    const r = $('retour');
    r.textContent = '';
    r.className = 'retour-mot';
    // en défi, pas d'indice : « Solution » fait passer le mot (il compte comme raté)
    $('btn-indice').hidden = jeu.mode === 'defi';
    $('btn-indice').disabled = false;
    $('btn-solution').hidden = false;
    $('btn-suivant').hidden = true;
    $('btn-solution').lastChild.textContent = jeu.mode === 'defi' ? t(' Passer', ' Skip') : t(' Solution', ' Answer');
    if (jeu.mode === 'defi') {
      $('titre').textContent = t(`Mot ${jeu.numero + 1} sur ${jeu.serie.length}`, `Word ${jeu.numero + 1} of ${jeu.serie.length}`);
      majPoints();
      defi.debut = performance.now();
      if (defi.chrono) demarrerChrono();
    }
  }

  function taper(car, touche) {
    if (jeu.fini) return;
    car = NFC(car);
    const attendu = jeu.cars[jeu.pos];
    if (!touche) touche = [...$('clavier').querySelectorAll('.touche')].find(b => egal(b.dataset.car, car));
    if (touche && touche.disabled) return;
    if (egal(car, attendu.c)) {
      const b = boite(jeu.pos);
      b.textContent = attendu.c;
      b.classList.remove('fantome');
      b.classList.add('pleine');
      if (touche) { touche.classList.remove('bonne'); void touche.offsetWidth; touche.classList.add('bonne'); }
      Sons.pose(1);
      jeu.erreursIci = 0;
      do jeu.pos++; while (jeu.pos < jeu.cars.length && !jeu.cars[jeu.pos].tape);
      majApercu();
      if (jeu.pos >= jeu.cars.length) reussir();
      else marquerCourante();
      return;
    }
    // lettre fausse : elle n'est pas posée
    jeu.erreursMot++;
    jeu.erreursIci++;
    const b = boite(jeu.pos);
    b.classList.remove('faux'); void b.offsetWidth; b.classList.add('faux');
    if (touche) { touche.classList.remove('mauvaise'); void touche.offsetWidth; touche.classList.add('mauvaise'); }
    Sons.refus();
    if (jeu.erreursIci >= 3) { b.textContent = attendu.c; b.classList.add('fantome'); }
    if (jeu.erreursIci === 3) window.Pom?.erreur(); // (Pom' ne réagit qu'à la 3e lettre fausse : la lettre est alors montrée)
  }

  function terminer() {
    jeu.fini = true;
    marquerCourante();
    majApercu();
    $('btn-indice').hidden = true;
    $('btn-solution').hidden = true;
    $('btn-suivant').hidden = false;
    $('btn-suivant').firstChild.textContent = jeu.numero === jeu.serie.length - 1 ? t('Voir le résultat ', 'See the result ') : t('Suivant ', 'Next ');
    $('btn-suivant').focus({ preventScroll: true });
  }
  function reussir() {
    const parfait = !jeu.erreursMot && !jeu.indice;
    if (parfait) jeu.parfaits++; else jeu.aides++;
    noterDefi(true);
    const r = $('retour');
    r.className = 'retour-mot juste';
    r.textContent = parfait ? t('Bravo, du premier coup !', 'Well done, first try!') : t('Bravo, tu l\'as trouvé !', 'Well done, you found it!');
    $('mot').classList.add('trouve');
    Sons.juste();
    window.Pom?.bonneReponse();
    terminer();
    // le mot est lu juste après le son de réussite (sauf si le son est coupé)
    if (Sons.actif) { const n = jeu.numero; setTimeout(() => { if (jeu.numero === n && jeu.fini) lireMot(); }, 450); }
  }
  // tempsEcoule : appelé par le chrono du défi
  function montrerSolution(tempsEcoule) {
    if (jeu.fini) return;
    jeu.solutions++;
    noterDefi(false);
    jeu.cars.forEach((c, i) => {
      if (!c.tape || i < jeu.pos) return;
      const b = boite(i);
      b.textContent = c.c;
      b.classList.remove('fantome');
      b.classList.add('donnee');
    });
    jeu.pos = jeu.cars.length;
    const r = $('retour');
    r.className = 'retour-mot solution';
    r.textContent = tempsEcoule === true ? t('Temps écoulé ! Voici le mot.', "Time's up! Here's the word.")
      : t('Voici le mot. Tu le retrouveras plus tard !', "Here's the word. You'll get it next time!");
    if (tempsEcoule === true) { Sons.echec(); window.Pom?.erreur(); }
    terminer();
  }
  function suivant() {
    if (!jeu.fini) return;
    $('mot').classList.remove('trouve');
    if (jeu.numero < jeu.serie.length - 1) { jeu.numero++; afficher(); return; }
    if (jeu.mode === 'defi') resultatsDefi(); else finSerie();
  }
  function finSerie() {
    const total = jeu.serie.length;
    const trouves = jeu.parfaits + jeu.aides;
    const part = jeu.parfaits / total;
    const etoiles = jeu.solutions === 0 && part >= 0.8 ? 3 : part >= 0.5 ? 2 : trouves >= total / 2 ? 1 : 0;
    $('res-titre').textContent = etoiles === 3 ? t('Champion !', 'Champion!') : etoiles >= 1 ? t('Bravo !', 'Well done!') : t('Continue !', 'Keep going!');
    $('res-sur').textContent = `/ ${total}`;
    compterJusqua($('res-score'), trouves);
    $('res-detail').textContent = t(
      `${jeu.parfaits} du premier coup, ${jeu.aides} avec un peu d'aide, ${jeu.solutions} solution${jeu.solutions > 1 ? 's' : ''} montrée${jeu.solutions > 1 ? 's' : ''}.`,
      `${jeu.parfaits} on the first try, ${jeu.aides} with a little help, ${jeu.solutions} answer${jeu.solutions === 1 ? '' : 's'} shown.`);
    $('res-detail').hidden = false;
    $('res-liste').hidden = true;
    $('res-temps').hidden = true;
    allumerEtoiles($('etoiles'), etoiles);
    $('resultats').hidden = false;
    if (etoiles >= 2) { lancerPluie($('pluie'), 60); Sons.victoire(); }
    window.Pom?.resultat(etoiles);
    $('btn-rejouer').focus({ preventScroll: true });
  }
  // fin d'un défi : 10 mots, un point par mot trouvé (les erreurs de lettres sont permises)
  function resultatsDefi() {
    arreterChrono();
    const score = defi.resultats.filter(r => r.ok).length;
    const etoiles = score === NB_DEFIS ? 3 : score >= 7 ? 2 : score >= 4 ? 1 : 0;
    $('res-titre').textContent = score === NB_DEFIS ? t('Parfait !', 'Perfect!') : score >= 7 ? t('Bravo !', 'Well done!') : score >= 4 ? t('Bien joué !', 'Nice work!') : t('Continue, tu progresses !', 'Keep going, you\'re getting better!');
    $('res-sur').textContent = `/ ${NB_DEFIS}`;
    compterJusqua($('res-score'), score);
    allumerEtoiles($('etoiles'), etoiles);
    $('res-detail').hidden = true;
    const liste = $('res-liste');
    liste.hidden = false;
    liste.lang = reglages.langue;
    liste.innerHTML = defi.resultats.map((r, i) =>
      `<li class="${r.ok ? 'ok' : 'rate'}" style="animation-delay:${700 + i * 70}ms"><span class="res-rond">${r.ok ? ICONES.ok : ICONES.rate}</span><span class="res-t"></span></li>`).join('');
    liste.querySelectorAll('.res-t').forEach((el, i) => { el.textContent = defi.resultats[i].mot; });
    const total = defi.resultats.reduce((somme, r) => somme + r.temps, 0);
    $('res-temps').hidden = false;
    $('res-temps').textContent = t('Temps total : ', 'Total time: ') + formaterDuree(total);
    $('resultats').hidden = false;
    lancerPluie($('pluie'), etoiles >= 1 ? 70 : 30);
    Sons.victoire();
    window.Pom?.resultat(etoiles);
    $('btn-rejouer').focus({ preventScroll: true });
  }

  // ---------- Fenêtre des défis ----------
  function ouvrirChoix() { $('choix-defi').hidden = false; $('mode-defi').focus({ preventScroll: true }); }
  function fermerChoix() { $('choix-defi').hidden = true; }
  $('btn-defis').addEventListener('click', ouvrirChoix);
  $('btn-fermer-choix').addEventListener('click', () => { fermerChoix(); $('btn-defis').focus(); });
  $('choix-defi').addEventListener('click', (e) => { if (e.target === e.currentTarget) fermerChoix(); });
  $('mode-defi').addEventListener('click', () => lancerDefi(false));
  $('mode-chrono').addEventListener('click', () => lancerDefi(true));
  $('btn-retour').addEventListener('click', nouvelleSerie);
  $('btn-menu').addEventListener('click', nouvelleSerie);

  // ---------- Branchements ----------
  // Pom' réfléchit avec toi (un indice)
  $('btn-indice').addEventListener('click', () => window.Pom?.hmm());
  $('btn-indice').addEventListener('click', () => {
    if (jeu.fini || jeu.indice) return;
    jeu.indice = true;
    $('btn-indice').disabled = true;
    appliquerIndice();
  });
  // Pom' a trouvé (la solution)
  $('btn-solution').addEventListener('click', () => window.Pom?.eureka());
  $('btn-solution').addEventListener('click', () => montrerSolution(false));
  $('btn-suivant').addEventListener('click', suivant);
  $('btn-rejouer').addEventListener('click', () => (jeu.mode === 'defi' ? lancerDefi(defi.chrono) : nouvelleSerie()));
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('select, input, textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!$('choix-defi').hidden) { if (e.key === 'Escape') fermerChoix(); return; }
    if (!$('resultats').hidden) return;
    if (e.key === 'Enter') {
      if (jeu.fini && !e.target.closest('button')) { e.preventDefault(); suivant(); }
      return;
    }
    if ([...e.key].length === 1 && LETTRE.test(e.key)) { e.preventDefault(); taper(e.key); }
  });

  // langue du mot
  const choixLangue = $('reg-langue');
  for (const [code, L] of Object.entries(LANGUES)) {
    const o = document.createElement('option');
    o.value = code;
    o.lang = code;
    o.textContent = L.nom;
    choixLangue.appendChild(o);
  }
  choixLangue.value = reglages.langue;
  choixLangue.addEventListener('change', () => {
    reglages.langue = choixLangue.value;
    ecrire('echecs.mots.langue', reglages.langue);
    nouvelleSerie();
    choixLangue.blur();
  });
  // niveau
  const boutonsNiveau = document.querySelectorAll('#reg-niveau button');
  const majNiveau = () => boutonsNiveau.forEach(b => b.setAttribute('aria-pressed', b.dataset.niveau === reglages.niveau ? 'true' : 'false'));
  boutonsNiveau.forEach(b => b.addEventListener('click', () => {
    if (b.dataset.niveau === reglages.niveau) return;
    reglages.niveau = b.dataset.niveau;
    ecrire('echecs.mots.niveau', reglages.niveau);
    majNiveau();
    nouvelleSerie();
  }));

  brancherBoutonTheme($('btn-theme'));
  brancherReglages($('btn-reglages'), $('panneau-reglages'));
  brancherInterrupteur($('reg-son'), Sons.actif, (v) => { Sons.actif = v; });

  // pour les tests : l'état de la partie
  window.Mots = { etat: () => jeu };

  // ---------- Démarrage ----------
  window.Echecs.injecterSprite();
  majNiveau();
  nouvelleSerie();
})();
