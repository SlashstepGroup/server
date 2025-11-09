insert into server_policies (
  name,
  display_name,
  value_type,
  default_number_value,
  default_boolean_value,
  default_string_value,
  number_value,
  boolean_value,
  string_value
) values (
  $1,
  $2,
  $3,
  $4,
  $5,
  $6,
  $7,
  $8,
  $9
) returning *;