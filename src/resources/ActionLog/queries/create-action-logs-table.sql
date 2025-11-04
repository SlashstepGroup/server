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
  actor_user_id UUID,
  actor_app_id UUID,
  actor_ip_address inet,
  target_resource_type action_log_target_resource_type not null,
  target_access_policy_id UUID,
  target_action_id UUID,
  target_action_log_id UUID,
  target_app_id UUID,
  target_app_authorization_id UUID,
  target_app_authorization_credential_id UUID,
  target_app_credential_id UUID,
  target_field_id UUID,
  target_group_id UUID,
  target_item_id UUID,
  target_item_connection_id UUID,
  target_item_connection_type_id UUID,
  target_milestone_id UUID,
  target_project_id UUID,
  target_role_id UUID,
  target_session_id UUID,
  target_user_id UUID,
  target_workspace_id UUID,
  reason text,
  error_message text
);