import Group from "#resources/Group/Group.js";
import Project from "#resources/Project/Project.js";
import Workspace from "#resources/Workspace/Workspace.js";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path"

export enum RoleParent {
  Instance = "Instance",
  Workspace = "Workspace",
  Project = "Project",
  Group = "Group"
}

export type RoleProperties = {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  parentResourceType: RoleParent;
  parentWorkspaceID?: string;
  parentProjectID?: string;
  parentGroupID?: string;
}

export type EditableRoleProperties = Omit<RoleProperties, "id" | "parentType" | "parentWorkspaceID" | "parentProjectID" | "parentGroupID">;

export type RoleObjectProperties = RoleProperties & {
  parentWorkspace?: Workspace;
  parentProject?: Project;
  parentGroup?: Group;
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

}