/* Comptes (facultatifs) : Supabase (supabase/schema.sql). Le site marche toujours sans compte.
   Chargé dans le <head> de chaque page, très léger : la bibliothèque Supabase (js/lib/supabase.js) n'est chargée que
   si quelqu'un est connecté (ou sur les pages du compte).
   - Trois types : basique (tout le site), eleve (le compte d'un parent, avec un profil par enfant ; l'enfant qui joue
     n'a que les jeux ouverts par son enseignant), enseignant (ses classes : enseignant/index.html).
   - Les réglages (clés echecs.* du navigateur) suivent le compte, ou le profil de l'enfant qui joue.
   - La progression : chaque réaction de Pom' (bonne réponse, fin de défi…) donne de l'expérience au joueur, envoyée
     au serveur par paquets (fonction noter() de la base) ; la dernière activité d'un enfant sert au statut « en ligne ».
   - Ce qu'on sait déjà (type de compte, enfant qui joue, jeux ouverts) est gardé dans le navigateur
     (echecs.compte.etat), pour verrouiller tout de suite les jeux d'un élève, avant même la réponse du serveur. */
(function () {
  const ADRESSE = 'https://eimxxpcwxmvonkrldlfp.supabase.co';
  const CLE_PUBLIQUE = 'sb_publishable_erFM047aCSbWGnoaV4o2Xg_8LneJ2hy';
  const CLE_SESSION = 'sb-eimxxpcwxmvonkrldlfp-auth-token';
  const SRC = (document.currentScript && document.currentScript.src) || '';
  const RACINE = SRC.split('?')[0].replace(/js\/compte\.js$/, '');
  const VERSION = SRC.split('?v=')[1] || '';
  const EN = document.documentElement.lang === 'en';
  const t = (fr, en) => (EN ? en : fr);
  const appli = () => !!window.EchecsAndroid || document.documentElement.classList.contains('appli-android');

  // les jeux, dans l'ordre de l'accueil (id = dossier jeux/<id>/)
  const JEUX = [
    ['labyrinthe', 'Le labyrinthe', 'The maze'], ['roi', 'Capture le roi', 'Capture the king'],
    ['mat', 'Mat ou pas mat ?', 'Mate or not mate?'], ['mat1', 'Mat en un', 'Mate in one'],
    ['cases', 'Trouve la case', 'Find the square'], ['notation', 'Note le coup', 'Write the move'],
    ['joue', 'Joue le coup', 'Play the move'], ['mots', 'Comment ça s\'appelle ?', 'What\'s it called?'],
    ['balance', 'La balance', 'The scales'], ['cheval', 'Le cheval de la reine', 'The queen\'s horse'],
    ['ouvertures', 'Quiz des ouvertures', 'Openings quiz'], ['mer', 'La mer rouge', 'The Red Sea'], ['aveugle', 'À l\'aveugle', 'Blindfold'], ['des', 'Dice chess', 'Dice chess'],
  ].map(([id, fr, en]) => ({ id, nom: EN ? en : fr }));
  const JEU = (location.pathname.match(/\/jeux\/([^/]+)\//) || [])[1] || null;
  // le niveau d'un jeu, d'après l'expérience (1 au départ, puis 40, 160, 360, 640… XP)
  const niveau = (xp) => 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 40));

  // ---------- Petit stockage ----------
  const lire = (cle, defaut = null) => { try { const v = localStorage.getItem(cle); return v === null ? defaut : JSON.parse(v); } catch (e) { return defaut; } };
  const ecrire = (cle, valeur) => { try { if (valeur === null) localStorage.removeItem(cle); else localStorage.setItem(cle, JSON.stringify(valeur)); } catch (e) { /* stockage indisponible */ } };
  const aUneSession = () => { try { return !!localStorage.getItem(CLE_SESSION); } catch (e) { return false; } };

  // ---------- La bibliothèque et le client Supabase (chargés à la demande) ----------
  let client = null;
  function chargerClient() {
    if (client) return client;
    client = new Promise((ok, ko) => {
      const fin = () => ok(window.supabase.createClient(ADRESSE, CLE_PUBLIQUE, {
        auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: CLE_SESSION },
      }));
      if (window.supabase && window.supabase.createClient) { fin(); return; }
      const s = document.createElement('script');
      s.src = `${RACINE}js/lib/supabase.js${VERSION ? '?v=' + VERSION : ''}`;
      s.onload = fin;
      s.onerror = () => { client = null; ko(new Error('chargement')); };
      document.head.appendChild(s);
    });
    return client;
  }

  // ---------- L'état du compte ----------
  // { utilisateur, compte (ligne de comptes, ou null s'il reste à le créer), enfants, enfant (celui qui joue),
  //   acces (liste des jeux ouverts pour l'enfant qui joue ; null = tout) }
  async function chargerEtat() {
    const sb = await chargerClient();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { oublier(); return null; }
    const utilisateur = session.user;
    const { data: compte, error } = await sb.from('comptes').select('*').eq('id', utilisateur.id).maybeSingle();
    if (error) throw error;
    const etat = { utilisateur, compte, enfants: [], enfant: null, acces: null };
    if (compte && compte.type === 'eleve') {
      const { data: enfants } = await sb.from('enfants').select('*, classes(nom)').order('cree_le');
      etat.enfants = enfants || [];
      const choisi = lire('echecs.compte.enfant');
      etat.enfant = etat.enfants.find((e) => e.id === choisi) || (etat.enfants.length === 1 ? etat.enfants[0] : null);
      if (etat.enfant) etat.acces = await accesDe(sb, etat.enfant);
    }
    garderCache(etat);
    return etat;
  }
  // les jeux ouverts pour un enfant : ceux de sa classe, plus ceux ouverts pour lui, moins ceux fermés pour lui
  async function accesDe(sb, enfant) {
    if (!enfant.classe) return [];
    const [{ data: classe }, { data: perso }] = await Promise.all([
      sb.from('jeux_classe').select('jeu').eq('classe', enfant.classe),
      sb.from('jeux_enfant').select('jeu, ouvert').eq('enfant', enfant.id),
    ]);
    const ouverts = new Set((classe || []).map((r) => r.jeu));
    for (const r of perso || []) { if (r.ouvert) ouverts.add(r.jeu); else ouverts.delete(r.jeu); }
    return JEUX.map((j) => j.id).filter((id) => ouverts.has(id));
  }
  function garderCache(etat) {
    if (!etat || !etat.compte) { ecrire('echecs.compte.etat', etat ? { type: null } : null); return; }
    ecrire('echecs.compte.etat', {
      type: etat.compte.type, prenom: etat.compte.prenom,
      enfant: etat.enfant ? { id: etat.enfant.id, prenom: etat.enfant.prenom, classe: etat.enfant.classes ? etat.enfant.classes.nom : null } : null,
      acces: etat.compte.type === 'eleve' ? (etat.acces || []) : null,
      nbEnfants: etat.enfants.length,
    });
  }
  function oublier() {
    ecrire('echecs.compte.etat', null);
    ecrire('echecs.compte.enfant', null);
    ecrire('echecs.compte.attente', null);
    ecrire('echecs.compte.maj', null);
  }

  // ---------- Jeux verrouillés (élèves) ----------
  // un compte élève sans enfant choisi, ou un jeu pas encore ouvert par l'enseignant
  function verrou(cache) {
    if (!cache || cache.type !== 'eleve') return null;
    if (!cache.enfant) return 'profil';
    if (JEU && !(cache.acces || []).includes(JEU)) return 'ferme';
    return null;
  }
  const lienCompte = () => `${RACINE}${EN ? 'en/' : ''}compte/index.html`;
  const lienAccueil = () => `${RACINE}${EN ? 'en/' : ''}index.html`;
  function montrerVerrou(raison) {
    let v = document.getElementById('verrou-jeu');
    if (!raison) { if (v) v.remove(); document.documentElement.classList.remove('jeu-verrouille'); return; }
    document.documentElement.classList.add('jeu-verrouille');
    if (!document.body) return;
    if (!v) { v = document.createElement('div'); v.id = 'verrou-jeu'; v.className = 'voile verrou-jeu'; document.body.appendChild(v); }
    const texte = raison === 'profil'
      ? t('Choisis d\'abord qui joue : un des enfants du compte.', 'First choose who is playing: one of the children on the account.')
      : t('Ce jeu n\'est pas encore ouvert. Ton enseignant l\'ouvrira bientôt !', 'This game isn\'t open yet. Your teacher will open it soon!');
    v.innerHTML = `<div class="carte-choix carte-verrou" role="dialog" aria-modal="true">
      <svg class="cadenas" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>
      <h2>${raison === 'profil' ? t('Qui joue ?', 'Who is playing?') : t('Pas encore ouvert', 'Not open yet')}</h2>
      <p class="carte-choix-intro">${texte}</p>
      <div class="res-actions">
        <a class="bouton-principal" href="${raison === 'profil' ? lienCompte() : lienAccueil()}">${raison === 'profil' ? t('Choisir', 'Choose') : t('Retour à l\'accueil', 'Back to home')}</a>
      </div></div>`;
  }
  // l'accueil : les cartes des jeux fermés, avec un cadenas
  function verrouillerCartes(cache) {
    const eleve = cache && cache.type === 'eleve';
    document.querySelectorAll('.carte-jeu').forEach((a) => {
      const id = (a.getAttribute('href').match(/jeux\/([^/]+)\//) || [])[1];
      const ferme = eleve && (!cache.enfant || !(cache.acces || []).includes(id));
      a.classList.toggle('verrouillee', !!ferme);
      if (ferme) a.setAttribute('aria-disabled', 'true'); else a.removeAttribute('aria-disabled');
    });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('.carte-jeu.verrouillee');
    if (!a) return;
    e.preventDefault();
    const cache = lire('echecs.compte.etat');
    const bulle = document.getElementById('bulle-pom');
    const msg = cache && !cache.enfant
      ? t('Choisis d\'abord qui joue, avec le bouton de ton compte en haut.', 'First choose who is playing, with your account button at the top.')
      : t('Ce jeu n\'est pas encore ouvert : ton enseignant l\'ouvrira bientôt !', 'This game isn\'t open yet: your teacher will open it soon!');
    if (bulle) { bulle.textContent = msg; bulle.closest('.bulle')?.classList.remove('parle'); void bulle.offsetWidth; bulle.closest('.bulle')?.classList.add('parle'); }
  }, true);

  // ---------- Le bouton du compte (accueil) ----------
  function bouton(cache) {
    const barre = document.querySelector('body > .ecran > .barre, .accueil > .barre, header.barre');
    if (!barre || !document.querySelector('.grille-jeux')) return;
    let b = document.getElementById('btn-compte');
    if (!b) {
      b = document.createElement('a');
      b.id = 'btn-compte';
      b.className = 'bouton-compte';
      b.setAttribute('data-hors-artifact', '');
      const reglages = barre.querySelector('.reglages');
      barre.insertBefore(b, reglages);
    }
    b.href = lienCompte();
    const nom = cache && (cache.enfant ? cache.enfant.prenom : cache.prenom);
    b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c.8-3.9 3.8-6 7.5-6s6.7 2.1 7.5 6"/></svg><span>${nom ? echapper(nom) : (cache && cache.type === 'eleve' ? t('Qui joue ?', 'Who\'s playing?') : t('Se connecter', 'Sign in'))}</span>`;
    b.title = nom ? t('Mon compte', 'My account') : t('Se connecter (facultatif)', 'Sign in (optional)');
    b.classList.toggle('connecte', !!(cache && cache.type));
  }
  const echapper = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- Réglages qui suivent le compte ----------
  const cleSuivie = (k) => k && k.startsWith('echecs.') && !k.startsWith('echecs.compte.');
  let applique = false, attenteReglages = 0;
  function reglagesLocaux() {
    const o = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (cleSuivie(k)) o[k] = localStorage.getItem(k); } } catch (e) { /* rien */ }
    return o;
  }
  function appliquerReglages(o) {
    applique = true;
    try {
      const anciennes = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (cleSuivie(k)) anciennes.push(k); }
      anciennes.forEach((k) => localStorage.removeItem(k));
      for (const [k, v] of Object.entries(o)) if (cleSuivie(k) && typeof v === 'string') localStorage.setItem(k, v);
    } catch (e) { /* rien */ }
    applique = false;
  }
  // chaque changement de réglage (n'importe quel jeu) part au serveur, un peu plus tard
  const proto = window.Storage && Storage.prototype;
  if (proto) {
    const setItem = proto.setItem, removeItem = proto.removeItem;
    proto.setItem = function (k, v) { setItem.call(this, k, v); if (this === window.localStorage && cleSuivie(k) && !applique) reglagesChanges(); };
    proto.removeItem = function (k) { removeItem.call(this, k); if (this === window.localStorage && cleSuivie(k) && !applique) reglagesChanges(); };
  }
  function reglagesChanges() {
    const cache = lire('echecs.compte.etat');
    if (!cache || !cache.type || (cache.type === 'eleve' && !cache.enfant)) return;
    clearTimeout(attenteReglages);
    attenteReglages = setTimeout(envoyerReglages, 1500);
  }
  async function envoyerReglages() {
    const cache = lire('echecs.compte.etat');
    if (!cache || !cache.type) return;
    const maj = Date.now();
    const reglages = { ...reglagesLocaux(), _maj: maj };
    try {
      const sb = await chargerClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;
      const r = cache.type === 'eleve'
        ? await sb.from('enfants').update({ reglages }).eq('id', cache.enfant.id)
        : await sb.from('comptes').update({ reglages }).eq('id', session.user.id);
      if (!r.error) ecrire('echecs.compte.maj', maj);
    } catch (e) { /* hors ligne : ce sera pour la prochaine fois */ }
  }
  // au chargement : les réglages du serveur s'ils sont plus récents (un autre appareil), sinon ceux d'ici partent
  function synchroniserReglages(etat) {
    const source = etat.enfant || (etat.compte && etat.compte.type !== 'eleve' ? etat.compte : null);
    if (!source) return false;
    const distants = source.reglages || {};
    const majLocale = lire('echecs.compte.maj', 0);
    if ((distants._maj || 0) > majLocale) { appliquerReglages(distants); ecrire('echecs.compte.maj', distants._maj); return true; }
    if (!distants._maj || majLocale > distants._maj) envoyerReglages();
    return false;
  }

  // ---------- Progression ----------
  // les réactions de Pom' (js/pom.js) disent ce qui s'est passé : on en fait de l'expérience, gardée en attente puis
  // envoyée par paquets (et retentée au prochain chargement si l'envoi échoue)
  function noter(ajout) {
    const cache = lire('echecs.compte.etat');
    if (!JEU || !cache || !cache.type) return;
    const joueur = cache.type === 'eleve' ? (cache.enfant && cache.enfant.id) : 'moi';
    if (!joueur) return;
    const attente = lire('echecs.compte.attente', {}) || {};
    const cle = `${joueur}|${JEU}`;
    const a = attente[cle] || { xp: 0, reussites: 0, parties: 0, etoiles: 0 };
    a.xp += ajout.xp || 0; a.reussites += ajout.reussites || 0; a.parties += ajout.parties || 0; a.etoiles = Math.max(a.etoiles, ajout.etoiles || 0);
    attente[cle] = a;
    ecrire('echecs.compte.attente', attente);
    clearTimeout(attenteEnvoi);
    attenteEnvoi = setTimeout(envoyerProgression, 8000);
  }
  let attenteEnvoi = 0, envoiEnCours = false;
  async function envoyerProgression() {
    const attente = lire('echecs.compte.attente', {}) || {};
    if (envoiEnCours || !Object.keys(attente).length) return;
    envoiEnCours = true;
    try {
      const sb = await chargerClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { ecrire('echecs.compte.attente', null); return; }
      for (const [cle, a] of Object.entries(attente)) {
        const [qui, jeu] = cle.split('|');
        const joueur = qui === 'moi' ? session.user.id : qui;
        // (la base accepte au plus 200 XP, 50 réussites et 10 parties par envoi : on découpe)
        let { xp, reussites, parties } = a;
        do {
          const { error } = await sb.rpc('noter', { joueur, jeu, xp: Math.min(xp, 200), reussites: Math.min(reussites, 50), parties: Math.min(parties, 10), etoiles: a.etoiles });
          if (error) throw error;
          xp -= Math.min(xp, 200); reussites -= Math.min(reussites, 50); parties -= Math.min(parties, 10);
        } while (xp > 0 || reussites > 0 || parties > 0);
        const reste = lire('echecs.compte.attente', {}) || {};
        delete reste[cle];
        ecrire('echecs.compte.attente', reste);
      }
    } catch (e) { /* hors ligne : retenté plus tard */ }
    finally { envoiEnCours = false; }
  }
  function brancherPom() {
    const P = window.Pom;
    if (!P || P.__compte) return;
    P.__compte = true;
    const avant = (nom, f) => { const o = P[nom]; if (typeof o === 'function') P[nom] = function (...a) { try { f(...a); } catch (e) { /* rien */ } return o.apply(this, a); }; };
    avant('bonneReponse', () => noter({ xp: 5, reussites: 1 }));
    avant('etoiles', (n) => noter({ xp: 5 * Math.max(0, Math.min(3, n | 0)) }));
    avant('resultat', (n) => { const e = Math.max(0, Math.min(3, n | 0)); noter({ xp: 10 + 10 * e, parties: 1, etoiles: e }); });
  }
  // « je joue » : la page enseignant montre l'élève en ligne
  function presence(etat) {
    if (!etat.enfant) return;
    const ping = async () => {
      if (document.hidden) return;
      try { const sb = await chargerClient(); await sb.rpc('je_joue', { enfant: etat.enfant.id }); } catch (e) { /* rien */ }
    };
    ping();
    setInterval(ping, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) ping(); });
  }

  // ---------- Démarrage ----------
  const cache0 = lire('echecs.compte.etat');
  // avant même le serveur : un jeu fermé pour l'élève est tout de suite verrouillé
  if (verrou(cache0)) document.documentElement.classList.add('jeu-verrouille');
  const pageCompte = /\/(compte|enseignant)\//.test(location.pathname);
  let pret = Promise.resolve(null);
  if (aUneSession() || pageCompte || /[?&]code=/.test(location.search)) {
    pret = chargerEtat().catch(() => cache0 ? { horsLigne: true } : null);
  } else if (cache0) oublier();

  function auDemarrage() {
    bouton(cache0);
    verrouillerCartes(cache0);
    montrerVerrou(verrou(cache0));
    brancherPom();
    pret.then((etat) => {
      if (!etat || etat.horsLigne) { if (!etat) { bouton(null); verrouillerCartes(null); montrerVerrou(null); } return; }
      const cache = lire('echecs.compte.etat');
      bouton(cache);
      verrouillerCartes(cache);
      montrerVerrou(pageCompte ? null : verrou(cache));
      if (etat.compte) {
        const nouveaux = synchroniserReglages(etat);
        // (de nouveaux réglages venus d'un autre appareil : la page d'un jeu se recharge pour les prendre)
        if (nouveaux && JEU && !sessionStorage.getItem('echecs.recharge')) { sessionStorage.setItem('echecs.recharge', '1'); location.reload(); return; }
        sessionStorage.removeItem('echecs.recharge');
        envoyerProgression();
        if (JEU || document.querySelector('.grille-jeux')) presence(etat);
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auDemarrage);
  else auDemarrage();
  window.addEventListener('pagehide', () => { clearTimeout(attenteEnvoi); envoyerProgression(); });

  // ---------- Pour les pages du compte ----------
  async function choisirEnfant(id) {
    ecrire('echecs.compte.enfant', id);
    ecrire('echecs.compte.maj', 0); // les réglages de cet enfant remplacent ceux d'ici
    const etat = await chargerEtat();
    if (etat && etat.enfant) { appliquerReglages(etat.enfant.reglages || {}); ecrire('echecs.compte.maj', (etat.enfant.reglages || {})._maj || 0); }
    return etat;
  }
  async function deconnecter() {
    await envoyerProgression();
    const sb = await chargerClient();
    await sb.auth.signOut();
    oublier();
  }
  window.Compte = {
    JEUX, niveau, t, EN, RACINE, appli, lienCompte, lienAccueil,
    client: chargerClient, etat: chargerEtat, get pret() { return pret; }, set pret(p) { pret = p; },
    choisirEnfant, deconnecter, envoyerReglages, reglagesLocaux, appliquerReglages, oublier, accesDe,
    retourConnexion: () => (appli() ? 'pomchess://connexion' : location.href.split(/[?#]/)[0]),
  };
})();
