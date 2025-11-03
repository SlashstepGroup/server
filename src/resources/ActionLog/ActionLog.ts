import { DatabaseError, Pool } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import ResourceConflictError from "#errors/ResourceConflictError.js";

export enum ActionLogActorType {
  User = "User",
  App = "App"
}

export enum ActionLogTargetResourceType {
  AccessPolicy = "AccessPolicy",
  Action = "Action",
  ActionLog = "ActionLog",
  App = "App",
  AppAuthorization = "AppAuthorization",
  AppAuthorizationCredential = "AppAuthorizationCredential",
  AppCredential = "AppCredential",
  Field = "Field",
  Group = "Group",
  Instance = "Instance",
  Item = "Item",
  ItemConnection = "ItemConnection",
  ItemConnectionType = "ItemConnectionType",
  Milestone = "Milestone",
  Project = "Project",
  Role = "Role",
  Session = "Session",
  User = "User",
  Workspace = "Workspace"
}

export type BaseActionLogProperties = {
  id: string;
  actorType: ActionLogActorType | `${ActionLogActorType}`;
  actorUserID?: string | null;
  actorAppID?: string | null;
  actionID: string;
  actorIPAddress?: string | null;
  targetResourceType: ActionLogTargetResourceType | `${ActionLogTargetResourceType}`;
  targetAccessPolicyID?: string | null;
  targetActionID?: string | null;
  targetActionLogID?: string | null;
  targetAppID?: string | null;
  targetAppAuthorizationID?: string | null;
  targetAppAuthorizationCredentialID?: string | null;
  targetAppCredentialID?: string | null;
  targetFieldID?: string | null;
  targetGroupID?: string | null;
  targetItemID?: string | null;
  targetItemConnectionID?: string | null;
  targetItemConnectionTypeID?: string | null;
  targetMilestoneID?: string | null;
  targetProjectID?: string | null;
  targetRoleID?: string | null;
  targetSessionID?: string | null;
  targetUserID?: string | null;
  targetWorkspaceID?: string | null;
  reason?: string | null;
  errorMessage?: string | null;
}

export type ActionLogQueryResult = {
  id: BaseActionLogProperties["id"];
  action_id: BaseActionLogProperties["actionID"];
  actor_type: BaseActionLogProperties["actorType"];
  actor_user_id: BaseActionLogProperties["actorUserID"];
  actor_app_id: BaseActionLogProperties["actorAppID"];
  actor_ip_address: BaseActionLogProperties["actorIPAddress"];
  target_resource_type: BaseActionLogProperties["targetResourceType"];
  target_access_policy_id: BaseActionLogProperties["targetAccessPolicyID"];
  target_action_id: BaseActionLogProperties["targetActionID"];
  target_action_log_id: BaseActionLogProperties["targetActionLogID"];
  target_app_id: BaseActionLogProperties["targetAppID"];
  target_app_authorization_id: BaseActionLogProperties["targetAppAuthorizationID"];
  target_app_authorization_credential_id: BaseActionLogProperties["targetAppAuthorizationCredentialID"];
  target_app_credential_id: BaseActionLogProperties["targetAppCredentialID"];
  target_field_id: BaseActionLogProperties["targetFieldID"];
  target_group_id: BaseActionLogProperties["targetGroupID"];
  target_item_id: BaseActionLogProperties["targetItemID"];
  target_item_connection_id: BaseActionLogProperties["targetItemConnectionID"];
  target_item_connection_type_id: BaseActionLogProperties["targetItemConnectionTypeID"];
  target_milestone_id: BaseActionLogProperties["targetMilestoneID"];
  target_project_id: BaseActionLogProperties["targetProjectID"];
  target_role_id: BaseActionLogProperties["targetRoleID"];
  target_session_id: BaseActionLogProperties["targetSessionID"];
  target_user_id: BaseActionLogProperties["targetUserID"];
  target_workspace_id: BaseActionLogProperties["targetWorkspaceID"];
  reason: BaseActionLogProperties["reason"];
  error_message: BaseActionLogProperties["errorMessage"];
}

export type InitialActionLogProperties = Omit<BaseActionLogProperties, "id">;

export default class ActionLog {
  
  /** The action log's ID, if applicable. */
  readonly id: BaseActionLogProperties["id"];
  
  /** The action log's actor type. */
  readonly actorType: BaseActionLogProperties["actorType"];

  /** The action log's actor user ID, if applicable. */
  readonly actorUserID: BaseActionLogProperties["actorUserID"];

  /** The action log's actor app ID, if applicable. */
  readonly actorAppID: BaseActionLogProperties["actorAppID"];

  /** The action log's actor IP address, if applicable. */
  readonly actorIPAddress: BaseActionLogProperties["actorIPAddress"];

  /** The action log's target resource type. */
  readonly targetResourceType: BaseActionLogProperties["targetResourceType"];

  /** The action log's target access policy ID, if applicable. */
  readonly targetAccessPolicyID: BaseActionLogProperties["targetAccessPolicyID"];

  /** The action log's target action ID, if applicable. */
  readonly targetActionID: BaseActionLogProperties["targetActionID"];

  /** The action log's target action log ID, if applicable. */
  readonly targetActionLogID: BaseActionLogProperties["targetActionLogID"];

  /** The action log's target app ID, if applicable. */
  readonly targetAppID: BaseActionLogProperties["targetAppID"];

  /** The action log's target app authorization ID, if applicable. */
  readonly targetAppAuthorizationID: BaseActionLogProperties["targetAppAuthorizationID"];

  /** The action log's target app authorization credential ID, if applicable. */
  readonly targetAppAuthorizationCredentialID: BaseActionLogProperties["targetAppAuthorizationCredentialID"];

  /** The action log's target app credential ID, if applicable. */
  readonly targetAppCredentialID: BaseActionLogProperties["targetAppCredentialID"];

  /** The action log's target field ID, if applicable. */
  readonly targetFieldID: BaseActionLogProperties["targetFieldID"];

  /** The action log's target group ID, if applicable. */
  readonly targetGroupID: BaseActionLogProperties["targetGroupID"];

  /** The action log's target item ID, if applicable. */
  readonly targetItemID: BaseActionLogProperties["targetItemID"];

  /** The action log's target item connection ID, if applicable. */
  readonly targetItemConnectionID: BaseActionLogProperties["targetItemConnectionID"];

  /** The action log's target item connection type ID, if applicable. */
  readonly targetItemConnectionTypeID: BaseActionLogProperties["targetItemConnectionTypeID"];

  /** The action log's target milestone ID, if applicable. */
  readonly targetMilestoneID: BaseActionLogProperties["targetMilestoneID"];

  /** The action log's target project ID, if applicable. */
  readonly targetProjectID: BaseActionLogProperties["targetProjectID"];

  /** The action log's target role ID, if applicable. */
  readonly targetRoleID: BaseActionLogProperties["targetRoleID"];

  /** The action log's target session ID, if applicable. */
  readonly targetSessionID: BaseActionLogProperties["targetSessionID"];

  /** The action log's target user ID, if applicable. */
  readonly targetUserID: BaseActionLogProperties["targetUserID"];

  /** The action log's target workspace ID, if applicable. */
  readonly targetWorkspaceID: BaseActionLogProperties["targetWorkspaceID"];

  /** The action log's reason, if applicable. */
  readonly reason: BaseActionLogProperties["reason"];

  /** The action log's error message, if applicable. */
  readonly errorMessage: BaseActionLogProperties["errorMessage"];

  /** The client used to make requests. */
  readonly #pool: Pool;

  constructor(data: BaseActionLogProperties, pool: Pool) {

    this.id = data.id;
    this.actorType = data.actorType;
    this.actorUserID = data.actorUserID;
    this.actorAppID = data.actorAppID;
    this.actorIPAddress = data.actorIPAddress;
    this.targetResourceType = data.targetResourceType;
    this.targetAccessPolicyID = data.targetAccessPolicyID;
    this.targetActionID = data.targetActionID;
    this.targetActionLogID = data.targetActionLogID;
    this.targetAppID = data.targetAppID;
    this.targetAppAuthorizationID = data.targetAppAuthorizationID;
    this.targetAppAuthorizationCredentialID = data.targetAppAuthorizationCredentialID;
    this.targetAppCredentialID = data.targetAppCredentialID;
    this.targetFieldID = data.targetFieldID;
    this.targetGroupID = data.targetGroupID;
    this.targetItemID = data.targetItemID;
    this.targetItemConnectionID = data.targetItemConnectionID;
    this.targetItemConnectionTypeID = data.targetItemConnectionTypeID;
    this.targetMilestoneID = data.targetMilestoneID;
    this.targetProjectID = data.targetProjectID;
    this.targetRoleID = data.targetRoleID;
    this.targetSessionID = data.targetSessionID;
    this.targetUserID = data.targetUserID;
    this.targetWorkspaceID = data.targetWorkspaceID;
    this.reason = data.reason;
    this.errorMessage = data.errorMessage;
    this.#pool = pool;

  }

  /**
   * Requests the server to create a new app.
   *
   * @param data The data for the new app, excluding the ID.
   */
  static async create(data: InitialActionLogProperties, pool: Pool): Promise<ActionLog> {

    // Insert the access policy into the database.
    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-action-log-row.sql"), "utf8");
      const values = [
        data.actorType,
        data.actorUserID,
        data.actorAppID,
        data.actorIPAddress,
        data.targetResourceType,
        data.targetAccessPolicyID,
        data.targetActionID,
        data.targetActionLogID,
        data.targetAppID,
        data.targetAppAuthorizationID,
        data.targetAppAuthorizationCredentialID,
        data.targetAppCredentialID,
        data.targetFieldID,
        data.targetGroupID,
        data.targetItemID,
        data.targetItemConnectionID,
        data.targetItemConnectionTypeID,
        data.targetMilestoneID,
        data.targetProjectID,
        data.targetRoleID,
        data.targetSessionID,
        data.targetUserID,
        data.targetWorkspaceID,
        data.reason,
        data.errorMessage
      ];
      const result = await poolClient.query(query, values);

      // Convert the row to an Action object.
      const actionRow = result.rows[0];
      const actionProperties = ActionLog.getPropertiesFromRow(actionRow);
      const accessPolicy = new ActionLog(actionProperties, pool);

      // Return the access policy.
      return accessPolicy;

    } catch (error) {
      
      if (error instanceof DatabaseError && error.code === "23505") {

        throw new ResourceConflictError("ActionLog");

      }

      throw error;
      
    } finally {

      poolClient.release();

    }

  }

  /**
   * Requests the server for a specific user by ID.
   *
   * @param id The ID of the user to retrieve.
   */
  static async get(id: string, pool: Pool): Promise<ActionLog> {

    // Get the app data from the database.
    const poolClient = await pool.connect();
    const query = readFileSync(resolve(import.meta.dirname, "ActionLog", "queries", "get-action-log-row.sql"), "utf8");
    const result = await poolClient.query(query, [id]);
    poolClient.release();

    // Convert the app data into an App object.
    const row = result.rows[0];

    if (!row) {

      throw new ResourceNotFoundError("ActionLog");

    }

    const app = new ActionLog(ActionLog.getPropertiesFromRow(row), pool);

    // Return the app.
    return app;

  }

  static getPropertiesFromRow(rowData: ActionLogQueryResult): BaseActionLogProperties {
        
    return {
      id: rowData.id,
      actionID: rowData.action_id,
      actorType: rowData.actor_type,
      actorUserID: rowData.actor_user_id,
      actorAppID: rowData.actor_app_id,
      actorIPAddress: rowData.actor_ip_address,
      targetResourceType: rowData.target_resource_type,
      targetAccessPolicyID: rowData.target_access_policy_id,
      targetActionID: rowData.target_action_id,
      targetActionLogID: rowData.target_action_log_id,
      targetAppID: rowData.target_app_id,
      targetAppAuthorizationID: rowData.target_app_authorization_id,
      targetAppAuthorizationCredentialID: rowData.target_app_authorization_credential_id,
      targetAppCredentialID: rowData.target_app_credential_id,
      targetFieldID: rowData.target_field_id,
      targetGroupID: rowData.target_group_id,
      targetItemID: rowData.target_item_id,
      targetItemConnectionID: rowData.target_item_connection_id,
      targetItemConnectionTypeID: rowData.target_item_connection_type_id,
      targetMilestoneID: rowData.target_milestone_id,
      targetProjectID: rowData.target_project_id,
      targetRoleID: rowData.target_role_id,
      targetSessionID: rowData.target_session_id,
      targetUserID: rowData.target_user_id,
      targetWorkspaceID: rowData.target_workspace_id,
      reason: rowData.reason,
      errorMessage: rowData.error_message
    };
    
  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();
    const createAppsTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-action-logs-table.sql"), "utf8");
    await poolClient.query(createAppsTableQuery);
    poolClient.release();

  }

  /**
   * Requests the server to delete this user.
   */
  async delete(): Promise<void> {

    const poolClient = await this.#pool.connect();

    try {

      await poolClient.query("begin;");
      const query = readFileSync(resolve(import.meta.dirname, "queries", "delete-action-log-row.sql"), "utf8");
      await poolClient.query(query, [this.id]);
      await poolClient.query("commit;");

    } finally {

      poolClient.release();

    }

  }

}