-- Migration: Create function and trigger for enforcing 10,000 card limit
-- Purpose: Prevent users from adding cards beyond the 10,000 card limit
-- Affected tables: user_cards
-- Special considerations: Trigger fires BEFORE INSERT or UPDATE, raises exception on violation

-- create function to prevent adding cards beyond 10,000 limit
create or replace function check_card_limit()
returns trigger as $$
declare
  new_total int;
begin
  -- calculate what the total would be after this operation
  -- exclude the current row if updating (to avoid counting old quantity twice)
  select coalesce(sum(quantity), 0) into new_total
  from user_cards
  where user_id = new.user_id
    and id != coalesce(old.id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- add the new/updated quantity
  new_total := new_total + new.quantity;

  -- raise error if exceeds limit
  if new_total > 10000 then
    raise exception 'Card limit exceeded: user % has % cards (max 10000)',
      new.user_id, new_total;
  end if;

  return new;
end;
$$ language plpgsql;

-- trigger on user_cards insert or update to enforce card limit
create trigger enforce_card_limit
  before insert or update on user_cards
  for each row
  execute function check_card_limit();

-- Rationale:
-- Database-level enforcement of the 10,000 card limit prevents application bypasses.
-- BEFORE trigger prevents invalid data from being inserted or updated.
-- Descriptive error message helps users understand why operation failed.
-- Protects against accidental violations from any data source.
-- CHECK constraint on quantity (1-1000) prevents per-variant overflow.
