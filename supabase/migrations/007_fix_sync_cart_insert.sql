-- Fix the applied cart synchronization function without rewriting migration 002.
begin;

create or replace function public.sync_cart(p_cart jsonb)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_entry jsonb;
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;
  if jsonb_typeof(p_cart) <> 'object'
    or p_cart->>'version' <> '2'
    or jsonb_typeof(p_cart->'entries') <> 'array'
    or coalesce(length(p_cart->>'deviceId'), 0) not between 8 and 128
    or p_cart->>'deviceId' !~ '^[A-Za-z0-9_-]{8,128}$'
    or jsonb_typeof(p_cart->'clock') <> 'number'
    or (p_cart->>'clock') !~ '^[0-9]+$'
    or jsonb_array_length(p_cart->'entries') > 100 then
    raise exception 'Invalid cart payload' using errcode = '22023';
  end if;

  for v_entry in select value from jsonb_array_elements(p_cart->'entries') loop
    if jsonb_typeof(v_entry) <> 'object'
      or v_entry->>'asin' !~ '^[A-Z0-9]{10}$'
      or (v_entry->>'quantity') !~ '^[0-9]+$'
      or (v_entry->>'quantity')::integer > 999
      or (v_entry->>'clock') !~ '^[0-9]+$'
      or v_entry->>'deviceId' !~ '^[A-Za-z0-9_-]{8,128}$'
      or coalesce(length(v_entry->>'name'), 0) > 500
      or coalesce(length(v_entry->>'slug'), 0) > 500
      or coalesce(length(v_entry->>'image'), 0) > 2000
      or coalesce(length(v_entry->>'url'), 0) > 2000 then
      raise exception 'Invalid cart entry' using errcode = '22023';
    end if;

    insert into public.cart_sync_entries (user_id, asin, quantity, logical_clock, device_id, item, updated_at)
    values (
      v_user_id,
      v_entry->>'asin',
      (v_entry->>'quantity')::integer,
      (v_entry->>'clock')::bigint,
      v_entry->>'deviceId',
      jsonb_build_object(
        'asin', v_entry->>'asin', 'quantity', (v_entry->>'quantity')::integer,
        'slug', coalesce(v_entry->>'slug', ''), 'name', coalesce(v_entry->>'name', v_entry->>'asin'),
        'price', coalesce(v_entry->'price', '0'::jsonb), 'image', coalesce(v_entry->>'image', ''),
        'url', coalesce(v_entry->>'url', ''), 'clock', (v_entry->>'clock')::bigint,
        'deviceId', v_entry->>'deviceId'
      ), now()
    )
    on conflict (user_id, asin) do update set
      quantity = excluded.quantity,
      logical_clock = excluded.logical_clock,
      device_id = excluded.device_id,
      item = excluded.item,
      updated_at = now()
    where excluded.logical_clock > public.cart_sync_entries.logical_clock
      or (excluded.logical_clock = public.cart_sync_entries.logical_clock and excluded.device_id > public.cart_sync_entries.device_id);
  end loop;

  select jsonb_build_object(
    'version', 2,
    'deviceId', p_cart->>'deviceId',
    'clock', coalesce(max(logical_clock), 0),
    'entries', coalesce(jsonb_agg(item order by asin), '[]'::jsonb)
  ) into v_result
  from public.cart_sync_entries
  where user_id = v_user_id;

  return v_result;
end;
$$;

revoke all on function public.sync_cart(jsonb) from public, anon;
grant execute on function public.sync_cart(jsonb) to authenticated;

commit;
