-- specs/003-event-comments/data-model.md
create table if not exists gender_reveal_comments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references gender_reveal_events(id) on delete cascade,
  sender_name varchar(20) not null,
  content varchar(100) not null,
  created_at timestamptz not null default now(),
  constraint sender_name_not_blank check (btrim(sender_name) <> ''),
  constraint content_not_blank check (btrim(content) <> '')
);

create index if not exists idx_gender_reveal_comments_event_id
  on gender_reveal_comments (event_id);
