insert into fields (
  name,
  display_name,
  type,
  description,
  parent_resource_type,
  parent_workspace_id,
  parent_project_id,
  are_stakeholder_reviews_enabled,
  minimum_value,
  maximum_value,
  minimum_choices,
  maximum_choices,
  is_required
) values (
  $1,
  $2,
  $3,
  $4,
  $5,
  $6,
  $7,
  $8,
  $9,
  $10,
  $11,
  $12,
  $13
) returning *;