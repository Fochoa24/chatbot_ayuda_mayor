-- ==============================================================
-- Guía Mayor v2 — esquema de base de datos (Supabase / Postgres)
-- Ejecutar completo en: Supabase > SQL Editor
--
-- Modelo de acceso:
--  * La persona mayor entra de forma ANÓNIMA (Supabase anonymous sign-in).
--    No necesita cuenta, correo ni contraseña.
--  * El familiar entra con Google y genera un código de invitación.
--  * La persona mayor canjea el código y queda vinculada al familiar.
--  * Ningún cliente puede cambiar su propio rol ni sus vínculos: solo
--    funciones SECURITY DEFINER muy acotadas (ver más abajo).
-- ==============================================================

-- ---------- Tablas ----------

create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null default 'elder' check (role in ('elder', 'family')),
  display_name text not null default '',
  consent_at   timestamptz,               -- registro del consentimiento de datos
  created_at   timestamptz not null default now()
);

create table if not exists links (
  elder_id   uuid not null references profiles(id) on delete cascade,
  family_id  uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (elder_id, family_id)
);

create table if not exists invites (
  code       text primary key,
  family_id  uuid not null references profiles(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days')
);

create table if not exists procedure_runs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  procedure_id   text not null,
  institution_id text,
  total_steps    int  not null check (total_steps > 0),
  current_step   int  not null default 1,
  status         text not null default 'in_progress' check (status in ('in_progress', 'done')),
  started_at     timestamptz not null default now(),
  finished_at    timestamptz
);

create table if not exists help_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  run_id     uuid references procedure_runs(id) on delete cascade,
  step       int  not null,
  status     text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists idx_links_family on links(family_id);
create index if not exists idx_runs_user on procedure_runs(user_id);
create index if not exists idx_help_user_status on help_requests(user_id, status);

-- ---------- Perfil automático al crear usuario ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Funciones controladas (únicas vías para cambios sensibles) ----------

-- Convierte la cuenta Google en familiar. Las cuentas anónimas no pueden.
create or replace function public.become_family()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  is_anon boolean;
begin
  select u.is_anonymous into is_anon from auth.users u where u.id = auth.uid();
  if is_anon is null then
    raise exception 'Debes iniciar sesión primero';
  end if;
  if is_anon then
    raise exception 'Para ser familiar necesitas entrar con Google';
  end if;
  update profiles set role = 'family' where id = auth.uid();
end;
$$;

-- El familiar genera un código de invitación de 10 caracteres aleatorios (vence en 7 días).
create or replace function public.create_invite()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'family') then
    raise exception 'Solo familiares pueden crear invitaciones';
  end if;

  delete from invites where family_id = auth.uid();
  new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into invites (code, family_id) values (new_code, auth.uid());
  return new_code;
end;
$$;

-- La persona mayor canjea un código y queda vinculada a ese familiar.
create or replace function public.redeem_invite(p_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  fam_id uuid;
  fam_name text;
begin
  if auth.uid() is null then
    raise exception 'Sesión no iniciada';
  end if;

  select i.family_id into fam_id
  from invites i
  where i.code = upper(trim(p_code)) and i.expires_at > now();

  if fam_id is null then
    raise exception 'El código no es válido o ya venció';
  end if;
  if fam_id = auth.uid() then
    raise exception 'No puedes vincularte contigo mismo';
  end if;

  insert into links (elder_id, family_id)
  values (auth.uid(), fam_id)
  on conflict do nothing;

  select p.display_name into fam_name from profiles p where p.id = fam_id;
  return coalesce(nullif(fam_name, ''), 'tu familiar');
end;
$$;

revoke execute on function public.become_family()        from public, anon;
revoke execute on function public.create_invite()        from public, anon;
revoke execute on function public.redeem_invite(text)    from public, anon;
grant  execute on function public.become_family()        to authenticated;
grant  execute on function public.create_invite()        to authenticated;
grant  execute on function public.redeem_invite(text)    to authenticated;

-- ---------- Row Level Security ----------

alter table profiles       enable row level security;
alter table links          enable row level security;
alter table invites        enable row level security;
alter table procedure_runs enable row level security;
alter table help_requests  enable row level security;

-- Los clientes NO pueden cambiar role ni created_at; solo nombre y consentimiento.
revoke update on profiles from authenticated;
grant  update (display_name, consent_at) on profiles to authenticated;

-- profiles: cada uno ve y edita lo suyo; el familiar ve a sus personas vinculadas.
create policy "profiles_select" on profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (select 1 from links l where l.elder_id = profiles.id and l.family_id = auth.uid())
  );

create policy "profiles_update_own" on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- links: solo lectura para las dos partes. Se crean únicamente con redeem_invite().
create policy "links_select" on links for select to authenticated
  using (elder_id = auth.uid() or family_id = auth.uid());

-- invites: el familiar ve sus códigos. Se crean solo con create_invite().
create policy "invites_select" on invites for select to authenticated
  using (family_id = auth.uid());

-- procedure_runs: la persona mayor gestiona sus trámites; el familiar vinculado los lee.
create policy "runs_owner_all" on procedure_runs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "runs_linked_family_select" on procedure_runs for select to authenticated
  using (exists (select 1 from links l where l.elder_id = procedure_runs.user_id and l.family_id = auth.uid()));

-- help_requests: la persona mayor crea pedidos; el familiar vinculado los ve y los marca atendidos.
create policy "help_owner_insert" on help_requests for insert to authenticated
  with check (user_id = auth.uid());

create policy "help_owner_select" on help_requests for select to authenticated
  using (user_id = auth.uid());

create policy "help_linked_family_select" on help_requests for select to authenticated
  using (exists (select 1 from links l where l.elder_id = help_requests.user_id and l.family_id = auth.uid()));

create policy "help_linked_family_update" on help_requests for update to authenticated
  using (exists (select 1 from links l where l.elder_id = help_requests.user_id and l.family_id = auth.uid()))
  with check (exists (select 1 from links l where l.elder_id = help_requests.user_id and l.family_id = auth.uid()));

-- El familiar solo puede cambiar el estado del pedido.
revoke update on help_requests from authenticated;
grant  update (status) on help_requests to authenticated;

-- ---------- Nota ----------
-- Activar en Supabase > Authentication > Providers > "Anonymous Sign-Ins" (necesario para la persona mayor).
-- Activar Google en Authentication > Providers > Google (solo para familiares).
