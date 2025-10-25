import { Pool } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";

export type BaseGroupProperties = {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  parentGroupID?: string;
}

export type InitialWritableGroupProperties = Omit<BaseGroupProperties, "id">;

export type EditableGroupProperties = InitialWritableGroupProperties;

export type ExtendedGroupProperties = BaseGroupProperties & {
  parentGroup?: Group;
}

export type GroupTableQueryResult = {
  id: string;
  name: string;
  display_name: string;
  description: string;
  parent_group_id?: string;
}

/**
 * A Group represents a collection of principals.
 */
export default class Group {

  /** The group's ID. */
  readonly id: ExtendedGroupProperties["id"];

  /** The group's name. */
  readonly name: ExtendedGroupProperties["name"];

  /** The group's display name. */
  readonly displayName: ExtendedGroupProperties["displayName"];

  /** The group's description, if applicable. */
  readonly description: ExtendedGroupProperties["description"];

  readonly parentGroup: ExtendedGroupProperties["parentGroup"];
  
  readonly parentGroupID: ExtendedGroupProperties["parentGroupID"];

  /** The pool used to send queries to the database. */
  readonly #pool: Pool

  constructor(data: ExtendedGroupProperties, pool: Pool) {

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

  /**
   * Creates a group.
   * @param data The data for the new group.
   * @param pool The pool to use to send queries to the database.
   * @returns The created group.
   */
  static async create(data: InitialWritableGroupProperties, pool: Pool): Promise<Group> {

    // Insert the group into the database.
    const poolClient = await pool.connect();

    const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-group-row.sql"), "utf8");
    const values = [data.name, data.displayName, data.description, data.parentGroupID];
    const result = await poolClient.query<GroupTableQueryResult>(query, values);
    poolClient.release();

    // Convert the row to a group object.
    const rowData = result.rows[0];
    const group = new Group({
      id: rowData.id,
      name: rowData.name,
      displayName: rowData.display_name,
      description: rowData.description,
      parentGroupID: rowData.parent_group_id
    }, pool);

    return group;

  }

}