drop view if exists hydrated_access_policies;

create view hydrated_access_policies as
  select
    access_policies.*,
    actions.name as action_name,
    actions.display_name as action_display_name,
    actions.description as action_description,
    apps.name as app_name,
    apps.display_name as app_display_name,
    apps.description as app_description
  from 
    access_policies
  inner join 
    actions on actions.id = access_policies.action_id
  inner join
    apps on apps.id = actions.app_id
  inner join 
    users on users.id = access_policies.user_id
  inner join 
    workspaces on workspaces.id = access_policies.workspace_id
  inner join 
    projects on projects.id = access_policies.project_id
  inner join 
    items on items.id = access_policies.item_id;