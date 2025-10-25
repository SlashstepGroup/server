import Collection, { CollectionProperties } from "#resources/Collection/Collection.js";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";
import Project from "#resources/Project/Project.js";
import Workspace from "#resources/Workspace/Workspace.js";

export enum MilestoneParentResourceType {
  Project = "Project",
  Workspace = "Workspace"
}

export type BaseMilestoneProperties = CollectionProperties & {
  parentResourceType: MilestoneParentResourceType | `${MilestoneParentResourceType}`;
  parentProjectID?: string;
  parentWorkspaceID?: string;
}

export type InitialWritableMilestoneProperties = Omit<BaseMilestoneProperties, "id">;

export type EditableMilestoneProperties = Omit<InitialWritableMilestoneProperties, "parentResourceType" | "parentProjectID" | "parentWorkspaceID">;

export type ExtendedMilestoneProperties = BaseMilestoneProperties & {
  parentProject?: Project;
  parentWorkspace?: Workspace;
}

export type MilestoneTableQueryResult = {
  id: string;
  name: string;
  display_name: string;
  description: string;
  parent_resource_type: MilestoneParentResourceType;
  parent_project_id: string;
  parent_workspace_id: string;
}

/**
 * A Milestone represents a specific goal — such as a release or major deliverable — within a project or a workspace.
 */
export default class Milestone extends Collection {

  static readonly name = "Milestone";

  /** The milestone's parent project, if applicable. */
  readonly parentProject: ExtendedMilestoneProperties["parentProject"];

  /** The milestone's parent project ID, if applicable. */
  readonly parentProjectID: ExtendedMilestoneProperties["parentProjectID"];

  /** The milestone's parent workspace, if applicable. */
  readonly parentWorkspace: ExtendedMilestoneProperties["parentWorkspace"];

  /** The milestone's parent workspace ID, if applicable. */
  readonly parentWorkspaceID: ExtendedMilestoneProperties["parentWorkspaceID"];

  /** The milestone's parent resource type. */
  readonly parentResourceType: ExtendedMilestoneProperties["parentResourceType"];

  /** The pool used to send queries to the database. */
  readonly #pool: Pool;

  constructor(data: ExtendedMilestoneProperties, pool: Pool) {

    super(data);
    this.parentProject = data.parentProject;
    this.parentProjectID = data.parentProjectID;
    this.parentWorkspace = data.parentWorkspace;
    this.parentWorkspaceID = data.parentWorkspaceID;
    this.parentResourceType = data.parentResourceType;
    this.#pool = pool;

  }

  /**
   * Creates the groups table in the database.
   * @param pool 
   */
  static async initializeTable(pool: Pool): Promise<void> {

    // Create the table.
    const poolClient = await pool.connect();
    const createAccessPoliciesTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-milestones-table.sql"), "utf8");
    const createHydratedAccessPoliciesViewQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-hydrated-milestones-view.sql"), "utf8");
    await poolClient.query(createAccessPoliciesTableQuery);
    await poolClient.query(createHydratedAccessPoliciesViewQuery);
    poolClient.release();

  }

  /**
   * Creates a milestone.
   * @param data The data for the new milestone.
   * @param pool The pool to use to send queries to the database.
   * @returns The created milestone.
   */
  static async create(data: InitialWritableMilestoneProperties, pool: Pool): Promise<Milestone> {

    // Insert the milestone into the database.
    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-milestone-row.sql"), "utf8");
      const values = [data.name, data.displayName, data.description, data.parentResourceType, data.parentProjectID, data.parentWorkspaceID];
      const result = await poolClient.query<MilestoneTableQueryResult>(query, values);

      // Convert the row to a milestone object.
      const rowData = result.rows[0];
      const milestone = new Milestone({
        id: rowData.id,
        name: rowData.name,
        displayName: rowData.display_name,
        description: rowData.description,
        parentResourceType: rowData.parent_resource_type,
        parentProjectID: rowData.parent_project_id,
        parentWorkspaceID: rowData.parent_workspace_id
      }, pool);

      return milestone;

    } finally {

      poolClient.release();

    }

  }

}