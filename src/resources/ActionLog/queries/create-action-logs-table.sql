do $$
begin
  if not exists (select 1 from pg_type where typname = 'action_log_actor_type') then
    create type action_log_actor_type as enum (
      'User',
      'App'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'action_log_target_resource_type') then
    create type action_log_target_resource_type as enum (
      'AccessPolicy',
      'Action',
      'ActionLog',
      'App',
      'AppAuthorization',
      'AppAuthorizationCredential',
      'AppCredential',
      'Field',
      'Group',
      'Instance',
      'Item',
      'ItemConnection',
      'ItemConnectionType',
      'Milestone',
      'Project',
      'Role',
      'Session',
      'User',
      'Workspace'
    );
  end if;
end
$$ LANGUAGE plpgsql;

create table if not exists action_logs (
  id UUID default uuidv7() primary key,
  actor_type action_log_actor_type not null,
  actor_user_id UUID references users(id),
  actor_app_id UUID references apps(id),
  actor_ip_address inet,
  target_resource_type action_log_target_resource_type not null,
  target_access_policy_id UUID references access_policies(id),
  target_action_id UUID references actions(id),
  target_action_log_id UUID references action_logs(id),
  target_app_id UUID references apps(id),
  target_app_authorization_id UUID references app_authorizations(id),
  target_app_authorization_credential_id UUID references app_authorization_credentials(id),
  target_app_credential_id UUID references app_credentials(id),
  target_field_id UUID references fields(id),
  target_group_id UUID references groups(id),
  target_item_id UUID references items(id),
  target_item_connection_id UUID references item_connections(id),
  target_item_connection_type_id UUID references item_connection_types(id),
  target_milestone_id UUID references milestones(id),
  target_project_id UUID references projects(id),
  target_role_id UUID references roles(id),
  target_session_id UUID references sessions(id),
  target_user_id UUID references users(id),
  target_workspace_id UUID references workspaces(id),
  reason text,
  error_message text
);