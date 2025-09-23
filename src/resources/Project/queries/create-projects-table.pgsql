create table if not exists projects (
  id UUID default uuidv7() primary key,
  name text not null,
  display_name text not null,
  key text not null,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  workspace_id UUID not null references workspaces(id) on delete cascade
);