create or replace view hydrated_app_authorizations as
  select
    app_authorizations.*
  from 
    app_authorizations
  -- left join
  --   users as principal_users on principal_users.id = access_policies.principal_user_id
  