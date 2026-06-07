create extension if not exists pgcrypto;

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  category text not null,
  status text not null default 'por_testar',
  prep_time_min integer,
  cook_time_min integer,
  cost_level text,
  notes text,
  created_at timestamptz not null default now()
);

alter table recipes add column if not exists feedback_notes text;
alter table recipes add column if not exists last_feedback_at timestamptz;
alter table recipes add column if not exists feedback_history jsonb not null default '[]'::jsonb;
alter table recipes add column if not exists image_url text;
alter table recipes add column if not exists source_url text;

create table if not exists recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  ingredient_name text not null,
  quantity numeric,
  unit text,
  category text,
  optional boolean not null default false,
  created_at timestamptz not null default now()
);

alter table recipe_ingredients add column if not exists image_url text;

create table if not exists inventory_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  ingredient_name text not null,
  quantity_initial numeric not null,
  quantity_remaining numeric not null,
  unit text not null,
  category text,
  source text,
  expiry_date date,
  storage_location text,
  status text default 'disponivel',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists shopping_lists (
  id uuid primary key default gen_random_uuid(),
  start_date date,
  end_date date,
  status text not null default 'rascunho',
  created_at timestamptz not null default now()
);

create table if not exists shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  shopping_list_id uuid references shopping_lists(id) on delete cascade,
  ingredient_name text not null,
  planned_quantity numeric,
  planned_unit text,
  category text,
  purchased_status text not null default 'nao_comprado',
  notes text,
  created_at timestamptz not null default now()
);

alter table shopping_list_items add column if not exists purchased_quantity numeric;
alter table shopping_list_items add column if not exists inventory_entry_id uuid references inventory_entries(id) on delete set null;

create table if not exists meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  planned_date date not null,
  meal_slot text not null,
  recipe_id uuid not null references recipes(id) on delete cascade,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists family_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text unique not null,
  rule_value text not null,
  created_at timestamptz not null default now()
);

create table if not exists recipe_feedback (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  status text not null,
  rating integer,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists assistant_action_logs (
  id uuid primary key default gen_random_uuid(),
  user_message text not null,
  interpreted_intent text not null,
  proposed_payload jsonb not null,
  status text not null default 'proposed',
  result jsonb,
  error text,
  created_at timestamptz not null default now()
);

alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;
alter table inventory_entries enable row level security;
alter table shopping_lists enable row level security;
alter table shopping_list_items enable row level security;
alter table meal_plan_entries enable row level security;
alter table family_rules enable row level security;
alter table recipe_feedback enable row level security;
alter table assistant_action_logs enable row level security;

drop policy if exists "public read recipes" on recipes;
drop policy if exists "public insert recipes" on recipes;
drop policy if exists "public update recipes" on recipes;
drop policy if exists "public read recipe ingredients" on recipe_ingredients;
drop policy if exists "public insert recipe ingredients" on recipe_ingredients;
drop policy if exists "public read inventory" on inventory_entries;
drop policy if exists "public insert inventory" on inventory_entries;
drop policy if exists "public update inventory" on inventory_entries;
drop policy if exists "public read shopping lists" on shopping_lists;
drop policy if exists "public insert shopping lists" on shopping_lists;
drop policy if exists "public update shopping lists" on shopping_lists;
drop policy if exists "public read shopping items" on shopping_list_items;
drop policy if exists "public insert shopping items" on shopping_list_items;
drop policy if exists "public update shopping items" on shopping_list_items;
drop policy if exists "public delete shopping items" on shopping_list_items;
drop policy if exists "public read meal plan" on meal_plan_entries;
drop policy if exists "public insert meal plan" on meal_plan_entries;
drop policy if exists "public delete meal plan" on meal_plan_entries;
drop policy if exists "public read rules" on family_rules;
drop policy if exists "public insert rules" on family_rules;
drop policy if exists "public update rules" on family_rules;
drop policy if exists "public delete rules" on family_rules;
drop policy if exists "public read recipe feedback" on recipe_feedback;
drop policy if exists "public insert recipe feedback" on recipe_feedback;
drop policy if exists "public read assistant logs" on assistant_action_logs;
drop policy if exists "public insert assistant logs" on assistant_action_logs;
drop policy if exists "public update assistant logs" on assistant_action_logs;

create policy "public read recipes" on recipes for select using (true);
create policy "public insert recipes" on recipes for insert with check (true);
create policy "public update recipes" on recipes for update using (true) with check (true);
create policy "public read recipe ingredients" on recipe_ingredients for select using (true);
create policy "public insert recipe ingredients" on recipe_ingredients for insert with check (true);
create policy "public read inventory" on inventory_entries for select using (true);
create policy "public insert inventory" on inventory_entries for insert with check (true);
create policy "public update inventory" on inventory_entries for update using (true) with check (true);
create policy "public read shopping lists" on shopping_lists for select using (true);
create policy "public insert shopping lists" on shopping_lists for insert with check (true);
create policy "public update shopping lists" on shopping_lists for update using (true) with check (true);
create policy "public read shopping items" on shopping_list_items for select using (true);
create policy "public insert shopping items" on shopping_list_items for insert with check (true);
create policy "public update shopping items" on shopping_list_items for update using (true) with check (true);
create policy "public delete shopping items" on shopping_list_items for delete using (true);
create policy "public read meal plan" on meal_plan_entries for select using (true);
create policy "public insert meal plan" on meal_plan_entries for insert with check (true);
create policy "public delete meal plan" on meal_plan_entries for delete using (true);
create policy "public read rules" on family_rules for select using (true);
create policy "public insert rules" on family_rules for insert with check (true);
create policy "public update rules" on family_rules for update using (true) with check (true);
create policy "public delete rules" on family_rules for delete using (true);
create policy "public read recipe feedback" on recipe_feedback for select using (true);
create policy "public insert recipe feedback" on recipe_feedback for insert with check (true);
create policy "public read assistant logs" on assistant_action_logs for select using (true);
create policy "public insert assistant logs" on assistant_action_logs for insert with check (true);
create policy "public update assistant logs" on assistant_action_logs for update using (true) with check (true);
