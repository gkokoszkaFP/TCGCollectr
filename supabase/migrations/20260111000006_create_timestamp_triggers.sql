-- Migration: Create functions and triggers for updated_at timestamp updates
-- Purpose: Automatically update the updated_at column whenever rows are modified
-- Affected tables: profiles, cards, sets, user_cards
-- Special considerations: Trigger functions must run before update for proper timestamp

-- Create function to automatically update updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger on profiles table for automatic updated_at updates
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

-- Trigger on cards table for automatic updated_at updates
create trigger update_cards_updated_at
  before update on cards
  for each row
  execute function update_updated_at_column();

-- Trigger on sets table for automatic updated_at updates
create trigger update_sets_updated_at
  before update on sets
  for each row
  execute function update_updated_at_column();

-- Trigger on user_cards table for automatic updated_at updates
create trigger update_user_cards_updated_at
  before update on user_cards
  for each row
  execute function update_updated_at_column();

-- Rationale:
-- All tables include created_at and updated_at timestamp tracking for audit trail and analytics.
-- Automatic triggers ensure updated_at is always current without requiring application logic.
-- BEFORE UPDATE trigger allows the function to modify the NEW record before insertion.
