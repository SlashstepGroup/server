import SlashstepQLFilterSanitizer from "#utilities/SlashstepQLFilterSanitizer.js";
import { ResourceType } from "#utilities/types.js";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import PermissionDeniedError from "#errors/PermissionDeniedError.js";
import Action from "#resources/Action/Action.js";
import App from "#resources/App/App.js";
import Group from "#resources/Group/Group.js";
import Item from "#resources/Item/Item.js";
import Milestone from "#resources/Milestone/Milestone.js";
import Project from "#resources/Project/Project.js";
import Role from "#resources/Role/Role.js";
import User from "#resources/User/User.js";
import Workspace from "#resources/Workspace/Workspace.js";

export type IncludedResourcesClassMap = {
  principalUser?: typeof User;
  principalGroup?: typeof Group;
  principalRole?: typeof Role;
  scopedAction?: typeof Action;
  "scopedAction.app"?: typeof App;
  scopedApp?: typeof App;
  scopedGroup?: typeof Group;
  scopedItem?: typeof Item;
  "scopedItem.project"?: typeof Project;
  "scopedItem.project.workspace"?: typeof Workspace;
  scopedMilestone?: typeof Milestone;
  "scopedMilestone.project"?: typeof Project;
  "scopedMilestone.project.workspace"?: typeof Workspace;
  scopedProject?: typeof Project;
  "scopedProject.workspace"?: typeof Workspace;
  scopedRole?: typeof Role;
  scopedUser?: typeof User;
  scopedWorkspace?: typeof Workspace;
  action?: typeof Action;
  "action.app"?: typeof App;
}

export type IncludedResourcesMap = {
  principalUser?: User;
  principalGroup?: Group;
  principalRole?: Role;
  scopedAction?: Action;
  scopedApp?: App;
  scopedGroup?: Group;
  scopedItem?: Item;
  scopedMilestone?: Milestone;
  scopedProject?: Project;
  scopedRole?: Role;
  scopedUser?: User;
  scopedWorkspace?: Workspace;
  action?: Action;
}

export enum AccessPolicyPermissionLevel {

  /** Principal cannot perform this action. */
  None = "None",

  /** Principal can perform this action. */
  User = "User",

  /** Principal can perform this action, along with managing the permission levels of other principals. */
  Editor = "Editor",

  /** Principal can perform this action, along with managing the permission levels of other principals in addition to overriding the inheritance requirements of this access policy on child resources. */
  Admin = "Admin"

}

export enum AccessPolicyInheritanceLevel {

  /** Child resources will not inherit this access policy. */
  Disabled = "Disabled",

  /** Child resources will inherit this access policy by default. */
  Enabled = "Enabled",

  /** Child resources will inherit this access policy and are required to have the selected permission level at minimum. */
  Required = "Required"

}

export enum AccessPolicyPrincipalType {
  Group = "Group",
  User = "User",
  Role = "Role"
}

export type AccessPolicyProperties = {
  id: string;
  principalType: AccessPolicyPrincipalType;
  principalUser?: User;
  principalUserID?: string;
  principalGroup?: Group;
  principalGroupID?: string;
  principalRole?: Role;
  principalRoleID?: string;
  scopeType: ResourceType;
  scopedAction?: Action;
  scopedActionID?: string;
  scopedApp?: App;
  scopedAppID?: string;
  scopedGroup?: Group;
  scopedGroupID?: string;
  scopedItem?: Item;
  scopedItemID?: string;
  scopedMilestone?: Milestone;
  scopedMilestoneID?: string;
  scopedProject?: Project;
  scopedProjectID?: string;
  scopedRole?: Role;
  scopedRoleID?: string;
  scopedUser?: User;
  scopedUserID?: string;
  scopedWorkspace?: Workspace;
  scopedWorkspaceID?: string;
  action?: Action;
  actionID: string;
  permissionLevel: AccessPolicyPermissionLevel;
  inheritanceLevel: AccessPolicyInheritanceLevel;
}

export type Scope = {
  itemID?: string;
  projectID?: string;
  workspaceID?: string;
};

export type AccessPolicyTableQueryResult = {
  id: string;
  principal_type: AccessPolicyPrincipalType;
  scope_type: ResourceType;
  action_id: string;
  permission_level: AccessPolicyPermissionLevel;
  inheritance_level: AccessPolicyInheritanceLevel;
}

export type AccessPolicyListQueryResult = {
  id: string;
  principal_type: AccessPolicyPrincipalType;
  principal_user_id?: string;
  principal_user_username?: string;
  principal_user_display_name?: string;
  principal_user_hashed_password?: string;
  principal_group_display_name?: string;
  principal_group_name?: string;
  principal_group_id?: string;
  principal_role_id?: string;
  scope_type: ResourceType;
  scoped_workspace_id?: string;
  scoped_project_id?: string;
  scoped_item_id?: string;
  scoped_action_id?: string;
  scoped_user_id?: string;
  scoped_role_id?: string;
  scoped_group_id?: string;
  scoped_app_id?: string;
  scoped_milestone_id?: string;
  action_id: string;
  permission_level: AccessPolicyPermissionLevel;
  inheritance_level: AccessPolicyInheritanceLevel;
}

/**
 * An AccessPolicy defines the permissions a principal has on a resource.
 */
export default class AccessPolicy {

  static readonly name = "AccessPolicy";

  /** The access policy's ID. */
  readonly id: AccessPolicyProperties["id"];

  readonly actionID: AccessPolicyProperties["actionID"];

  /** The type of principal this access policy applies to, such as "User", "Group", etc. */
  readonly principalType: AccessPolicyProperties["principalType"];

  /** The user principal this access policy applies to. */
  readonly principalUser: AccessPolicyProperties["principalUser"];

  /** The ID of the user principal this access policy applies to. */
  readonly principalUserID: AccessPolicyProperties["principalUserID"];

  /** The group principal this access policy applies to. */
  readonly principalGroup: AccessPolicyProperties["principalGroup"];

  /** The ID of the group principal this access policy applies to. */
  readonly principalGroupID: AccessPolicyProperties["principalGroupID"];

  /** The role principal this access policy applies to. */
  readonly principalRole: AccessPolicyProperties["principalRole"];

  /** The ID of the role principal this access policy applies to. */
  readonly principalRoleID: AccessPolicyProperties["principalRoleID"];

  /** The type of resource this access policy applies to, such as "Workspace", "Project", etc. */
  readonly scopeType: AccessPolicyProperties["scopeType"];

  /** The workspace this access policy applies to. */
  readonly scopedWorkspace: AccessPolicyProperties["scopedWorkspace"];

  /** The ID of the workspace this access policy applies to. */
  readonly scopedWorkspaceID: AccessPolicyProperties["scopedWorkspaceID"];

  /** The project this access policy applies to. */
  readonly scopedProject: AccessPolicyProperties["scopedProject"];

  /** The ID of the project this access policy applies to. */
  readonly scopedProjectID: AccessPolicyProperties["scopedProjectID"];

  /** The item this access policy applies to. */
  readonly scopedItem?: AccessPolicyProperties["scopedItem"];

  /** The ID of the item this access policy applies to. */
  readonly scopedItemID: AccessPolicyProperties["scopedItemID"];

  /** The action this access policy applies to. */
  readonly scopedAction: AccessPolicyProperties["scopedAction"];

  /** The ID of the action this access policy applies to, such as "slashstep.items.create". */
  readonly scopedActionID: AccessPolicyProperties["scopedActionID"];

  /** The role this access policy applies to. */
  readonly scopedRole: AccessPolicyProperties["scopedRole"];

  /** The ID of the role this access policy applies to. */
  readonly scopedRoleID: AccessPolicyProperties["scopedRoleID"];

  /** The group this access policy applies to. */
  readonly scopedGroup: AccessPolicyProperties["scopedGroup"];

  /** The ID of the group this access policy applies to. */
  readonly scopedGroupID: AccessPolicyProperties["scopedGroupID"];

  /** The user this access policy applies to. */
  readonly scopedUser: AccessPolicyProperties["scopedUser"];

  /** The ID of the user this access policy applies to. */
  readonly scopedUserID: AccessPolicyProperties["scopedUserID"];

  /** The level of permission granted by this access policy. */
  readonly permissionLevel: AccessPolicyProperties["permissionLevel"];

  /** The level of inheritance granted by this access policy. */
  readonly inheritanceLevel: AccessPolicyProperties["inheritanceLevel"];

  /** The action this access policy applies to. */
  readonly action: AccessPolicyProperties["action"];

  readonly #pool: Pool;

  constructor(data: AccessPolicyProperties, pool: Pool) {

    this.id = data.id;
    this.principalType = data.principalType;
    this.principalUserID = data.principalUserID;
    this.principalGroupID = data.principalGroupID;
    this.principalRoleID = data.principalRoleID;
    this.scopeType = data.scopeType;
    this.scopedWorkspace = data.scopedWorkspace;
    this.scopedWorkspaceID = data.scopedWorkspaceID;
    this.scopedProject = data.scopedProject;
    this.scopedProjectID = data.scopedProjectID;
    this.scopedItem = data.scopedItem;
    this.scopedItemID = data.scopedItemID;
    this.scopedAction = data.scopedAction;
    this.scopedActionID = data.scopedActionID;
    this.scopedRole = data.scopedRole;
    this.scopedRoleID = data.scopedRoleID;
    this.scopedGroup = data.scopedGroup;
    this.scopedGroupID = data.scopedGroupID;
    this.scopedUser = data.scopedUser;
    this.scopedUserID = data.scopedUserID;
    this.scopedWorkspace = data.scopedWorkspace;
    this.scopedWorkspaceID = data.scopedWorkspaceID;
    this.action = data.action;
    this.permissionLevel = data.permissionLevel;
    this.inheritanceLevel = data.inheritanceLevel;
    this.actionID = data.actionID;
    this.#pool = pool;

  }

  /**
   * Creates an access policy.
   * 
   * @param data The data for the new AccessPolicy, excluding the ID.
   * @returns The created AccessPolicy.
   */
  static async create(data: Omit<AccessPolicyProperties, "id">, pool: Pool): Promise<AccessPolicy> {

    // Insert the access policy into the database.
    const poolClient = await pool.connect();
    const query = readFileSync(resolve(dirname(import.meta.dirname), "AccessPolicy", "queries", "insert-access-policy-row.sql"), "utf8");
    const values = [data.principalType, data.principalUserID, data.principalGroupID, data.principalRoleID, data.scopeType, data.scopedWorkspaceID, data.scopedProjectID, data.scopedItemID, data.scopedActionID, data.scopedRoleID, data.scopedGroupID, data.scopedUserID, data.permissionLevel, data.inheritanceLevel, data.actionID];
    const result = await poolClient.query<AccessPolicyTableQueryResult>(query, values);
    poolClient.release();

    // Convert the row to an AccessPolicy object.
    const rowData = result.rows[0];
    const accessPolicy = new AccessPolicy({
      id: rowData.id,
      principalType: rowData.principal_type,
      scopeType: rowData.scope_type,
      actionID: rowData.action_id,
      permissionLevel: rowData.permission_level,
      inheritanceLevel: rowData.inheritance_level
    }, pool);

    // Return the access policy.
    return accessPolicy;

  }

  static async grantDefaultAdminPermissions(userID: string, pool: Pool): Promise<AccessPolicy[]> {

    const poolClient = await pool.connect();
    const rows = [];
    const adminActions = ["slashstep.users.register", "slashstep.items.create", "slashstep.accessPolicies.admin", "slashstep.sessions.create"];
    for (const adminAction of adminActions) {

      const result = await poolClient.query(readFileSync(resolve(dirname(import.meta.dirname), "AccessPolicy", "queries", "grant-admin-permissions.sql"), "utf8"), [userID, adminAction]);
      rows.push(...result.rows);

    }
    poolClient.release();

    const accessPolicies = rows.map(row => new AccessPolicy({
      id: row.id,
      principalType: row.principal_type,
      principalUserID: row.principal_user_id,
      principalGroupID: row.principal_group_id,
      principalRoleID: row.principal_role_id,
      scopeType: row.scope_type,
      scopedWorkspaceID: row.scoped_workspace_id,
      scopedProjectID: row.scoped_project_id,
      scopedItemID: row.scoped_item_id,
      scopedActionID: row.scoped_action_id,
      scopedRoleID: row.scoped_role_id,
      scopedGroupID: row.scoped_group_id,
      scopedUserID: row.scoped_user_id,
      actionID: row.action_id,
      permissionLevel: row.permission_level,
      inheritanceLevel: row.inheritance_level
    }, pool));

    return accessPolicies;

  }

  private static mapIncludedResources(rowData: AccessPolicyListQueryResult, includedResources: IncludedResourcesClassMap, pool: Pool): IncludedResourcesMap {

    const mappedResources: IncludedResourcesMap = {};

    let User = includedResources.principalUser;
    if (User && rowData.principal_user_id && rowData.principal_user_username && rowData.principal_user_display_name && rowData.principal_user_hashed_password) {

      mappedResources.principalUser = new User({
        id: rowData.principal_user_id,
        username: rowData.principal_user_username,
        displayName: rowData.principal_user_display_name,
        hashedPassword: rowData.principal_user_hashed_password
      }, pool);

    }

    let Group = includedResources.principalGroup;
    if (Group && rowData.principal_group_id && rowData.principal_group_display_name && rowData.principal_group_name) {

      mappedResources.principalGroup = new Group({
        id: rowData.principal_group_id,
        displayName: rowData.principal_group_display_name,
        name: rowData.principal_group_name
      }, pool);

    }

    return mappedResources;

  }

  /** 
   * Requests the server to return a list of access policies.
   * @param filterQuery A SlashstepQL filter to apply to the list of access policies.
   */
  static async list(filterQuery: string, pool: Pool, includedResources: IncludedResourcesClassMap = {}): Promise<AccessPolicy[]> {

    // Get the list from the database.
    const poolClient = await pool.connect();
    const { whereClause, values } = SlashstepQLFilterSanitizer.sanitize({ tableName: "hydrated_access_policies", filterQuery, defaultLimit: 1000 });
    await poolClient.query("set search_path to app");
    const result = await poolClient.query<AccessPolicyListQueryResult>(`select * from hydrated_access_policies${whereClause ? ` where ${whereClause}` : ""}`, values);
    poolClient.release();

    // Convert the list of rows to AccessPolicy objects.
    const accessPolicies: AccessPolicy[] = [];
    for (const row of result.rows) {

      const { principalUser, principalGroup, principalRole, scopedAction, scopedApp, scopedGroup, scopedItem, scopedMilestone, scopedProject, scopedRole, scopedUser, scopedWorkspace, action } = AccessPolicy.mapIncludedResources(row, includedResources, pool);

      const accessPolicy = new AccessPolicy({
        id: row.id,
        principalType: row.principal_type,
        principalUser,
        principalUserID: row.principal_user_id,
        principalGroup,
        principalGroupID: row.principal_group_id,
        principalRole,
        principalRoleID: row.principal_role_id,
        scopeType: row.scope_type,
        scopedWorkspace,
        scopedWorkspaceID: row.scoped_workspace_id,
        scopedProject,
        scopedProjectID: row.scoped_project_id,
        scopedItem,
        scopedItemID: row.scoped_item_id,
        scopedAction,
        scopedActionID: row.scoped_action_id,
        scopedRole,
        scopedRoleID: row.scoped_role_id,
        scopedGroup,
        scopedGroupID: row.scoped_group_id,
        scopedUser,
        scopedUserID: row.scoped_user_id,
        action,
        actionID: row.action_id,
        permissionLevel: row.permission_level,
        inheritanceLevel: row.inheritance_level
      }, pool);

      accessPolicies.push(accessPolicy);

    }

    // Return the list.
    return accessPolicies;

  }

  static async count(filterQuery: string, pool: Pool): Promise<number> {

    // Get the list from the database.
    const poolClient = await pool.connect();
    const { whereClause, values } = SlashstepQLFilterSanitizer.sanitize({
      tableName: "hydrated_access_policies",
      filterQuery,
      shouldIgnoreOffset: true,
      shouldIgnoreLimit: true
    });
    const result = await poolClient.query(`select count(*) from hydrated_access_policies${whereClause ? ` where ${whereClause}` : ""}`, values);
    poolClient.release();

    // Convert the list of rows to AccessPolicy objects.
    const count = parseInt(result.rows[0].count, 10);

    // Return the list.
    return count;

  }

  /**
   * Creates the accessPolicies table in the database.
   * @param pool 
   */
  static async initializeTable(pool: Pool): Promise<void> {

    // Create the table.
    const poolClient = await pool.connect();
    const createAccessPoliciesTableQuery = readFileSync(resolve(dirname(import.meta.dirname), "AccessPolicy", "queries", "create-access-policies-table.sql"), "utf8");
    const createHydratedAccessPoliciesViewQuery = readFileSync(resolve(dirname(import.meta.dirname), "AccessPolicy", "queries", "create-hydrated-access-policies-view.sql"), "utf8");
    await poolClient.query(createAccessPoliciesTableQuery);
    await poolClient.query(createHydratedAccessPoliciesViewQuery);
    poolClient.release();

  }

  /**
   * Requests the server to return a specific access policy by ID.
   * @param id The ID of the access policy to retrieve.
   * @param client The client used to make requests.
   * @returns The requested access policy.
   */
  static async getByDeepestScope(actionID: string, pool: Pool, userID: string | null = null, scope: Scope = {}): Promise<AccessPolicy> {

    // Get the user's access policies.
    const scopeArray = [];
    if (scope.itemID) {

      scopeArray.push(`item_id = ${scope.itemID}`);

    }

    if (scope.projectID) {

      scopeArray.push(`project_id = ${scope.projectID}`);

    }

    if (scope.workspaceID) {

      scopeArray.push(`workspace_id = ${scope.workspaceID}`);

    }

    scopeArray.push("scope_type = 'Instance'");

    const accessPolicies = await AccessPolicy.list(`action_id = '${actionID}' and user_id ${userID ? `= '${userID}'` : "is null"} and (${scopeArray.join(" or ")})`, pool);

    const instanceAccessPolicy = accessPolicies.find(accessPolicy => accessPolicy.scopeType === "Instance");
    const workspaceAccessPolicy = accessPolicies.find(accessPolicy => accessPolicy.scopeType === "Workspace");
    const projectAccessPolicy = accessPolicies.find(accessPolicy => accessPolicy.scopeType === "Project");
    const itemAccessPolicy = accessPolicies.find(accessPolicy => accessPolicy.scopeType === "Item");

    const accessPolicy = itemAccessPolicy ?? projectAccessPolicy ?? workspaceAccessPolicy ?? instanceAccessPolicy;

    if (!accessPolicy) {

      throw new ResourceNotFoundError("AccessPolicy");

    }

    return accessPolicy;

  }

  static async verifyUserPermissions(actionID: string, pool: Pool, userID: string | null = null, requiredPermissionLevel: AccessPolicyPermissionLevel = AccessPolicyPermissionLevel.User, scope: Scope = {}) {

    try {

      const deepestAccessPolicy = await AccessPolicy.getByDeepestScope(actionID, pool, userID, scope);

      if (deepestAccessPolicy.permissionLevel < requiredPermissionLevel) {

        throw new PermissionDeniedError();

      }

    } catch (error) {

      if (error instanceof ResourceNotFoundError) {

        throw new PermissionDeniedError();

      }

      throw error;

    }

  }

  /**
   * Deletes this access policy.
   */
  async delete(): Promise<void> {

    const query = readFileSync(resolve(dirname(import.meta.dirname), "AccessPolicy", "queries", "delete-access-policy.sql"), "utf8");
    const poolClient = await this.#pool.connect();
    await poolClient.query(query, [this.id]);
    poolClient.release();

  }

}
