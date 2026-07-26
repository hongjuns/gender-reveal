-- specs/002-shareable-link-flow/data-model.md
create extension if not exists pgcrypto;

create table if not exists gender_reveal_events (
  id uuid primary key default gen_random_uuid(),
  baby_nickname text not null,
  due_date date not null,
  recipient_name text not null,
  gender text not null check (gender in ('son', 'daughter')),
  share_link text not null unique,
  link_expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint baby_nickname_not_blank check (btrim(baby_nickname) <> ''),
  constraint recipient_name_not_blank check (btrim(recipient_name) <> '')
);
