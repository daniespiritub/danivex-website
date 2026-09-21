begin;

-- Role model kept separate from dv_profiles: identity/profile vs privileges.
-- The role is ALWAYS read server-side from this table; never trusted from the client.
create table public.dv_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user','admin','super_admin')),
  granted_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Every new account starts as 'user'. Companion to dv_create_profile (unchanged).
create function public.dv_create_role() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.dv_user_roles(user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
revoke all on function public.dv_create_role() from public, anon, authenticated;
create trigger dv_auth_user_role after insert on auth.users
for each row execute function public.dv_create_role();
insert into public.dv_user_roles(user_id) select id from auth.users on conflict do nothing;

-- Audit trail for sensitive admin actions. No client access at all (RLS + revoke);
-- only written/read through the SECURITY DEFINER admin functions below.
create table public.dv_admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor uuid references auth.users(id) on delete set null,
  action text not null,
  target uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}' check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

-- RLS: a user may read ONLY their own role row, gated on a live session. No client
-- write path exists (grants below omit insert/update/delete) => roles change only
-- through dv_admin_set_role. dv_admin_audit exposes nothing to clients.
do $$
declare t text;
begin
  foreach t in array array['dv_user_roles','dv_admin_audit'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end;
$$;
grant select on public.dv_user_roles to authenticated;
create policy own_role_read on public.dv_user_roles for select to authenticated
  using ((select auth.uid()) = user_id and (select public.dv_session_active()));

-- Current caller's effective role, read from the DB (defaults to 'user').
create function public.dv_current_role() returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((select role from public.dv_user_roles where user_id = (select auth.uid())), 'user');
$$;
revoke all on function public.dv_current_role() from public, anon;
grant execute on function public.dv_current_role() to authenticated;

-- Authorization guard: raises 42501 (permission denied) unless the caller has a live
-- session AND at least the required role. Reused by every admin function.
create function public.dv_require_role(min_role text) returns void
language plpgsql stable security definer set search_path = '' as $$
declare r text;
begin
  if not public.dv_session_active() then raise exception 'not_authenticated' using errcode = '42501'; end if;
  r := public.dv_current_role();
  if min_role = 'super_admin' and r <> 'super_admin' then raise exception 'forbidden' using errcode = '42501'; end if;
  if min_role = 'admin' and r not in ('admin','super_admin') then raise exception 'forbidden' using errcode = '42501'; end if;
end;
$$;
revoke all on function public.dv_require_role(text) from public, anon;
grant execute on function public.dv_require_role(text) to authenticated;

-- Aggregate platform metrics (admin+). Never returns any private user content.
create function public.dv_admin_metrics() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  perform public.dv_require_role('admin');
  select jsonb_build_object(
    'users_total', (select count(*) from auth.users),
    'users_new_7d', (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'users_active_7d', (select count(distinct user_id) from public.dv_activity where created_at > now() - interval '7 days'),
    'google_accounts', (select count(distinct user_id) from auth.identities where provider = 'google'),
    'email_accounts', (select count(distinct user_id) from auth.identities where provider = 'email'),
    'favorites', (select count(*) from public.dv_favorites),
    'saved', (select count(*) from public.dv_saved),
    'downloads', (select count(*) from public.dv_downloads),
    'admins', (select count(*) from public.dv_user_roles where role in ('admin','super_admin')),
    'super_admins', (select count(*) from public.dv_user_roles where role = 'super_admin')
  ) into result;
  return result;
end;
$$;
revoke all on function public.dv_admin_metrics() from public, anon;
grant execute on function public.dv_admin_metrics() to authenticated;

-- Operational user listing (admin+): identity + role metadata only, no private content.
create function public.dv_admin_users(search text default null, lim integer default 50, off integer default 0)
returns table(user_id uuid, email text, handle text, role text, providers text, created_at timestamptz, last_activity timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.dv_require_role('admin');
  return query
    select u.id, u.email::text, p.handle,
      coalesce(ur.role, 'user'),
      (select string_agg(distinct i.provider, ',' order by i.provider) from auth.identities i where i.user_id = u.id),
      u.created_at,
      (select max(a.created_at) from public.dv_activity a where a.user_id = u.id)
    from auth.users u
    left join public.dv_profiles p on p.user_id = u.id
    left join public.dv_user_roles ur on ur.user_id = u.id
    where search is null or search = ''
       or u.email ilike '%' || search || '%'
       or p.handle ilike '%' || search || '%'
    order by u.created_at desc
    limit least(coalesce(lim, 50), 100) offset greatest(coalesce(off, 0), 0);
end;
$$;
revoke all on function public.dv_admin_users(text, integer, integer) from public, anon;
grant execute on function public.dv_admin_users(text, integer, integer) to authenticated;

-- Change a user's role (super_admin only). Enforces: valid role, cannot demote/strip
-- the LAST super_admin, and writes an audit entry. Actor is the verified session uid.
create function public.dv_admin_set_role(target uuid, new_role text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid; current_target text; super_count integer;
begin
  perform public.dv_require_role('super_admin');
  if new_role not in ('user','admin','super_admin') then raise exception 'invalid_role' using errcode = '22023'; end if;
  actor := (select auth.uid());
  if target is null or not exists (select 1 from auth.users where id = target) then raise exception 'user_not_found' using errcode = 'P0002'; end if;
  insert into public.dv_user_roles(user_id, role, granted_by) values (target, 'user', actor) on conflict (user_id) do nothing;
  select coalesce(role, 'user') into current_target from public.dv_user_roles where user_id = target;
  if current_target = new_role then return jsonb_build_object('ok', true, 'target', target, 'role', new_role, 'unchanged', true); end if;
  -- Protect the platform from losing its last principal administrator.
  if current_target = 'super_admin' and new_role <> 'super_admin' then
    select count(*) into super_count from public.dv_user_roles where role = 'super_admin';
    if super_count <= 1 then raise exception 'last_super_admin' using errcode = '23514'; end if;
  end if;
  update public.dv_user_roles set role = new_role, granted_by = actor, updated_at = now() where user_id = target;
  insert into public.dv_admin_audit(actor, action, target, metadata)
    values (actor,
      case when new_role = 'user' then 'admin.role.demoted'
           when current_target = 'super_admin' then 'admin.role.demoted'
           else 'admin.role.promoted' end,
      target, jsonb_build_object('from', current_target, 'to', new_role));
  return jsonb_build_object('ok', true, 'target', target, 'role', new_role);
end;
$$;
revoke all on function public.dv_admin_set_role(uuid, text) from public, anon;
grant execute on function public.dv_admin_set_role(uuid, text) to authenticated;

-- Recent audit entries (admin+), with emails resolved for readability. No secrets.
create function public.dv_admin_audit_list(lim integer default 50)
returns table(id uuid, actor_email text, action text, target_email text, metadata jsonb, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.dv_require_role('admin');
  return query
    select a.id,
      (select u.email::text from auth.users u where u.id = a.actor),
      a.action,
      (select u.email::text from auth.users u where u.id = a.target),
      a.metadata, a.created_at
    from public.dv_admin_audit a
    order by a.created_at desc
    limit least(coalesce(lim, 50), 200);
end;
$$;
revoke all on function public.dv_admin_audit_list(integer) from public, anon;
grant execute on function public.dv_admin_audit_list(integer) to authenticated;

-- One-time controlled bootstrap of the first super_admin BY EMAIL. Not exposed to any
-- client role; invoked once from a privileged SQL session (see docs). Idempotent.
create function public.dv_bootstrap_super_admin(target_email text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid;
begin
  select id into uid from auth.users where email = target_email order by created_at asc limit 1;
  if uid is null then return jsonb_build_object('ok', false, 'error', 'user_not_found'); end if;
  insert into public.dv_user_roles(user_id, role) values (uid, 'super_admin')
    on conflict (user_id) do update set role = 'super_admin', updated_at = now();
  return jsonb_build_object('ok', true, 'user_id', uid, 'role', 'super_admin');
end;
$$;
revoke all on function public.dv_bootstrap_super_admin(text) from public, anon, authenticated;

commit;
