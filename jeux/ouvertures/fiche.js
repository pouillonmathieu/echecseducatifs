/* Fiche d'une ouverture (fiche.html?o=<identifiant>), ouverte par « En savoir plus » dans le quiz :
   l'échiquier avec les coups (flèches et liste cliquable), l'idée, ce qu'il faut retenir, les principales variantes
   (chacune se montre sur l'échiquier ; celles du quiz ont leur propre fiche), « Rejouer l'ouverture » et des liens
   vers Lichess. Sans paramètre : la liste de toutes les ouvertures, par niveau.
   Tout vient de donnees.js (généré par outils/ouvertures.js). */
(function () {
  const { EN, t, brancherBoutonTheme } = window.Commun;
  const OUVERTURES = window.OUVERTURES;
  const PAR_ID = Object.fromEntries(OUVERTURES.map(o => [o.id, o]));
  const $ = (id) => document.getElementById(id);
  const nomDe = (o) => (EN ? o.nom_en : o.nom);
  const sanFr = (s) => (EN ? s : s.replace(/[NBRQK]/g, c => ({ N: 'C', B: 'F', R: 'T', Q: 'D', K: 'R' })[c]));
  const NIVEAUX = { facile: t('Facile', 'Easy'), moyen: t('Moyen', 'Medium'), expert: t('Expert', 'Expert') };
  const echapper = (s) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  // « 1. e4 e5 2. Cf3 » ; à partir du coup « depuis » (« 4… Cf6 » si ce sont les Noirs qui commencent)
  function texteCoups(san, depuis = 0) {
    const m = [];
    for (let i = depuis; i < san.length; i++) {
      if (i % 2 === 0) m.push(`${i / 2 + 1}. ${sanFr(san[i])}`);
      else m.push(i === depuis ? `${(i + 1) / 2}… ${sanFr(san[i])}` : sanFr(san[i]));
    }
    return m.join(' ');
  }

  window.Echecs.injecterSprite();
  brancherBoutonTheme($('btn-theme'));
  const o = PAR_ID[new URLSearchParams(location.search).get('o')];
  // le bouton de langue garde l'ouverture affichée
  const langue = document.querySelector('.bouton-langue');
  if (langue && location.search) langue.href += location.search;

  if (!o) { sommaire(); return; }

  // ---------- Une ouverture ----------
  document.title = `${nomDe(o)} – ${t('Les ouvertures', 'Chess openings')}`;
  $('titre').textContent = t('Les ouvertures', 'Chess openings');
  $('fiche').hidden = false;
  $('nom').textContent = nomDe(o);
  $('niveau').textContent = NIVEAUX[o.niveau];
  $('niveau').dataset.niveau = o.niveau;
  const parent = o.parent && PAR_ID[o.parent];
  $('parent').innerHTML = parent ? `${t('Variante de', 'A line of')} <a href="fiche.html?o=${parent.id}">${echapper(nomDe(parent))}</a>` : '';
  $('resume').textContent = EN ? o.resume_en : o.resume;
  $('idees').innerHTML = (EN ? o.idees_en : o.idees).map(x => `<li>${echapper(x)}</li>`).join('');
  $('btn-rejouer-fiche').href = `index.html?rejouer=${o.id}`;

  // une variante qui ne prolonge pas exactement l'ouverture (elle s'en sépare avant la fin) se montre depuis le départ
  const prolonge = (l) => o.san.every((x, i) => l.san[i] === x);
  // l'échiquier : la ligne de l'ouverture, ou celle d'une variante choisie plus bas
  const plateau = $('echiquier');
  let ligne = o, numeroAvant = -1;
  function dessiner(ph) {
    Echiquier.dessiner(plateau, ph.fen);
    if (ph.anim) { Echiquier.marquer(plateau, [ph.anim[0][0]], 'depart'); Echiquier.marquer(plateau, [ph.anim[0][1]], 'arrivee'); }
    if (ph.anim && ph.i === numeroAvant + 1) animer(ph.anim);
    numeroAvant = ph.i;
    majListe();
  }
  function animer(deplacements) {
    for (const [a, b] of deplacements) {
      const de = plateau.querySelector(`[data-case="${a}"]`), vers = plateau.querySelector(`[data-case="${b}"]`);
      const piece = vers && vers.querySelector('.piece-e');
      if (!de || !piece || !piece.animate) continue;
      const ra = de.getBoundingClientRect(), rb = vers.getBoundingClientRect();
      piece.style.zIndex = 5;
      piece.animate([{ transform: `translate(${ra.left - rb.left}px, ${ra.top - rb.top}px)` }, { transform: 'none' }],
        { duration: 300, easing: 'cubic-bezier(.3, .7, .3, 1)' }).onfinish = () => { piece.style.zIndex = ''; };
    }
  }
  const revoir = window.Revoir({ barre: $('navigation'), dessiner, quandChange: majListe });
  function majListe() {
    const vue = revoir.vue();
    $('liste-fiche').innerHTML = ligne.san.map((s, i) =>
      `${i % 2 === 0 ? `<span class="num">${i / 2 + 1}.</span>` : ''}<button type="button" class="coup${i + 1 === vue ? ' actuel' : ''}${i >= o.san.length ? ' suite' : ''}" data-vue="${i + 1}">${sanFr(s)}</button>`).join(' ');
  }
  $('liste-fiche').addEventListener('click', (e) => { const b = e.target.closest('button[data-vue]'); if (b) revoir.aller(+b.dataset.vue); });
  // montrer une ligne : on part de la dernière position de l'ouverture, puis les coups de la variante se jouent
  function montrer(l, nom) {
    ligne = l;
    numeroAvant = -1;
    revoir.photos(l.fens.map((fen, i) => ({ fen, i, anim: i ? l.coups[i - 1] : null })));
    // une variante qui prolonge l'ouverture se joue depuis la fin de l'ouverture ; sinon, depuis le départ
    revoir.aller(l === o ? o.san.length : prolonge(l) ? o.san.length : 0);
    if (l !== o) setTimeout(() => { if (ligne === l) revoir.lire(800); }, 500);
    $('ligne-vue').hidden = l === o;
    $('ligne-vue-nom').textContent = nom || '';
    document.querySelectorAll('.variante').forEach(v => v.classList.toggle('montree', v.dataset.nom === nom));
  }
  $('btn-ligne-principale').addEventListener('click', () => montrer(o));

  // les variantes : celles du quiz (avec leur fiche), puis les suites propres à cette ouverture
  const variantes = [
    ...OUVERTURES.filter(x => x.parent === o.id).map(x => ({ nom: nomDe(x), ligne: x, texte: (EN ? x.resume_en : x.resume).split(/(?<=\.)\s/)[0], fiche: x.id, niveau: x.niveau })),
    ...o.suites.map(s => ({ nom: EN ? s.nom_en : s.nom, ligne: s, texte: EN ? s.texte_en : s.texte })),
  ];
  $('variantes').innerHTML = variantes.length ? variantes.map((v, i) => `
    <div class="variante" data-i="${i}" data-nom="${echapper(v.nom)}">
      <button type="button" class="variante-voir" data-i="${i}">
        <span class="variante-nom">${echapper(v.nom)}${v.niveau ? ` <span class="etiquette-niveau" data-niveau="${v.niveau}">${NIVEAUX[v.niveau]}</span>` : ''}</span>
        <span class="variante-coups">${texteCoups(v.ligne.san, prolonge(v.ligne) ? o.san.length : 0)}</span>
        <span class="variante-texte">${echapper(v.texte)}</span>
      </button>
      ${v.fiche ? `<a class="variante-fiche" href="fiche.html?o=${v.fiche}">${t('Voir sa fiche', 'Open its page')} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></a>` : ''}
    </div>`).join('') : `<p class="fiche-intro">${t('C\'est déjà une variante très précise : les deux camps ont fini de sortir leurs pièces, la partie commence vraiment !', 'This is already a very precise line: both sides have developed, and the real game begins!')}</p>`;
  $('variantes').addEventListener('click', (e) => {
    const b = e.target.closest('.variante-voir');
    if (!b) return;
    const v = variantes[+b.dataset.i];
    montrer(v.ligne, v.nom);
    if (window.matchMedia('(max-width: 860px)').matches) plateau.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // liens : la page de l'ouverture sur Lichess (statistiques et parties), l'échiquier d'analyse de Lichess
  const fleche = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';
  const liens = [];
  if (o.lichess) liens.push(`<li><a href="${o.lichess.page}" target="_blank" rel="noopener">${t('Cette ouverture sur Lichess : les coups les plus joués et des parties de champions', 'This opening on Lichess: the most played moves and games by top players')} ${fleche}</a></li>`);
  liens.push(`<li><a href="${o.analyse}" target="_blank" rel="noopener">${t('Analyser la position sur l\'échiquier de Lichess', 'Analyse the position on the Lichess board')} ${fleche}</a></li>`);
  liens.push(`<li><a href="https://lichess.org/practice" target="_blank" rel="noopener">${t('Les exercices d\'entraînement de Lichess', 'Lichess practice lessons')} ${fleche}</a></li>`);
  liens.push(`<li><a href="fiche.html">${t('Toutes les ouvertures du quiz', 'All the openings in the quiz')}</a></li>`);
  $('liens').innerHTML = liens.join('');

  montrer(o);

  // ---------- Toutes les ouvertures ----------
  function sommaire() {
    document.title = t('Les ouvertures', 'Chess openings');
    $('sommaire').hidden = false;
    $('sommaire-niveaux').innerHTML = Object.entries(NIVEAUX).map(([n, titre]) => `
      <h2 class="sommaire-titre"><span class="etiquette-niveau" data-niveau="${n}">${titre}</span></h2>
      <ul class="sommaire-liste">${OUVERTURES.filter(x => x.niveau === n).map(x =>
        `<li><a href="fiche.html?o=${x.id}"><span class="variante-nom">${echapper(nomDe(x))}</span><span class="variante-coups">${texteCoups(x.san)}</span></a></li>`).join('')}</ul>`).join('');
  }
})();
