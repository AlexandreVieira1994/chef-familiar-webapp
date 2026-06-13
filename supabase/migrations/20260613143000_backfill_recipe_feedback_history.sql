insert into public.recipe_feedback (recipe_id, status, notes, created_at)
select
  r.id,
  coalesce(history_item.value->>'status', r.status),
  nullif(history_item.value->>'notes', ''),
  coalesce(nullif(history_item.value->>'created_at', '')::timestamptz, r.last_feedback_at, now())
from public.recipes r
cross join lateral jsonb_array_elements(
  case
    when jsonb_typeof(coalesce(r.feedback_history, '[]'::jsonb)) = 'array'
      then coalesce(r.feedback_history, '[]'::jsonb)
    else '[]'::jsonb
  end
) as history_item(value)
where not exists (
  select 1
  from public.recipe_feedback rf
  where rf.recipe_id = r.id
);

insert into public.recipe_feedback (recipe_id, status, notes, created_at)
select
  r.id,
  r.status,
  r.feedback_notes,
  coalesce(r.last_feedback_at, now())
from public.recipes r
where r.feedback_notes is not null
  and not exists (
    select 1
    from public.recipe_feedback rf
    where rf.recipe_id = r.id
  );
