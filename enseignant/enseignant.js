/* Mes classes (comptes enseignant) : les classes, leurs élèves (compte créé, dernière activité, en ligne), les jeux
   ouverts pour la classe et les ajustements par élève, la progression de chaque élève (XP, niveau par jeu).
   Les règles d'accès de la base (supabase/schema.sql) ne laissent voir que ses propres classes et leurs élèves. */
(function () {
  const C = window.Compte;
  const { t, EN } = C;
  const $ = (id) => document.getElementById(id);
  const contenu = $('contenu');
  const e = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const EN_LIGNE = 2 * 60 * 1000; // une activité il y a moins de 2 minutes : en ligne
  let sb = null, etat = null, classes = [], donnees = null, minuterie = 0;

  const dateCourte = (d) => (d ? new Date(d).toLocaleDateString(EN ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
  function ilYA(d) {
    if (!d) return t('jamais', 'never');
    const s = (Date.now() - new Date(d).getTime()) / 1000;
    if (s < 90) return t('à l\'instant', 'just now');
    if (s < 3600) return t(`il y a ${Math.round(s / 60)} min`, `${Math.round(s / 60)} min ago`);
    if (s < 86400) return t(`il y a ${Math.round(s / 3600)} h`, `${Math.round(s / 3600)} h ago`);
    if (s < 7 * 86400) return t(`il y a ${Math.round(s / 86400)} j`, `${Math.round(s / 86400)} days ago`);
    return dateCourte(d);
  }
  const enLigne = (d) => !!d && Date.now() - new Date(d).getTime() < EN_LIGNE;
  const params = () => new URLSearchParams(location.hash.slice(1));
  const message = '<p id="message-compte" class="message-compte" hidden></p>';
  function erreur(texte) { const p = $('message-compte'); if (p) { p.textContent = texte; p.hidden = !texte; p.className = 'message-compte erreur'; } }

  async function demarrer() {
    try {
      sb = await C.client();
      etat = await C.etat();
    } catch (err) {
      contenu.innerHTML = `<section class="carte-compte"><h2>${t('Pas de connexion', 'No connection')}</h2><p>${t('Le serveur des comptes ne répond pas.', 'The accounts server isn\'t answering.')}</p></section>`;
      return;
    }
    if (!etat || !etat.compte || etat.compte.type !== 'enseignant') {
      contenu.innerHTML = `<section class="carte-compte"><h2>${t('Réservé aux enseignants', 'For teachers only')}</h2>
        <p>${t('Cette page sert à gérer des classes : elle demande un compte enseignant.', 'This page is for managing classes: it needs a teacher account.')}</p>
        <a class="bouton-principal" href="${C.lienCompte()}">${etat ? t('Mon compte', 'My account') : t('Se connecter', 'Sign in')}</a></section>`;
      return;
    }
    window.addEventListener('hashchange', route);
    route();
  }

  async function chargerClasses() {
    const { data, error } = await sb.from('classes').select('*, enfants(count)').order('cree_le');
    if (error) throw error;
    classes = data || [];
  }

  async function route() {
    clearInterval(minuterie);
    const id = params().get('c');
    try {
      await chargerClasses();
      if (id && classes.some((c) => c.id === id)) await vueClasse(id);
      else vueListe();
    } catch (err) {
      contenu.innerHTML = `<section class="carte-compte">${message}</section>`;
      erreur(err.message);
    }
  }

  // ---------- Les classes ----------
  function vueListe() {
    $('titre').textContent = t('Mes classes', 'My classes');
    contenu.innerHTML = `
      ${message}
      <section class="carte-compte">
        <h2>${t('Mes classes', 'My classes')}</h2>
        ${classes.length ? `<div class="liste-classes">${classes.map((c) => `
          <a class="classe-carte" href="#c=${c.id}">
            <b>${e(c.nom)}</b>
            <span>${(c.enfants[0] || {}).count || 0} ${t('élève(s)', 'pupil(s)')}</span>
            <span class="code-classe" title="${t('Code à donner aux parents', 'Code to give to parents')}">${e(c.code)}</span>
          </a>`).join('')}</div>` : `<p class="petit">${t('Pas encore de classe : crée la première ci-dessous.', 'No class yet: create the first one below.')}</p>`}
        <form id="form-classe" class="form-compte ajout-classe">
          <label><span class="etiquette-champ">${t('Nouvelle classe', 'New class')}</span><input id="nom-classe" required maxlength="60" placeholder="${t('Par exemple : CM1 B, club du mercredi…', 'For example: Year 5 B, Wednesday club…')}"></label>
          <button class="bouton-principal" type="submit">${t('Créer la classe', 'Create the class')}</button>
        </form>
      </section>
      <section class="carte-compte carte-construction">
        <h2>${t('Fiches pédagogiques', 'Teaching sheets')} <span class="badge-construction">${t('En construction', 'Under construction')}</span></h2>
        <p>${t('Bientôt ici : des fiches pour préparer des leçons d\'échecs autour de chaque mini-jeu (objectifs, déroulé, exercices à imprimer).', 'Coming soon: sheets to prepare chess lessons around each mini-game (objectives, lesson plan, printable exercises).')}</p>
      </section>`;
    $('form-classe').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const { data, error } = await sb.from('classes').insert({ enseignant: etat.compte.id, nom: $('nom-classe').value.trim() }).select().single();
      if (error) { erreur(error.message); return; }
      location.hash = `c=${data.id}`;
    });
  }

  // ---------- Une classe ----------
  async function chargerClasse(id) {
    const [enfants, jeuxClasse] = await Promise.all([
      sb.from('enfants').select('id, prenom, nom, cree_le, derniere_activite').eq('classe', id).order('prenom'),
      sb.from('jeux_classe').select('jeu').eq('classe', id),
    ]);
    if (enfants.error) throw enfants.error;
    const ids = (enfants.data || []).map((x) => x.id);
    const [perso, prog] = ids.length ? await Promise.all([
      sb.from('jeux_enfant').select('*').in('enfant', ids),
      sb.from('progression').select('*').in('joueur', ids),
    ]) : [{ data: [] }, { data: [] }];
    return {
      classe: classes.find((c) => c.id === id),
      enfants: enfants.data || [],
      jeuxClasse: new Set((jeuxClasse.data || []).map((r) => r.jeu)),
      perso: perso.data || [],
      progression: prog.data || [],
    };
  }
  // les jeux ouverts pour un élève : ceux de la classe, plus ses ajustements
  function ouverts(d, enfant) {
    const s = new Set(d.jeuxClasse);
    for (const r of d.perso.filter((p) => p.enfant === enfant)) { if (r.ouvert) s.add(r.jeu); else s.delete(r.jeu); }
    return s;
  }
  const xpDe = (d, enfant) => d.progression.filter((p) => p.joueur === enfant).reduce((s, p) => s + p.xp, 0);

  async function vueClasse(id) {
    donnees = await chargerClasse(id);
    const d = donnees;
    $('titre').textContent = d.classe.nom;
    const eleve = params().get('e');
    contenu.innerHTML = `
      <a class="lien-retour" href="#">← ${t('Toutes mes classes', 'All my classes')}</a>
      ${message}
      <section class="carte-compte tete-classe">
        <div>
          <h2>${e(d.classe.nom)}</h2>
          <p class="petit">${t('Pour rejoindre la classe, les parents créent un compte « Élève » sur Pom\'chess, ajoutent leur enfant, puis tapent ce code :', 'To join the class, parents create a "Pupil" account on Pom\'chess, add their child, then type this code:')}</p>
        </div>
        <div class="code-grand"><span id="code">${e(d.classe.code)}</span><button class="bouton-secondaire petit-bouton" type="button" id="btn-copier">${t('Copier', 'Copy')}</button></div>
      </section>

      <section class="carte-compte">
        <h2>${t('Élèves', 'Pupils')} <span class="compte-eleves">${d.enfants.length}</span></h2>
        ${d.enfants.length ? `<div class="tableau-defile"><table class="tableau-eleves">
          <thead><tr><th>${t('Élève', 'Pupil')}</th><th>${t('Compte créé', 'Account created')}</th><th>${t('Dernière activité', 'Last activity')}</th><th>${t('Statut', 'Status')}</th><th>XP</th><th>${t('Jeux', 'Games')}</th></tr></thead>
          <tbody>${d.enfants.map((x) => `
            <tr data-enfant="${x.id}" class="${eleve === x.id ? 'choisi' : ''}" tabindex="0">
              <td><b>${e(x.prenom)} ${e(x.nom)}</b></td>
              <td>${dateCourte(x.cree_le)}</td>
              <td>${ilYA(x.derniere_activite)}</td>
              <td>${enLigne(x.derniere_activite) ? `<span class="statut en-ligne">● ${t('En ligne', 'Online')}</span>` : `<span class="statut">${t('Hors ligne', 'Offline')}</span>`}</td>
              <td>${xpDe(d, x.id)}</td>
              <td>${ouverts(d, x.id).size} / ${C.JEUX.length}</td>
            </tr>`).join('')}</tbody></table></div>`
          : `<p class="petit">${t('Aucun élève pour l\'instant. Donne le code de la classe aux parents.', 'No pupils yet. Give the class code to the parents.')}</p>`}
      </section>

      <div id="fiche-eleve"></div>

      <section class="carte-compte">
        <h2>${t('Jeux ouverts pour la classe', 'Games open for the class')}</h2>
        <p class="petit">${t('Ouvre les jeux au rythme de tes leçons. Pour un élève en particulier, clique sur son nom.', 'Open the games at the pace of your lessons. For one pupil in particular, click their name.')}</p>
        <div class="grille-acces">${C.JEUX.map((j) => `
          <button type="button" class="acces-jeu" data-jeu="${j.id}" role="switch" aria-checked="${d.jeuxClasse.has(j.id)}">
            <span>${e(j.nom)}</span><span class="interrupteur" aria-hidden="true"></span>
          </button>`).join('')}</div>
      </section>

      <section class="carte-compte">
        <h2>${t('La classe', 'The class')}</h2>
        <form id="form-renommer" class="form-compte ligne-form">
          <label><span class="etiquette-champ">${t('Nom de la classe', 'Class name')}</span><input id="nom-classe" required maxlength="60" value="${e(d.classe.nom)}"></label>
          <button class="bouton-secondaire" type="submit">${t('Renommer', 'Rename')}</button>
        </form>
        <button class="bouton-secondaire danger" type="button" id="btn-supprimer-classe">${t('Supprimer la classe', 'Delete the class')}</button>
      </section>`;

    $('btn-copier').addEventListener('click', () => { navigator.clipboard?.writeText(d.classe.code); $('btn-copier').textContent = t('Copié !', 'Copied!'); });
    contenu.querySelectorAll('tr[data-enfant]').forEach((tr) => {
      const ouvrir = () => { const p = params(); p.set('e', tr.dataset.enfant); history.replaceState(null, '', '#' + p.toString()); ficheEleve(tr.dataset.enfant); contenu.querySelectorAll('tr.choisi').forEach((x) => x.classList.remove('choisi')); tr.classList.add('choisi'); };
      tr.addEventListener('click', ouvrir);
      tr.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ouvrir(); } });
    });
    contenu.querySelectorAll('.acces-jeu').forEach((b) => b.addEventListener('click', async () => {
      const ouvrir = b.getAttribute('aria-checked') !== 'true';
      b.setAttribute('aria-checked', String(ouvrir));
      const r = ouvrir
        ? await sb.from('jeux_classe').insert({ classe: id, jeu: b.dataset.jeu })
        : await sb.from('jeux_classe').delete().eq('classe', id).eq('jeu', b.dataset.jeu);
      if (r.error) { erreur(r.error.message); b.setAttribute('aria-checked', String(!ouvrir)); return; }
      if (ouvrir) d.jeuxClasse.add(b.dataset.jeu); else d.jeuxClasse.delete(b.dataset.jeu);
      majColonneJeux();
      if (params().get('e')) ficheEleve(params().get('e'));
    }));
    $('form-renommer').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const { error } = await sb.from('classes').update({ nom: $('nom-classe').value.trim() }).eq('id', id);
      if (error) erreur(error.message); else route();
    });
    $('btn-supprimer-classe').addEventListener('click', async () => {
      if (!confirm(t('Supprimer cette classe ? Les élèves la quittent (leurs comptes et leur progression restent).', 'Delete this class? The pupils leave it (their accounts and progress remain).'))) return;
      const { error } = await sb.from('classes').delete().eq('id', id);
      if (error) erreur(error.message); else location.hash = '';
    });
    if (eleve && d.enfants.some((x) => x.id === eleve)) ficheEleve(eleve);
    // les statuts (en ligne, dernière activité) se mettent à jour tout seuls
    minuterie = setInterval(async () => {
      if (document.hidden) return;
      const { data } = await sb.from('enfants').select('id, derniere_activite').eq('classe', id);
      for (const r of data || []) {
        const x = d.enfants.find((y) => y.id === r.id);
        if (!x) continue;
        x.derniere_activite = r.derniere_activite;
        const tr = contenu.querySelector(`tr[data-enfant="${r.id}"]`);
        if (!tr) continue;
        tr.children[2].textContent = ilYA(r.derniere_activite);
        tr.children[3].innerHTML = enLigne(r.derniere_activite) ? `<span class="statut en-ligne">● ${t('En ligne', 'Online')}</span>` : `<span class="statut">${t('Hors ligne', 'Offline')}</span>`;
      }
    }, 30000);
  }
  function majColonneJeux() {
    contenu.querySelectorAll('tr[data-enfant]').forEach((tr) => { tr.children[5].textContent = `${ouverts(donnees, tr.dataset.enfant).size} / ${C.JEUX.length}`; });
  }

  // ---------- Un élève ----------
  function ficheEleve(id) {
    const d = donnees;
    const x = d.enfants.find((y) => y.id === id);
    if (!x) return;
    const prog = new Map(d.progression.filter((p) => p.joueur === id).map((p) => [p.jeu, p]));
    const ajust = new Map(d.perso.filter((p) => p.enfant === id).map((p) => [p.jeu, p.ouvert]));
    const total = xpDe(d, id);
    $('fiche-eleve').innerHTML = `
      <section class="carte-compte fiche-eleve">
        <div class="fiche-tete">
          <h2>${e(x.prenom)} ${e(x.nom)}</h2>
          <button class="bouton-icone" type="button" id="btn-fermer-fiche" aria-label="${t('Fermer', 'Close')}" title="${t('Fermer', 'Close')}"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
        </div>
        <p class="xp-total"><b>${total}</b> XP ${t('au total', 'in total')}</p>
        <div class="tableau-defile"><table class="tableau-jeux-eleve">
          <thead><tr><th>${t('Jeu', 'Game')}</th><th>${t('Niveau', 'Level')}</th><th>XP</th><th>${t('Accès', 'Access')}</th></tr></thead>
          <tbody>${C.JEUX.map((j) => {
            const p = prog.get(j.id);
            const classe = d.jeuxClasse.has(j.id);
            const a = ajust.has(j.id) ? (ajust.get(j.id) ? 'ouvert' : 'ferme') : 'classe';
            return `<tr><td>${e(j.nom)}</td><td>${p ? C.niveau(p.xp) : '—'}</td><td>${p ? p.xp : 0}</td>
              <td><select data-jeu="${j.id}" aria-label="${t('Accès à', 'Access to')} ${e(j.nom)}">
                <option value="classe" ${a === 'classe' ? 'selected' : ''}>${classe ? t('Ouvert (classe)', 'Open (class)') : t('Fermé (classe)', 'Closed (class)')}</option>
                <option value="ouvert" ${a === 'ouvert' ? 'selected' : ''}>${t('Ouvert pour cet élève', 'Open for this pupil')}</option>
                <option value="ferme" ${a === 'ferme' ? 'selected' : ''}>${t('Fermé pour cet élève', 'Closed for this pupil')}</option>
              </select></td></tr>`;
          }).join('')}</tbody></table></div>
        <button class="bouton-secondaire danger petit-bouton" type="button" id="btn-retirer">${t('Retirer de la classe', 'Remove from the class')}</button>
      </section>`;
    $('btn-fermer-fiche').addEventListener('click', () => { $('fiche-eleve').innerHTML = ''; const p = params(); p.delete('e'); history.replaceState(null, '', '#' + p.toString()); contenu.querySelectorAll('tr.choisi').forEach((y) => y.classList.remove('choisi')); });
    $('fiche-eleve').querySelectorAll('select[data-jeu]').forEach((s) => s.addEventListener('change', async () => {
      const jeu = s.dataset.jeu;
      const r = s.value === 'classe'
        ? await sb.from('jeux_enfant').delete().eq('enfant', id).eq('jeu', jeu)
        : await sb.from('jeux_enfant').upsert({ enfant: id, jeu, ouvert: s.value === 'ouvert' });
      if (r.error) { erreur(r.error.message); return; }
      d.perso = d.perso.filter((p) => !(p.enfant === id && p.jeu === jeu));
      if (s.value !== 'classe') d.perso.push({ enfant: id, jeu, ouvert: s.value === 'ouvert' });
      majColonneJeux();
    }));
    $('btn-retirer').addEventListener('click', async () => {
      if (!confirm(t(`Retirer ${x.prenom} de la classe ?`, `Remove ${x.prenom} from the class?`))) return;
      const { error } = await sb.rpc('quitter_classe', { enfant: id });
      if (error) erreur(error.message); else { const p = params(); p.delete('e'); location.hash = p.toString(); route(); }
    });
    $('fiche-eleve').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  demarrer();
})();
