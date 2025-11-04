import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";

export type BaseItemConnectionProperties = {
  id: string;
  typeID: string;
  inwardItemID: string;
  outwardItemID: string;
}

export type ItemConnectionQueryResult = {
  id: string;
  type_id: string;
  inward_item_id: string;
  outward_item_id: string;
}

export type InitialItemConnectionProperties = Omit<BaseItemConnectionProperties, "id">;

export default class ItemConnection {

  static readonly name = "ItemConnection";

  /** The item connection's ID. */
  readonly id: BaseItemConnectionProperties["id"];

  /** The item connection's type ID. */
  readonly typeID: BaseItemConnectionProperties["typeID"];

  /** The inward item ID of this connection. */
  readonly inwardItemID: BaseItemConnectionProperties["inwardItemID"];

  /** The outward item ID of this connection. */
  readonly outwardItemID: BaseItemConnectionProperties["outwardItemID"];

  /** The pool used to send queries to the database. */
  readonly #pool: Pool

  constructor(data: BaseItemConnectionProperties, pool: Pool) {

    this.id = data.id;
    this.typeID = data.typeID
    this.inwardItemID = data.inwardItemID
    this.outwardItemID = data.outwardItemID
    this.#pool = pool;

  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();

    try {

      const createItemConnectionsTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-item-connections-table.sql"), "utf8");
      const createHydratedItemConnectionsViewQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-hydrated-item-connections-view.sql"), "utf8");
      await poolClient.query(createItemConnectionsTableQuery);
      await poolClient.query(createHydratedItemConnectionsViewQuery);

    } finally {

      poolClient.release();

    }

  }

  static async getByID(id: string, pool: Pool): Promise<ItemConnection> {

    const poolClient = await pool.connect();
    
    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "get-item-connection-row.sql"), "utf8");
      const result = await poolClient.query(query, [id]);
      const row = result.rows[0];

      if (!row) {

        throw new ResourceNotFoundError("ItemConnection");

      }

      const itemConnection = new ItemConnection(ItemConnection.getPropertiesFromRow(row), pool);

      return itemConnection;

    } finally {

      poolClient.release();

    }

  }

  static async create(data: InitialItemConnectionProperties, pool: Pool): Promise<ItemConnection> {

    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-item-connection-row.sql"), "utf8");
      const values = [
        data.typeID,
        data.inwardItemID,
        data.outwardItemID
      ];
      const result = await poolClient.query<ItemConnectionQueryResult>(query, values);

      const rowData = result.rows[0];
      const itemConnection = new ItemConnection(ItemConnection.getPropertiesFromRow(rowData), pool);

      return itemConnection;

    } finally {

      poolClient.release();

    }

  }

  static getPropertiesFromRow(rowData: ItemConnectionQueryResult): BaseItemConnectionProperties {
        
    return {
      id: rowData.id,
      typeID: rowData.type_id,
      inwardItemID: rowData.inward_item_id,
      outwardItemID: rowData.outward_item_id
    };
    
  }

  async delete(): Promise<void> {

    const poolClient = await this.#pool.connect();

    try {

      await poolClient.query("begin;");
      const query = readFileSync(resolve(import.meta.dirname, "queries", "delete-item-connection-row.sql"), "utf8");
      await poolClient.query(query, [this.id]);
      await poolClient.query("commit;");

    } finally {

      poolClient.release();

    }

  }

}