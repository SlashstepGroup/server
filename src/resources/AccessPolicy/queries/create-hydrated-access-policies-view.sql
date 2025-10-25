create or replace view hydrated_access_policies as
  select
    access_policies.*,
    actions.name as action_name,
    actions.app_id as action_app_id,
    actions.display_name as action_display_name,
    actions.description as action_description,

    /** Principals */
    /* User */
    principal_users.username as principal_user_username,
    principal_users.display_name as principal_user_display_name,

    /* Group */
    principal_groups.name as principal_group_name,
    principal_groups.display_name as principal_group_display_name,

    /* Role */
    principal_roles.name as principal_role_name,
    principal_roles.display_name as principal_role_display_name,

    /** Scopes */
    /* Action */
    scoped_actions.name as scoped_action_name,
    scoped_actions.display_name as scoped_action_display_name,
    scoped_actions.description as scoped_action_description,

    /* App */
    scoped_apps.name as scoped_app_name,
    scoped_apps.display_name as scoped_app_display_name,
    scoped_apps.description as scoped_app_description,

    /* Group */
    scoped_groups.name as scoped_group_name,
    scoped_groups.display_name as scoped_group_display_name,

    /* Item */
    scoped_items.summary as scoped_item_summary,
    scoped_items.description as scoped_item_description,

    /* Milestone */
    scoped_milestones.name as scoped_milestone_name,
    scoped_milestones.display_name as scoped_milestone_display_name,

    /* Project */
    scoped_projects.name as scoped_project_name,
    scoped_projects.display_name as scoped_project_display_name,
    scoped_projects.description as scoped_project_description,
    scoped_projects.key as scoped_project_key,
    
    /* Role */
    scoped_roles.name as scoped_role_name,
    scoped_roles.display_name as scoped_role_display_name,

    /* User */
    scoped_users.username as scoped_user_username,
    scoped_users.display_name as scoped_user_display_name,

    /* Workspace */
    scoped_workspaces.name as scoped_workspace_name,
    scoped_workspaces.display_name as scoped_workspace_display_name,
    scoped_workspaces.description as scoped_workspace_description
  from 
    access_policies
  left join
    users as principal_users on principal_users.id = access_policies.principal_user_id
  left join
    groups as principal_groups on principal_groups.id = access_policies.principal_group_id
  left join
    roles as principal_roles on principal_roles.id = access_policies.principal_role_id
  left join 
    hydrated_actions as actions on actions.id = access_policies.action_id
  left join
    hydrated_actions as scoped_actions on scoped_actions.id = access_policies.scoped_action_id
  left join
    hydrated_apps as scoped_apps on scoped_apps.id = access_policies.scoped_app_id
  left join
    hydrated_groups as scoped_groups on scoped_groups.id = access_policies.scoped_group_id
  left join 
    hydrated_items as scoped_items on scoped_items.id = access_policies.scoped_item_id
  left join 
    hydrated_milestones as scoped_milestones on scoped_milestones.id = access_policies.scoped_milestone_id
  left join 
    hydrated_projects as scoped_projects on scoped_projects.id = access_policies.scoped_project_id
  left join
    hydrated_roles as scoped_roles on scoped_roles.id = access_policies.scoped_role_id
  left join 
    hydrated_users as scoped_users on scoped_users.id = access_policies.scoped_user_id
  left join 
    hydrated_workspaces as scoped_workspaces on scoped_workspaces.id = access_policies.scoped_workspace_id