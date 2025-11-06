create or replace view hydrated_action_log_entries as
  select
    action_log_entries.*,
    row_to_json(actor_users.*) as actor_user,
    row_to_json(actor_apps.*) as actor_app,
    row_to_json(access_policies.*) as target_access_policy,
    row_to_json(actions.*) as target_action,
    row_to_json(apps.*) as target_app,
    row_to_json(app_authorizations.*) as target_app_authorization,
    row_to_json(app_authorization_credentials.*) as target_app_authorization_credential,
    row_to_json(app_credentials.*) as target_app_credential,
    row_to_json(fields.*) as target_field,
    row_to_json(groups.*) as target_group,
    row_to_json(items.*) as target_item,
    row_to_json(item_connections.*) as target_item_connection,
    row_to_json(item_connection_types.*) as target_item_connection_type,
    row_to_json(milestones.*) as target_milestone,
    row_to_json(projects.*) as target_project,
    row_to_json(roles.*) as target_role,
    row_to_json(sessions.*) as target_session,
    row_to_json(users.*) as target_user,
    row_to_json(workspaces.*) as target_workspace
  from
    action_log_entries
  left join
    users as actor_users on actor_users.id = action_log_entries.actor_user_id
  left join
    apps as actor_apps on actor_apps.id = action_log_entries.actor_app_id
  left join
    access_policies on access_policies.id = action_log_entries.target_access_policy_id
  left join
    actions on actions.id = action_log_entries.target_action_id
  left join
    apps on apps.id = action_log_entries.target_app_id
  left join
    app_authorizations on app_authorizations.id = action_log_entries.target_app_authorization_id
  left join
    app_authorization_credentials on app_authorization_credentials.id = action_log_entries.target_app_authorization_credential_id
  left join
    app_credentials on app_credentials.id = action_log_entries.target_app_credential_id
  left join
    fields on fields.id = action_log_entries.target_field_id
  left join
    groups on groups.id = action_log_entries.target_group_id
  left join
    items on items.id = action_log_entries.target_item_id
  left join
    item_connections on item_connections.id = action_log_entries.target_item_connection_id
  left join
    item_connection_types on item_connection_types.id = action_log_entries.target_item_connection_type_id
  left join
    milestones on milestones.id = action_log_entries.target_milestone_id
  left join
    projects on projects.id = action_log_entries.target_project_id
  left join
    roles on roles.id = action_log_entries.target_role_id
  left join
    sessions on sessions.id = action_log_entries.target_session_id
  left join
    users on users.id = action_log_entries.target_user_id
  left join
    workspaces on workspaces.id = action_log_entries.target_workspace_id