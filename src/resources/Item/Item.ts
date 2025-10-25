import { Pool } from "pg";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import SlashstepQLFilterSanitizer from "#utilities/SlashstepQLFilterSanitizer.js";
import Project from "#resources/Project/Project.js";
import Workspace from "#resources/Workspace/Workspace.js";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";

export type ItemProperties = {
  id: string;
  summary: string;
  description?: string;
  projectID: string;
  project?: Project;
  number: string;
}

export type ItemIncludedResourcesConstructorMap = {
  Project?: typeof Project;
  Workspace?: typeof Workspace;
}

/**
 * An Item represents a collection of tasks and milestones that are organized to achieve a specific goal.
 */
export default class Item {

  static readonly name = "Item";

  static readonly allowedQueryFields = {
    id: "id",
    userID: "user_id",
    workspaceID: "workspace_id",
    workspace: "workspace",
    projectID: "project_id",
    project: "project",
    summary: "summary",
    description: "description",
    startDate: "start_date",
    endDate: "end_date",
    milestoneID: "milestone_id",
    milestone: "milestone"
  }

  /** The ID of the item. */
  readonly id: ItemProperties["id"];

  /** The summary of the item. */
  readonly summary: ItemProperties["summary"];

  /** The description of the item, if applicable. */
  readonly description: ItemProperties["description"];

  /** The ID of the project this item belongs to. */
  readonly projectID: ItemProperties["projectID"];

  /** The project this item belongs to. This is */
  readonly project?: Project;

  readonly number: ItemProperties["number"];

  readonly #pool: Pool;

  constructor(data: ItemProperties, pool: Pool) {

    this.id = data.id;
    this.summary = data.summary;
    this.description = data.description;
    this.projectID = data.projectID;
    this.number = data.number;
    this.project = data.project;
    this.#pool = pool;

  }

  /**
   * Requests the server to create a new item.
   *
   * @param data The data for the new item, excluding the ID, creation time, and update time.
   */
  static async create(data: Omit<ItemProperties, "id" | "number">, pool: Pool): Promise<Item> {

    // Insert the item data into the database.
    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-item-row.sql"), "utf8");
      const values = [data.summary, data.description, data.projectID, data.projectID];
      const result = await poolClient.query(query, values);

      // Convert the row to an item object.
      const row = result.rows[0];
      if (!row) {

        throw new ResourceNotFoundError("Item");

      }

      const item = new Item({
        ...row,
        projectID: row.project_id,
        project: data.project
      }, pool);

      // Return the item.
      return item;

    } finally {

      poolClient.release();

    }

  }

  static async initializeTable(pool: Pool): Promise<void> {

    // Insert the item data into the database.
    const poolClient = await pool.connect();
    const createItemsTableQuery = readFileSync(resolve(dirname(import.meta.dirname), "Item", "queries", "create-items-table.sql"), "utf8");
    const createHydratedItemsViewQuery = readFileSync(resolve(dirname(import.meta.dirname), "Item", "queries", "create-hydrated-items-view.sql"), "utf8");
    await poolClient.query(createItemsTableQuery);
    await poolClient.query(createHydratedItemsViewQuery);
    poolClient.release();

  }

  /**
   * Requests the server for a list of items.
   *
   * @param filterQuery The query to filter the items.
   */
  static async list(filterQuery: string, pool: Pool, includedResources?: ItemIncludedResourcesConstructorMap): Promise<Item[]> {

    // Get the list from the database.
    const poolClient = await pool.connect();
    const { whereClause, values } = SlashstepQLFilterSanitizer.sanitize({
      tableName: "hydrated_items", 
      filterQuery, 
      defaultLimit: 1000,
      allowedQueryFields: this.allowedQueryFields
    });
    await poolClient.query("set search_path to app");
    const result = await poolClient.query(`select * from hydrated_items${whereClause ? ` where ${whereClause}` : ""}`, values);
    poolClient.release();

    // Convert the list of rows to AccessPolicy objects.
    const items = result.rows.map((row) => {

      const workspace = includedResources?.Workspace ? new includedResources.Workspace({
        id: row.workspace_id,
        name: row.workspace_name,
        displayName: row.workspace_display_name,
        description: row.workspace_description
      }, pool) : undefined;

      const project = includedResources?.Project ? new includedResources.Project({
        id: row.project_id,
        name: row.project_name,
        displayName: row.project_display_name,
        key: row.project_key,
        description: row.project_description,
        startDate: row.project_start_date,
        endDate: row.project_end_date,
        workspaceID: row.workspace_id,
        workspace
      }, pool) : undefined;

      const item = new Item({
        ...row,
        projectID: row.project_id,
        project
      }, pool);

      return item;
    
    });

    // Return the list.
    return items;

  }

  /**
   * Gets the number of items that match the given query.
   *
   * @param filterQuery The query to filter the items.
   */
  static async count(filterQuery: string, pool: Pool): Promise<number> {

    // Get the list from the database.
    const poolClient = await pool.connect();
    const { whereClause, values } = SlashstepQLFilterSanitizer.sanitize({
      tableName: "hydrated_items", 
      filterQuery, 
      shouldIgnoreOffset: true,
      shouldIgnoreLimit: true,
      allowedQueryFields: this.allowedQueryFields
    });
    const result = await poolClient.query(`select count(*) from hydrated_items${whereClause ? ` where ${whereClause}` : ""}`, values);
    poolClient.release();

    // Convert the list of rows to AccessPolicy objects.
    const count = parseInt(result.rows[0].count, 10);

    // Return the list.
    return count;

  }

  /**
   * Gets an item by its ID.
   *
   * @param id The ID of the item to retrieve.
   */
  static async get(id: string, pool: Pool, includedResources?: ItemIncludedResourcesConstructorMap): Promise<Item> {

    // Get the item data from the database.
    const poolClient = await pool.connect();
    const result = await poolClient.query(`set search_path to app; select * from hydrated_items where id = $1`, [id]);
    poolClient.release();

    // Convert the data to an item object.
    const row = result.rows[0];

    const workspace = includedResources?.Workspace ? new includedResources.Workspace({
      id: row.workspace_id,
      name: row.workspace_name,
      displayName: row.workspace_display_name,
      description: row.workspace_description
    }, pool) : undefined;

    const project = includedResources?.Project ? new includedResources.Project({
      id: row.project_id,
      name: row.project_name,
      displayName: row.project_display_name,
      key: row.project_key,
      description: row.project_description,
      startDate: row.project_start_date,
      endDate: row.project_end_date,
      workspaceID: row.workspace_id,
      workspace
    }, pool) : undefined;

    const item = new Item({
      ...row,
      projectID: row.project_id,
      project
    }, pool);

    // Return the item.
    return item;

  }

  // /**
  //  * Requests the server to delete this item.
  //  */
  // async delete(): Promise<void> {

  //   await this.#client.fetch(`/items/${this.id}`, {
  //     method: "DELETE"
  //   });

  // }

  // /**
  //  * Requests the server to update this project.
  //  *
  //  * @param data The data to update the item with.
  //  */
  // async update(data: Partial<Omit<ItemProperties, "id" | "creationTime" | "updateTime">>): Promise<Item> {

  //   const editedInstanceData = await this.#client.fetch(`/items/${this.id}`, {
  //     method: "PATCH",
  //     body: JSON.stringify(data)
  //   });

  //   return new Item(editedInstanceData, this.#client);

  // }

  // /**
  //  * Requests the server to get an updated version of this project.
  //  */
  // async refresh(): Promise<Item> {

  //   const item = await Item.get(this.id, this.#client);

  //   return item;

  // }

  // async getProject(projectClass: typeof Project): Promise<Project> {

  //   const project = await projectClass.get(this.projectID, this.#client);

  //   return project;

  // }

}