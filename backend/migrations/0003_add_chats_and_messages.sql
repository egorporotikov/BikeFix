-- Create chats and messages tables for realtime chat
-- Run this migration with your Supabase migrations tooling or psql

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  request_id uuid,
  user_id text,
  mechanic_id text,
  created_at timestamp with time zone default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references chats(id) on delete cascade,
  sender_id text not null,
  sender_role text not null,
  content text not null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_messages_chat_id_created_at on messages(chat_id, created_at);
