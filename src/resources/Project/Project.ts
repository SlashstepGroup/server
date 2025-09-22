import Collection, { CollectionProperties } from "#resources/Collection/Collection.js";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import SlashstepQLFilterSanitizer from "#utilities/SlashstepQLFilterSanitizer.js";
import HTTPError from "#errors/HTTPError.js";

export type ProjectProperties = CollectionProperties & {
  key: string;
};

/**
 * A Project represents a collection of tasks and milestones that are organized to achieve a specific goal.
 */
export default class Project extends Collection {

  /** The client used to make requests. */
  readonly #pool: Pool;

  constructor(data: ProjectProperties, pool: Pool) {

    super(data);
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
    const insertProjectRowQuery = readFileSync(resolve(dirname(import.meta.dirname), "Project", "queries", "insert-project-row.pgsql"), "utf8");
    const values = [data.name, data.displayName, data.key, data.description, data.startDate, data.endDate];
    const result = await poolClient.query(insertProjectRowQuery, values);
    await poolClient.query(`select create_project_sequence($1);`, [result.rows[0].id]);
    poolClient.release();

    // Convert the row to a project object.
    const project = new Project(result.rows[0], pool);

    // Return the project.
    return project;

  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();
    const createProjectsTableQuery = readFileSync(resolve(dirname(import.meta.dirname), "Project", "queries", "create-projects-table.pgsql"), "utf8");
    const createCamelcaseProjectsViewQuery = readFileSync(resolve(dirname(import.meta.dirname), "Project", "queries", "create-camelcase-projects-view.pgsql"), "utf8");
    await poolClient.query(createProjectsTableQuery);
    await poolClient.query(createCamelcaseProjectsViewQuery);
    poolClient.release();

  }

  /**
   * Requests the server for a list of projects.
   *
   * @param filterQuery The query to filter the projects.
   */
  static async list(filterQuery: string, pool: Pool): Promise<Project[]> {

    // Get the list from the database.
    const poolClient = await pool.connect();
    const { query, values } = SlashstepQLFilterSanitizer.sanitize({tableName: "camelcase_projects_view", filterQuery, defaultLimit: 1000});
    const result = await poolClient.query(query, values);
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
  static async getByID(id: string, pool: Pool): Promise<Project> {

    // Get the list from the database.
    const poolClient = await pool.connect();
    const result = await poolClient.query("select * from projects where id = $1", [id]);
    poolClient.release();

    if (result.rows.length === 0) {

      throw new HTTPError(404, "Project not found.");

    }

    // Convert the project data into a Project object.
    const project = new Project(result.rows[0], pool);

    // Return the project.
    return project;

  }

}
