import { DatabaseError, Pool } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import ResourceConflictError from "#errors/ResourceConflictError.js";
import SlashstepQLFilterSanitizer from "#utilities/SlashstepQLFilterSanitizer.js";
import type { default as AccessPolicy, BaseAccessPolicyProperties } from "#resources/AccessPolicy/AccessPolicy.js";
import type { default as Action, BaseActionProperties, InitialWritableActionProperties } from "#resources/Action/Action.js";
import type { default as App, AppProperties } from "#resources/App/App.js";
import type { default as AppAuthorization, BaseAppAuthorizationProperties } from "#resources/AppAuthorization/AppAuthorization.js";
import type { default as AppAuthorizationCredential, BaseAppAuthorizationCredentialProperties } from "#resources/AppAuthorizationCredential/AppAuthorizationCredential.js";
import type { default as AppCredential, BaseAppCredentialProperties } from "#resources/AppCredential/AppCredential.js";
import type { BaseFieldProperties, default as Field } from "#resources/Field/Field.js";
import type { BaseGroupProperties, default as Group } from "#resources/Group/Group.js";
import type { default as Item, ItemProperties } from "#resources/Item/Item.js";
import type { BaseItemConnectionProperties, default as ItemConnection } from "#resources/ItemConnection/ItemConnection.js";
import type { BaseItemConnectionTypeProperties, default as ItemConnectionType } from "#resources/ItemConnectionType/ItemConnectionType.js";
import type { BaseMilestoneProperties, default as Milestone } from "#resources/Milestone/Milestone.js";
import type { default as Project, ProjectProperties } from "#resources/Project/Project.js";
import type { BaseRoleProperties, default as Role } from "#resources/Role/Role.js";
import type { default as Session, SessionProperties } from "#resources/Session/Session.js";
import type { default as User, UserProperties } from "#resources/User/User.js"; 
import type { default as Workspace, WorkspaceProperties } from "#resources/Workspace/Workspace.js";
import BadRequestError from "#errors/BadRequestError.js";

export type ActionLogEntryScopeData = {
  scopedResourceType: "ActionLogEntry";
  actionLogEntryID: string;
}

export enum ActionLogEntryActorType {
  User = "User",
  App = "App"
}

export enum ActionLogEntryTargetResourceType {
  AccessPolicy = "AccessPolicy",
  Action = "Action",
  ActionLogEntry = "ActionLogEntry",
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

export type ActionLogEntryIncludedResourceClassMap = {
  actorUser?: typeof User;
  actorApp?: typeof App;
  targetAccessPolicy?: typeof AccessPolicy;
  targetAction?: typeof Action;
  targetActionLogEntry?: typeof ActionLogEntry;
  targetApp?: typeof App;
  targetAppAuthorization?: typeof AppAuthorization;
  targetAppAuthorizationCredential?: typeof AppAuthorizationCredential;
  targetAppCredential?: typeof AppCredential;
  targetField?: typeof Field;
  targetGroup?: typeof Group;
  targetItem?: typeof Item;
  targetItemConnection?: typeof ItemConnection;
  targetItemConnectionType?: typeof ItemConnectionType;
  targetMilestone?: typeof Milestone;
  targetProject?: typeof Project;
  targetRole?: typeof Role;
  targetSession?: typeof Session;
  targetUser?: typeof User;
  targetWorkspace?: typeof Workspace;
}

export type ActionLogEntryIncludedResourceMap = {
  [key in keyof ActionLogEntryIncludedResourceClassMap]?: InstanceType<NonNullable<ActionLogEntryIncludedResourceClassMap[key]>>;
}

export type BaseActionLogEntryProperties = {
  id: string;
  actorType: ActionLogEntryActorType | `${ActionLogEntryActorType}`;
  actorUserID?: string | null;
  actorAppID?: string | null;
  actionID: string;
  httpRequestID?: string | null;
  targetResourceType: ActionLogEntryTargetResourceType | `${ActionLogEntryTargetResourceType}`;
  targetAccessPolicyID?: string | null;
  targetActionID?: string | null;
  targetActionLogEntryID?: string | null;
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

export type ActionLogEntryQueryResult = {
  id: BaseActionLogEntryProperties["id"];
  action_id: BaseActionLogEntryProperties["actionID"];
  actor_type: BaseActionLogEntryProperties["actorType"];
  actor_user: UserProperties | null;
  actor_user_id: BaseActionLogEntryProperties["actorUserID"];
  actor_app: AppProperties | null;
  actor_app_id: BaseActionLogEntryProperties["actorAppID"];
  http_request_id: BaseActionLogEntryProperties["httpRequestID"];
  target_resource_type: BaseActionLogEntryProperties["targetResourceType"];
  target_access_policy: BaseAccessPolicyProperties | null;
  target_access_policy_id: BaseActionLogEntryProperties["targetAccessPolicyID"];
  target_action: BaseActionProperties | null;
  target_action_id: BaseActionLogEntryProperties["targetActionID"];
  target_action_log_entry: BaseActionLogEntryProperties | null;
  target_action_log_entry_id: BaseActionLogEntryProperties["targetActionLogEntryID"];
  target_app: AppProperties | null;
  target_app_id: BaseActionLogEntryProperties["targetAppID"];
  target_app_authorization: BaseAppAuthorizationProperties | null;
  target_app_authorization_id: BaseActionLogEntryProperties["targetAppAuthorizationID"];
  target_app_authorization_credential: BaseAppAuthorizationCredentialProperties | null;
  target_app_authorization_credential_id: BaseActionLogEntryProperties["targetAppAuthorizationCredentialID"];
  target_app_credential: BaseAppCredentialProperties | null;
  target_app_credential_id: BaseActionLogEntryProperties["targetAppCredentialID"];
  target_field: BaseFieldProperties | null;
  target_field_id: BaseActionLogEntryProperties["targetFieldID"];
  target_group: BaseGroupProperties | null;
  target_group_id: BaseActionLogEntryProperties["targetGroupID"];
  target_item: ItemProperties | null;
  target_item_id: BaseActionLogEntryProperties["targetItemID"];
  target_item_connection: BaseItemConnectionProperties | null;
  target_item_connection_id: BaseActionLogEntryProperties["targetItemConnectionID"];
  target_item_connection_type: BaseItemConnectionTypeProperties | null;
  target_item_connection_type_id: BaseActionLogEntryProperties["targetItemConnectionTypeID"];
  target_milestone: BaseMilestoneProperties | null;
  target_milestone_id: BaseActionLogEntryProperties["targetMilestoneID"];
  target_project: ProjectProperties | null;
  target_project_id: BaseActionLogEntryProperties["targetProjectID"];
  target_role: BaseRoleProperties | null;
  target_role_id: BaseActionLogEntryProperties["targetRoleID"];
  target_session: SessionProperties | null;
  target_session_id: BaseActionLogEntryProperties["targetSessionID"];
  target_user: UserProperties | null;
  target_user_id: BaseActionLogEntryProperties["targetUserID"];
  target_workspace: WorkspaceProperties | null;
  target_workspace_id: BaseActionLogEntryProperties["targetWorkspaceID"];
  reason: BaseActionLogEntryProperties["reason"];
  error_message: BaseActionLogEntryProperties["errorMessage"];
}

export type InitialActionLogEntryProperties = Omit<BaseActionLogEntryProperties, "id">;

export default class ActionLogEntry {

  static readonly allowedQueryFields = {
    id: "id", 
    actorType: "actor_type", 
    actorUserID: "actor_user_id", 
    actorAppID: "actor_app_id",
    actionID: "action_id",
    httpRequestID: "http_request_id", 
    targetResourceType: "target_resource_type", 
    targetAccessPolicyID: "target_access_policy_id", 
    targetActionID: "target_action_id", 
    targetActionLogEntryID: "target_action_log_entry_id", 
    targetAppID: "target_app_id", 
    targetAppAuthorizationID: "target_app_authorization_id", 
    targetAppAuthorizationCredentialID: "target_app_authorization_credential_id", 
    targetAppCredentialID: "target_app_credential_id", 
    targetFieldID: "target_field_id", 
    targetGroupID: "target_group_id", 
    targetItemID: "target_item_id", 
    targetItemConnectionID: "target_item_connection_id", 
    targetItemConnectionTypeID: "target_item_connection_type_id", 
    targetMilestoneID: "target_milestone_id", 
    targetProjectID: "target_project_id", 
    targetRoleID: "target_role_id", 
    targetSessionID: "target_session_id", 
    targetUserID: "target_user_id", 
    targetWorkspaceID: "target_workspace_id", 
    reason: "reason", 
    errorMessage: "error_message"
  };
  
  /** The action log's ID, if applicable. */
  readonly id: BaseActionLogEntryProperties["id"];
  
  /** The action log's actor type. */
  readonly actorType: BaseActionLogEntryProperties["actorType"];

  /** The action log's actor user ID, if applicable. */
  readonly actorUserID: BaseActionLogEntryProperties["actorUserID"];

  /** The action log's actor app ID, if applicable. */
  readonly actorAppID: BaseActionLogEntryProperties["actorAppID"];

  /** The action log's HTTP request ID, if applicable. */
  readonly httpRequestID: BaseActionLogEntryProperties["httpRequestID"];

  /** The action log's target resource type. */
  readonly targetResourceType: BaseActionLogEntryProperties["targetResourceType"];

  /** The action log's target access policy ID, if applicable. */
  readonly targetAccessPolicyID: BaseActionLogEntryProperties["targetAccessPolicyID"];

  /** The action log's target action ID, if applicable. */
  readonly targetActionID: BaseActionLogEntryProperties["targetActionID"];

  /** The action log's target action log ID, if applicable. */
  readonly targetActionLogEntryID: BaseActionLogEntryProperties["targetActionLogEntryID"];

  /** The action log's target app ID, if applicable. */
  readonly targetAppID: BaseActionLogEntryProperties["targetAppID"];

  /** The action log's target app authorization ID, if applicable. */
  readonly targetAppAuthorizationID: BaseActionLogEntryProperties["targetAppAuthorizationID"];

  /** The action log's target app authorization credential ID, if applicable. */
  readonly targetAppAuthorizationCredentialID: BaseActionLogEntryProperties["targetAppAuthorizationCredentialID"];

  /** The action log's target app credential ID, if applicable. */
  readonly targetAppCredentialID: BaseActionLogEntryProperties["targetAppCredentialID"];

  /** The action log's target field ID, if applicable. */
  readonly targetFieldID: BaseActionLogEntryProperties["targetFieldID"];

  /** The action log's target group ID, if applicable. */
  readonly targetGroupID: BaseActionLogEntryProperties["targetGroupID"];

  /** The action log's target item ID, if applicable. */
  readonly targetItemID: BaseActionLogEntryProperties["targetItemID"];

  /** The action log's target item connection ID, if applicable. */
  readonly targetItemConnectionID: BaseActionLogEntryProperties["targetItemConnectionID"];

  /** The action log's target item connection type ID, if applicable. */
  readonly targetItemConnectionTypeID: BaseActionLogEntryProperties["targetItemConnectionTypeID"];

  /** The action log's target milestone ID, if applicable. */
  readonly targetMilestoneID: BaseActionLogEntryProperties["targetMilestoneID"];

  /** The action log's target project ID, if applicable. */
  readonly targetProjectID: BaseActionLogEntryProperties["targetProjectID"];

  /** The action log's target role ID, if applicable. */
  readonly targetRoleID: BaseActionLogEntryProperties["targetRoleID"];

  /** The action log's target session ID, if applicable. */
  readonly targetSessionID: BaseActionLogEntryProperties["targetSessionID"];

  /** The action log's target user ID, if applicable. */
  readonly targetUserID: BaseActionLogEntryProperties["targetUserID"];

  /** The action log's target workspace ID, if applicable. */
  readonly targetWorkspaceID: BaseActionLogEntryProperties["targetWorkspaceID"];

  /** The action log's reason, if applicable. */
  readonly reason: BaseActionLogEntryProperties["reason"];

  /** The action log's error message, if applicable. */
  readonly errorMessage: BaseActionLogEntryProperties["errorMessage"];

  /** The action log's action ID. */
  readonly actionID: BaseActionLogEntryProperties["actionID"];

  /** The client used to make requests. */
  readonly #pool: Pool;

  constructor(data: BaseActionLogEntryProperties, pool: Pool) {

    this.id = data.id;
    this.actorType = data.actorType;
    this.actorUserID = data.actorUserID;
    this.actorAppID = data.actorAppID;
    this.actionID = data.actionID;
    this.httpRequestID = data.httpRequestID;
    this.targetResourceType = data.targetResourceType;
    this.targetAccessPolicyID = data.targetAccessPolicyID;
    this.targetActionID = data.targetActionID;
    this.targetActionLogEntryID = data.targetActionLogEntryID;
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

  static mapIncludedResources(rowData: ActionLogEntryQueryResult, includedResources: ActionLogEntryIncludedResourceClassMap, pool: Pool): ActionLogEntryIncludedResourceMap {

    const mappedResources: ActionLogEntryIncludedResourceMap = {
      actorUser: includedResources.actorUser && rowData.actor_user ? new includedResources.actorUser(rowData.actor_user, pool) : undefined,
      actorApp: includedResources.actorApp && rowData.actor_app ? new includedResources.actorApp(rowData.actor_app, pool) : undefined,
      targetAccessPolicy: includedResources.targetAccessPolicy && rowData.target_access_policy ? new includedResources.targetAccessPolicy(rowData.target_access_policy, pool) : undefined,
      targetAction: includedResources.targetAction && rowData.target_action ? new includedResources.targetAction(rowData.target_action, pool) : undefined,
      targetApp: includedResources.targetApp && rowData.target_app ? new includedResources.targetApp(rowData.target_app, pool) : undefined,
      targetAppAuthorization: includedResources.targetAppAuthorization && rowData.target_app_authorization ? new includedResources.targetAppAuthorization(rowData.target_app_authorization, pool) : undefined,
      targetAppAuthorizationCredential: includedResources.targetAppAuthorizationCredential && rowData.target_app_authorization_credential ? new includedResources.targetAppAuthorizationCredential(rowData.target_app_authorization_credential, {pool}) : undefined,
      targetAppCredential: includedResources.targetAppCredential && rowData.target_app_credential ? new includedResources.targetAppCredential(rowData.target_app_credential, pool) : undefined,
      targetField: includedResources.targetField && rowData.target_field ? new includedResources.targetField(rowData.target_field, pool) : undefined,
      targetGroup: includedResources.targetGroup && rowData.target_group ? new includedResources.targetGroup(rowData.target_group, pool) : undefined,
      targetItem: includedResources.targetItem && rowData.target_item ? new includedResources.targetItem(rowData.target_item, pool) : undefined,
      targetItemConnection: includedResources.targetItemConnection && rowData.target_item_connection ? new includedResources.targetItemConnection(rowData.target_item_connection, pool) : undefined,
      targetItemConnectionType: includedResources.targetItemConnectionType && rowData.target_item_connection_type ? new includedResources.targetItemConnectionType(rowData.target_item_connection_type, pool) : undefined,
      targetMilestone: includedResources.targetMilestone && rowData.target_milestone ? new includedResources.targetMilestone(rowData.target_milestone, pool) : undefined,
      targetProject: includedResources.targetProject && rowData.target_project ? new includedResources.targetProject(rowData.target_project, pool) : undefined,
      targetRole: includedResources.targetRole && rowData.target_role ? new includedResources.targetRole(rowData.target_role, pool) : undefined,
      targetSession: includedResources.targetSession && rowData.target_session ? new includedResources.targetSession(rowData.target_session, pool) : undefined,
      targetUser: includedResources.targetUser && rowData.target_user ? new includedResources.targetUser(rowData.target_user, pool) : undefined,
      targetWorkspace: includedResources.targetWorkspace && rowData.target_workspace ? new includedResources.targetWorkspace(rowData.target_workspace, pool) : undefined
    };

    return mappedResources;

  }

  /**
   * Requests the server to create a new app.
   *
   * @param data The data for the new app, excluding the ID.
   */
  static async create(data: InitialActionLogEntryProperties, pool: Pool): Promise<ActionLogEntry> {

    // Insert the access policy into the database.
    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-action-log-entry-row.sql"), "utf8");
      const values = [
        data.actionID,
        data.actorType,
        data.actorUserID,
        data.actorAppID,
        data.httpRequestID,
        data.targetResourceType,
        data.targetAccessPolicyID,
        data.targetActionID,
        data.targetActionLogEntryID,
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
      const actionProperties = ActionLogEntry.getPropertiesFromRow(actionRow);
      const accessPolicy = new ActionLogEntry(actionProperties, pool);

      // Return the access policy.
      return accessPolicy;

    } catch (error) {
      
      if (error instanceof DatabaseError && error.code === "23505") {

        throw new ResourceConflictError("ActionLogEntry");

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
  static async getByID(id: string, pool: Pool): Promise<ActionLogEntry> {

    // Get the app data from the database.
    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "get-action-log-entry-row.sql"), "utf8");
      const result = await poolClient.query(query, [id]);

      // Convert the app data into an App object.
      const row = result.rows[0];

      if (!row) {

        throw new ResourceNotFoundError("ActionLogEntry");

      }

      const app = new ActionLogEntry(ActionLogEntry.getPropertiesFromRow(row), pool);

      // Return the app.
      return app;

    } catch (error) {
          
      if (error instanceof DatabaseError && error.code === "22P02") {

        throw new BadRequestError("The access policy ID must be a UUID.");

      }

      throw error;
      
    } finally {

      poolClient.release();

    }

  }

  static getPropertiesFromRow(rowData: ActionLogEntryQueryResult): BaseActionLogEntryProperties {
        
    return {
      id: rowData.id,
      actionID: rowData.action_id,
      actorType: rowData.actor_type,
      actorUserID: rowData.actor_user_id,
      actorAppID: rowData.actor_app_id,
      httpRequestID: rowData.http_request_id,
      targetResourceType: rowData.target_resource_type,
      targetAccessPolicyID: rowData.target_access_policy_id,
      targetActionID: rowData.target_action_id,
      targetActionLogEntryID: rowData.target_action_log_entry_id,
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

  static async list(filterQuery: string, pool: Pool, includedResources?: ActionLogEntryIncludedResourceClassMap): Promise<ActionLogEntry[]> {

    // Get the list from the database.
    const poolClient = await pool.connect();

    try {

      const { whereClause, values, limit, offset } = SlashstepQLFilterSanitizer.sanitize({
        tableName: "hydrated_action_log_entries", 
        filterQuery, 
        defaultLimit: 1000, 
        allowedQueryFields: this.allowedQueryFields
      });
      const result = await poolClient.query(`select * from hydrated_action_log_entries${whereClause ? ` where ${whereClause}` : ""}${limit !== undefined ? ` limit ${limit}` : ""}${offset !== undefined ? ` offset ${offset}` : ""}`, values);
      const actionLogs = result.rows.map((row) => {
        
        const actionLogEntryProperties = ActionLogEntry.getPropertiesFromRow(row);
        const mappedResources = includedResources ? ActionLogEntry.mapIncludedResources(row, includedResources, pool) : {};
        const actionLogEntry = new ActionLogEntry({
          ...actionLogEntryProperties,
          ...mappedResources
        }, pool);

        return actionLogEntry;
      
      });

      return actionLogs;

    } finally {

      poolClient.release();

    }

  }
  
  static async count(filterQuery: string, pool: Pool): Promise<number> {

    // Get the list from the database.
    const poolClient = await pool.connect();

    try {

      const { whereClause, values } = SlashstepQLFilterSanitizer.sanitize({
        tableName: "hydrated_action_log_entries",
        filterQuery,
        shouldIgnoreOffset: true,
        shouldIgnoreLimit: true,
        allowedQueryFields: this.allowedQueryFields
      });
      const result = await poolClient.query(`select count(*) from hydrated_action_log_entries${whereClause ? ` where ${whereClause}` : ""}`, values);
      
      // Convert the list of rows to AccessPolicy objects.
      const count = parseInt(result.rows[0].count, 10);

      // Return the list.
      return count;

    } finally {

      poolClient.release();

    }

  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();

    try {

      const createActionLogsTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-action-log-entries-table.sql"), "utf8");
      const createHydratedActionLogsViewQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-hydrated-action-log-entries-view.sql"), "utf8");
      await poolClient.query(createActionLogsTableQuery);
      await poolClient.query(createHydratedActionLogsViewQuery);

    } finally {

      poolClient.release();

    }

  }

  static async initializeActions(actionClass: typeof Action, pool: Pool): Promise<Action[]> {
  
    const actionPropertiesList: InitialWritableActionProperties[] = [
      {
        name: "slashstep.actionLogEntries.get",
        displayName: "Get action log entry",
        description: "View an action log entry."
      },
      {
        name: "slashstep.actionLogEntries.list",
        displayName: "List action log entries",
        description: "List action log entries on a particular scope."
      },
      {
        name: "slashstep.actionLogEntries.create",
        displayName: "Create action log entries",
        description: "Create action log entries on a particular scope."
      },
      {
        name: "slashstep.actionLogEntries.delete",
        displayName: "Delete action log entries",
        description: "Delete action log entries on a particular scope."
      }
    ];

    const actions = [];
    for (const actionProperties of actionPropertiesList) {

      try {

        const action = await actionClass.create(actionProperties, pool);
        actions.push(action);

      } catch (error) {

        if (error instanceof ResourceConflictError) {

          const action = await actionClass.getByName(actionProperties.name, pool);
          actions.push(action);

        } else {

          throw error;

        }

      }

    }

    return actions;

  }

  /**
   * Requests the server to delete this user.
   */
  async delete(): Promise<void> {

    const poolClient = await this.#pool.connect();

    try {

      await poolClient.query("begin;");
      const query = readFileSync(resolve(import.meta.dirname, "queries", "delete-action-log-entry-row.sql"), "utf8");
      await poolClient.query(query, [this.id]);
      await poolClient.query("commit;");

    } finally {

      poolClient.release();

    }

  }

  getScopeData(): ActionLogEntryScopeData {

    return {
      scopedResourceType: "ActionLogEntry",
      actionLogEntryID: this.id
    };

  }

}