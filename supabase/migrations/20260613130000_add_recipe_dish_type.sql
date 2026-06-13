alter table recipes add column if not exists dish_type text not null default 'Prato principal';

update recipes
set dish_type = category,
    category = 'Outro'
where category in ('Sopa', 'Entrada', 'Sobremesa')
  and dish_type = 'Prato principal';
