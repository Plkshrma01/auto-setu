-- AutoSetu starter schema for Supabase (Postgres)
-- Run in Supabase Dashboard > SQL Editor. Review policies before public launch.
create extension if not exists pgcrypto;

create type public.ride_status as enum ('requested','accepted','driver_arriving','in_progress','completed','cancelled','rejected');
create type public.user_role as enum ('passenger','driver','admin');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'passenger',
  avatar_url text,
  created_at timestamptz not null default now()
);
create table if not exists public.drivers (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  vehicle_type text not null default 'auto',
  vehicle_number text,
  is_online boolean not null default false,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
  latitude double precision,
  longitude double precision,
  updated_at timestamptz not null default now()
);
create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  passenger_id uuid references auth.users(id) on delete set null default auth.uid(),
  driver_id uuid references auth.users(id) on delete set null,
  pickup_text text not null,
  destination_text text not null,
  pickup_lat double precision,
  pickup_lng double precision,
  destination_lat double precision,
  destination_lng double precision,
  ride_type text not null default 'auto' check (ride_type in ('auto','shared')),
  passenger_count int not null default 1 check (passenger_count between 1 and 6),
  estimated_fare_text text,
  status public.ride_status not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.carpools (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  from_text text not null,
  to_text text not null,
  departure_at timestamptz not null,
  seats_total int not null check (seats_total between 1 and 8),
  seats_available int not null check (seats_available between 0 and seats_total),
  cost_per_person numeric(10,2) not null check (cost_per_person >= 0),
  notes text,
  status text not null default 'open' check (status in ('open','full','cancelled','completed')),
  created_at timestamptz not null default now()
);
create table if not exists public.carpool_requests (
  id uuid primary key default gen_random_uuid(),
  carpool_id uuid not null references public.carpools(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  seats_requested int not null default 1 check (seats_requested between 1 and 8),
  status text not null default 'pending' check (status in ('pending','accepted','rejected','cancelled')),
  created_at timestamptz not null default now(),
  unique(carpool_id, requester_id)
);
create table if not exists public.ride_reviews (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  reviewee_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(ride_id, reviewer_id)
);
create table if not exists public.safety_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null default auth.uid(),
  ride_id uuid references public.rides(id) on delete set null,
  category text not null,
  description text not null,
  status text not null default 'new' check (status in ('new','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.drivers enable row level security;
alter table public.rides enable row level security;
alter table public.carpools enable row level security;
alter table public.carpool_requests enable row level security;
alter table public.ride_reviews enable row level security;
alter table public.safety_reports enable row level security;

-- Profiles: authenticated users can view basic profiles; only edit own row.
create policy "profiles read authenticated" on public.profiles for select to authenticated using (true);
create policy "profiles insert self" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles update self" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Driver availability/profile: authenticated reads, drivers manage their own row.
create policy "drivers read authenticated" on public.drivers for select to authenticated using (true);
create policy "drivers insert self" on public.drivers for insert to authenticated with check (user_id = auth.uid());
create policy "drivers update self" on public.drivers for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Rides: involved parties can read; passengers create their own; involved parties can update.
create policy "rides read involved" on public.rides for select to authenticated using (passenger_id = auth.uid() or driver_id = auth.uid());
create policy "rides create passenger" on public.rides for insert to authenticated with check (passenger_id = auth.uid());
create policy "rides update involved" on public.rides for update to authenticated using (passenger_id = auth.uid() or driver_id = auth.uid()) with check (passenger_id = auth.uid() or driver_id = auth.uid());

-- Public listing details for logged-in members; owner manages listing.
create policy "carpools read authenticated" on public.carpools for select to authenticated using (true);
create policy "carpools create own" on public.carpools for insert to authenticated with check (owner_id = auth.uid());
create policy "carpools update own" on public.carpools for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "carpool requests read involved" on public.carpool_requests for select to authenticated using (requester_id = auth.uid() or exists(select 1 from public.carpools c where c.id = carpool_id and c.owner_id = auth.uid()));
create policy "carpool requests create self" on public.carpool_requests for insert to authenticated with check (requester_id = auth.uid());
create policy "carpool requests update involved" on public.carpool_requests for update to authenticated using (requester_id = auth.uid() or exists(select 1 from public.carpools c where c.id = carpool_id and c.owner_id = auth.uid())) with check (requester_id = auth.uid() or exists(select 1 from public.carpools c where c.id = carpool_id and c.owner_id = auth.uid()));

create policy "reviews read authenticated" on public.ride_reviews for select to authenticated using (true);
create policy "reviews create own" on public.ride_reviews for insert to authenticated with check (reviewer_id = auth.uid());
create policy "reports create authenticated" on public.safety_reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "reports read reporter" on public.safety_reports for select to authenticated using (reporter_id = auth.uid());

-- IMPORTANT: Admin-only reads/updates should be implemented with a server-verified role/claim.
-- Do not expose all reports or create an admin frontend password-only gate.
