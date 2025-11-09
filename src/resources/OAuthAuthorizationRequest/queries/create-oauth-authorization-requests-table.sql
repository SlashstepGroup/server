create table if not exists oauth_authorization_requests (
  id uuid primary key default uuidv7(),
  encrypted_code text,
  code_challenge text,
  app_authorization_id uuid not null,
  expiration_date timestamptz not null,
  app_id uuid not null
);