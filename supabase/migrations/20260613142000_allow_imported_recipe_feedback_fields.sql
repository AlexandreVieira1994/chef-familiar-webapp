create or replace function public.prevent_imported_recipe_content_update()
returns trigger
language plpgsql
as $$
begin
  if old.source_type = 'importada'
    and (
      new.code is distinct from old.code
      or new.name is distinct from old.name
      or new.category is distinct from old.category
      or new.dish_type is distinct from old.dish_type
      or new.prep_time_min is distinct from old.prep_time_min
      or new.cook_time_min is distinct from old.cook_time_min
      or new.cost_level is distinct from old.cost_level
      or new.servings is distinct from old.servings
      or new.image_url is distinct from old.image_url
      or new.source_type is distinct from old.source_type
      or new.source_url is distinct from old.source_url
    )
  then
    raise exception 'Receitas importadas só permitem alterar feedback.';
  end if;

  return new;
end;
$$;
