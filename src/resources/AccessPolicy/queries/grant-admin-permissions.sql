insert into access_policies (
  user_id, 
  scope_type, 
  action_id, 
  permission_level, 
  inheritance_level
) values (
  $1,
  'Instance',
  (
    select 
      id 
    from 
      actions 
    where 
      name = $2
  ),
  'Admin',
  'Locked'
) returning *;