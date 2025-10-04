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

  if not exists (select 1 from pg_type where typname = 'prinicpal_type') then
    create type prinicpal_type as enum (
      'User',
      'Group',
      'Role'
    );
  end
END
$$ LANGUAGE plpgsql;

create table if not exists access_policies (
  id UUID default uuidv7() primary key,

  /* Principals */
  principal_type prinicpal_type not null,
  prinicpal_user_id UUID references users(id) on delete cascade,
  prinicpal_group_id UUID references groups(id) on delete cascade,
  prinicpal_role_id UUID references roles(id) on delete cascade,

  /* Scopes */
  scope_type scope_type not null,
  scoped_workspace_id UUID references workspaces(id) on delete cascade,
  scoped_project_id UUID references projects(id) on delete cascade,
  scoped_item_id UUID references items(id) on delete cascade,
  scoped_action_id UUID references actions(id) on delete cascade,
  scoped_user_id UUID references users(id) on delete cascade,
  scoped_role_id UUID references roles(id) on delete cascade,
  scoped_group_id UUID references groups(id) on delete cascade,
  scoped_app_id UUID references apps(id) on delete cascade,
  scoped_milestone_id UUID references milestones(id) on delete cascade,

  /* Permissions */
  action_id UUID not null references actions(id) on delete cascade,
  permission_level permission_level not null,
  inheritance_level inheritance_level not null,
  
  /* Constraints */
  constraint one_principal_type check (
    (principal_type = 'User' and prinicpal_user_id is not null and prinicial_group_id is null and prinicial_role_id is null)
    or (principal_type = 'Group' and prinicpal_user_id is null and prinicial_group_id is not null and prinicial_role_id is null)
    or (principal_type = 'Role' and prinicpal_user_id is null and prinicial_group_id is null and prinicial_role_id is not null)
  ),

  constraint one_scope_type check (
    (scope_type = 'Instance' and scoped_workspace_id is null and scoped_project_id is null and scoped_item_id is null and scoped_action_id is null and scoped_user_id is null and scoped_role_id is null and scoped_group_id is null and scoped_app_id is null and scoped_milestone_id is null)
    or (scope_type = 'Workspace' and scoped_workspace_id is not null and scoped_project_id is null and scoped_item_id is null and scoped_action_id is null and scoped_user_id is null and scoped_role_id is null and scoped_group_id is null and scoped_app_id is null and scoped_milestone_id is null)
    or (scope_type = 'Project' and scoped_workspace_id is null and scoped_project_id is not null and scoped_item_id is null and scoped_action_id is null and scoped_user_id is null and scoped_role_id is null and scoped_group_id is null and scoped_app_id is null and scoped_milestone_id is null)
    or (scope_type = 'Item' and scoped_workspace_id is null and scoped_project_id is null and scoped_item_id is not null and scoped_action_id is null and scoped_user_id is null and scoped_role_id is null and scoped_group_id is null and scoped_app_id is null and scoped_milestone_id is null)
    or (scope_type = 'Action' and scoped_workspace_id is null and scoped_project_id is null and scoped_item_id is null and scoped_action_id is not null and scoped_user_id is null and scoped_role_id is null and scoped_group_id is null and scoped_app_id is null and scoped_milestone_id is null)
    or (scope_type = 'User' and scoped_workspace_id is null and scoped_project_id is null and scoped_item_id is null and scoped_action_id is null and scoped_user_id is not null and scoped_role_id is null and scoped_group_id is null and scoped_app_id is null and scoped_milestone_id is null)
    or (scope_type = 'Role' and scoped_workspace_id is null and scoped_project_id is null and scoped_item_id is null and scoped_action_id is null and scoped_user_id is null and scoped_role_id is not null and scoped_group_id is null and scoped_app_id is null and scoped_milestone_id is null)
    or (scope_type = 'Group' and scoped_workspace_id is null and scoped_project_id is null and scoped_item_id is null and scoped_action_id is null and scoped_user_id is null and scoped_role_id is null and scoped_group_id is not null and scoped_app_id is null and scoped_milestone_id is null)
    or (scope_type = 'App' and scoped_workspace_id is null and scoped_project_id is null and scoped_item_id is null and scoped_action_id is null and scoped_user_id is null and scoped_role_id is null and scoped_group_id is null and scoped_app_id is not null and scoped_milestone_id is null)
    or (scope_type = 'Milestone' and scoped_workspace_id is null and scoped_project_id is null and scoped_item_id is null and scoped_action_id is null and scoped_user_id is null and scoped_role_id is null and scoped_group_id is null and scoped_app_id is null and scoped_milestone_id is not null)
  )
);