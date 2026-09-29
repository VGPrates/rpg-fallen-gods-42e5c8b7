create table if not exists public.user_roles (
  user_id text primary key,
  role text not null check (role in ('gm', 'player')),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id text primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.game_tables (
  id serial primary key,
  gm_user_id text not null unique,
  name text not null default 'A Mesa',
  created_at timestamptz not null default now()
);

create table if not exists public.characters (
  id serial primary key,
  user_id text,
  created_by text not null,
  table_id int references public.game_tables(id) on delete cascade,
  name text not null,
  race text not null,
  class_name text not null,
  age int not null,
  backstory text not null default '',
  hp int not null default 20,
  hp_max int not null default 20,
  mana int not null default 12,
  mana_max int not null default 12,
  stamina int not null default 16,
  stamina_max int not null default 16,
  strength int not null default 10,
  agility int not null default 10,
  resistance int not null default 10,
  intelligence int not null default 10,
  presence int not null default 10,
  unspent_points int not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists characters_one_per_user
  on public.characters (user_id) where user_id is not null;
create index if not exists characters_table_id_idx on public.characters (table_id);
create index if not exists characters_user_id_idx on public.characters (user_id);

create table if not exists public.equipment (
  id serial primary key,
  name text not null,
  icon text not null default 'sword',
  category text not null,
  rarity text not null default 'comum',
  description text not null default '',
  effects text not null default '',
  modifiers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.effects (
  id serial primary key,
  kind text not null,
  name text not null,
  icon text not null default 'sparkles',
  color text not null default '#7fa065',
  description text not null default '',
  modifiers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.conditions (
  id serial primary key,
  name text not null,
  icon text not null default 'blood',
  color text not null default '#d0564d',
  description text not null default '',
  effect text not null default '',
  modifiers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_items (
  id serial primary key,
  character_id int not null references public.characters(id) on delete cascade,
  equipment_id int references public.equipment(id) on delete cascade,
  name text not null,
  description text not null default '',
  quantity int not null default 1,
  kind text not null,
  equipped_slot text,
  created_at timestamptz not null default now()
);

create index if not exists inventory_items_character_id_idx on public.inventory_items (character_id);

create table if not exists public.character_effects (
  id serial primary key,
  character_id int not null references public.characters(id) on delete cascade,
  effect_id int not null references public.effects(id) on delete cascade,
  duration text not null default '',
  applied_at timestamptz not null default now()
);

create table if not exists public.character_conditions (
  id serial primary key,
  character_id int not null references public.characters(id) on delete cascade,
  condition_id int not null references public.conditions(id) on delete cascade,
  duration text not null default '',
  applied_at timestamptz not null default now()
);

create table if not exists public.dice_rolls (
  id serial primary key,
  user_id text not null,
  table_id int references public.game_tables(id) on delete cascade,
  character_id int references public.characters(id) on delete set null,
  roller_name text not null,
  value int not null,
  created_at timestamptz not null default now()
);

create index if not exists dice_rolls_table_id_idx on public.dice_rolls (table_id);

create table if not exists public.custom_icons (
  id serial primary key,
  key text not null unique,
  label text not null,
  category text not null,
  url text not null,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.hidden_icons (
  key text primary key,
  created_at timestamptz not null default now()
);

grant all on public.user_roles to service_role;
grant all on public.profiles to service_role;
grant all on public.game_tables to service_role;
grant all on public.characters to service_role;
grant all on public.equipment to service_role;
grant all on public.effects to service_role;
grant all on public.conditions to service_role;
grant all on public.inventory_items to service_role;
grant all on public.character_effects to service_role;
grant all on public.character_conditions to service_role;
grant all on public.dice_rolls to service_role;
grant all on public.custom_icons to service_role;
grant all on public.hidden_icons to service_role;
grant usage, select on all sequences in schema public to service_role;

alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.game_tables enable row level security;
alter table public.characters enable row level security;
alter table public.equipment enable row level security;
alter table public.effects enable row level security;
alter table public.conditions enable row level security;
alter table public.inventory_items enable row level security;
alter table public.character_effects enable row level security;
alter table public.character_conditions enable row level security;
alter table public.dice_rolls enable row level security;
alter table public.custom_icons enable row level security;
alter table public.hidden_icons enable row level security;

insert into public.equipment (name, icon, category, rarity, description, effects, modifiers)
select * from (
  values
    ('Elmo de Ferro', 'helmet', 'elmo', 'comum', 'Protege o crânio contra golpes rasos.', '', '{"resistance":1}'::jsonb),
    ('Cota de Malha', 'armor', 'armadura', 'incomum', 'Anéis entrelaçados para o tronco.', '', '{"resistance":2}'::jsonb),
    ('Grevas de Couro', 'pants', 'calca', 'comum', 'Cobrem coxas e joelhos.', '', '{"agility":1}'::jsonb),
    ('Espada Longa', 'sword', 'arma', 'raro', 'Lâmina equilibrada para a mão dominante.', '', '{"strength":2}'::jsonb),
    ('Escudo Redondo', 'shield', 'escudo', 'incomum', 'Madeira e bronze, bom para aparar.', '', '{"resistance":1}'::jsonb),
    ('Botas de Caminhada', 'boot', 'bota', 'comum', 'Sola firme para longas marchas.', '', '{"agility":1}'::jsonb),
    ('Anel de Vigília', 'ring', 'acessorio', 'epico', 'Um olho gravado no metal.', '', '{"presence":1,"intelligence":1}'::jsonb)
) as s(name, icon, category, rarity, description, effects, modifiers)
where not exists (select 1 from public.equipment);

insert into public.effects (kind, name, icon, color, description, modifiers)
select * from (
  values
    ('buff', 'Bênção', 'sparkles', '#7fa065', 'Um sopro de favor.', '{"presence":1}'::jsonb)
) as s(kind, name, icon, color, description, modifiers)
where not exists (select 1 from public.effects);

insert into public.conditions (name, icon, color, description, effect, modifiers)
select * from (
  values
    ('Ferido', 'blood', '#d0564d', 'Sangra pelas fendas da armadura.', 'Desvantagem em testes de resistência.', '{"resistance":-1}'::jsonb)
) as s(name, icon, color, description, effect, modifiers)
where not exists (select 1 from public.conditions);

create or replace function public.exec_sql(q text, returns_rows boolean default true)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  result jsonb;
begin
  if returns_rows then
    execute 'select coalesce(jsonb_agg(t), ''[]''::jsonb) from (' || q || ') t' into result;
    return coalesce(result, '[]'::jsonb);
  end if;
  execute q;
  return '[]'::jsonb;
end;
$fn$;

revoke all on function public.exec_sql(text, boolean) from public;
revoke all on function public.exec_sql(text, boolean) from anon;
revoke all on function public.exec_sql(text, boolean) from authenticated;
grant execute on function public.exec_sql(text, boolean) to service_role;