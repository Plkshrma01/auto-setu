-- AutoSetu role-based auth setup. Run once in Supabase SQL Editor after schema.sql.
-- Creates a profile row automatically from auth signup metadata.
-- Users can self-register as passenger or driver; driver verification remains pending.
create or replace function public.handle_new_autosetu_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen_role text;
begin
  chosen_role := coalesce(new.raw_user_meta_data ->> 'role', 'passenger');
  if chosen_role not in ('passenger','driver') then chosen_role := 'passenger'; end if;
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name',''), chosen_role::public.user_role)
  on conflict (id) do nothing;
  if chosen_role = 'driver' then
    insert into public.drivers (user_id, verification_status)
    values (new.id, 'pending')
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_autosetu on auth.users;
create trigger on_auth_user_created_autosetu
after insert on auth.users
for each row execute procedure public.handle_new_autosetu_user();

-- Profiles are created by the trusted database trigger; clients should not be
-- able to change their own role after signup.
drop policy if exists "profiles insert self" on public.profiles;
drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update own non-role fields" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Prevent client-side role edits even through a direct REST update.
create or replace function public.prevent_profile_role_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'Account role cannot be changed by the account owner';
  end if;
  return new;
end;
$$;
drop trigger if exists prevent_profile_role_change_trigger on public.profiles;
create trigger prevent_profile_role_change_trigger
before update on public.profiles
for each row execute procedure public.prevent_profile_role_change();

-- NOTE: Review the existing policies in schema.sql before production.
-- Driver approvals must be performed by a trusted admin/server process.
