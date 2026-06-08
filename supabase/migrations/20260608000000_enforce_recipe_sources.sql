delete from recipes;

insert into family_rules (rule_key, rule_value) values
('recipe_sources', 'Receitas so podem ser importadas de marcas, supermercados, editoras/livros, publicacoes institucionais ou sites oficiais. Nao criar receitas por IA e nao usar comunidades.')
on conflict (rule_key) do update set rule_value = excluded.rule_value;

alter table recipes drop constraint if exists recipes_source_url_required;
alter table recipes alter column source_url set not null;
alter table recipes add constraint recipes_source_url_required check (source_url ~* '^https?://');
