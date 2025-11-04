do $$
begin
  if not exists (select 1 from pg_type where typname = 'field_type') then
    create type field_type as enum (
      'Text',
      'Number',
      'Date',
      'Checkbox',
      'Stakeholder'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'field_parent_resource_type') then
    create type field_parent_resource_type as enum (
      'Workspace',
      'Project'
    );
  end if;
end
$$ LANGUAGE plpgsql;

create table if not exists fields (
  id UUID default uuidv7() primary key,
  name text not null,
  display_name text not null,
  type field_type not null,
  description text,
  parent_resource_type field_parent_resource_type not null,
  parent_workspace_id UUID references workspaces(id) on delete cascade,
  parent_project_id UUID references projects(id) on delete cascade,
  are_stakeholder_reviews_enabled boolean not null default false,
  minimum_value numeric,
  maximum_value numeric,
  minimum_choices integer,
  maximum_choices integer,
  is_required boolean not null default false,

  /* Constraints */
  constraint one_field_parent_type check (
    (parent_resource_type = 'Workspace' and parent_workspace_id is not null and parent_project_id is null)
    or (parent_resource_type = 'Project' and parent_workspace_id is null and parent_project_id is not null)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_field_name_across_workspace ON fields (UPPER(name), parent_workspace_id, parent_resource_type);
CREATE UNIQUE INDEX IF NOT EXISTS unique_field_name_across_project ON fields (UPPER(name), parent_project_id, parent_resource_type);