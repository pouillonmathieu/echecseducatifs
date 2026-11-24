/* Mon compte : se connecter, créer son compte (basique, élève, enseignant), les profils des enfants (compte
   élève : celui d'un parent), la progression, ses données (télécharger, supprimer). Voir js/compte.js. */
(function () {
  const C = window.Compte;
  const { t, EN } = C;
  const $ = (id) => document.getElementById(id);
  const contenu = $('contenu');
  const e = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lienConfidentialite = `${C.RACINE}${EN ? 'en/' : ''}confidentialite.html`;
  const TYPES = {
    basique: [t('Joueur', 'Player'), t('Tous les jeux, tes réglages et ta progression sur tous tes appareils.', 'All the games, your settings and your progress on all your devices.')],
    eleve: [t('Élève', 'Pupil'), t('Avec le compte d\'un parent : un profil par enfant, qui rejoint la classe de son enseignant.', 'With a parent\'s account: one profile per child, who joins their teacher\'s class.')],
    enseignant: [t('Enseignant', 'Teacher'), t('Crée tes classes, choisis les jeux ouverts et suis la progression de tes élèves.', 'Create your classes, choose which games are open and follow your pupils\' progress.')],
  };
  const FOURNISSEURS = [
    ['google', 'Google', '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.8-5.4 3.8-3.2 0-5.9-2.7-5.9-6s2.6-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.8 2.4 2.6 6.6 2.6 11.9S6.8 21.4 12 21.4c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12Z"/></svg>'],
    ['facebook', 'Facebook', '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#1877F2"/><path fill="#fff" d="M13.2 21.9v-7h2.4l.4-2.8h-2.8v-1.8c0-.8.3-1.4 1.4-1.4H16V6.4c-.3 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6v2.2H8v2.8h2.4v7"/></svg>'],
    ['linkedin_oidc', 'LinkedIn', '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="4" fill="#0A66C2"/><path fill="#fff" d="M7 10h2.6v7.6H7zM8.3 6.2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM11.2 10h2.5v1.1c.4-.7 1.3-1.3 2.6-1.3 2.7 0 3.2 1.7 3.2 4v3.8h-2.6v-3.4c0-.8 0-1.9-1.2-1.9s-1.4.9-1.4 1.8v3.5h-2.6z"/></svg>'],
  ];
  // Le bouton de Google lui-même (Google Identity Services) : la connexion se fait sur pomchess.app, et Google
  // affiche « Pom'chess » au lieu de l'adresse du serveur des comptes. Seulement sur le domaine déclaré dans la
  // console Google (origine JavaScript autorisée) ; ailleurs (appli Android, essais en local), la redirection.
  const CLIENT_GOOGLE = '641905281731-jkffurppcggb0oup63i3j7nc25nv971l.apps.googleusercontent.com';
  const boutonGoogleIntegre = () => !C.appli() && /(^|\.)pomchess\.app$/.test(location.hostname);
  function chargerGoogle() {
    if (window.google && google.accounts && google.accounts.id) return Promise.resolve();
    return new Promise((ok, ko) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = ok; s.onerror = ko;
      document.head.appendChild(s);
    });
  }
  async function hacher(texte) {
    const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texte));
    return [...new Uint8Array(h)].map((o) => o.toString(16).padStart(2, '0')).join('');
  }
  // Dans l'application Android : la fenêtre de connexion de Google d'Android (ConnexionGoogle.java), qui donne le même
  // jeton d'identité. Si elle ne marche pas (pas de services Google, application pas déclarée chez Google…), on
  // revient à la connexion par le navigateur. Les anciennes versions de l'application n'ont pas ce pont.
  const googleNatif = () => C.appli() && window.EchecsAndroid && typeof EchecsAndroid.connexionGoogle === 'function';
  async function connexionGoogleNative() { // -> true si c'est réglé (connecté, ou annulé), false pour passer au navigateur
    const nonce = [...crypto.getRandomValues(new Uint8Array(16))].map((o) => o.toString(16).padStart(2, '0')).join('');
    const id = String(Date.now());
    const hache = await hacher(nonce);
    const { jeton, err } = await new Promise((ok) => {
      window.__connexionGoogle = (pour, j, e) => { if (pour === id) ok({ jeton: j, err: e }); };
      EchecsAndroid.connexionGoogle(id, hache);
    });
    if (!jeton) return /^annule/.test(err || '');
    info(t('Connexion…', 'Signing in…'));
    const sb = await C.client();
    const { error } = await sb.auth.signInWithIdToken({ provider: 'google', token: jeton, nonce });
    if (error) { erreur(t('La connexion n\'a pas abouti : ', 'Sign-in failed: ') + error.message); return true; }
    info('');
    rafraichir();
    return true;
  }
  async function brancherGoogle() {
    const place = $('place-google');
    if (!place) return;
    try { await chargerGoogle(); } catch (err) { return; } // (le bouton de secours reste)
    // (un nombre au hasard, haché pour Google, en clair pour Supabase, qui vérifie qu'ils correspondent)
    const nonce = [...crypto.getRandomValues(new Uint8Array(16))].map((o) => o.toString(16).padStart(2, '0')).join('');
    google.accounts.id.initialize({
      client_id: CLIENT_GOOGLE,
      nonce: await hacher(nonce),
      ux_mode: 'popup',
      use_fedcm_for_button: true,
      context: 'signin',
      callback: async (reponse) => {
        info(t('Connexion…', 'Signing in…'));
        const sb = await C.client();
        const { error } = await sb.auth.signInWithIdToken({ provider: 'google', token: reponse.credential, nonce });
        if (error) { erreur(t('La connexion n\'a pas abouti : ', 'Sign-in failed: ') + error.message); brancherGoogle(); return; }
        info('');
        rafraichir();
      },
    });
    const racine = document.documentElement;
    const sombre = racine.getAttribute('data-theme') === 'dark' || (racine.getAttribute('data-theme') !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
    const largeur = Math.max(200, Math.min(400, Math.round(place.parentElement.clientWidth)));
    place.innerHTML = '';
    google.accounts.id.renderButton(place, {
      type: 'standard', theme: sombre ? 'filled_black' : 'outline', size: 'large', text: 'continue_with',
      shape: 'pill', logo_alignment: 'left', width: largeur, locale: EN ? 'en' : 'fr',
    });
  }
  const date = (d) => (d ? new Date(d).toLocaleDateString(EN ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

  let etat = null;
  function afficher(html) { contenu.innerHTML = html; }
  function erreur(texte) {
    const p = $('message-compte');
    if (p) { p.textContent = texte; p.hidden = !texte; p.className = 'message-compte erreur'; }
  }
  function info(texte) {
    const p = $('message-compte');
    if (p) { p.textContent = texte; p.hidden = !texte; p.className = 'message-compte'; }
    messageSuivant = texte; // (gardé pour l'écran suivant, qui redessine la page)
  }
  let messageSuivant = '';
  const message = '<p id="message-compte" class="message-compte" hidden></p>';

  async function rafraichir() {
    try {
      etat = await C.etat();
    } catch (err) {
      afficher(`<section class="carte-compte"><h2>${t('Pas de connexion', 'No connection')}</h2><p>${t('Le serveur des comptes ne répond pas. Les jeux marchent toujours, sans compte.', 'The accounts server isn\'t answering. The games still work, without an account.')}</p></section>`);
      return;
    }
    // (après une connexion par Google, Meta ou LinkedIn, l'adresse contient un code : on la nettoie)
    if (/[?&](code|error)=/.test(location.search)) history.replaceState(null, '', location.pathname);
    if (!etat) return ecranConnexion();
    if (!etat.compte) return ecranCreation();
    return ecranCompte();
  }

  // ---------- Connexion ----------
  async function ecranConnexion() {
    let actifs = {};
    try {
      const r = await fetch('https://eimxxpcwxmvonkrldlfp.supabase.co/auth/v1/settings', { headers: { apikey: 'sb_publishable_erFM047aCSbWGnoaV4o2Xg_8LneJ2hy' } });
      actifs = (await r.json()).external || {};
    } catch (err) { /* hors ligne */ }
    const erreurRetour = new URLSearchParams(location.search).get('error_description');
    const integre = boutonGoogleIntegre();
    const boutons = FOURNISSEURS.filter(([id]) => actifs[id]).map(([id, nom, ico]) => {
      const bouton = `<button class="bouton-secondaire bouton-fournisseur" type="button" data-fournisseur="${id}">${ico}<span>${t('Continuer avec', 'Continue with')} ${nom}</span></button>`;
      return id === 'google' && integre ? `<div id="place-google" class="place-google">${bouton}</div>` : bouton;
    }).join('');
    afficher(`
      <section class="carte-compte intro-compte">
        <h2>${t('Un compte, si tu veux', 'An account, if you like')}</h2>
        <p>${t('Pom\'chess marche très bien sans compte. Un compte garde tes réglages et ta progression sur tous tes appareils, et permet de rejoindre la classe de ton enseignant.', 'Pom\'chess works perfectly well without an account. An account keeps your settings and progress on all your devices, and lets you join your teacher\'s class.')}</p>
        <p class="petit">${t('Un élève se connecte avec le compte ou l\'adresse e-mail d\'un de ses parents.', 'A pupil signs in with one of their parents\' account or e-mail address.')}</p>
      </section>
      <section class="carte-compte">
        <h2>${t('Se connecter', 'Sign in')}</h2>
        ${boutons ? `<div class="fournisseurs">${boutons}</div><p class="ou"><span>${t('ou avec une adresse e-mail', 'or with an e-mail address')}</span></p>` : ''}
        <form id="form-email" class="form-compte" autocomplete="on">
          <label>${t('Adresse e-mail', 'E-mail address')}<input id="email" type="email" required autocomplete="email" inputmode="email" placeholder="${t('nom@exemple.fr', 'name@example.com')}"></label>
          <button class="bouton-principal" type="submit">${t('Recevoir un code', 'Get a code')}</button>
        </form>
        <form id="form-code" class="form-compte" hidden>
          <p>${t('Nous venons d\'envoyer un e-mail : clique sur le lien qu\'il contient pour te connecter. S\'il contient un code, tu peux aussi le taper ici.', 'We\'ve just sent an e-mail: click the link in it to sign in. If it contains a code, you can also type it here.')}</p>
          <p class="petit">${t('Rien reçu ? Regarde dans les courriers indésirables.', 'Nothing received? Check your spam folder.')}</p>
          <label>${t('Code reçu (s\'il y en a un)', 'Code received (if any)')}<input id="code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,10}" maxlength="10" required></label>
          <button class="bouton-principal" type="submit">${t('Se connecter', 'Sign in')}</button>
          <button class="lien-bouton" type="button" id="btn-autre-email">${t('Changer d\'adresse', 'Use another address')}</button>
        </form>
        ${message}
        <p class="petit">${t('Nous gardons seulement ton prénom, ton nom et ton adresse e-mail, sans jamais les communiquer à personne.', 'We only keep your first name, surname and e-mail address, and never share them with anyone.')} <a href="${lienConfidentialite}">${t('Données personnelles', 'Personal data')}</a></p>
      </section>`);
    if (erreurRetour) erreur(t('La connexion n\'a pas abouti : ', 'Sign-in failed: ') + erreurRetour);
    contenu.querySelectorAll('[data-fournisseur]').forEach((b) => b.addEventListener('click', async () => {
      if (b.dataset.fournisseur === 'google' && googleNatif()) {
        b.disabled = true;
        try { if (await connexionGoogleNative()) return; } catch (err) { /* on passe au navigateur */ } finally { b.disabled = false; }
      }
      const sb = await C.client();
      const { error } = await sb.auth.signInWithOAuth({
        provider: b.dataset.fournisseur,
        options: { redirectTo: C.retourConnexion(), scopes: b.dataset.fournisseur === 'facebook' ? 'email' : undefined },
      });
      if (error) erreur(error.message);
    }));
    if (integre && actifs.google) brancherGoogle();
    let adresse = '';
    $('form-email').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      adresse = $('email').value.trim();
      const sb = await C.client();
      info(t('Envoi…', 'Sending…'));
      const { error } = await sb.auth.signInWithOtp({ email: adresse, options: { emailRedirectTo: C.retourConnexion(), shouldCreateUser: true } });
      if (error) { erreur(/rate|limit/i.test(error.message) ? t('Trop d\'e-mails envoyés : réessaie dans quelques minutes.', 'Too many e-mails sent: try again in a few minutes.') : error.message); return; }
      info('');
      $('form-email').hidden = true;
      $('form-code').hidden = false;
      $('code').focus();
    });
    $('form-code').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const sb = await C.client();
      const { error } = await sb.auth.verifyOtp({ email: adresse, token: $('code').value.trim(), type: 'email' });
      if (error) { erreur(t('Ce code ne marche pas (ou il a expiré).', 'This code doesn\'t work (or it has expired).')); return; }
      rafraichir();
    });
    $('btn-autre-email').addEventListener('click', () => { $('form-code').hidden = true; $('form-email').hidden = false; info(''); });
  }

  // ---------- Création du compte ----------
  function ecranCreation() {
    const m = etat.utilisateur.user_metadata || {};
    const complet = (m.full_name || m.name || '').trim();
    const prenom = m.given_name || (complet ? complet.split(' ')[0] : '');
    const nom = m.family_name || (complet ? complet.split(' ').slice(1).join(' ') : '');
    afficher(`
      <section class="carte-compte">
        <h2>${t('Bienvenue !', 'Welcome!')}</h2>
        <p>${t('Connecté avec', 'Signed in with')} <b>${e(etat.utilisateur.email)}</b>. ${t('Encore quelques informations pour créer ton compte :', 'A few more details to create your account:')}</p>
        <form id="form-creation" class="form-compte">
          <fieldset class="types-compte">
            <legend>${t('Type de compte', 'Account type')}</legend>
            ${Object.entries(TYPES).map(([id, [titre, texte]], i) => `
              <label class="type-compte"><input type="radio" name="type" value="${id}" ${i === 0 ? 'checked' : ''}>
                <span><b>${titre}</b><small>${texte}</small></span></label>`).join('')}
          </fieldset>
          <div class="deux-champs">
            <label><span class="etiquette-champ">${t('Prénom', 'First name')}</span><input id="prenom" required maxlength="60" autocomplete="given-name" value="${e(prenom)}"></label>
            <label><span class="etiquette-champ">${t('Nom', 'Surname')}</span><input id="nom" maxlength="60" autocomplete="family-name" value="${e(nom)}"></label>
          </div>
          <p class="petit seulement-eleve" hidden>${t('Pour un compte élève : ce sont le prénom et le nom du parent. Ceux des enfants viennent juste après.', 'For a pupil account: these are the parent\'s first name and surname. The children\'s come right after.')}</p>
          <label class="case-a-cocher"><input type="checkbox" id="accord" required> <span>${t('J\'ai lu', 'I have read')} <a href="${lienConfidentialite}" target="_blank" rel="noopener">${t('comment mes données sont utilisées', 'how my data is used')}</a> ${t('et j\'accepte qu\'elles soient gardées pour mon compte.', 'and I agree that it is kept for my account.')}</span></label>
          <label class="case-a-cocher seulement-eleve" hidden><input type="checkbox" id="parent"> <span>${t('Je suis le parent ou le responsable légal des enfants que j\'inscrirai.', 'I am the parent or legal guardian of the children I will register.')}</span></label>
          <button class="bouton-principal" type="submit">${t('Créer mon compte', 'Create my account')}</button>
          <button class="lien-bouton" type="button" id="btn-annuler">${t('Annuler et se déconnecter', 'Cancel and sign out')}</button>
        </form>
        ${message}
      </section>`);
    const majType = () => {
      const eleve = contenu.querySelector('input[name="type"]:checked').value === 'eleve';
      contenu.querySelectorAll('.seulement-eleve').forEach((x) => { x.hidden = !eleve; });
      $('parent').required = eleve;
    };
    contenu.querySelectorAll('input[name="type"]').forEach((r) => r.addEventListener('change', majType));
    $('btn-annuler').addEventListener('click', async () => { await C.deconnecter(); rafraichir(); });
    $('form-creation').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const sb = await C.client();
      const type = contenu.querySelector('input[name="type"]:checked').value;
      // (les réglages de ce navigateur deviennent ceux du compte ; pour un compte élève, ceux de chaque enfant)
      const reglages = type === 'eleve' ? {} : { ...C.reglagesLocaux(), _maj: Date.now() };
      const { error } = await sb.from('comptes').insert({ id: etat.utilisateur.id, type, prenom: $('prenom').value.trim(), nom: $('nom').value.trim(), reglages });
      if (error) { erreur(error.message); return; }
      rafraichir();
    });
  }

  // ---------- Le compte ----------
  async function progression(joueurs) {
    if (!joueurs.length) return [];
    const sb = await C.client();
    const { data } = await sb.from('progression').select('*').in('joueur', joueurs);
    return data || [];
  }
  function tableauProgression(lignes) {
    const total = lignes.reduce((s, l) => s + l.xp, 0);
    const parJeu = new Map(lignes.map((l) => [l.jeu, l]));
    const joues = C.JEUX.filter((j) => parJeu.has(j.id));
    return `<p class="xp-total"><b>${total}</b> XP</p>` + (joues.length
      ? `<ul class="liste-niveaux">${joues.map((j) => { const l = parJeu.get(j.id); return `<li><span>${e(j.nom)}</span><span class="niveau">${t('niveau', 'level')} ${C.niveau(l.xp)}</span><span class="xp">${l.xp} XP</span></li>`; }).join('')}</ul>`
      : `<p class="petit">${t('Pas encore de partie avec ce compte : à toi de jouer !', 'No games yet with this account: your turn to play!')}</p>`);
  }

  async function ecranCompte() {
    const c = etat.compte;
    const [titre] = TYPES[c.type];
    const lignes = await progression(c.type === 'eleve' ? etat.enfants.map((x) => x.id) : [c.id]);
    let corps = '';
    if (c.type === 'eleve') corps = sectionEnfants(lignes);
    else corps = `<section class="carte-compte"><h2>${t('Ma progression', 'My progress')}</h2>${tableauProgression(lignes)}</section>`;
    if (c.type === 'enseignant') {
      corps = `<section class="carte-compte carte-enseignant"><h2>${t('Mes classes', 'My classes')}</h2>
        <p>${t('Crée tes classes, ouvre les jeux au rythme de tes leçons et suis la progression de tes élèves.', 'Create your classes, open the games at the pace of your lessons and follow your pupils\' progress.')}</p>
        <a class="bouton-principal" href="${C.RACINE}${EN ? 'en/' : ''}enseignant/index.html">${t('Gérer mes classes', 'Manage my classes')}</a></section>` + corps;
    }
    afficher(`
      <section class="carte-compte tete-compte">
        <div><h2>${t(`Bonjour ${e(c.prenom)} !`, `Hello ${e(c.prenom)}!`)}</h2><p class="petit">${e(c.email || etat.utilisateur.email)}</p></div>
        <span class="badge-type badge-${c.type}">${titre}</span>
      </section>
      ${message}
      ${corps}
      <section class="carte-compte">
        <h2>${t('Mes informations', 'My details')}</h2>
        <form id="form-infos" class="form-compte">
          <div class="deux-champs">
            <label><span class="etiquette-champ">${t('Prénom', 'First name')}</span><input id="prenom" required maxlength="60" value="${e(c.prenom)}"></label>
            <label><span class="etiquette-champ">${t('Nom', 'Surname')}</span><input id="nom" maxlength="60" value="${e(c.nom)}"></label>
          </div>
          <p class="petit">${t('Type de compte :', 'Account type:')} <b>${titre}</b> · ${t('compte créé le', 'account created on')} ${date(c.cree_le)}</p>
          <button class="bouton-secondaire" type="submit">${t('Enregistrer', 'Save')}</button>
        </form>
      </section>
      <section class="carte-compte">
        <h2>${t('Mes données', 'My data')}</h2>
        <p class="petit">${t('Prénom, nom, adresse e-mail, et pour chaque enfant son prénom, son nom, sa classe et sa progression. Rien n\'est communiqué à personne.', 'First name, surname, e-mail address, and for each child their first name, surname, class and progress. Nothing is shared with anyone.')} <a href="${lienConfidentialite}">${t('En savoir plus', 'Learn more')}</a></p>
        <div class="actions-compte">
          <button class="bouton-secondaire" type="button" id="btn-telecharger">${t('Télécharger mes données', 'Download my data')}</button>
          <button class="bouton-secondaire" type="button" id="btn-deconnecter">${t('Se déconnecter', 'Sign out')}</button>
          <button class="bouton-secondaire danger" type="button" id="btn-supprimer">${t('Supprimer mon compte', 'Delete my account')}</button>
        </div>
      </section>`);
    brancherCompte(lignes);
    if (messageSuivant) { const m = messageSuivant; info(m); messageSuivant = ''; }
  }

  function sectionEnfants(lignes) {
    const xpDe = (id) => lignes.filter((l) => l.joueur === id).reduce((s, l) => s + l.xp, 0);
    const cartes = etat.enfants.map((x) => {
      const actif = etat.enfant && etat.enfant.id === x.id;
      return `<article class="enfant ${actif ? 'actif' : ''}" data-enfant="${x.id}">
        <div class="enfant-tete">
          <span class="avatar-enfant" aria-hidden="true">${e((x.prenom || '?')[0].toUpperCase())}</span>
          <div><b>${e(x.prenom)} ${e(x.nom)}</b><small>${x.classes ? t('Classe : ', 'Class: ') + e(x.classes.nom) : t('Pas encore de classe', 'No class yet')} · ${xpDe(x.id)} XP</small></div>
          ${actif ? `<span class="badge-actif">${t('Joue en ce moment', 'Playing now')}</span>` : `<button class="bouton-principal petit-bouton" type="button" data-action="jouer">${t('C\'est lui ou elle qui joue', 'This child is playing')}</button>`}
        </div>
        ${x.classe ? '' : `<form class="rejoindre" data-action="rejoindre"><input name="code" required maxlength="8" autocapitalize="characters" placeholder="${t('Code de la classe', 'Class code')}" aria-label="${t('Code de la classe (donné par l\'enseignant)', 'Class code (given by the teacher)')}"><button class="bouton-secondaire petit-bouton" type="submit">${t('Rejoindre', 'Join')}</button></form>`}
        <details class="details-enfant"><summary>${t('Progression et réglages du profil', 'Progress and profile settings')}</summary>
          ${tableauProgression(lignes.filter((l) => l.joueur === x.id))}
          <form class="form-compte" data-action="renommer">
            <div class="deux-champs">
              <label><span class="etiquette-champ">${t('Prénom', 'First name')}</span><input name="prenom" required maxlength="60" value="${e(x.prenom)}"></label>
              <label><span class="etiquette-champ">${t('Nom', 'Surname')}</span><input name="nom" maxlength="60" value="${e(x.nom)}"></label>
            </div>
            <div class="actions-compte">
              <button class="bouton-secondaire petit-bouton" type="submit">${t('Enregistrer', 'Save')}</button>
              ${x.classe ? `<button class="bouton-secondaire petit-bouton" type="button" data-action="quitter">${t('Quitter la classe', 'Leave the class')}</button>` : ''}
              <button class="bouton-secondaire petit-bouton danger" type="button" data-action="supprimer">${t('Supprimer ce profil', 'Delete this profile')}</button>
            </div>
          </form>
        </details>
      </article>`;
    }).join('');
    return `<section class="carte-compte">
      <h2>${t('Les enfants', 'The children')}</h2>
      <p class="petit">${t('Un profil par enfant. Choisis qui joue sur cet appareil : ses jeux, ses réglages et sa progression suivent.', 'One profile per child. Choose who is playing on this device: their games, settings and progress follow.')}</p>
      <div class="liste-enfants">${cartes || `<p class="petit">${t('Ajoute ton premier enfant ci-dessous.', 'Add your first child below.')}</p>`}</div>
      <form id="form-enfant" class="form-compte ajout-enfant">
        <h3>${t('Ajouter un enfant', 'Add a child')}</h3>
        <div class="deux-champs">
          <label><span class="etiquette-champ">${t('Prénom', 'First name')}</span><input id="enfant-prenom" required maxlength="60"></label>
          <label><span class="etiquette-champ">${t('Nom', 'Surname')}</span><input id="enfant-nom" maxlength="60"></label>
        </div>
        <label><span class="etiquette-champ">${t('Code de la classe (facultatif, donné par l\'enseignant)', 'Class code (optional, given by the teacher)')}</span><input id="enfant-code" maxlength="8" autocapitalize="characters"></label>
        <button class="bouton-principal" type="submit">${t('Ajouter', 'Add')}</button>
      </form>
    </section>`;
  }

  function brancherCompte() {
    const sbP = C.client();
    $('form-infos').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const sb = await sbP;
      const { error } = await sb.from('comptes').update({ prenom: $('prenom').value.trim(), nom: $('nom').value.trim() }).eq('id', etat.compte.id);
      if (error) erreur(error.message); else { info(t('Enregistré.', 'Saved.')); rafraichir(); }
    });
    $('btn-deconnecter').addEventListener('click', async () => { await C.deconnecter(); location.href = C.lienAccueil(); });
    $('btn-telecharger').addEventListener('click', telecharger);
    $('btn-supprimer').addEventListener('click', async () => {
      if (!confirm(t('Supprimer ton compte, et tout ce qu\'il contient (enfants, classes, progression) ? C\'est définitif.', 'Delete your account and everything in it (children, classes, progress)? This cannot be undone.'))) return;
      const sb = await sbP;
      const { error } = await sb.rpc('supprimer_mon_compte');
      if (error) { erreur(error.message); return; }
      await sb.auth.signOut();
      C.oublier();
      afficher(`<section class="carte-compte"><h2>${t('Compte supprimé', 'Account deleted')}</h2><p>${t('Toutes tes données ont été effacées. Les jeux marchent toujours, sans compte.', 'All your data has been erased. The games still work, without an account.')}</p><a class="bouton-principal" href="${C.lienAccueil()}">${t('Retour à l\'accueil', 'Back to home')}</a></section>`);
    });
    const form = $('form-enfant');
    if (form) form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const sb = await sbP;
      const { data, error } = await sb.from('enfants').insert({ parent: etat.compte.id, prenom: $('enfant-prenom').value.trim(), nom: $('enfant-nom').value.trim() }).select().single();
      if (error) { erreur(error.message); return; }
      const code = $('enfant-code').value.trim();
      if (code) await rejoindre(data.id, code);
      // le premier enfant joue tout de suite sur cet appareil
      if (!etat.enfants.length) await C.choisirEnfant(data.id);
      rafraichir();
    });
    contenu.querySelectorAll('.enfant').forEach((carte) => {
      const id = carte.dataset.enfant;
      carte.addEventListener('click', async (ev) => {
        const b = ev.target.closest('button[data-action]');
        if (!b) return;
        const sb = await sbP;
        if (b.dataset.action === 'jouer') { await C.choisirEnfant(id); info(t('C\'est noté : c\'est cet enfant qui joue sur cet appareil.', 'Got it: this child is playing on this device.')); rafraichir(); }
        if (b.dataset.action === 'quitter') { await sb.rpc('quitter_classe', { enfant: id }); rafraichir(); }
        if (b.dataset.action === 'supprimer') {
          if (!confirm(t('Supprimer ce profil et sa progression ?', 'Delete this profile and its progress?'))) return;
          await sb.from('enfants').delete().eq('id', id);
          rafraichir();
        }
      });
      carte.querySelector('[data-action="rejoindre"]')?.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        if (await rejoindre(id, ev.target.code.value)) rafraichir();
      });
      carte.querySelector('[data-action="renommer"]').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const sb = await sbP;
        const { error } = await sb.from('enfants').update({ prenom: ev.target.prenom.value.trim(), nom: ev.target.nom.value.trim() }).eq('id', id);
        if (error) erreur(error.message); else rafraichir();
      });
    });
  }
  async function rejoindre(enfant, code) {
    const sb = await C.client();
    const { data, error } = await sb.rpc('rejoindre_classe', { enfant, code_classe: code.trim() });
    if (error) { erreur(/inconnu/.test(error.message) ? t('Ce code de classe n\'existe pas. Vérifie-le auprès de l\'enseignant.', 'This class code doesn\'t exist. Check it with the teacher.') : error.message); return false; }
    info(t(`Bienvenue dans la classe « ${data} » !`, `Welcome to the class "${data}"!`));
    return true;
  }

  async function telecharger() {
    const sb = await C.client();
    const [comptes, enfants, classes, progressionLignes] = await Promise.all([
      sb.from('comptes').select('*'), sb.from('enfants').select('*'), sb.from('classes').select('*'),
      progression([etat.compte.id, ...etat.enfants.map((x) => x.id)]),
    ]);
    const donnees = { exporte_le: new Date().toISOString(), compte: comptes.data, enfants: enfants.data, classes: classes.data, progression: progressionLignes };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(donnees, null, 2)], { type: 'application/json' }));
    a.download = 'pomchess-mes-donnees.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  rafraichir();
  // (une connexion finie dans un autre onglet, ou par le lien de l'e-mail)
  C.client().then((sb) => sb.auth.onAuthStateChange((evt) => { if (evt === 'SIGNED_IN' && (!etat || !etat.utilisateur)) rafraichir(); })).catch(() => {});
})();
