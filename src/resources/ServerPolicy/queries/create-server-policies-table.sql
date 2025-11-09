create table if not exists server_policies (
  id uuid primary key default uuidv7(),
  name text not null,
  display_name text not null,
  value_type text not null,
  default_number_value integer,
  default_boolean_value boolean,
  default_string_value text,
  number_value integer,
  boolean_value boolean,
  string_value text
);