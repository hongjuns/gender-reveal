-- specs/003-event-comments/data-model.md
-- write-once를 DB 레벨에서 강제: update/delete 정책은 의도적으로 만들지 않는다.
alter table gender_reveal_comments enable row level security;

create policy "Public can create gender reveal comments"
  on gender_reveal_comments
  for insert
  to anon
  with check (true);

create policy "Public can read gender reveal comments"
  on gender_reveal_comments
  for select
  to anon
  using (true);
