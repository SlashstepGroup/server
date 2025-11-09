create or replace view hydrated_server_policies as
  select
    server_policies.*
  from
    server_policies