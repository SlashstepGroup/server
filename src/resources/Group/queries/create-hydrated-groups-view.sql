drop view if exists hydrated_groups;

create view hydrated_groups as
  select
    groups.*
  from 
    groups
  -- left join
  --   users as principal_users on principal_users.id = access_policies.principal_user_id
  