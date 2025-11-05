create or replace view hydrated_action_log_entries as
  select
    action_log_entries.*
  from
    action_log_entries