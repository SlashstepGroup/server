import { Pool } from "pg";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import SlashstepQLFilterSanitizer from "#utilities/SlashstepQLFilterSanitizer.js";
import User from "#resources/User/User.js";

export type ActionProperties = {
  id: string;
  name: string;
  appID?: string;
  displayName: string;
  description: string;
}

/**
 * An Action is a type of process that is performed by an actor.
 */
export default class Action {

  /** The action's ID. */
  readonly id: ActionProperties["id"];

  /** The action's name. */
  readonly name: ActionProperties["name"];

  /** The action's display name. */
  readonly displayName: ActionProperties["displayName"];

  /** The action's description. */
  readonly description: ActionProperties["description"];

  /** The action's application ID. If there isn't one, then the action is directly associated with the instance. */
  readonly appID: ActionProperties["appID"];

  /** The client used to make requests. */
  readonly #pool: Pool;

  constructor(data: ActionProperties, pool: Pool) {

    this.id = data.id;
    this.name = data.name;
    this.displayName = data.displayName;
    this.description = data.description;
    this.appID = data.appID;
    this.#pool = pool;

  }

  /**
   * Requests the server to create a new action.
   * 
   * @param data The data for the new Action, excluding the ID.
   */
  static async create(data: Omit<ActionProperties, "id">, pool: Pool): Promise<Action> {

    // Insert the access policy into the database.
    const poolClient = await pool.connect();
    const query = readFileSync(resolve(dirname(import.meta.dirname), "Action", "queries", "insert-action-row.sql"), "utf8");
    const values = [data.name, data.displayName, data.description, data.appID];
    const result = await poolClient.query(query, values);
    poolClient.release();

    // Convert the row to an Action object.
    const accessPolicy = new Action(result.rows[0], pool);

    // Return the access policy.
    return accessPolicy;

  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();
    const createActionsTableQuery = readFileSync(resolve(dirname(import.meta.dirname), "Action", "queries", "create-actions-table.sql"), "utf8");
    const createHydratedActionsViewQuery = readFileSync(resolve(dirname(import.meta.dirname), "Action", "queries", "create-hydrated-actions-view.sql"), "utf8");
    const insertDefaultActionsQuery = readFileSync(resolve(dirname(import.meta.dirname), "Action", "queries", "insert-default-actions.sql"), "utf8");
    await poolClient.query(createActionsTableQuery);
    await poolClient.query(insertDefaultActionsQuery);
    await poolClient.query(createHydratedActionsViewQuery);
    poolClient.release();

  }

  /**
   * Requests the server to return a specific action by ID.
   * @param id The ID of the action to retrieve.
   * @returns The requested action.
   */
  static async getByID(id: string, pool: Pool): Promise<Action> {

    // Get the action data from the database.
    const poolClient = await pool.connect();
    const query = readFileSync(resolve(dirname(import.meta.dirname), "Action", "queries", "get-action-row-by-id.sql"), "utf8");
    const result = await poolClient.query(query, [id]);
    poolClient.release();

    // Make sure the action data exists.
    const data = result.rows[0];

    if (!data) {

      throw new ResourceNotFoundError("Action");

    }

    // Return the action.
    const action = new Action(data, pool);
    return action;

  }

  /**
   * Requests the server to return a specific action by ID.
   * @param id The ID of the action to retrieve.
   * @returns The requested action.
   */
  static async getByName(name: string, pool: Pool): Promise<Action> {

    // Get the action data from the database.
    const poolClient = await pool.connect();
    const query = readFileSync(resolve(dirname(import.meta.dirname), "Action", "queries", "get-action-row-by-name.sql"), "utf8");
    const result = await poolClient.query(query, [name]);
    poolClient.release();

    // Make sure the action data exists.
    const data = result.rows[0];

    if (!data) {

      throw new ResourceNotFoundError("Action");

    }

    // Return the action.
    const action = new Action(data, pool);
    return action;

  }

  /** 
   * Requests the server to return a list of actions.
   * 
   * @param filterQuery A SlashstepQL filter to apply to the list of actions.
   */
  static async list(filterQuery: string, pool: Pool): Promise<Action[]> {

    // Get the list from the database.
    const poolClient = await pool.connect();
    const { whereClause, values } = SlashstepQLFilterSanitizer.sanitize({tableName: "hydrated_actions", filterQuery, defaultLimit: 1000});
    await poolClient.query(`set search_path to app`);
    const result = await poolClient.query(`select * from hydrated_actions${whereClause ? ` where ${whereClause}` : ""}`, values);
    poolClient.release();

    // Convert the list of rows to AccessPolicy objects.
    const items = result.rows.map(row => new Action(row, pool));

    // Return the list.
    return items;

  }

  /**
   * Requests the server to delete this action.
   * 
   * This method only works for app accounts.
   */
  async delete(): Promise<void> {

    const query = readFileSync(resolve(dirname(import.meta.dirname), "Action", "queries", "delete-action-row.sql"), "utf8");
    const poolClient = await this.#pool.connect();
    await poolClient.query(query, [this.id]);
    poolClient.release();

  }

}