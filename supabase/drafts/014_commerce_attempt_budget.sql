-- LOCAL REVIEW DRAFT: not a migration or authorization to provision real budgets.
begin;
create table public.block10_commerce_attempt_budgets (
  account_ref text primary key check (account_ref ~ '^[A-Za-z0-9:_-]{1,160}$'),
  revision text not null check (revision ~ '^[A-Za-z0-9:_-]{1,160}$'),
  approval_ref text not null check (approval_ref ~ '^[A-Za-z0-9:_-]{1,160}$'),
  enabled boolean not null default false,
  starts_at timestamptz not null check (isfinite(starts_at)),
  expires_at timestamptz not null check (isfinite(expires_at)),
  max_attempts bigint not null check (max_attempts > 0),
  used_attempts bigint not null default 0 check (used_attempts >= 0 and used_attempts <= max_attempts),
  last_reserved_at timestamptz check (last_reserved_at is null or isfinite(last_reserved_at)),
  check (starts_at < expires_at)
);
alter table public.block10_commerce_attempt_budgets enable row level security;
revoke all on table public.block10_commerce_attempt_budgets from public, anon, authenticated, service_role;

-- One absolute budget per account; no automatic refill, reset, retry refund or
-- separate ASIN budgets. A trusted operator must provision/review limits.
-- Call in a dedicated transaction and COMMIT before external acquisition. An
-- uncertain RPC outcome must deny acquisition, never assume the attempt committed.
create function public.block10_reserve_commerce_attempt(p_account_ref text, p_revision text)
returns boolean language plpgsql security definer set search_path = pg_catalog as $$
declare
  budget public.block10_commerce_attempt_budgets%rowtype;
  at_time timestamptz;
begin
  if p_account_ref is null or p_revision is null
    or p_account_ref !~ '^[A-Za-z0-9:_-]{1,160}$' or p_revision !~ '^[A-Za-z0-9:_-]{1,160}$' then return false; end if;
  select * into budget from public.block10_commerce_attempt_budgets
    where account_ref = p_account_ref for update;
  if not found then return false; end if;
  -- Time must be measured AFTER waiting for the row lock, not at transaction start.
  at_time := clock_timestamp();
  if not budget.enabled or budget.revision <> p_revision
    or at_time < budget.starts_at or at_time >= budget.expires_at
    or (budget.last_reserved_at is not null and at_time < budget.last_reserved_at)
    or budget.used_attempts >= budget.max_attempts then return false; end if;
  update public.block10_commerce_attempt_budgets set used_attempts = used_attempts + 1, last_reserved_at = at_time
    where account_ref = p_account_ref;
  return true;
end;
$$;
revoke all on function public.block10_reserve_commerce_attempt(text,text) from public, anon, authenticated, service_role;
commit;
