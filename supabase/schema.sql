-- =====================================================================================================================
-- Pom'chess : comptes, classes et progression (Supabase / PostgreSQL)
--
-- À coller tel quel dans Supabase : SQL Editor -> New query -> Run. On peut le relancer sans risque : il crée ce qui
-- manque et remplace les règles et les fonctions, sans effacer de données.
--
-- Trois types de comptes (table comptes, colonne type) :
--   - basique    : accès à tout le site ;
--   - eleve      : le compte d'un parent, qui porte un ou plusieurs profils d'enfants (table enfants) ; chaque enfant
--                  rejoint la classe de son enseignant avec un code et n'a accès qu'aux jeux ouverts par l'enseignant ;
--   - enseignant : crée des classes, ouvre les jeux pour la classe ou pour un élève, suit la progression.
-- Données personnelles gardées : prénom, nom et adresse e-mail du titulaire du compte ; prénom et nom de chaque enfant.
-- Les règles d'accès (Row Level Security) sont vérifiées par le serveur : chacun ne voit que ce qui le concerne.
-- =====================================================================================================================

-- ---------- Tables ----------
create table if not exists public.comptes (
  id         uuid primary key references auth.users (id) on delete cascade,
  type       text not null check (type in ('basique', 'eleve', 'enseignant')),
  prenom     text not null default '' check (char_length(prenom) <= 60),
  nom        text not null default '' check (char_length(nom) <= 60),
  email      text,
  reglages   jsonb not null default '{}'::jsonb,
  cree_le    timestamptz not null default now()
);

create table if not exists public.classes (
  id         uuid primary key default gen_random_uuid(),
  enseignant uuid not null references public.comptes (id) on delete cascade,
  nom        text not null check (char_length(nom) between 1 and 60),
  code       text not null unique,
  cree_le    timestamptz not null default now()
);

create table if not exists public.enfants (
  id                uuid primary key default gen_random_uuid(),
  parent            uuid not null references public.comptes (id) on delete cascade,
  prenom            text not null check (char_length(prenom) between 1 and 60),
  nom               text not null default '' check (char_length(nom) <= 60),
  classe            uuid references public.classes (id) on delete set null,
  reglages          jsonb not null default '{}'::jsonb,
  cree_le           timestamptz not null default now(),
  derniere_activite timestamptz
);

-- les jeux ouverts pour toute la classe
create table if not exists public.jeux_classe (
  classe uuid not null references public.classes (id) on delete cascade,
  jeu    text not null check (char_length(jeu) <= 30),
  primary key (classe, jeu)
);

-- les ajustements par élève : ouvert = true (ouvert pour lui en plus), false (fermé pour lui)
create table if not exists public.jeux_enfant (
  enfant uuid not null references public.enfants (id) on delete cascade,
  jeu    text not null check (char_length(jeu) <= 30),
  ouvert boolean not null,
  primary key (enfant, jeu)
);

-- la progression par jeu ; joueur = un compte (basique, enseignant) ou un enfant
create table if not exists public.progression (
  joueur    uuid not null,
  jeu       text not null check (char_length(jeu) <= 30),
  xp        integer not null default 0,
  reussites integer not null default 0,
  parties   integer not null default 0,
  etoiles   integer not null default 0,   -- meilleur résultat d'un défi (0 à 3)
  maj       timestamptz not null default now(),
  primary key (joueur, jeu)
);

create index if not exists enfants_parent on public.enfants (parent);
create index if not exists enfants_classe on public.enfants (classe);
create index if not exists classes_enseignant on public.classes (enseignant);

-- ---------- Automatismes ----------
-- l'adresse e-mail d'un compte est toujours celle de la connexion (on ne peut pas en mettre une autre)
create or replace function public.email_du_compte() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.email := coalesce(auth.jwt() ->> 'email', new.email);
  return new;
end $$;
drop trigger if exists comptes_email on public.comptes;
create trigger comptes_email before insert or update on public.comptes
  for each row execute function public.email_du_compte();

-- le code d'une classe : 6 caractères faciles à lire (pas de 0/O, 1/I/L)
create or replace function public.code_de_classe() returns trigger
language plpgsql set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  essai text;
begin
  loop
    essai := '';
    for i in 1..6 loop
      essai := essai || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.classes where code = essai);
  end loop;
  new.code := essai;
  return new;
end $$;
drop trigger if exists classes_code on public.classes;
create trigger classes_code before insert on public.classes
  for each row execute function public.code_de_classe();

-- la progression d'un compte ou d'un enfant supprimé part avec lui
create or replace function public.effacer_progression() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.progression where joueur = old.id;
  return old;
end $$;
drop trigger if exists comptes_progression on public.comptes;
create trigger comptes_progression after delete on public.comptes
  for each row execute function public.effacer_progression();
drop trigger if exists enfants_progression on public.enfants;
create trigger enfants_progression after delete on public.enfants
  for each row execute function public.effacer_progression();

-- ---------- Aides pour les règles d'accès (security definer : pas de boucle entre les règles) ----------
create or replace function public.est_enseignant() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from comptes where id = auth.uid() and type = 'enseignant')
$$;
create or replace function public.est_ma_classe(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from classes where id = c and enseignant = auth.uid())
$$;
create or replace function public.est_mon_enfant(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from enfants where id = e and parent = auth.uid())
$$;
create or replace function public.est_mon_eleve(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from enfants en join classes c on c.id = en.classe where en.id = e and c.enseignant = auth.uid())
$$;
create or replace function public.classe_de_mes_enfants(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from enfants where classe = c and parent = auth.uid())
$$;

-- ---------- Règles d'accès ----------
alter table public.comptes     enable row level security;
alter table public.classes     enable row level security;
alter table public.enfants     enable row level security;
alter table public.jeux_classe enable row level security;
alter table public.jeux_enfant enable row level security;
alter table public.progression enable row level security;

-- rien pour les visiteurs sans compte ; pour les comptes connectés, seulement ce qui sert (les projets Supabase récents
-- n'accordent plus rien par défaut), et les règles ci-dessous choisissent les lignes
revoke all on public.comptes, public.classes, public.enfants, public.jeux_classe, public.jeux_enfant, public.progression from anon;
grant select, insert on public.comptes to authenticated;
grant select, insert, delete on public.classes to authenticated;
grant select, delete on public.enfants to authenticated;
grant select, insert, delete on public.jeux_classe to authenticated;
grant select, insert, update, delete on public.jeux_enfant to authenticated;
grant select on public.progression to authenticated;

-- comptes : chacun le sien
drop policy if exists comptes_lire on public.comptes;
drop policy if exists comptes_creer on public.comptes;
drop policy if exists comptes_modifier on public.comptes;
create policy comptes_lire on public.comptes for select to authenticated using (id = auth.uid());
create policy comptes_creer on public.comptes for insert to authenticated with check (id = auth.uid());
create policy comptes_modifier on public.comptes for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.comptes from authenticated;
grant update (type, prenom, nom, reglages) on public.comptes to authenticated;

-- classes : l'enseignant gère les siennes ; un parent voit celles de ses enfants
drop policy if exists classes_enseignant on public.classes;
drop policy if exists classes_parent on public.classes;
create policy classes_enseignant on public.classes for all to authenticated
  using (enseignant = auth.uid()) with check (enseignant = auth.uid() and public.est_enseignant());
create policy classes_parent on public.classes for select to authenticated using (public.classe_de_mes_enfants(id));
revoke update on public.classes from authenticated;
grant update (nom) on public.classes to authenticated;

-- enfants : le parent gère les siens (sauf la classe : voir rejoindre_classe) ; l'enseignant voit ses élèves
drop policy if exists enfants_parent on public.enfants;
drop policy if exists enfants_enseignant on public.enfants;
create policy enfants_parent on public.enfants for all to authenticated
  using (parent = auth.uid()) with check (parent = auth.uid());
create policy enfants_enseignant on public.enfants for select to authenticated using (public.est_ma_classe(classe));
revoke insert, update on public.enfants from authenticated;
grant insert (parent, prenom, nom, reglages) on public.enfants to authenticated;
grant update (prenom, nom, reglages) on public.enfants to authenticated;

-- jeux de la classe : l'enseignant les choisit ; les parents des élèves les lisent
drop policy if exists jeux_classe_enseignant on public.jeux_classe;
drop policy if exists jeux_classe_parent on public.jeux_classe;
create policy jeux_classe_enseignant on public.jeux_classe for all to authenticated
  using (public.est_ma_classe(classe)) with check (public.est_ma_classe(classe));
create policy jeux_classe_parent on public.jeux_classe for select to authenticated using (public.classe_de_mes_enfants(classe));

-- ajustements par élève : l'enseignant les choisit ; le parent les lit
drop policy if exists jeux_enfant_enseignant on public.jeux_enfant;
drop policy if exists jeux_enfant_parent on public.jeux_enfant;
create policy jeux_enfant_enseignant on public.jeux_enfant for all to authenticated
  using (public.est_mon_eleve(enfant)) with check (public.est_mon_eleve(enfant));
create policy jeux_enfant_parent on public.jeux_enfant for select to authenticated using (public.est_mon_enfant(enfant));

-- progression : la sienne et celle de ses enfants ; l'enseignant lit celle de ses élèves (écriture : noter())
drop policy if exists progression_lire on public.progression;
create policy progression_lire on public.progression for select to authenticated
  using (joueur = auth.uid() or public.est_mon_enfant(joueur) or public.est_mon_eleve(joueur));
revoke insert, update, delete on public.progression from authenticated;

-- ---------- Fonctions appelées par le site ----------
-- un enfant rejoint une classe avec son code (rend le nom de la classe, ou une erreur)
create or replace function public.rejoindre_classe(enfant uuid, code_classe text) returns text
language plpgsql security definer set search_path = public as $$
declare c record;
begin
  if not public.est_mon_enfant(enfant) then raise exception 'pas votre enfant'; end if;
  select id, nom into c from classes where code = upper(trim(code_classe));
  if c.id is null then raise exception 'code inconnu'; end if;
  update enfants set classe = c.id where id = enfant;
  return c.nom;
end $$;

-- un enfant quitte sa classe (parent), ou l'enseignant retire un élève
create or replace function public.quitter_classe(enfant uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.est_mon_enfant(enfant) or public.est_mon_eleve(enfant)) then raise exception 'interdit'; end if;
  delete from jeux_enfant where jeux_enfant.enfant = quitter_classe.enfant;
  update enfants set classe = null where id = enfant;
end $$;

-- « je joue » : la dernière activité d'un enfant (le statut « en ligne » de la page enseignant)
create or replace function public.je_joue(enfant uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.est_mon_enfant(enfant) then update enfants set derniere_activite = now() where id = enfant; end if;
end $$;

-- ajoute à la progression d'un joueur (le compte connecté ou un de ses enfants), dans des limites raisonnables
create or replace function public.noter(joueur uuid, jeu text, xp integer, reussites integer, parties integer, etoiles integer)
returns void
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not (noter.joueur = auth.uid() or public.est_mon_enfant(noter.joueur)) then raise exception 'interdit'; end if;
  insert into progression as p (joueur, jeu, xp, reussites, parties, etoiles)
  values (noter.joueur, noter.jeu, least(greatest(noter.xp, 0), 200), least(greatest(noter.reussites, 0), 50),
          least(greatest(noter.parties, 0), 10), least(greatest(noter.etoiles, 0), 3))
  on conflict (joueur, jeu) do update set
    xp = p.xp + excluded.xp,
    reussites = p.reussites + excluded.reussites,
    parties = p.parties + excluded.parties,
    etoiles = greatest(p.etoiles, excluded.etoiles),
    maj = now();
  if noter.joueur <> auth.uid() then update enfants set derniere_activite = now() where id = noter.joueur; end if;
end $$;

-- supprimer son compte : tout part (enfants, classes, progression), puis l'utilisateur de connexion lui-même
create or replace function public.supprimer_mon_compte() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  delete from public.progression where joueur in (select id from public.enfants where parent = auth.uid());
  delete from public.comptes where id = auth.uid();
  delete from auth.users where id = auth.uid();
end $$;

revoke execute on function public.rejoindre_classe(uuid, text), public.quitter_classe(uuid), public.je_joue(uuid),
  public.noter(uuid, text, integer, integer, integer, integer), public.supprimer_mon_compte() from public, anon;
grant execute on function public.rejoindre_classe(uuid, text), public.quitter_classe(uuid), public.je_joue(uuid),
  public.noter(uuid, text, integer, integer, integer, integer), public.supprimer_mon_compte() to authenticated;
