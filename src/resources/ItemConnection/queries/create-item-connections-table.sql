create table if not exists item_connections (
  id UUID default uuidv7() primary key,
  type_id UUID not null references item_connection_types(id) on delete cascade,
  inward_item_id UUID not null references items(id) on delete cascade,
  outward_item_id UUID not null references items(id) on delete cascade
)