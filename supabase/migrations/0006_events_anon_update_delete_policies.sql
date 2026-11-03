-- v3: 풍선 연장(update)·삭제(delete)를 anon 키로도 수행할 수 있게 한다.
-- id + code 일치 검증은 서버 API에서 수행한다(anon 키는 서버 전용, NEXT_PUBLIC 아님).
-- 삭제 시 댓글은 gender_reveal_comments FK(on delete cascade)로 함께 삭제된다.
create policy "Public can update gender reveal events"
  on gender_reveal_events
  for update
  to anon
  using (true)
  with check (true);

create policy "Public can delete gender reveal events"
  on gender_reveal_events
  for delete
  to anon
  using (true);
