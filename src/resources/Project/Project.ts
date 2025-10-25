import Collection, { CollectionProperties } from "#resources/Collection/Collection.js";
import { DatabaseError, Pool } from "pg";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import SlashstepQLFilterSanitizer from "#utilities/SlashstepQLFilterSanitizer.js";
import HTTPError from "#errors/HTTPError.js";
import Workspace from "#resources/Workspace/Workspace.js";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";

export type ProjectProperties = CollectionProperties & {
  key: string;
  workspaceID: string;
  workspace?: Workspace;
};

export type ProjectIncludedResourcesConstructorMap = {
  Workspace?: typeof Workspace;
}

/**
 * A Project represents a collection of tasks and milestones that are organized to achieve a specific goal.
 */
export default class Project extends Collection {

  static readonly name = "Project";

  static readonly allowedQueryFields = {
    id: "id",
    userID: "user_id",
    workspaceID: "workspace_id",
    workspace: "workspace",
    key: "key",
    summary: "summary",
    description: "description",
    startDate: "start_date",
    endDate: "end_date",
    itemID: "item_id",
    item: "item"
  }

  key: ProjectProperties["key"];

  workspace: ProjectProperties["workspace"];

  workspaceID: ProjectProperties["workspaceID"];

  /** The client used to make requests. */
  readonly #pool: Pool;

  constructor(data: ProjectProperties, pool: Pool) {

    super(data);
    this.key = data.key;
    this.workspaceID = data.workspaceID;
    this.workspace = data.workspace;
    this.#pool = pool;

  }

  /**
   * Requests the server to create a new item.
   *
   * @param data The data for the new item, excluding the ID, creation time, and update time.
   */
  static async create(data: Omit<ProjectProperties, "id">, pool: Pool): Promise<Project> {

    // Insert the item data into the database.
    const poolClient = await pool.connect();

    try {

      const insertProjectRowQuery = readFileSync(resolve(import.meta.dirname, "queries", "insert-project-row.sql"), "utf8");
      const values = [data.name, data.displayName, data.key, data.description, data.startDate, data.endDate, data.workspaceID];
      const result = await poolClient.query(insertProjectRowQuery, values);
      await poolClient.query("set search_path to app");
      await poolClient.query(`select create_project_sequence($1);`, [result.rows[0].id]);

      // Convert the row to a project object.
      const row = result.rows[0];
      const project = new Project({
        ...row,
        workspaceID: row.workspace_id,
        workspace: data.workspace
      }, pool);

      // Return the project.
      return project;

    } finally {

      poolClient.release();

    }

  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();

    try {

      const createProjectsTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-projects-table.sql"), "utf8");
      const createHydratedProjectsViewQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-hydrated-projects-view.sql"), "utf8");
      const createProjectSequenceFunctionQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-project-sequence.sql"), "utf8");
      await poolClient.query(createProjectsTableQuery);
      await poolClient.query(createHydratedProjectsViewQuery);
      await poolClient.query(createProjectSequenceFunctionQuery);

    } finally {

      poolClient.release();

    }

  }

  /**
   * Requests the server for a list of projects.
   *
   * @param filterQuery The query to filter the projects.
   */
  static async list(filterQuery: string, pool: Pool): Promise<Project[]> {

    // Get the list from the database.
    const poolClient = await pool.connect();
    const { whereClause, values } = SlashstepQLFilterSanitizer.sanitize({
      tableName: "hydrated_projects", 
      filterQuery, 
      defaultLimit: 1000,
      allowedQueryFields: this.allowedQueryFields
    });
    await poolClient.query(`set search_path to app`);
    const result = await poolClient.query(`select * from projects${whereClause ? ` where ${whereClause}` : ""}`, values);
    poolClient.release();

    // Convert the list of rows to AccessPolicy objects.
    const items = result.rows.map(row => new Project(row, pool));

    // Return the list.
    return items;

  }

  /**
   * Gets a project by its ID.
   *
   * @param id The ID of the project to get.
   * @param pool The pool to use to connect to the database.
   */
  static async getByID(id: string, pool: Pool, includedResources?: ProjectIncludedResourcesConstructorMap): Promise<Project> {

    try {

      // Get the list from the database.
      const poolClient = await pool.connect();
      await poolClient.query("set search_path to app");
      const result = await poolClient.query("select * from hydrated_projects where id = $1", [id]);
      poolClient.release();

      if (result.rows.length === 0) {

        throw new HTTPError(404, "Project not found.");

      }

      // Convert the project data into a Project object.
      const row = result.rows[0];
      if (!row) {

        throw new ResourceNotFoundError("Project");

      }

      const project = new Project({
        ...row,
        workspaceID: row.workspace_id,
        workspace: includedResources?.Workspace ? new includedResources.Workspace({
          id: row.workspace_id,
          name: row.workspace_name,
          displayName: row.workspace_display_name,
          description: row.workspace_description
        }, pool) : undefined
      }, pool);

      // Return the project.
      return project;

    } catch (error) {

      if (error instanceof DatabaseError && error.code === "22P02") {

        throw new ResourceNotFoundError("Project");

      }

      throw error;

    }

  }

  async delete(): Promise<void> {

    const poolClient = await this.#pool.connect();
    await poolClient.query("set search_path to app");
    await poolClient.query("delete from projects where id = $1", [this.id]);
    poolClient.release();

  }

}
