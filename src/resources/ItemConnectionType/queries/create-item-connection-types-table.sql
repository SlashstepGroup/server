do $$
begin
  if not exists (select 1 from pg_type where typname = 'item_connection_type_parent_resource_type') then
    create type item_connection_type_parent_resource_type as enum (
      'Project',
      'Workspace'
    );
  end if;
end
$$ LANGUAGE plpgsql;

create table if not exists item_connection_types (
  id UUID default uuidv7() primary key,
  display_name text not null,
  inward_description text not null,
  outward_description text not null,
  parent_resource_type item_connection_type_parent_resource_type not null,
  parent_project_id UUID references projects(id) on delete cascade,
  parent_workspace_id UUID references workspaces(id) on delete cascade
)