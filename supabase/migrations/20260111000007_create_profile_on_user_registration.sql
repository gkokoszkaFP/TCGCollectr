-- Migration: Create trigger for automatic profile creation on user registration
-- Purpose: Automatically create a profile when a new auth user is registered
-- Affected tables: profiles, auth.users
-- Special considerations: AFTER INSERT trigger on auth.users, initializes created_at and updated_at

-- create function to create profile when user is registered
create or replace function create_profile_for_user()
returns trigger as $$
begin
  insert into profiles (id, created_at, updated_at)
  values (new.id, now(), now());
  return new;
end;
$$ language plpgsql;

-- trigger on auth.users insert
create trigger create_profile_on_auth_user_insert
  after insert on auth.users
  for each row
  execute function create_profile_for_user();

-- Rationale:
-- Ensures every authenticated user automatically has a profile record.
-- Prevents orphaned auth.users records without corresponding profiles.
-- Triggered after user registration, initializing profile with default values.
-- Profile deletion is automatically handled via CASCADE when auth user is deleted.
