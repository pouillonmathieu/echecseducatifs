/* Dice chess — compagnon de partie sur un vrai échiquier.
   Les Blancs puis les Noirs lancent leurs dés à tour de rôle ; chaque face montre une pièce :
   1 pion, 2 cavalier, 3 fou, 4 tour, 5 dame, 6 roi.
   La partie en cours est gardée dans le navigateur pour pouvoir la reprendre. */
(function () {
  const { Prefs, brancherBoutonTheme, brancherReglages, brancherInterrupteur } = window.Commun;
  const { lancerPluie, reduireMouvement, ICONES } = window.UI;
  const Sons = window.Sons;
  const $ = (id) => document.getElementById(id);

  const FACES = ['pion', 'cavalier', 'fou', 'tour', 'dame', 'roi'];
  const NOMS = { pion: 'pion', cavalier: 'cavalier', fou: 'fou', tour: 'tour', dame: 'dame', roi: 'roi' };
  const NOM_CAMP = { blanc: 'Blancs', noir: 'Noirs' };
  const autre = (c) => (c === 'blanc' ? 'noir' : 'blanc');
  const CLE_PARTIE = 'echecs.des.partie';

  // ---------- Réglages ----------
  let nombre = 3;
  try { nombre = localStorage.getItem('echecs.des.nombre') === '1' ? 1 : 3; } catch (e) { /* rien */ }
  const reglages = {
    face: Prefs.lire('echecs.des.face', false),
    chiffres: Prefs.lire('echecs.des.chiffres', false),
  };

  // ---------- Hasard équitable (1 à 6) ----------
  function lancerUnDe() {
    if (window.crypto && crypto.getRandomValues) {
      const t = new Uint8Array(1);
      do { crypto.getRandomValues(t); } while (t[0] >= 252); // 252 = 6 × 42 : pas de biais
      return (t[0] % 6) + 1;
    }
    return 1 + Math.floor(Math.random() * 6);
  }

  // ---------- Partie ----------
  const nouvelleEtat = () => ({ tour: 1, aLancer: 'blanc', enJeu: null, des: { blanc: [], noir: [] }, historique: [], fini: false });
  let partie = nouvelleEtat();
  let pile = [];          // états précédents, pour « Annuler »
  let verrou = false;     // pendant l'animation des dés

  function sauver() {
    try { localStorage.setItem(CLE_PARTIE, JSON.stringify({ partie, pile: pile.slice(-40) })); } catch (e) { /* rien */ }
  }
  function charger() {
    try {
      const d = JSON.parse(localStorage.getItem(CLE_PARTIE) || 'null');
      if (d && d.partie && Array.isArray(d.partie.historique)) return d;
    } catch (e) { /* rien */ }
    return null;
  }

  // ---------- Affichage d'un dé ----------
  function htmlDe(valeur, cote, { balise = 'span', index = null, joue = false, classes = '' } = {}) {
    const piece = FACES[valeur - 1];
    const attrs = balise === 'button'
      ? ` type="button" data-index="${index}" aria-pressed="${joue}" aria-label="Dé ${index + 1} : ${NOMS[piece]}${joue ? ', joué' : ''}"`
      : ' aria-hidden="true"';
    return `<${balise} class="de ${cote}${joue ? ' joue' : ''} ${classes}"${attrs}>` +
      `<span class="chiffre">${valeur}</span>` +
      `<svg class="piece" viewBox="0 0 100 100"><use href="#piece-${piece}-noir"/></svg>` +
      `<span class="coche">${ICONES.ok}</span></${balise}>`;
  }
  const miniDe = (v, cote) => `<span class="mini-de ${cote}" title="${NOMS[FACES[v - 1]]}"><svg viewBox="0 0 100 100"><use href="#piece-${FACES[v - 1]}-noir"/></svg></span>`;

  // ---------- Rendu ----------
  function rendre() {
    for (const cote of ['blanc', 'noir']) {
      const zone = document.querySelector(`.zone-${cote}`);
      const aLancer = !partie.fini && partie.aLancer === cote;
      const enJeu = !partie.fini && partie.enJeu === cote;
      zone.classList.toggle('a-lancer', aLancer);
      zone.classList.toggle('en-jeu', enJeu);
      $(`etat-${cote}`).textContent = enJeu ? 'À toi de jouer' : (aLancer && partie.enJeu === null ? 'À toi de lancer' : '');
      $(`lancer-${cote}`).disabled = !aLancer;

      const des = partie.des[cote];
      const conteneur = $(`des-${cote}`);
      if (!des.length) {
        conteneur.innerHTML = `<span class="des-vide">${cote === 'blanc' ? 'Les Blancs commencent' : 'Pas encore lancé'}</span>`;
      } else {
        conteneur.innerHTML = des.map((d, i) =>
          htmlDe(d.v, cote, { balise: 'button', index: i, joue: d.joue, classes: enJeu ? '' : 'ancien' })).join('');
      }
    }
    $('numero-tour').textContent = `Tour ${partie.tour}`;
    $('btn-annuler').disabled = pile.length === 0;
    // une ligne par tour : les dés des Blancs, puis ceux des Noirs
    const tours = [];
    for (const h of partie.historique) {
      if (!tours.length || tours[tours.length - 1].tour !== h.tour) tours.push({ tour: h.tour, blanc: null, noir: null });
      tours[tours.length - 1][h.cote] = h.valeurs;
    }
    const groupe = (valeurs, cote) => `<span class="h-des">${valeurs ? valeurs.map(v => miniDe(v, cote)).join('') : ''}</span>`;
    $('historique').innerHTML = tours.map(t =>
      `<li><span class="h-tour">Tour ${t.tour}</span>${groupe(t.blanc, 'blanc')}${groupe(t.noir, 'noir')}</li>`).join('');
  }

  // ---------- Actions ----------
  function lancer(cote) {
    if (verrou || partie.fini || cote !== partie.aLancer) return;
    pile.push(JSON.parse(JSON.stringify(partie)));
    const valeurs = Array.from({ length: nombre }, lancerUnDe);
    if (cote === 'blanc' && partie.historique.length) partie.tour++;
    partie.des[cote] = valeurs.map(v => ({ v, joue: false }));
    partie.enJeu = cote;
    partie.aLancer = autre(cote);
    partie.historique.push({ tour: partie.tour, cote, valeurs });
    sauver();
    Sons.des();
    animerLancer(cote, valeurs);
  }

  function animerLancer(cote, valeurs) {
    if (reduireMouvement()) { rendre(); return; }
    verrou = true;
    rendre();
    const conteneur = $(`des-${cote}`);
    const boutons = [...conteneur.querySelectorAll('.de')];
    const debut = performance.now();
    boutons.forEach(b => b.classList.add('roule'));
    const changer = setInterval(() => {
      boutons.forEach((b) => {
        if (!b.classList.contains('roule')) return;
        const v = 1 + Math.floor(Math.random() * 6);
        b.querySelector('use').setAttribute('href', `#piece-${FACES[v - 1]}-noir`);
        b.querySelector('.chiffre').textContent = v;
      });
      const t = performance.now() - debut;
      boutons.forEach((b, i) => {
        if (b.classList.contains('roule') && t > 450 + i * 160) {
          b.classList.remove('roule');
          b.querySelector('use').setAttribute('href', `#piece-${FACES[valeurs[i] - 1]}-noir`);
          b.querySelector('.chiffre').textContent = valeurs[i];
          b.classList.add('pose');
        }
      });
      if (boutons.every(b => !b.classList.contains('roule'))) {
        clearInterval(changer);
        setTimeout(() => { verrou = false; rendre(); }, 350);
      }
    }, 70);
  }

  function basculerDe(cote, i) {
    if (verrou || partie.fini || cote !== partie.enJeu) return;
    const d = partie.des[cote][i];
    d.joue = !d.joue;
    if (d.joue) Sons.juste(); else Sons.retire();
    sauver();
    rendre();
  }

  function annuler() {
    if (verrou || !pile.length) return;
    partie = pile.pop();
    Sons.retire();
    sauver();
    rendre();
  }

  function nouvellePartie() {
    partie = nouvelleEtat();
    pile = [];
    sauver();
    rendre();
  }

  // ---------- Fin de partie ----------
  function ouvrirFin() {
    $('fin-choix').hidden = false;
    $('fin-victoire').hidden = true;
    $('fin').hidden = false;
  }
  function declarerVainqueur(cote) {
    partie.fini = true;
    sauver();
    $('fin-roi').setAttribute('href', `#piece-roi-${cote}`);
    $('fin-message').textContent = `Victoire des ${NOM_CAMP[cote]} !`;
    const lancers = partie.historique.length;
    $('fin-detail').textContent = `Le roi ${cote === 'blanc' ? 'noir' : 'blanc'} est tombé au tour ${partie.tour}, après ${lancers} lancer${lancers > 1 ? 's' : ''} de dés.`;
    $('fin-choix').hidden = true;
    $('fin-victoire').hidden = false;
    lancerPluie($('pluie'), 70);
    Sons.victoire();
    rendre();
  }

  // ---------- Règles ----------
  const de = (v, cote = 'blanc', classes = '') => htmlDe(v, cote, { classes });
  const REGLES = [
    {
      titre: 'Un dé, six pièces',
      illus: () => FACES.map((p, i) => `<span class="face">${de(i + 1)}${i + 1}</span>`).join(''),
      texte: `<p>Chaque face du dé montre une pièce : <strong>1 pion, 2 cavalier, 3 fou, 4 tour, 5 dame, 6 roi</strong>.</p>
              <p>On joue sur un vrai échiquier, avec la position de départ habituelle. Les Blancs commencent.</p>`,
    },
    {
      titre: 'Trois dés, trois coups',
      illus: () => de(1) + de(2) + de(1),
      texte: `<p>À ton tour, lance les 3 dés. Chaque dé te permet de jouer <strong>un coup avec la pièce qu'il montre</strong>.</p>
              <p>Ici : deux coups de pion et un coup de cavalier, dans l'ordre que tu veux. Une même pièce peut bouger plusieurs fois.</p>`,
    },
    {
      titre: 'Un dé qui ne sert à rien',
      illus: () => de(1) + `<span class="barre-de">${de(4)}</span>` + de(2),
      texte: `<p>Si aucune de tes pièces de ce type ne peut bouger, ce dé est perdu. Par exemple, au début de la partie, les tours sont bloquées.</p>
              <p>Tu joues tous les dés que tu peux utiliser. Si aucun dé n'est jouable, ton tour passe.</p>`,
    },
    {
      titre: 'Ni échec, ni mat',
      illus: () => `<svg class="grand-roi" viewBox="0 0 100 100"><use href="#piece-roi-noir"/></svg>` + de(6, 'blanc'),
      texte: `<p>On n'annonce pas « échec » : le roi a le droit de se mettre en danger ou d'y rester.</p>
              <p>Pour gagner, il faut <strong>capturer le roi adverse</strong>. Attention : après ton tour, l'adversaire peut prendre ton roi s'il obtient la bonne pièce aux dés !</p>`,
    },
    {
      titre: 'Les coups spéciaux',
      illus: () => de(1) + de(6) + de(1, 'noir'),
      texte: `<ul>
                <li><strong>Promotion</strong> : avec un dé pion, un pion qui arrive au bout de l'échiquier se transforme en dame, tour, fou ou cavalier.</li>
                <li><strong>Roque</strong> : il se joue avec un dé roi.</li>
                <li><strong>Prise en passant</strong> : avec un dé pion, au tour qui suit juste le double pas du pion adverse.</li>
              </ul>`,
    },
    {
      titre: 'Avec ce site',
      illus: () => de(3) + de(5, 'blanc', 'joue') + de(2),
      texte: `<p>Appuie sur <strong>« Lancer les dés »</strong> quand c'est ton tour. <strong>Touche un dé</strong> quand tu l'as joué : il se grise. Ensuite, l'adversaire lance à son tour.</p>
              <p>Dans les réglages : le <strong>face à face</strong> retourne les dés des Noirs pour jouer avec la tablette entre vous deux, et la <strong>version classique</strong> se joue avec un seul dé par tour.</p>`,
    },
  ];
  let etape = 0;
  let reglesDepuisEntree = false;

  function afficherEtape() {
    const r = REGLES[etape];
    $('regle-compteur').textContent = `${etape + 1} / ${REGLES.length}`;
    $('regle-illus').innerHTML = r.illus();
    $('regle-titre').textContent = r.titre;
    $('regle-texte').innerHTML = r.texte;
    $('regle-prec').disabled = etape === 0;
    $('regle-suiv').textContent = etape === REGLES.length - 1 ? 'Jouer !' : 'Suivant';
    $('regle-points').innerHTML = REGLES.map((_, i) => `<li class="${i < etape ? 'ok' : i === etape ? 'actuel' : ''}"></li>`).join('');
  }
  function ouvrirRegles(depuisEntree) {
    reglesDepuisEntree = depuisEntree;
    etape = 0;
    afficherEtape();
    $('regles').hidden = false;
    $('regle-suiv').focus({ preventScroll: true });
  }
  function fermerRegles() {
    $('regles').hidden = true;
    if (reglesDepuisEntree) {
      reglesDepuisEntree = false;
      $('btn-reprendre').hidden ? commencer(true) : commencer(false);
    }
  }

  // ---------- Écran d'entrée ----------
  function preparerEntree() {
    const sauvegarde = charger();
    const enCours = sauvegarde && sauvegarde.partie.historique.length > 0 && !sauvegarde.partie.fini;
    $('btn-reprendre').hidden = !enCours;
    $('btn-commencer').textContent = enCours ? 'Nouvelle partie' : 'Commencer la partie';
    $('btn-commencer').className = enCours ? 'bouton-secondaire' : 'bouton-principal';
    $('entree-des').innerHTML = htmlDe(2, 'blanc') + htmlDe(6, 'noir') + htmlDe(5, 'blanc');
    if (enCours) { partie = sauvegarde.partie; pile = sauvegarde.pile || []; }
    rendre();
  }
  function commencer(nouvelle) {
    if (nouvelle) nouvellePartie();
    $('entree').hidden = true;
  }

  // ---------- Branchements ----------
  for (const cote of ['blanc', 'noir']) {
    $(`lancer-${cote}`).addEventListener('click', () => lancer(cote));
    $(`des-${cote}`).addEventListener('click', (e) => {
      const b = e.target.closest('button.de');
      if (b) basculerDe(cote, +b.dataset.index);
    });
  }
  $('btn-annuler').addEventListener('click', annuler);
  $('btn-roi-pris').addEventListener('click', ouvrirFin);
  $('fin-annuler').addEventListener('click', () => { $('fin').hidden = true; });
  document.querySelectorAll('.fin-camp').forEach(b => b.addEventListener('click', () => declarerVainqueur(b.dataset.gagnant)));
  $('fin-rejouer').addEventListener('click', () => { $('fin').hidden = true; $('pluie').innerHTML = ''; nouvellePartie(); });

  $('btn-apprendre').addEventListener('click', () => ouvrirRegles(true));
  $('btn-commencer').addEventListener('click', () => commencer(true));
  $('btn-reprendre').addEventListener('click', () => commencer(false));
  $('btn-regles').addEventListener('click', () => ouvrirRegles(false));
  $('btn-fermer-regles').addEventListener('click', () => { reglesDepuisEntree = false; $('regles').hidden = true; });
  $('regle-prec').addEventListener('click', () => { if (etape > 0) { etape--; afficherEtape(); } });
  $('regle-suiv').addEventListener('click', () => {
    if (etape < REGLES.length - 1) { etape++; afficherEtape(); } else fermerRegles();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('regles').hidden) { reglesDepuisEntree = false; $('regles').hidden = true; }
    else if (!$('fin').hidden && !$('fin-choix').hidden) $('fin').hidden = true;
  });

  // réglages
  brancherBoutonTheme($('btn-theme'));
  brancherReglages($('btn-reglages'), $('panneau-reglages'));
  const segments = [...$('reg-nombre').querySelectorAll('button')];
  const majNombre = () => segments.forEach(b => b.setAttribute('aria-pressed', +b.dataset.nombre === nombre ? 'true' : 'false'));
  segments.forEach(b => b.addEventListener('click', () => {
    nombre = +b.dataset.nombre;
    try { localStorage.setItem('echecs.des.nombre', String(nombre)); } catch (e) { /* rien */ }
    majNombre();
  }));
  majNombre();
  const appliquer = () => {
    document.body.classList.toggle('face-a-face', reglages.face);
    document.body.classList.toggle('avec-chiffres', reglages.chiffres);
  };
  brancherInterrupteur($('reg-face'), reglages.face, (v) => { reglages.face = v; Prefs.ecrire('echecs.des.face', v); appliquer(); });
  brancherInterrupteur($('reg-chiffres'), reglages.chiffres, (v) => { reglages.chiffres = v; Prefs.ecrire('echecs.des.chiffres', v); appliquer(); });
  brancherInterrupteur($('reg-son'), Sons.actif, (v) => { Sons.actif = v; });

  // ---------- Démarrage ----------
  window.Echecs.injecterSprite();
  appliquer();
  preparerEntree();
})();
