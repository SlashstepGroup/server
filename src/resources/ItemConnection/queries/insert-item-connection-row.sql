insert into item_connections (
  type_id, 
  inward_item_id, 
  outward_item_id
) values (
  $1, 
  $2, 
  $3
) returning *;