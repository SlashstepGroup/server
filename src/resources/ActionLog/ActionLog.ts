import { Pool } from "pg";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";

export type ActionLogProperties = {
  id: string;
  actorID?: string;
  actionID: string;
  actorIPAddress?: string;
  targetItemID?: string;
  targetProjectID?: string;
  targetWorkspaceID?: string;
  targetAccessPolicyID?: string;
  targetUserID?: string;
  reason?: string;
}

export default class ActionLog {
  
  /** The action log's ID. */
  readonly id: ActionLogProperties["id"];

  /** The action log's action ID. */
  readonly actionID: ActionLogProperties["actionID"];

  /** The action log's actor ID. */
  readonly actorID: ActionLogProperties["actorID"];

  /** The action log's actor IP address, if applicable. */
  readonly actorIPAddress: ActionLogProperties["actorIPAddress"];

  /** The action log's target item ID, if applicable. */
  readonly targetItemID: ActionLogProperties["targetItemID"];

  /** The action log's target project ID, if applicable. */
  readonly targetProjectID: ActionLogProperties["targetProjectID"];

  /** The action log's target workspace ID, if applicable. */
  readonly targetWorkspaceID: ActionLogProperties["targetWorkspaceID"];

  /** The action log's target access policy ID, if applicable. */
  readonly targetAccessPolicyID: ActionLogProperties["targetAccessPolicyID"];

  /** The action log's target user ID, if applicable. */
  readonly targetUserID: ActionLogProperties["targetUserID"];

  /** The action log's reason, if applicable. */
  readonly reason: ActionLogProperties["reason"];

  /** The client used to make requests. */
  readonly #pool: Pool;

  constructor(data: ActionLogProperties, pool: Pool) {

    this.id = data.id;
    this.actionID = data.actionID;
    this.actorID = data.actorID;
    this.actorIPAddress = data.actorIPAddress;
    this.targetItemID = data.targetItemID;
    this.targetProjectID = data.targetProjectID;
    this.targetWorkspaceID = data.targetWorkspaceID;
    this.targetAccessPolicyID = data.targetAccessPolicyID;
    this.targetUserID = data.targetUserID;
    this.reason = data.reason;
    this.#pool = pool;

  }

  /**
   * Requests the server to create a new app.
   *
   * @param data The data for the new app, excluding the ID.
   */
  static async create(data: Omit<ActionLogProperties, "id">, pool: Pool): Promise<ActionLog> {

    // Insert the action log data into the database.
    const poolClient = await pool.connect();
    const query = readFileSync(resolve(dirname(import.meta.dirname), "ActionLog", "queries", "insert-action-log-row.sql"), "utf8");
    const values = [data.actionID, data.actorID, data.actorIPAddress, data.targetItemID, data.targetProjectID, data.targetWorkspaceID, data.targetAccessPolicyID, data.targetUserID, data.reason];
    const result = await poolClient.query(query, values);
    poolClient.release();

    // Convert the row to an action log object.
    const row = result.rows[0];
    const actionLog = new ActionLog({
      id: row.id,
      actionID: row.action_id,
      actorID: row.actor_id,
      actorIPAddress: row.actor_ip_address,
      targetItemID: row.target_item_id,
      targetProjectID: row.target_project_id,
      targetWorkspaceID: row.target_workspace_id,
      targetAccessPolicyID: row.target_access_policy_id,
      targetUserID: row.target_user_id,
      reason: row.reason
    }, pool);

    // Return the user.
    return actionLog;

  }

  /**
   * Requests the server for a specific user by ID.
   *
   * @param id The ID of the user to retrieve.
   */
  static async get(id: string, pool: Pool): Promise<ActionLog> {

    // Get the app data from the database.
    const poolClient = await pool.connect();
    const query = readFileSync(resolve(dirname(import.meta.dirname), "ActionLog", "queries", "get-action-log-row.sql"), "utf8");
    const result = await poolClient.query(query, [id]);
    poolClient.release();

    // Convert the app data into an App object.
    const row = result.rows[0];

    if (!row) {

      throw new ResourceNotFoundError("ActionLog");

    }

    const app = new ActionLog({
      id: row.id,
      actionID: row.action_id,
      actorID: row.actor_id,
      actorIPAddress: row.actor_ip_address,
      targetItemID: row.target_item_id,
      targetProjectID: row.target_project_id,
      targetWorkspaceID: row.target_workspace_id,
      targetAccessPolicyID: row.target_access_policy_id,
      targetUserID: row.target_user_id,
      reason: row.reason
    }, pool);

    // Return the app.
    return app;

  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();
    const createAppsTableQuery = readFileSync(resolve(dirname(import.meta.dirname), "ActionLog", "queries", "create-action-logs-table.sql"), "utf8");
    await poolClient.query(createAppsTableQuery);
    poolClient.release();

  }

  /**
   * Requests the server to delete this user.
   */
  async delete(): Promise<void> {

    const poolClient = await this.#pool.connect();
    const query = readFileSync(resolve(dirname(import.meta.dirname), "ActionLog", "queries", "delete-action-log-row.sql"), "utf8");
    await poolClient.query(query, [this.id]);
    poolClient.release();

  }

}