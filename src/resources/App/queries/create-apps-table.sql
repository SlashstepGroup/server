do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_parent_resource_type') then
    create type app_parent_resource_type as enum (
      'Instance',
      'User',
      'Workspace'
    );
  end if;
end
$$ LANGUAGE plpgsql;

create table if not exists apps (
  id UUID default uuidv7() primary key,
  description text,
  name text not null,
  display_name text not null,
  parent_resource_type app_parent_resource_type not null,
  parent_user_id UUID references users(id) on delete cascade,
  parent_workspace_id UUID references workspaces(id) on delete cascade
);