create or replace view hydrated_action_logs as
  select
    actions.*,
    apps.name as app_name,
    apps.display_name as app_display_name,
    apps.description as app_description,
    users.username as actor_username,
    users.display_name as actor_display_name,
    users.description as actor_description,
    items.summary as target_item_summary,
    projects.name as target_project_name,
    projects.display_name as target_project_display_name,
    projects.description as target_project_description,
    workspaces.name as target_workspace_name,
    workspaces.display_name as target_workspace_display_name,
    workspaces.description as target_workspace_description,
    access_policies.user_id as target_access_policy_user_id,
    access_policies.scope_type as target_access_policy_scope_type,
    access_policies.workspace_id as target_access_policy_workspace_id,
    access_policies.project_id as target_access_policy_project_id,
    access_policies.item_id as target_access_policy_item_id,
    access_policies.permission_level as target_access_policy_permission_level,
    access_policies.inheritance_level as target_access_policy_inheritance_level
  from
    action_logs
  inner join
    actions on actions.id = action_logs.action_id
  inner join
    apps on apps.id = actions.app_id
  inner join
    users on users.id = action_logs.actor_id
  inner join
    items on items.id = action_logs.target_item_id
  inner join
    projects on projects.id = action_logs.target_project_id
  inner join
    workspaces on workspaces.id = action_logs.target_workspace_id
  inner join
    access_policies on access_policies.id = action_logs.target_access_policy_id;