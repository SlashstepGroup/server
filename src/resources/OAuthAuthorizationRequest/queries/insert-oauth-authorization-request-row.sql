insert into oauth_authorization_requests (
  encrypted_code,
  code_challenge,
  app_authorization_id,
  expiration_date,
  app_id
) values (
  $1,
  $2,
  $3,
  $4,
  $5
) returning *;