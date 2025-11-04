create or replace view hydrated_item_connections as
  select
    item_connections.*
  from 
    item_connections