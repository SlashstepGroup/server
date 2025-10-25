import SlashstepQLFilterSanitizer from "#utilities/SlashstepQLFilterSanitizer.js";
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

export type AccessPolicyIncludedResourceClassMap = {
  principalUser?: typeof User;
  principalGroup?: typeof Group;
  principalRole?: typeof Role;
  scopedAction?: typeof Action;
  scopedApp?: typeof App;
  scopedGroup?: typeof Group;
  scopedItem?: typeof Item;
  scopedMilestone?: typeof Milestone;
  scopedProject?: typeof Project;
  scopedRole?: typeof Role;
  scopedUser?: typeof User;
  scopedWorkspace?: typeof Workspace;
  action?: typeof Action;
}

export type AccessPolicyIncludedResourceMap = {
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

export type BaseAccessPolicyProperties = {
  id: string;
  principalType: AccessPolicyPrincipalType;
  principalUserID?: string;
  principalGroupID?: string;
  principalRoleID?: string;
  scopedResourceType: AccessPolicyScopedResourceType;
  scopedActionID?: string;
  scopedAppID?: string;
  scopedGroupID?: string;
  scopedItemID?: string;
  scopedMilestoneID?: string;
  scopedProjectID?: string;
  scopedRoleID?: string;
  scopedUserID?: string;
  scopedWorkspaceID?: string;
  actionID: string;
  permissionLevel: AccessPolicyPermissionLevel;
  inheritanceLevel: AccessPolicyInheritanceLevel;
}

export type ExtendedAccessPolicyProperties = BaseAccessPolicyProperties & {
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

export type EditableAccessPolicyProperties = Omit<BaseAccessPolicyProperties, "id" | "principalType" | "principalUserID" | "principalGroupID" | "principalRoleID" | "scopedResourceType" | "scopedActionID" | "scopedAppID" | "scopedGroupID" | "scopedItemID" | "scopedMilestoneID" | "scopedProjectID" | "scopedRoleID" | "scopedUserID" | "scopedWorkspaceID" | "actionID">;

export type Scope = {
  itemID?: string;
  projectID?: string;
  workspaceID?: string;
};

export enum AccessPolicyScopedResourceType {
  App = "App",
  Action = "Action",
  Instance = "Instance",
  Workspace = "Workspace",
  Project = "Project",
  Iteration = "Iteration",
  Item = "Item",
  Group = "Group",
  Milestone = "Milestone",
  Role = "Role",
  User = "User"
}

export type AccessPolicyTableQueryResult = {
  id: string;
  principal_type: AccessPolicyPrincipalType;
  scoped_resource_type: AccessPolicyScopedResourceType;
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
  scoped_resource_type: AccessPolicyScopedResourceType;
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

  static readonly allowedQueryFields = {
    id: "id", 
    userID: "user_id", 
    scoped_resource_type: "scoped_resource_type",
    workspaceID: "workspace_id", 
    projectID: "project_id", 
    itemID: "item_id", 
    actionID: "action_id", 
    permissionLevel: "permission_level", 
    inheritanceLevel: "inheritance_level",
    principalUserID: "principal_user_id",
    principalGroupID: "principal_group_id",
    principalRoleID: "principal_role_id"
  }

  /** The access policy's ID. */
  readonly id: BaseAccessPolicyProperties["id"];

  readonly actionID: BaseAccessPolicyProperties["actionID"];

  /** The type of principal this access policy applies to, such as "User", "Group", etc. */
  readonly principalType: BaseAccessPolicyProperties["principalType"];

  /** The user principal this access policy applies to. */
  readonly principalUser: ExtendedAccessPolicyProperties["principalUser"];

  /** The ID of the user principal this access policy applies to. */
  readonly principalUserID: BaseAccessPolicyProperties["principalUserID"];

  /** The group principal this access policy applies to. */
  readonly principalGroup: ExtendedAccessPolicyProperties["principalGroup"];

  /** The ID of the group principal this access policy applies to. */
  readonly principalGroupID: BaseAccessPolicyProperties["principalGroupID"];

  /** The role principal this access policy applies to. */
  readonly principalRole: ExtendedAccessPolicyProperties["principalRole"];

  /** The ID of the role principal this access policy applies to. */
  readonly principalRoleID: BaseAccessPolicyProperties["principalRoleID"];

  /** The type of resource this access policy applies to, such as "Workspace", "Project", etc. */
  readonly scopedResourceType: BaseAccessPolicyProperties["scopedResourceType"];

  /** The workspace this access policy applies to. */
  readonly scopedWorkspace: ExtendedAccessPolicyProperties["scopedWorkspace"];

  /** The ID of the workspace this access policy applies to. */
  readonly scopedWorkspaceID: BaseAccessPolicyProperties["scopedWorkspaceID"];

  /** The project this access policy applies to. */
  readonly scopedProject: ExtendedAccessPolicyProperties["scopedProject"];

  /** The ID of the project this access policy applies to. */
  readonly scopedProjectID: BaseAccessPolicyProperties["scopedProjectID"];

  /** The app this access policy applies to. */
  readonly scopedApp: ExtendedAccessPolicyProperties["scopedApp"];

  /** The ID of the app this access policy applies to. */
  readonly scopedAppID: BaseAccessPolicyProperties["scopedAppID"];

  /** The item this access policy applies to. */
  readonly scopedItem?: ExtendedAccessPolicyProperties["scopedItem"];

  /** The ID of the item this access policy applies to. */
  readonly scopedItemID: BaseAccessPolicyProperties["scopedItemID"];

  /** The action this access policy applies to. */
  readonly scopedAction: ExtendedAccessPolicyProperties["scopedAction"];

  /** The ID of the action this access policy applies to, such as "slashstep.items.create". */
  readonly scopedActionID: BaseAccessPolicyProperties["scopedActionID"];

  /** The role this access policy applies to. */
  readonly scopedRole: ExtendedAccessPolicyProperties["scopedRole"];

  /** The ID of the role this access policy applies to. */
  readonly scopedRoleID: BaseAccessPolicyProperties["scopedRoleID"];

  /** The group this access policy applies to. */
  readonly scopedGroup: ExtendedAccessPolicyProperties["scopedGroup"];

  /** The ID of the group this access policy applies to. */
  readonly scopedGroupID: BaseAccessPolicyProperties["scopedGroupID"];

  /** The user this access policy applies to. */
  readonly scopedUser: ExtendedAccessPolicyProperties["scopedUser"];

  /** The ID of the user this access policy applies to. */
  readonly scopedUserID: BaseAccessPolicyProperties["scopedUserID"];

  /** The milestone this access policy applies to. */
  readonly scopedMilestone: ExtendedAccessPolicyProperties["scopedMilestone"];

  /** The ID of the milestone this access policy applies to. */
  readonly scopedMilestoneID: BaseAccessPolicyProperties["scopedMilestoneID"];

  /** The level of permission granted by this access policy. */
  readonly permissionLevel: BaseAccessPolicyProperties["permissionLevel"];

  /** The level of inheritance granted by this access policy. */
  readonly inheritanceLevel: BaseAccessPolicyProperties["inheritanceLevel"];

  /** The action this access policy applies to. */
  readonly action: ExtendedAccessPolicyProperties["action"];

  readonly #pool: Pool;

  constructor(data: ExtendedAccessPolicyProperties, pool: Pool) {

    this.id = data.id;
    this.principalType = data.principalType;
    this.principalUserID = data.principalUserID;
    this.principalGroupID = data.principalGroupID;
    this.principalRoleID = data.principalRoleID;
    this.scopedResourceType = data.scopedResourceType;
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
    this.scopedApp = data.scopedApp;
    this.scopedAppID = data.scopedAppID;
    this.scopedMilestone = data.scopedMilestone;
    this.scopedMilestoneID = data.scopedMilestoneID;
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
  static async create(data: Omit<BaseAccessPolicyProperties, "id">, pool: Pool): Promise<AccessPolicy> {

    // Insert the access policy into the database.
    const poolClient = await pool.connect();

    const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-access-policy-row.sql"), "utf8");
    const values = [data.principalType, data.principalUserID, data.principalGroupID, data.principalRoleID, data.scopedResourceType, data.scopedWorkspaceID, data.scopedProjectID, data.scopedItemID, data.scopedActionID, data.scopedRoleID, data.scopedGroupID, data.scopedUserID, data.permissionLevel, data.inheritanceLevel, data.actionID];
    const result = await poolClient.query<AccessPolicyTableQueryResult>(query, values);
    poolClient.release();

    // Convert the row to an AccessPolicy object.
    const rowData = result.rows[0];
    const accessPolicy = new AccessPolicy({
      id: rowData.id,
      principalType: rowData.principal_type,
      scopedResourceType: rowData.scoped_resource_type,
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
      scopedResourceType: row.scoped_resource_type,
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

  private static mapIncludedResources(rowData: AccessPolicyListQueryResult, includedResources: AccessPolicyIncludedResourceClassMap, pool: Pool): AccessPolicyIncludedResourceMap {

    const mappedResources: AccessPolicyIncludedResourceMap = {};

    let User = includedResources.principalUser ?? includedResources.scopedUser;
    if (User && rowData.principal_user_id && rowData.principal_user_username && rowData.principal_user_display_name && rowData.principal_user_hashed_password) {

      mappedResources.principalUser = new User({
        id: rowData.principal_user_id,
        username: rowData.principal_user_username,
        displayName: rowData.principal_user_display_name,
        hashedPassword: rowData.principal_user_hashed_password
      }, pool);

    }

    let Group = includedResources.principalGroup ?? includedResources.scopedGroup;
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
  static async list(filterQuery: string, pool: Pool, includedResources: AccessPolicyIncludedResourceClassMap = {}): Promise<AccessPolicy[]> {

    // Get the list from the database.
    const { whereClause, values } = SlashstepQLFilterSanitizer.sanitize({ 
      tableName: "hydrated_access_policies", 
      filterQuery, 
      defaultLimit: 1000, 
      allowedQueryFields: this.allowedQueryFields
    });
    const finalQuery = `select * from hydrated_access_policies${whereClause ? ` where ${whereClause}` : ""}`;
    
    let result;
    const poolClient = await pool.connect();

    try {

      result = await poolClient.query<AccessPolicyListQueryResult>(finalQuery, values);

    } finally {

      poolClient.release();

    }

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
        scopedResourceType: row.scoped_resource_type,
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
      shouldIgnoreLimit: true,
      allowedQueryFields: this.allowedQueryFields
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

    scopeArray.push("scoped_resource_type = 'Instance'");

    const accessPolicies = await AccessPolicy.list(`action_id = '${actionID}' and user_id ${userID ? `= '${userID}'` : "is null"} and (${scopeArray.join(" or ")})`, pool);

    const instanceAccessPolicy = accessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === "Instance");
    const workspaceAccessPolicy = accessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === "Workspace");
    const projectAccessPolicy = accessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === "Project");
    const itemAccessPolicy = accessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === "Item");

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
