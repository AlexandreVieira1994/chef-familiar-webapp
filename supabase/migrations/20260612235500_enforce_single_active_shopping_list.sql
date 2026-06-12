with stale_lists as (
  select id
  from (
    select
      id,
      row_number() over (partition by status order by created_at desc, id desc) as row_num
    from shopping_lists
    where status = 'ativa'
  ) ranked
  where row_num > 1
)
delete from shopping_list_items
where shopping_list_id in (select id from stale_lists);

with stale_lists as (
  select id
  from (
    select
      id,
      row_number() over (partition by status order by created_at desc, id desc) as row_num
    from shopping_lists
    where status = 'ativa'
  ) ranked
  where row_num > 1
)
delete from shopping_lists
where id in (select id from stale_lists);

create unique index if not exists shopping_lists_single_active_idx
  on shopping_lists (status)
  where status = 'ativa';
