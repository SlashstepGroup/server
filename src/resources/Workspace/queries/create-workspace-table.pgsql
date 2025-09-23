create table if not exists workspaces (
  id UUID default uuidv7() primary key,
  name text not null,
  display_name text not null,
  description text
);