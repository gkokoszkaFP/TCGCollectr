-- Migration: Create function and triggers for maintaining user total_cards_count denormalized counter
-- Purpose: Keep the profiles.total_cards_count in sync with the sum of user_cards quantities
-- Affected tables: profiles, user_cards
-- Special considerations: Trigger on INSERT, UPDATE, and DELETE operations

-- create function to update total_cards_count in profiles
create or replace function update_user_total_cards_count()
returns trigger as $$
declare
  new_total int;
begin
  -- calculate total cards for the user by summing all quantities
  select coalesce(sum(quantity), 0) into new_total
  from user_cards
  where user_id = coalesce(new.user_id, old.user_id);

  -- update profile with new total
  update profiles
  set total_cards_count = new_total
  where id = coalesce(new.user_id, old.user_id);

  return coalesce(new, old);
end;
$$ language plpgsql;

-- trigger on user_cards insert to update total count
create trigger update_total_cards_on_insert
  after insert on user_cards
  for each row
  execute function update_user_total_cards_count();

-- trigger on user_cards update to update total count
create trigger update_total_cards_on_update
  after update on user_cards
  for each row
  execute function update_user_total_cards_count();

-- trigger on user_cards delete to update total count
create trigger update_total_cards_on_delete
  after delete on user_cards
  for each row
  execute function update_user_total_cards_count();

-- Rationale:
-- Maintains accurate denormalized counter for efficient limit checking.
-- Avoids expensive SUM() aggregations on every query for the 10,000 card limit.
-- Triggers fire after operations to calculate actual total from user_cards table.
-- Supports fast queries for approaching/exceeding limit warnings.
-- Trade-off: minimal storage overhead (1 INT per user) for improved query performance.
