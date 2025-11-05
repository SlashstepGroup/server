create or replace view hydrated_action_logs as
  select
    action_logs.*
  from
    action_logs