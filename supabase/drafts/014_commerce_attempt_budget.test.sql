-- LOCAL fixture only. Every test mutation and temporary grant rolls back.
begin;
insert into public.block10_commerce_attempt_budgets
  (account_ref, revision, approval_ref, enabled, starts_at, expires_at, max_attempts)
values ('test:budget', 'r1', 'synthetic:not-human-approval', true, clock_timestamp()-interval '1 hour', clock_timestamp()+interval '1 hour', 2);
do $$
begin
  if public.block10_reserve_commerce_attempt('missing','r1') then raise exception 'Missing allowed'; end if;
  if public.block10_reserve_commerce_attempt('test:budget','wrong') then raise exception 'Revision mismatch allowed'; end if;
  if not public.block10_reserve_commerce_attempt('test:budget','r1') then raise exception 'First denied'; end if;
  if not public.block10_reserve_commerce_attempt('test:budget','r1') then raise exception 'Second denied'; end if;
  if public.block10_reserve_commerce_attempt('test:budget','r1') then raise exception 'Budget exceeded'; end if;
  update public.block10_commerce_attempt_budgets set revision='r2' where account_ref='test:budget';
  if public.block10_reserve_commerce_attempt('test:budget','r2') then raise exception 'Revision reset budget'; end if;
  update public.block10_commerce_attempt_budgets set max_attempts=3, enabled=false where account_ref='test:budget';
  if public.block10_reserve_commerce_attempt('test:budget','r2') then raise exception 'Disabled allowed'; end if;
  update public.block10_commerce_attempt_budgets set enabled=true, expires_at=clock_timestamp() where account_ref='test:budget';
  if public.block10_reserve_commerce_attempt('test:budget','r2') then raise exception 'Expired allowed'; end if;
  update public.block10_commerce_attempt_budgets set expires_at=clock_timestamp()+interval '1 hour', last_reserved_at=clock_timestamp()+interval '1 minute' where account_ref='test:budget';
  if public.block10_reserve_commerce_attempt('test:budget','r2') then raise exception 'Clock rollback allowed'; end if;
  if (select used_attempts from public.block10_commerce_attempt_budgets where account_ref='test:budget') <> 2 then raise exception 'Denials consumed or refunded'; end if;
end;
$$;
set local role service_role;
do $$
begin
  begin
    perform public.block10_reserve_commerce_attempt('test:budget','r2');
    raise exception 'Unauthorized RPC allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.block10_commerce_attempt_budgets set used_attempts=0;
    raise exception 'Unauthorized reset allowed';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
rollback;
