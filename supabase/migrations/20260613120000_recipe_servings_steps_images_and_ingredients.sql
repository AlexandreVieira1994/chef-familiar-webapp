create extension if not exists pgcrypto;

alter table recipes add column if not exists servings integer not null default 4;
alter table recipes drop constraint if exists recipes_servings_positive;
alter table recipes add constraint recipes_servings_positive check (servings > 0);

alter table recipes drop constraint if exists recipes_source_type_valid;
alter table recipes drop constraint if exists recipes_source_url_valid;
update recipes set source_type = 'criada' where source_type = 'manual';
alter table recipes alter column source_type set default 'criada';
alter table recipes add constraint recipes_source_type_valid check (source_type in ('criada', 'importada'));

alter table recipes add constraint recipes_source_url_valid check (
  (source_type = 'criada' and (source_url is null or source_url ~* '^https?://'))
  or (source_type = 'importada' and source_url ~* '^https?://')
);

create table if not exists ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text,
  default_unit text,
  created_at timestamptz not null default now()
);

insert into ingredients (name, category, default_unit)
select distinct on (trim(ingredient_name))
  trim(ingredient_name),
  nullif(trim(category), ''),
  nullif(trim(unit), '')
from (
  select ingredient_name, category, unit from recipe_ingredients
  union all
  select ingredient_name, category, unit from inventory_entries
  union all
  select ingredient_name, category, planned_unit as unit from shopping_list_items
) seed
where nullif(trim(ingredient_name), '') is not null
order by trim(ingredient_name), category nulls last, unit nulls last
on conflict (name) do update set
  category = coalesce(ingredients.category, excluded.category),
  default_unit = coalesce(ingredients.default_unit, excluded.default_unit);

alter table recipe_ingredients add column if not exists ingredient_id uuid references ingredients(id) on delete restrict;

update recipe_ingredients ri
set ingredient_id = i.id
from ingredients i
where ri.ingredient_id is null
  and i.name = trim(ri.ingredient_name);

create table if not exists recipe_steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  position integer not null,
  description text not null,
  created_at timestamptz not null default now(),
  unique (recipe_id, position)
);

insert into recipe_steps (recipe_id, position, description)
select r.id, step.position, step.description
from recipes r
cross join lateral (
  select row_number() over ()::integer as position, trim(match[1]) as description
  from regexp_matches(coalesce(r.notes, ''), '(?:^|\n)\s*\d+\.\s*([^\n]+)', 'g') as match
) step
where not exists (
  select 1 from recipe_steps existing where existing.recipe_id = r.id
)
  and step.description <> '';

update recipes
set notes = null
where notes ~ '(?:^|\n)\s*\d+\.';

alter table meal_plan_entries add column if not exists servings_needed integer not null default 4;
alter table meal_plan_entries drop constraint if exists meal_plan_entries_servings_needed_positive;
alter table meal_plan_entries add constraint meal_plan_entries_servings_needed_positive check (servings_needed > 0);

insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do update set public = excluded.public;

alter table ingredients enable row level security;
alter table recipe_steps enable row level security;

grant select, insert on ingredients to anon, authenticated;
grant select, insert, update, delete on recipe_steps to anon, authenticated;

drop policy if exists "public read ingredients" on ingredients;
drop policy if exists "public insert ingredients" on ingredients;
drop policy if exists "public read recipe steps" on recipe_steps;
drop policy if exists "public insert recipe steps" on recipe_steps;
drop policy if exists "public update recipe steps" on recipe_steps;
drop policy if exists "public delete recipe steps" on recipe_steps;

create policy "public read ingredients" on ingredients for select using (true);
create policy "public insert ingredients" on ingredients for insert with check (true);
create policy "public read recipe steps" on recipe_steps for select using (true);
create policy "public insert recipe steps" on recipe_steps for insert with check (
  exists (
    select 1 from recipes
    where recipes.id = recipe_steps.recipe_id
      and recipes.source_type = 'criada'
  )
);
create policy "public update recipe steps" on recipe_steps for update using (
  exists (
    select 1 from recipes
    where recipes.id = recipe_steps.recipe_id
      and recipes.source_type = 'criada'
  )
) with check (
  exists (
    select 1 from recipes
    where recipes.id = recipe_steps.recipe_id
      and recipes.source_type = 'criada'
  )
);
create policy "public delete recipe steps" on recipe_steps for delete using (
  exists (
    select 1 from recipes
    where recipes.id = recipe_steps.recipe_id
      and recipes.source_type = 'criada'
  )
);

drop policy if exists "public insert recipes" on recipes;
drop policy if exists "public update recipes" on recipes;
drop policy if exists "public delete recipes" on recipes;
drop policy if exists "public insert recipe ingredients" on recipe_ingredients;
drop policy if exists "public update recipe ingredients" on recipe_ingredients;
drop policy if exists "public delete recipe ingredients" on recipe_ingredients;

create policy "public insert recipes" on recipes for insert with check (source_type = 'criada');
create policy "public update recipes" on recipes for update using (source_type = 'criada') with check (source_type = 'criada');
create policy "public delete recipes" on recipes for delete using (source_type = 'criada');
create policy "public insert recipe ingredients" on recipe_ingredients for insert with check (
  exists (
    select 1 from recipes
    where recipes.id = recipe_ingredients.recipe_id
      and recipes.source_type = 'criada'
  )
);
create policy "public update recipe ingredients" on recipe_ingredients for update using (
  exists (
    select 1 from recipes
    where recipes.id = recipe_ingredients.recipe_id
      and recipes.source_type = 'criada'
  )
) with check (
  exists (
    select 1 from recipes
    where recipes.id = recipe_ingredients.recipe_id
      and recipes.source_type = 'criada'
  )
);
create policy "public delete recipe ingredients" on recipe_ingredients for delete using (
  exists (
    select 1 from recipes
    where recipes.id = recipe_ingredients.recipe_id
      and recipes.source_type = 'criada'
  )
);

drop policy if exists "public upload recipe images" on storage.objects;
drop policy if exists "public update recipe images" on storage.objects;
drop policy if exists "public delete recipe images" on storage.objects;

create policy "public upload recipe images"
  on storage.objects for insert
  with check (bucket_id = 'recipe-images');

create policy "public update recipe images"
  on storage.objects for update
  using (bucket_id = 'recipe-images')
  with check (bucket_id = 'recipe-images');

create policy "public delete recipe images"
  on storage.objects for delete
  using (bucket_id = 'recipe-images');
