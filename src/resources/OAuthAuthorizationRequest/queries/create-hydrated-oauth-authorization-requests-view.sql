create or replace view hydrated_oauth_authorization_requests as
  select
    oauth_authorization_requests.*
  from
    oauth_authorization_requests