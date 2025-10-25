import { Pool } from "pg";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";

export type WorkspaceProperties = {
  id: string;
  name: string;
  displayName: string;
  description?: string;
};

export default class Workspace {

  /** The workspace's ID. */
  readonly id: WorkspaceProperties["id"];

  /** The workspace's name. */
  readonly name: WorkspaceProperties["name"];

  /** The workspace's display name. */
  readonly displayName: WorkspaceProperties["displayName"];

  /** The workspace's description, if applicable. */
  readonly description: WorkspaceProperties["description"];

  readonly #pool: Pool;

  constructor(data: WorkspaceProperties, pool: Pool) {

    this.id = data.id;
    this.name = data.name;
    this.displayName = data.displayName;
    this.description = data.description;
    this.#pool = pool;

  }

  /**
   * Requests the server to create a new workspace.
   *
   * @param data The data for the new workspace, excluding the ID.
   */
  static async create(data: Omit<WorkspaceProperties, "id">, pool: Pool): Promise<Workspace> {

    // Insert the item data into the database.
    const poolClient = await pool.connect();
    const query = readFileSync(resolve(dirname(import.meta.dirname), "Workspace", "queries", "insert-workspace-row.sql"), "utf8");
    const values = [data.name, data.displayName, data.description];
    const result = await poolClient.query(query, values);
    poolClient.release();

    // Convert the row to an item object.
    const row = result.rows[0];
    const workspace = new Workspace({
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      description: row.description
    }, pool);

    // Return the item.
    return workspace;

  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();
    try {

      const createProjectsTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-workspace-table.sql"), "utf8");
      const createHydratedWorkspacesViewQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-hydrated-workspaces-view.sql"), "utf8");
      await poolClient.query(createProjectsTableQuery);
      await poolClient.query(createHydratedWorkspacesViewQuery);

    } finally {

      poolClient.release();

    }

  }

  /**
   * Gets a workspace by its ID.
   *
   * @param id The ID of the workspace to retrieve.
   */
  static async getFromID(id: string, pool: Pool): Promise<Workspace> {

    // Get the workspace data from the database.
    const poolClient = await pool.connect();
    await poolClient.query("set search_path to app");
    const result = await poolClient.query("select * from workspaces where id = $1", [id]);
    poolClient.release();

    // Convert the data to an workspace object.
    const row = result.rows[0];
    const workspace = new Workspace(row, pool);

    // Return the item.
    return workspace;

  }

  /**
   * Gets a workspace by its name.
   * 
   * @param name The name of the workspace to retrieve.
   */
  static async getFromName(name: string, pool: Pool): Promise<Workspace> {

    // Get the workspace data from the database.
    const poolClient = await pool.connect();
    await poolClient.query("set search_path to app");
    const result = await poolClient.query("select * from workspaces where lower(name) = lower($1)", [name]);
    poolClient.release();

    // Convert the data to an workspace object.
    const row = result.rows[0];
    if (!row) {

      throw new ResourceNotFoundError("Workspace");

    }

    const workspace = new Workspace(row, pool);

    // Return the item.
    return workspace;

  }

  /**
   * Requests the server to delete this workspace.
   */
  async delete(): Promise<void> {

    const poolClient = await this.#pool.connect();
    const query = readFileSync(resolve(dirname(import.meta.dirname), "Workspace", "queries", "delete-workspace-row.sql"), "utf8");
    await poolClient.query(query, [this.id]);
    poolClient.release();

  }

  // /**
  //  * Requests the server to update this workspace.
  //  */
  // async update(data: Partial<WorkspaceProperties>): Promise<void> {

  //   await this.#client.fetch(`/workspaces/${this.id}`, {
  //     method: "PATCH",
  //     body: JSON.stringify(data)
  //   });

  // }

}