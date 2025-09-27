drop view if exists hydrated_actions;

create view hydrated_actions as
  select
    actions.*,
    apps.name as app_name,
    apps.display_name as app_display_name,
    apps.description as app_description
  from
    actions
  inner join
    apps on apps.id = actions.app_id;