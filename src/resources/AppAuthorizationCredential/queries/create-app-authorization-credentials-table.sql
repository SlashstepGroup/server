create table if not exists app_authorization_credentials (
  id UUID default uuidv7() primary key,
  app_authorization_id UUID not null references app_authorizations(id) on delete cascade,
  expiration_date TIMESTAMPTZ not null
);