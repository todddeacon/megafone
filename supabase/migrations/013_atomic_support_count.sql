-- Atomic support count increment/decrement
-- Replaces the read-then-write pattern that loses counts under concurrent load

-- security definer ensures this function always has permission to update,
-- even with RLS enabled (runs as the function owner, not the calling user)
create or replace function increment_support_count(demand_id_input uuid)
returns integer
language sql
security definer
as $$
  update demands
  set support_count_cache = support_count_cache + 1
  where id = demand_id_input
  returning support_count_cache;
$$;
