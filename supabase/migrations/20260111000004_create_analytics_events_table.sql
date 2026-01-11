-- Migration: Create analytics_events table
-- Purpose: Track user actions for analytics and success metrics
-- Affected tables: analytics_events (new), profiles (foreign key reference)
-- Special considerations: JSONB for flexible event data, nullable user_id for anonymous events

-- Create analytics_events table
create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid references profiles(id) on delete cascade,
  event_data jsonb,
  created_at timestamptz default now() not null
);

-- Enable row level security
alter table analytics_events enable row level security;

-- Policy: Allow authenticated users to insert their own events
-- Includes check for null user_id to allow anonymous events if explicitly set
create policy "analytics_events_insert_own"
  on analytics_events for insert
  to authenticated
  with check (auth.uid() = user_id or user_id is null);

-- Rationale for RLS policy:
-- Users can only log their own events (auth.uid() match) or anonymous events (user_id IS NULL).
-- This prevents users from inserting events for other users.
-- No SELECT/UPDATE/DELETE policies needed; service role handles analytics dashboards.
-- Service role automatically bypasses RLS for queries.
