create table if not exists action_logs (
  id UUID default uuidv7() primary key,
  app_id UUID references apps(id),
  action_id UUID not null references actions(id),
  actor_id UUID references users(id),
  actor_ip_address text,
  reason text,
  target_item_id UUID references items(id),
  target_project_id UUID references projects(id),
  target_workspace_id UUID references workspaces(id),
  target_access_policy_id UUID references access_policies(id),
  target_user_id UUID references users(id),
  bulk_action_log_id UUID
);