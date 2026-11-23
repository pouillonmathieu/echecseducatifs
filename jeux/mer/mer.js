/* La mer rouge
   Variante du jeu de cour « Petit poisson, puis-je traverser la mer rouge ? ». Huit pions, peints chacun de trois
   couleurs (parmi bleu, rouge, jaune, vert, orange : 10 combinaisons, 8 tirées au hasard), partent de leur rangée de
   départ ; Pom' (sa tête et son chapeau) nage dans la mer et peut sauter sur n'importe quelle case.
   Chaque tour : les pions demandent « Petit poisson, peut-on traverser la mer rouge ? », Pom' répond « À condition
   d'avoir du… » et une couleur (tirée parmi celles des pions encore en mer). Seuls les pions de cette couleur peuvent
   avancer, chacun une fois (une case, ou deux depuis la case de départ). Puis Pom' part à la chasse : il attrape un
   pion qui n'a pas la couleur annoncée, qui n'est plus sur sa case de départ et qu'aucun autre pion ne défend (un pion
   en diagonale juste derrière lui) ; s'il en a le choix, le plus avancé. Sinon, il nage vers une autre case.
   Les pions arrivés de l'autre côté sont à l'abri. La partie finit quand plus aucun pion n'est en mer. */
(function () {
  const { EN, t, Prefs, brancherReglages, brancherInterrupteur } = window.Commun;
  const { lancerPluie, allumerEtoiles } = window.UI;
  const Sons = window.Sons;
  const $ = (id) => document.getElementById(id);
  const plateau = $('echiquier');
  const SRC = (document.currentScript && document.currentScript.src) || '';
  const BASE = SRC ? SRC.split('?')[0].replace(/[^/]*$/, '') : '';
  const VERSION = SRC.split('?v=')[1] || '';
  const IMAGE_POM = `${BASE}pom.png${VERSION ? '?v=' + VERSION : ''}`;
  const COLONNES = 'abcdefgh';

  const COULEURS = {
    bleu:   { css: '#2F6FE4', nom: t('bleu', 'blue'), du: t('du bleu', 'blue') },
    rouge:  { css: '#E0453A', nom: t('rouge', 'red'), du: t('du rouge', 'red') },
    jaune:  { css: '#F5C518', nom: t('jaune', 'yellow'), du: t('du jaune', 'yellow') },
    vert:   { css: '#2FA35F', nom: t('vert', 'green'), du: t('du vert', 'green') },
    orange: { css: '#F08A24', nom: t('orange', 'orange'), du: t('de l\'orange', 'orange') },
  };
  const QUESTION = t('Petit poisson, peut-on traverser la mer rouge ?', 'Little fish, may we cross the Red Sea?');
  const reponse = (c) => t(`À condition d'avoir ${COULEURS[c].du} !`, `Only if you're wearing ${COULEURS[c].du}!`);

  const reglages = {
    danger: Prefs.lire('echecs.mer.danger', true),
    voix: Prefs.lire('echecs.mer.voix', true),
    coordonnees: Prefs.lire('echecs.mer.coordonnees', true),
  };
  const jeu = { pions: [], pom: null, couleur: null, tour: 0, phase: 'fin', choisi: null, gen: 0 };

  const melanger = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const nomCase = (col, rang) => COLONNES[col] + rang;
  const nomPion = (p) => p.couleurs.map((c) => COULEURS[c].nom).join('-');

  // ---------- Le dessin d'un pion en trois couleurs : la tête, le corps, le socle ----------
  function dessinPion(p) {
    const [tete, corps, socle] = p.couleurs.map((c) => COULEURS[c].css);
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><g stroke="#1A1E27" stroke-width="3.2" stroke-linejoin="round">
      <path fill="${socle}" d="M18 92 H82 A4 4 0 0 0 86 88 V84 A6 6 0 0 0 80 78 H20 A6 6 0 0 0 14 84 V88 A4 4 0 0 0 18 92 Z"/>
      <path fill="${corps}" d="M33 78 C33 66 39 58 43 52 H57 C61 58 67 66 67 78 Z"/>
      <rect fill="${corps}" x="35" y="44" width="30" height="9" rx="4.5"/>
      <circle fill="${tete}" cx="50" cy="29" r="15"/></g>
      <ellipse cx="44" cy="23" rx="4.5" ry="3" fill="#fff" opacity=".45"/></svg>`;
  }

  // ---------- Les cases ----------
  function occupant(col, rang) {
    if (jeu.pom && jeu.pom.col === col && jeu.pom.rang === rang) return 'pom';
    return jeu.pions.find((p) => p.etat !== 'pris' && p.col === col && p.rang === rang) || null;
  }
  // les cases où un pion peut aller : une case devant, ou deux depuis la case de départ (si rien ne bloque)
  function cibles(p) {
    if (p.etat !== 'jeu') return [];
    const r = [];
    if (p.rang < 8 && !occupant(p.col, p.rang + 1)) {
      r.push(p.rang + 1);
      if (p.rang === 2 && !occupant(p.col, 4)) r.push(4);
    }
    return r;
  }
  const peutBouger = (p) => jeu.phase === 'joueur' && p.etat === 'jeu' && !p.bouge && p.couleurs.includes(jeu.couleur) && cibles(p).length > 0;
  const defendu = (p) => jeu.pions.some((q) => q !== p && q.etat !== 'pris' && Math.abs(q.col - p.col) === 1 && q.rang === p.rang - 1);
  // les pions que Pom' peut attraper à la fin du tour
  const proies = () => jeu.pions.filter((p) => p.etat === 'jeu' && p.rang !== 2 && !p.couleurs.includes(jeu.couleur) && !defendu(p));

  // ---------- Affichage ----------
  function dessinerPlateau() {
    Echiquier.dessiner(plateau, '8/8/8/8/8/8/8/8 w - - 0 1', { orientation: 'blanc' });
    plateau.classList.add('mer');
  }
  function placerPieces() {
    // (les pièces glissent de leur ancienne case à la nouvelle)
    const avant = new Map([...plateau.querySelectorAll('.piece-mer')].map((el) => [el.dataset.id, el.getBoundingClientRect()]));
    plateau.querySelectorAll('.piece-mer').forEach((el) => el.remove());
    plateau.querySelectorAll('.case-e').forEach((c) => c.classList.remove('jouable-mer', 'choisi-mer', 'cible-mer', 'danger-mer'));
    const danger = new Set(reglages.danger && jeu.phase === 'joueur' ? proies() : []);
    for (const p of jeu.pions) {
      if (p.etat === 'pris') continue;
      const c = plateau.querySelector(`[data-case="${nomCase(p.col, p.rang)}"]`);
      const el = document.createElement('div');
      el.className = `piece-mer pion-mer${p.etat === 'arrive' ? ' arrive' : ''}`;
      el.dataset.id = p.id;
      el.innerHTML = dessinPion(p);
      el.title = nomPion(p);
      c.appendChild(el);
      c.setAttribute('aria-label', `${nomCase(p.col, p.rang)} : ${t('pion', 'pawn')} ${nomPion(p)}`);
      if (peutBouger(p)) c.classList.add('jouable-mer');
      if (danger.has(p)) c.classList.add('danger-mer');
      if (jeu.choisi === p) {
        c.classList.add('choisi-mer');
        for (const r of cibles(p)) plateau.querySelector(`[data-case="${nomCase(p.col, r)}"]`).classList.add('cible-mer');
      }
    }
    if (jeu.pom) {
      const c = plateau.querySelector(`[data-case="${nomCase(jeu.pom.col, jeu.pom.rang)}"]`);
      const el = document.createElement('div');
      el.className = 'piece-mer pom-mer';
      el.dataset.id = 'pom';
      el.innerHTML = `<img src="${IMAGE_POM}" alt="Pom'" draggable="false">`;
      c.appendChild(el);
    }
    plateau.querySelectorAll('.piece-mer').forEach((el) => {
      const a = avant.get(el.dataset.id);
      if (!a || !el.animate) return;
      const b = el.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      const saut = el.dataset.id === 'pom';
      el.animate(saut
        ? [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: `translate(${dx / 2}px, ${dy / 2 - 40}px) scale(1.25)`, offset: 0.5 }, { transform: 'none' }]
        : [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: saut ? 650 : 320, easing: 'ease-in-out' });
    });
    majCompteurs();
  }
  function majCompteurs() {
    $('nb-arrives').textContent = jeu.pions.filter((p) => p.etat === 'arrive').length;
    $('nb-attrapes').textContent = jeu.pions.filter((p) => p.etat === 'pris').length;
    $('nb-tour').textContent = Math.max(1, jeu.tour);
    $('btn-fin-tour').disabled = jeu.phase !== 'joueur';
  }
  const message = (txt) => { $('message').textContent = txt; };

  // ---------- La voix ----------
  const parole = 'speechSynthesis' in window ? window.speechSynthesis : null;
  function dire(texte, aigu) {
    if (!reglages.voix || !parole) return;
    const u = new SpeechSynthesisUtterance(texte);
    u.lang = EN ? 'en-GB' : 'fr-FR';
    u.rate = 0.95;
    u.pitch = aigu ? 1.35 : 1;
    parole.speak(u);
  }

  // ---------- Les tours ----------
  function nouveauTour() {
    const gen = jeu.gen;
    jeu.tour++;
    jeu.pions.forEach((p) => { p.bouge = false; });
    jeu.choisi = null;
    jeu.phase = 'question';
    // la couleur : une de celles des pions encore en mer
    const enMer = jeu.pions.filter((p) => p.etat === 'jeu');
    const possibles = [...new Set(enMer.flatMap((p) => p.couleurs))];
    jeu.couleur = possibles[Math.floor(Math.random() * possibles.length)];
    $('bulle-pom').hidden = true;
    const bp = $('bulle-pions');
    bp.classList.remove('parle'); void bp.offsetWidth; bp.classList.add('parle');
    message('');
    dire(QUESTION, false);
    placerPieces();
    setTimeout(() => {
      if (gen !== jeu.gen) return;
      const c = COULEURS[jeu.couleur];
      $('reponse-pom').innerHTML = t(`À condition d'avoir ${jeu.couleur === 'orange' ? 'de l\'' : 'du '}`, 'Only if you\'re wearing ') +
        `<span class="pastille-couleur" style="--c:${c.css}">${c.nom}</span>${t(' !', '!')}`;
      const bm = $('bulle-pom');
      bm.hidden = false;
      bm.style.setProperty('--c', c.css);
      bm.classList.remove('parle'); void bm.offsetWidth; bm.classList.add('parle');
      dire(reponse(jeu.couleur), true);
      jeu.phase = 'joueur';
      placerPieces();
      const n = jeu.pions.filter(peutBouger).length;
      if (!n) {
        message(t(`Aucun pion avec ${c.du} ne peut avancer : Pom' part à la chasse.`, `No pawn wearing ${c.du} can move: Pom' goes hunting.`));
        setTimeout(() => { if (gen === jeu.gen) finirTour(); }, 2200);
      } else {
        message(t(`Touche un pion qui a ${c.du} pour le faire avancer. Puis « Finir le tour ».`, `Tap a pawn wearing ${c.du} to move it forward. Then "End the turn".`));
      }
    }, parole && reglages.voix ? 2300 : 1100);
  }

  function avancer(p, rang) {
    p.rang = rang;
    p.bouge = true;
    jeu.choisi = null;
    if (rang === 8) {
      p.etat = 'arrive';
      Sons.juste();
      window.Pom?.bonneReponse();
      message(t(`Le pion ${nomPion(p)} a traversé la mer rouge !`, `The ${nomPion(p)} pawn has crossed the Red Sea!`));
    } else Sons.pose(1);
    placerPieces();
    if (!jeu.pions.some(peutBouger)) {
      const gen = jeu.gen;
      setTimeout(() => { if (gen === jeu.gen && jeu.phase === 'joueur') finirTour(); }, 900);
    }
  }

  function finirTour() {
    if (jeu.phase !== 'joueur') return;
    const gen = jeu.gen;
    jeu.phase = 'pom';
    jeu.choisi = null;
    placerPieces();
    message(t('Pom\' part à la chasse…', 'Pom\' goes hunting…'));
    setTimeout(() => {
      if (gen !== jeu.gen) return;
      const liste = proies();
      if (liste.length) {
        const haut = Math.max(...liste.map((p) => p.rang));
        const plusHauts = liste.filter((p) => p.rang === haut);
        const proie = plusHauts[Math.floor(Math.random() * plusHauts.length)];
        const el = plateau.querySelector(`.piece-mer[data-id="${proie.id}"]`);
        if (el && el.animate) el.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.3) rotate(25deg)' }], { duration: 450, delay: 350, fill: 'forwards' });
        jeu.pom = { col: proie.col, rang: proie.rang };
        setTimeout(() => {
          if (gen !== jeu.gen) return;
          proie.etat = 'pris';
          Sons.retire();
          window.Pom?.erreur();
          message(t(`Pom' a attrapé le pion ${nomPion(proie)} ! Il n'avait pas ${COULEURS[jeu.couleur].du} et personne ne le défendait.`, `Pom' caught the ${nomPion(proie)} pawn! It wasn't wearing ${COULEURS[jeu.couleur].du} and nobody was defending it.`));
          placerPieces();
          suite();
        }, 800);
        // (Pom' saute sur la case du pion : on le dessine déjà là, le pion disparaît pendant le saut)
        const pomEl = plateau.querySelector('.piece-mer[data-id="pom"]');
        const a = pomEl && pomEl.getBoundingClientRect();
        const cible = plateau.querySelector(`[data-case="${nomCase(proie.col, proie.rang)}"]`);
        if (pomEl && cible) {
          cible.appendChild(pomEl);
          const b = pomEl.getBoundingClientRect();
          const dx = a.left - b.left, dy = a.top - b.top;
          if (pomEl.animate) pomEl.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: `translate(${dx / 2}px, ${dy / 2 - 40}px) scale(1.25)`, offset: 0.5 }, { transform: 'none' }], { duration: 650, easing: 'ease-in-out' });
        }
      } else {
        // personne à attraper : Pom' nage vers une autre case de la mer
        const libres = [];
        for (let col = 0; col < 8; col++) for (let rang = 3; rang <= 7; rang++) if (!occupant(col, rang)) libres.push({ col, rang });
        if (libres.length) jeu.pom = libres[Math.floor(Math.random() * libres.length)];
        message(t('Personne à attraper : tous les pions sont à l\'abri ! Pom\' nage ailleurs.', 'Nobody to catch: all the pawns are safe! Pom\' swims elsewhere.'));
        placerPieces();
        suite();
      }
    }, 900);
  }
  function suite() {
    const gen = jeu.gen;
    if (!jeu.pions.some((p) => p.etat === 'jeu')) { jeu.phase = 'fin'; setTimeout(() => { if (gen === jeu.gen) fin(); }, 900); majCompteurs(); return; }
    setTimeout(() => { if (gen === jeu.gen) nouveauTour(); }, 2200);
  }

  function fin() {
    const n = jeu.pions.filter((p) => p.etat === 'arrive').length;
    const etoiles = n === 8 ? 3 : n >= 6 ? 2 : n >= 4 ? 1 : 0;
    $('res-titre').textContent = n === 8 ? t('Tous de l\'autre côté !', 'All across!') : n >= 6 ? t('Bravo !', 'Well done!') : n >= 4 ? t('Bien joué !', 'Nice work!') : t('Pom\' a eu faim…', 'Pom\' was hungry…');
    $('res-score').textContent = n;
    $('res-detail').textContent = t(`${n} pion${n > 1 ? 's ont' : ' a'} traversé la mer rouge en ${jeu.tour} tours. Astuce : un pion défendu par un autre, en diagonale juste derrière lui, est à l'abri.`,
      `${n} pawn${n === 1 ? ' has' : 's have'} crossed the Red Sea in ${jeu.tour} turns. Tip: a pawn defended by another one, diagonally just behind it, is safe.`);
    allumerEtoiles($('etoiles'), etoiles);
    $('resultats').hidden = false;
    $('btn-rejouer').focus({ preventScroll: true });
    if (etoiles >= 2) lancerPluie($('pluie'), 70);
    Sons.victoire();
    window.Pom?.resultat(etoiles);
  }

  function nouvellePartie() {
    jeu.gen++;
    parole?.cancel();
    $('resultats').hidden = true;
    $('pluie').innerHTML = '';
    // les 10 façons de prendre 3 couleurs parmi 5 ; 8 tirées au hasard, dans un ordre au hasard sur chaque pion
    const noms = Object.keys(COULEURS);
    const combinaisons = [];
    for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) for (let k = j + 1; k < 5; k++) combinaisons.push([noms[i], noms[j], noms[k]]);
    jeu.pions = melanger(combinaisons).slice(0, 8).map((c, col) => ({ id: 'p' + col, couleurs: melanger(c), col, rang: 2, etat: 'jeu', bouge: false }));
    jeu.pom = { col: Math.floor(Math.random() * 8), rang: 6 };
    jeu.tour = 0;
    jeu.choisi = null;
    jeu.phase = 'question';
    dessinerPlateau();
    placerPieces();
    nouveauTour();
  }

  // ---------- Toucher un pion ----------
  plateau.addEventListener('click', (e) => {
    const c = e.target.closest('[data-case]');
    if (!c || jeu.phase !== 'joueur') return;
    const nom = c.dataset.case;
    const col = COLONNES.indexOf(nom[0]), rang = +nom[1];
    // une case proposée : le pion choisi y va
    if (jeu.choisi && jeu.choisi.col === col && cibles(jeu.choisi).includes(rang)) { avancer(jeu.choisi, rang); return; }
    const p = occupant(col, rang);
    if (p && p !== 'pom' && peutBouger(p)) {
      const cs = cibles(p);
      // une seule case possible : il y va tout de suite ; deux (premier pas) : on choisit
      if (cs.length === 1) { avancer(p, cs[0]); return; }
      jeu.choisi = jeu.choisi === p ? null : p;
      Sons.tic();
      placerPieces();
      return;
    }
    if (p && p !== 'pom' && p.etat === 'jeu') {
      Sons.refus();
      message(p.bouge ? t('Ce pion a déjà avancé pendant ce tour.', 'This pawn has already moved this turn.')
        : !p.couleurs.includes(jeu.couleur) ? t(`Ce pion n'a pas ${COULEURS[jeu.couleur].du} : il ne peut pas avancer ce tour-ci.`, `This pawn isn't wearing ${COULEURS[jeu.couleur].du}: it can't move this turn.`)
          : t('Ce pion est bloqué : la case devant lui est occupée.', 'This pawn is blocked: the square in front of it is taken.'));
    }
    if (jeu.choisi) { jeu.choisi = null; placerPieces(); }
  });

  $('btn-fin-tour').addEventListener('click', finirTour);
  $('btn-nouvelle').addEventListener('click', nouvellePartie);
  $('btn-rejouer').addEventListener('click', nouvellePartie);
  $('btn-voir').addEventListener('click', () => { $('resultats').hidden = true; });

  // ---------- Réglages ----------
  brancherReglages($('btn-reglages'), $('panneau-reglages'));
  brancherInterrupteur($('reg-danger'), reglages.danger, (v) => { reglages.danger = v; Prefs.ecrire('echecs.mer.danger', v); placerPieces(); });
  brancherInterrupteur($('reg-voix'), reglages.voix, (v) => { reglages.voix = v; Prefs.ecrire('echecs.mer.voix', v); if (!v) parole?.cancel(); });
  const appliquerCoord = () => document.body.classList.toggle('sans-coordonnees', !reglages.coordonnees);
  brancherInterrupteur($('reg-coordonnees'), reglages.coordonnees, (v) => { reglages.coordonnees = v; Prefs.ecrire('echecs.mer.coordonnees', v); appliquerCoord(); });
  brancherInterrupteur($('reg-son'), Sons.actif, (v) => { Sons.actif = v; });
  appliquerCoord();

  nouvellePartie();
  window.__mer = { jeu, proies, cibles, finirTour };
})();
