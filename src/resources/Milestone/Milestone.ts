import Collection, { CollectionProperties } from "#resources/Collection/Collection.js";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";

export enum ParentResourceType {
  Project = "Project",
  Workspace = "Workspace"
}

export type MilestoneProperties = CollectionProperties & {
  parentResourceType: ParentResourceType | `${ParentResourceType}`;
  parentProjectID?: string;
  parentWorkspaceID?: string;
}

/**
 * A Milestone represents a specific goal — such as a release or major deliverable — within a project or a workspace.
 */
export default class Milestone extends Collection {

  static readonly name = "Milestone";

  /** The pool used to send queries to the database. */
  readonly #pool: Pool;

  constructor(data: MilestoneProperties, pool: Pool) {

    super(data);
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

}