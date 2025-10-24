drop view if exists hydrated_apps;

create view hydrated_apps as
  select
    apps.*
  from 
    apps
  -- left join
  --   users as principal_users on principal_users.id = access_policies.principal_user_id
  