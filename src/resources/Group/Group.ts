import { Pool } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";

export type GroupProperties = {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  parentGroup?: Group;
  parentGroupID?: string;
}

/**
 * A Group represents a collection of principals.
 */
export default class Group {

  /** The group's ID. */
  readonly id: GroupProperties["id"];

  /** The group's name. */
  readonly name: GroupProperties["name"];

  /** The group's display name. */
  readonly displayName: GroupProperties["displayName"];

  /** The group's description, if applicable. */
  readonly description: GroupProperties["description"];

  readonly parentGroup: GroupProperties["parentGroup"];
  
  readonly parentGroupID: GroupProperties["parentGroupID"];

  /** The pool used to send queries to the database. */
  readonly #pool: Pool

  constructor(data: GroupProperties, pool: Pool) {

    this.displayName = data.displayName;
    this.description = data.description;
    this.id = data.id;
    this.name = data.name;
    this.#pool = pool;

  }

  /**
   * Creates the groups table in the database.
   * @param pool 
   */
  static async initializeTable(pool: Pool): Promise<void> {

    // Create the table.
    const poolClient = await pool.connect();
    const createAccessPoliciesTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-groups-table.sql"), "utf8");
    const createHydratedGroupsViewQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-hydrated-groups-view.sql"), "utf8");
    await poolClient.query(createAccessPoliciesTableQuery);
    await poolClient.query(createHydratedGroupsViewQuery);
    poolClient.release();

  }

}