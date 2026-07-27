-- specs/002-shareable-link-flow/data-model.md
-- Allows the app to run on SUPABASE_ANON_KEY alone (no service role key).
-- Only insert + select are needed: created events are immutable (no update/delete API).
alter table gender_reveal_events enable row level security;

create policy "Public can create gender reveal events"
  on gender_reveal_events
  for insert
  to anon
  with check (true);

create policy "Public can read gender reveal events"
  on gender_reveal_events
  for select
  to anon
  using (true);
