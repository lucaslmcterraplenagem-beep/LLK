-- LK Pneus: armazenamento sincronizado por conta autenticada.
-- Execute este arquivo uma única vez no Supabase SQL Editor.
-- A chave anon/public não recebe acesso direto aos dados; o usuário precisa autenticar-se.

create table if not exists public.lk_pneus_state (
    user_id uuid primary key references auth.users(id) on delete cascade,
    state jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now(),
    constraint lk_pneus_state_json_object check (jsonb_typeof(state) = 'object')
);

alter table public.lk_pneus_state enable row level security;

grant select, insert, update on table public.lk_pneus_state to authenticated;

drop policy if exists "LK Pneus users can read own state" on public.lk_pneus_state;
create policy "LK Pneus users can read own state"
    on public.lk_pneus_state
    for select
    to authenticated
    using (auth.uid() = user_id);

drop policy if exists "LK Pneus users can create own state" on public.lk_pneus_state;
create policy "LK Pneus users can create own state"
    on public.lk_pneus_state
    for insert
    to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "LK Pneus users can update own state" on public.lk_pneus_state;
create policy "LK Pneus users can update own state"
    on public.lk_pneus_state
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

comment on table public.lk_pneus_state is
    'LK Pneus application state. Each authenticated Supabase user can access only their own state row.';
