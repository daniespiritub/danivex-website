begin;

create table public.dv_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text check (handle ~ '^[A-Za-z0-9_]{3,16}$'),
  handle_normalized text generated always as (lower(handle)) stored unique,
  language text not null default 'es' check (language in ('es','en','it','pt')),
  chat_history_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  constraint reserved_handle check (lower(handle) <> all(array[
    'admin','administrator','root','support','staff','official','danivex','api',
    'auth','account','login','register','signup','signin','settings','android',
    'modules','download','downloads','security','verify','system']))
);

create function public.dv_create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.dv_profiles(user_id) values (new.id);
  return new;
end;
$$;
revoke all on function public.dv_create_profile() from public, anon, authenticated;
create trigger dv_auth_user_created after insert on auth.users
for each row execute function public.dv_create_profile();
insert into public.dv_profiles(user_id) select id from auth.users on conflict do nothing;

create table public.dv_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  resource_type text not null check (resource_type in ('tool','download')),
  resource_id text not null check (resource_id in ('sensitivity','scanner','mobilador')),
  created_at timestamptz not null default now(),
  unique(user_id,resource_type,resource_id)
);
create table public.dv_saved (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('sensitivity','preset','article')),
  title text not null check (char_length(title) between 1 and 100),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 8192),
  created_at timestamptz not null default now()
);
create table public.dv_downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  resource_id text not null check (resource_id = 'mobilador'),
  version text not null check (char_length(version) between 1 and 40),
  status text not null default 'requested' check (status = 'requested'),
  distribution_id uuid,
  created_at timestamptz not null default now()
);
create table public.dv_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  question text not null check (char_length(question) between 1 and 2000),
  answer text not null check (char_length(answer) between 1 and 8000),
  created_at timestamptz not null default now()
);
create table public.dv_support (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 3 and 100),
  message text not null check (char_length(message) between 10 and 4000),
  attachment_consent boolean not null default false,
  conversation text check (char_length(conversation) <= 8000),
  status text not null default 'received' check (status in ('received','resolved')),
  created_at timestamptz not null default now(),
  check (conversation is null or attachment_consent)
);
create table public.dv_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('saved','download_requested','support_requested')),
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['dv_profiles','dv_favorites','dv_saved','dv_downloads','dv_chats','dv_support','dv_activity'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('create policy own_read on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    if t <> 'dv_profiles' then
      execute format('create index on public.%I (user_id, created_at desc)', t);
      execute format('grant delete on public.%I to authenticated', t);
      execute format('create policy own_delete on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
      execute format('create policy own_insert on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    end if;
  end loop;
end;
$$;

grant update(handle,language,chat_history_enabled) on public.dv_profiles to authenticated;
create policy own_update on public.dv_profiles for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant insert(resource_type,resource_id) on public.dv_favorites to authenticated;
grant insert(kind,title,payload) on public.dv_saved to authenticated;
grant insert(resource_id,version) on public.dv_downloads to authenticated;
grant insert(question,answer) on public.dv_chats to authenticated;
grant insert(subject,message,attachment_consent,conversation) on public.dv_support to authenticated;
grant insert(kind) on public.dv_activity to authenticated;

-- Opt-out and deletion remain effective even for requests made outside the BFF.
drop policy own_insert on public.dv_chats;
create policy own_insert on public.dv_chats for insert to authenticated with check (
  (select auth.uid()) = user_id and exists (
    select 1 from public.dv_profiles where user_id = (select auth.uid()) and chat_history_enabled
  )
);
create function public.dv_clear_chat_on_opt_out() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.chat_history_enabled and not new.chat_history_enabled then
    delete from public.dv_chats where user_id = new.user_id;
  end if;
  return new;
end;
$$;
revoke all on function public.dv_clear_chat_on_opt_out() from public, anon, authenticated;
create trigger dv_chat_opt_out after update of chat_history_enabled on public.dv_profiles
for each row execute function public.dv_clear_chat_on_opt_out();

create function public.dv_record_activity() returns trigger
language plpgsql set search_path = '' as $$
begin
  insert into public.dv_activity(kind) values (case TG_TABLE_NAME
    when 'dv_saved' then 'saved' when 'dv_downloads' then 'download_requested'
    else 'support_requested' end);
  return new;
end;
$$;
revoke all on function public.dv_record_activity() from public,anon,authenticated;
create trigger dv_saved_activity after insert on public.dv_saved for each row execute function public.dv_record_activity();
create trigger dv_download_activity after insert on public.dv_downloads for each row execute function public.dv_record_activity();
create trigger dv_support_activity after insert on public.dv_support for each row execute function public.dv_record_activity();

commit;
