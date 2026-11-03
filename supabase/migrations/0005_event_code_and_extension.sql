-- v3: 한 사람이 여러 풍선(받는 사람)을 만들고 code로 묶어서 관리한다.
-- code는 관리 링크용 비밀값이므로 받는 사람 링크(id)에서 유추할 수 없는 랜덤 값이어야 한다.
-- (기존 행을 id로 채우면 공유 링크만으로 관리 권한을 얻게 되므로 랜덤 값으로 백필한다.)
alter table gender_reveal_events add column if not exists code text;

update gender_reveal_events
  set code = gen_random_uuid()::text
  where code is null;

alter table gender_reveal_events
  alter column code set default gen_random_uuid()::text,
  alter column code set not null;

-- 하나의 code에 여러 행이 묶이므로 unique가 아닌 일반 인덱스.
create index if not exists idx_gender_reveal_events_code
  on gender_reveal_events (code);

-- 풍선별 1회 연장 여부는 별도 칼럼 없이 link_expires_at > created_at + 7일로 판단한다.
