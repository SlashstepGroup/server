create table if not exists users (
  id UUID default uuidv7() primary key,
  username text not null,
  display_name text not null
)