import { StringUnion } from "#utilities/types.js";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";

export type ItemConnectionTypeQueryResult = {
  id: string;
  display_name: string;
  inward_description: string;
  outward_description: string;
  parent_resource_type: StringUnion<ItemConnectionTypeParentResourceType>;
  parent_project_id: string;
  parent_workspace_id: string;
}

export enum ItemConnectionTypeParentResourceType {
  Project = "Project",
  Workspace = "Workspace"
}

export type BaseItemConnectionTypeProperties = {
  id: string;
  displayName: string;
  inwardDescription: string;
  outwardDescription: string;
  parentResourceType: StringUnion<ItemConnectionTypeParentResourceType>;
  parentProjectID?: string | null;
  parentWorkspaceID?: string | null;
}

export type InitialItemConnectionTypeProperties = Omit<BaseItemConnectionTypeProperties, "id">;

export default class ItemConnectionType {

  static readonly name = "ItemConnectionType";

  /** The item connection type's ID. */
  readonly id: BaseItemConnectionTypeProperties["id"];

  /** The item connection type's display name. */
  readonly displayName: BaseItemConnectionTypeProperties["displayName"];

  /** The item connection type's inward description. */
  readonly inwardDescription: BaseItemConnectionTypeProperties["inwardDescription"];

  /** The item connection type's outward description. */
  readonly outwardDescription: BaseItemConnectionTypeProperties["outwardDescription"];

  /** The item connection type's parent resource type. */
  readonly parentResourceType: BaseItemConnectionTypeProperties["parentResourceType"];

  /** The item connection type's parent project ID, if applicable. */
  readonly parentProjectID: BaseItemConnectionTypeProperties["parentProjectID"];

  /** The item connection type's parent workspace ID, if applicable. */
  readonly parentWorkspaceID: BaseItemConnectionTypeProperties["parentWorkspaceID"];

  /** The pool used to send queries to the database. */
  readonly #pool: Pool

  constructor(data: BaseItemConnectionTypeProperties, pool: Pool) {

    this.id = data.id;
    this.displayName = data.displayName;
    this.inwardDescription = data.inwardDescription;
    this.outwardDescription = data.outwardDescription;
    this.parentResourceType = data.parentResourceType;
    this.parentProjectID = data.parentProjectID;
    this.parentWorkspaceID = data.parentWorkspaceID;
    this.#pool = pool;

  }

  /**
   * Requests the server to create a new item connection type.
   *
   * @param data The data for the new item connection type, excluding the ID.
   */
  static async create(data: InitialItemConnectionTypeProperties, pool: Pool): Promise<ItemConnectionType> {

    // Insert the item connection type into the database.
    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-item-connection-type-row.sql"), "utf8");
      const values = [
        data.displayName,
        data.inwardDescription,
        data.outwardDescription,
        data.parentResourceType,
        data.parentProjectID,
        data.parentWorkspaceID
      ];
      const result = await poolClient.query<ItemConnectionTypeQueryResult>(query, values);

      // Convert the row to an item connection type object.
      const rowData = result.rows[0];
      const itemConnectionType = new ItemConnectionType(ItemConnectionType.getPropertiesFromRow(rowData), pool);

      // Return the item connection type.
      return itemConnectionType;

    } finally {

      poolClient.release();

    }

  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();

    try {

      const createItemConnectionTypesTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-item-connection-types-table.sql"), "utf8");
      const createHydratedItemConnectionTypesViewQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-hydrated-item-connection-types-view.sql"), "utf8");
      await poolClient.query(createItemConnectionTypesTableQuery);
      await poolClient.query(createHydratedItemConnectionTypesViewQuery);

    } finally {

      poolClient.release();

    }

  }

  static getPropertiesFromRow(rowData: ItemConnectionTypeQueryResult): BaseItemConnectionTypeProperties {
        
    return {
      id: rowData.id,
      displayName: rowData.display_name,
      inwardDescription: rowData.inward_description,
      outwardDescription: rowData.outward_description,
      parentResourceType: rowData.parent_resource_type,
      parentProjectID: rowData.parent_project_id,
      parentWorkspaceID: rowData.parent_workspace_id
    };
    
  }

  async delete(): Promise<void> {

    const poolClient = await this.#pool.connect();

    try {

      await poolClient.query("begin;");
      const query = readFileSync(resolve(import.meta.dirname, "queries", "delete-item-connection-type-row.sql"), "utf8");
      await poolClient.query(query, [this.id]);
      await poolClient.query("commit;");

    } finally {

      poolClient.release();

    }

  }

}