create table if not exists users (
  id UUID default uuidv7() primary key,
  username text not null unique,
  display_name text not null,
  hashed_password text not null
)