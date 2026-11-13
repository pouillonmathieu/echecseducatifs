/* Revoir les coups d'une partie (le cheval de la reine, capture le roi).
   Le jeu enregistre une « photo » de la position après chaque coup (la première est le départ) ; les boutons
   ⏮ ◀ ▶ ⏭ (et les flèches du clavier) font défiler ces positions. Pendant qu'on revoit un coup passé, l'échiquier
   ne se joue pas ; on revient au direct avec ⏭. lire() déroule les positions toutes seules (pour la solution).
     const revoir = Revoir({ barre, dessiner: (photo, enDirect) => …, quandChange: () => … });
     revoir.depart(photo); revoir.ajouter(photo); revoir.enDirect(); revoir.lire(900); revoir.photos(liste) */
(function () {
  const { t } = window.Commun;
  window.Revoir = function ({ barre, dessiner, quandChange = () => {} }) {
    let photos = [], vue = 0, minuterie = 0;
    const boutons = {};
    barre.querySelectorAll('[data-nav]').forEach(b => { boutons[b.dataset.nav] = b; });
    const numero = barre.querySelector('.nav-numero');

    const dernier = () => photos.length - 1;
    const enDirect = () => vue === dernier();
    function maj() {
      boutons.debut.disabled = boutons.prec.disabled = vue <= 0;
      boutons.suiv.disabled = boutons.fin.disabled = vue >= dernier();
      numero.textContent = vue === 0 ? t('Départ', 'Start') : `${vue} / ${dernier()}`;
      barre.classList.toggle('en-arriere', !enDirect());
    }
    function aller(i, { garderLecture = false } = {}) {
      if (!garderLecture) arreter();
      vue = Math.max(0, Math.min(dernier(), i));
      maj();
      dessiner(photos[vue], enDirect());
      quandChange();
    }
    function arreter() { clearInterval(minuterie); minuterie = 0; barre.classList.remove('lecture'); }

    boutons.debut.addEventListener('click', () => aller(0));
    boutons.prec.addEventListener('click', () => aller(vue - 1));
    boutons.suiv.addEventListener('click', () => aller(vue + 1));
    boutons.fin.addEventListener('click', () => aller(dernier()));
    document.addEventListener('keydown', (e) => {
      if (e.target.closest('input, select, textarea') || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.voile:not([hidden])')) return;
      const k = { ArrowLeft: vue - 1, ArrowRight: vue + 1, Home: 0, End: dernier() }[e.key];
      if (k === undefined || photos.length < 2) return;
      e.preventDefault();
      aller(k);
    });

    return {
      // nouvelle partie : une seule photo, celle du départ
      depart(photo) { arreter(); photos = [photo]; vue = 0; maj(); },
      // un coup de plus : si on regardait le direct, on le suit ; sinon on reste sur le coup regardé
      ajouter(photo) { const suivre = enDirect(); photos.push(photo); if (suivre) vue = dernier(); maj(); },
      // toute une suite de positions (la solution), qu'on regarde depuis le départ
      photos(liste) { arreter(); photos = liste.slice(); vue = 0; maj(); dessiner(photos[0], enDirect()); },
      // déroule les positions une à une
      lire(ms = 900) {
        arreter();
        barre.classList.add('lecture');
        minuterie = setInterval(() => { if (vue >= dernier()) arreter(); else aller(vue + 1, { garderLecture: true }); }, ms);
      },
      arreter,
      enDirect,
      photoVue: () => photos[vue],
    };
  };
})();
