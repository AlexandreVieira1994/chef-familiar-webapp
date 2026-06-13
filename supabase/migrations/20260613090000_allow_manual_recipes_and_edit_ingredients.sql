alter table recipes add column if not exists source_type text not null default 'manual';

update recipes
set source_type = 'importada'
where nullif(trim(source_url), '') is not null;

alter table recipes alter column source_url drop not null;

alter table recipes drop constraint if exists recipes_source_url_required;
alter table recipes drop constraint if exists recipes_source_type_valid;
alter table recipes drop constraint if exists recipes_source_url_valid;

alter table recipes add constraint recipes_source_type_valid
  check (source_type in ('manual', 'importada'));

alter table recipes add constraint recipes_source_url_valid
  check (
    (source_type = 'manual' and (source_url is null or source_url ~* '^https?://'))
    or (source_type = 'importada' and source_url ~* '^https?://')
  );

drop policy if exists "public update recipe ingredients" on recipe_ingredients;
drop policy if exists "public delete recipe ingredients" on recipe_ingredients;

create policy "public update recipe ingredients"
  on recipe_ingredients for update
  using (true)
  with check (true);

create policy "public delete recipe ingredients"
  on recipe_ingredients for delete
  using (true);
