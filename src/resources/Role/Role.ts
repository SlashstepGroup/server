import Group from "#resources/Group/Group.js";
import Project from "#resources/Project/Project.js";
import Workspace from "#resources/Workspace/Workspace.js";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path"

export enum RoleParentResourceType {
  Instance = "Instance",
  Workspace = "Workspace",
  Project = "Project",
  Group = "Group"
}

export type BaseRoleProperties = {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  parentResourceType: RoleParentResourceType;
  parentWorkspaceID?: string;
  parentProjectID?: string;
  parentGroupID?: string;
}

export type InitialWritableRoleProperties = Omit<BaseRoleProperties, "id">;

export type EditableRoleProperties = Omit<InitialWritableRoleProperties, "parentResourceType" | "parentWorkspaceID" | "parentProjectID" | "parentGroupID">;

export type RoleObjectProperties = BaseRoleProperties & {
  parentWorkspace?: Workspace;
  parentProject?: Project;
  parentGroup?: Group;
}

export type RoleTableQueryResult = {
  id: string;
  name: string;
  display_name: string;
  description: string;
  parent_resource_type: RoleParentResourceType;
  parent_workspace_id: string;
  parent_project_id: string;
  parent_group_id: string;
}

export default class Role {
  
  /** The role's ID. */
  readonly id: RoleObjectProperties["id"];

  /** The role's name */
  readonly name: RoleObjectProperties["name"];

  /** The role's display name. */
  readonly displayName: RoleObjectProperties["displayName"];

  /** The role's description, if applicable. */
  readonly description: RoleObjectProperties["description"];

  /** The role's parent type. */
  readonly parentResourceType: RoleObjectProperties["parentResourceType"];

  /** The role's parent group, if applicable. */
  readonly parentGroup: RoleObjectProperties["parentGroup"];
  
  /** The role's parent group ID, if applicable. */
  readonly parentGroupID: RoleObjectProperties["parentGroupID"];

  /** The role's parent workspace, if applicable. */
  readonly parentWorkspace: RoleObjectProperties["parentWorkspace"];

  /** The role's parent workspace, if applicable. */
  readonly parentWorkspaceID: RoleObjectProperties["parentWorkspaceID"];

  /** The role's parent project, if applicable. */
  readonly parentProject: RoleObjectProperties["parentProject"];

  /** The role's parent workspace, if applicable. */
  readonly parentProjectID: RoleObjectProperties["parentProjectID"];

  /** The pool used to send queries to the database. */
  readonly #pool: Pool

  constructor(data: RoleObjectProperties, pool: Pool) {

    this.displayName = data.displayName;
    this.description = data.description;
    this.id = data.id;
    this.name = data.name;
    this.parentResourceType = data.parentResourceType;
    this.parentGroup = data.parentGroup;
    this.parentGroupID = data.parentGroupID;
    this.parentProject = data.parentProject;
    this.parentProjectID = data.parentProjectID;
    this.parentWorkspace = data.parentWorkspace;
    this.parentWorkspaceID = data.parentWorkspaceID;
    this.#pool = pool;

  }

  /**
   * Creates the groups table in the database.
   * @param pool 
   */
  static async initializeTable(pool: Pool): Promise<void> {

    // Create the table.
    const poolClient = await pool.connect();
    const createAccessPoliciesTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-roles-table.sql"), "utf8");
    const createHydratedRolesViewQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-hydrated-roles-view.sql"), "utf8");
    await poolClient.query(createAccessPoliciesTableQuery);
    await poolClient.query(createHydratedRolesViewQuery);
    poolClient.release();

  }

  /**
   * Creates a role.
   * @param data The data for the new role.
   * @param pool The pool to use to send queries to the database.
   * @returns The created role.
   */
  static async create(data: InitialWritableRoleProperties, pool: Pool): Promise<Role> {

    // Insert the role into the database.
    const poolClient = await pool.connect();

    const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-role-row.sql"), "utf8");
    const values = [data.name, data.displayName, data.description, data.parentResourceType, data.parentWorkspaceID, data.parentProjectID, data.parentGroupID];
    const result = await poolClient.query<RoleTableQueryResult>(query, values);
    poolClient.release();

    // Convert the row to a role object.
    const rowData = result.rows[0];
    const role = new Role({
      id: rowData.id,
      name: rowData.name,
      displayName: rowData.display_name,
      description: rowData.description,
      parentResourceType: rowData.parent_resource_type,
      parentWorkspaceID: rowData.parent_workspace_id,
      parentProjectID: rowData.parent_project_id,
      parentGroupID: rowData.parent_group_id
    }, pool);

    // Return the role.
    return role;

  }

}