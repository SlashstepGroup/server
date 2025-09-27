import { Pool } from "pg";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";

export type AppProperties = {
  id: string;
  name: string;
  displayName: string;
  description?: string;
};

export default class App {
  
  /** The app's ID. */
  readonly id: AppProperties["id"];

  /** The app's name. */
  readonly name: AppProperties["name"];

  /** The app's display name. */
  readonly displayName: AppProperties["displayName"];

  /** The app's description, if applicable. */
  readonly description: AppProperties["description"];

  /** The client used to make requests. */
  readonly #pool: Pool;

  constructor(data: AppProperties, pool: Pool) {

    this.id = data.id;
    this.name = data.name;
    this.displayName = data.displayName;
    this.description = data.description;
    this.#pool = pool;

  }

  /**
   * Requests the server to create a new app.
   *
   * @param data The data for the new app, excluding the ID.
   */
  static async create(data: Omit<AppProperties, "id">, pool: Pool): Promise<App> {

    // Insert the app data into the database.
    const poolClient = await pool.connect();
    const query = readFileSync(resolve(dirname(import.meta.dirname), "User", "queries", "insert-app-row.sql"), "utf8");
    const values = [data.name, data.displayName, data.description];
    const result = await poolClient.query(query, values);
    poolClient.release();

    // Convert the row to an app object.
    const row = result.rows[0];
    const app = new App({
      ...row,
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      description: row.description
    }, pool);

    // Return the user.
    return app;

  }

  /**
   * Requests the server for a specific user by ID.
   *
   * @param id The ID of the user to retrieve.
   */
  static async get(id: string, pool: Pool): Promise<App> {

    // Get the app data from the database.
    const poolClient = await pool.connect();
    const query = readFileSync(resolve(dirname(import.meta.dirname), "App", "queries", "get-app-row.sql"), "utf8");
    const result = await poolClient.query(query, [id]);
    poolClient.release();

    // Convert the app data into an App object.
    const row = result.rows[0];

    if (!row) {

      throw new ResourceNotFoundError("App");

    }

    const app = new App({
      ...row,
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      description: row.description
    }, pool);

    // Return the app.
    return app;

  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();
    const createAppsTableQuery = readFileSync(resolve(dirname(import.meta.dirname), "App", "queries", "create-apps-table.sql"), "utf8");
    await poolClient.query(createAppsTableQuery);
    poolClient.release();

  }

  /**
   * Requests the server to delete this user.
   */
  async delete(): Promise<void> {

    const poolClient = await this.#pool.connect();
    const query = readFileSync(resolve(dirname(import.meta.dirname), "App", "queries", "delete-app-row.sql"), "utf8");
    await poolClient.query(query, [this.id]);
    poolClient.release();

  }

}