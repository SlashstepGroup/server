create table if not exists apps (
  id UUID default uuidv7() primary key,
  description text,
  name text not null,
  display_name text not null
);