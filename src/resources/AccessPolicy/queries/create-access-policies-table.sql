do $$
begin
  if not exists (select 1 from pg_type where typname = 'permission_level') then
    create type permission_level as enum (
      'None',
      'User',
      'Admin'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'inheritance_level') then
    create type inheritance_level as enum (
      'Disabled',
      'Recommended',
      'Required',
      'Locked'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'scope_type') then
    create type scope_type as enum (
      'Instance',
      'Workspace',
      'Project',
      'Item'
    );
  end if;
END
$$ LANGUAGE plpgsql;

create table if not exists access_policies (
  id UUID default uuidv7() primary key,
  user_id UUID references users(id) on delete cascade,
  scope_type scope_type not null,
  workspace_id UUID references workspaces(id) on delete cascade,
  project_id UUID references projects(id) on delete cascade,
  item_id UUID references items(id) on delete cascade,
  action_id UUID not null references actions(id) on delete cascade,
  permission_level permission_level not null,
  inheritance_level inheritance_level not null,
  constraint one_scope_type check (
    (scope_type = 'Instance' and workspace_id is null and project_id is null and item_id is null) or
    (scope_type = 'Workspace' and workspace_id is not null and project_id is null and item_id is null) or
    (scope_type = 'Project' and workspace_id is not null and project_id is not null and item_id is null) or
    (scope_type = 'Item' and workspace_id is not null and project_id is not null and item_id is not null)
  )
);