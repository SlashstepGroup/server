create or replace view hydrated_milestones as
  select
    groups.*
  from 
    groups
  -- left join
  --   users as principal_users on principal_users.id = access_policies.principal_user_id
  