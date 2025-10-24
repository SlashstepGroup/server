DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_parent_type') THEN
    CREATE TYPE role_parent_type AS ENUM (
      'Instance',
      'Workspace',
      'Project',
      'Group'
    );
  END IF;
END
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS roles (
  /* Fields */
  id UUID DEFAULT uuidv7() PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  parent_resource_type role_parent_type NOT NULL,
  parent_group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  parent_workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  /* Constraints */
  CONSTRAINT one_parent_type CHECK (
    (parent_resource_type = 'Instance' AND parent_group_id IS NULL AND parent_workspace_id IS NULL AND parent_project_id IS NULL)
    OR (parent_resource_type = 'Workspace' AND parent_group_id IS NULL AND parent_workspace_id IS NOT NULL AND parent_project_id IS NULL)
    OR (parent_resource_type = 'Project' AND parent_group_id IS NULL AND parent_workspace_id IS NULL AND parent_project_id IS NOT NULL)
    OR (parent_resource_type = 'Group' AND parent_group_id IS NOT NULL AND parent_workspace_id IS NULL AND parent_project_id IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_role_name_across_group ON roles (UPPER(name), parent_group_id, parent_resource_type);
CREATE UNIQUE INDEX IF NOT EXISTS unique_role_name_across_workspace ON roles (UPPER(name), parent_workspace_id, parent_resource_type);
CREATE UNIQUE INDEX IF NOT EXISTS unique_role_name_across_project ON roles (UPPER(name), parent_project_id, parent_resource_type);