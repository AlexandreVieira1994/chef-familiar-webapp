update public.recipes
set feedback_notes = notes
where feedback_notes is null
  and notes is not null;
