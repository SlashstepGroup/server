import SlashstepQLFilterSanitizer from "#utilities/SlashstepQLFilterSanitizer.js";
import { ResourceType } from "#utilities/types.js";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";

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

export declare enum AccessPolicyInheritanceLevel {

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
  principalUserID?: string;
  principalGroupID?: string;
  principalRoleID?: string;
  scopeType: ResourceType;
  scopedWorkspaceID?: string;
  scopedProjectID?: string;
  scopedItemID?: string;
  scopedActionID?: string;
  scopedRoleID?: string;
  scopedMilestoneID?: string;
  scopedGroupID?: string;
  scopedUserID?: string;
  scopedAppID?: string;
  actionID: string;
  permissionLevel: AccessPolicyPermissionLevel;
  inheritanceLevel: AccessPolicyInheritanceLevel;
}

export type Scope = {
  itemID?: string;
  projectID?: string;
  workspaceID?: string;
};

/**
 * An AccessPolicy defines the permissions a principal has on a resource.
 */
export default class AccessPolicy {

  static readonly name = "AccessPolicy";

  /** The access policy's ID. */
  readonly id: AccessPolicyProperties["id"];
  
  /** The type of principal this access policy applies to, such as "User", "Group", etc. */
  readonly principalType: AccessPolicyProperties["principalType"];

  /** The ID of the user principal this access policy applies to. */
  readonly principalUserID: AccessPolicyProperties["principalUserID"];

  /** The ID of the group principal this access policy applies to. */
  readonly principalGroupID: AccessPolicyProperties["principalGroupID"];

  /** The ID of the role principal this access policy applies to. */
  readonly principalRoleID: AccessPolicyProperties["principalRoleID"];

  /** The type of resource this access policy applies to, such as "Workspace", "Project", etc. */
  readonly scopeType: AccessPolicyProperties["scopeType"];

  /** The ID of the workspace this access policy applies to. */
  readonly scopedWorkspaceID: AccessPolicyProperties["scopedWorkspaceID"];

  /** The ID of the project this access policy applies to. */
  readonly scopedProjectID: AccessPolicyProperties["scopedProjectID"];

  /** The ID of the item this access policy applies to. */
  readonly scopedItemID: AccessPolicyProperties["scopedItemID"];

  /** The ID of the action this access policy applies to, such as "slashstep.items.create". */
  readonly scopedActionID: AccessPolicyProperties["scopedActionID"];

  /** The ID of the role this access policy applies to. */
  readonly scopedRoleID: AccessPolicyProperties["scopedRoleID"];

  /** The ID of the group this access policy applies to. */
  readonly scopedGroupID: AccessPolicyProperties["scopedGroupID"];

  /** The ID of the user this access policy applies to. */
  readonly scopedUserID: AccessPolicyProperties["scopedUserID"];

  /** The level of permission granted by this access policy. */
  readonly permissionLevel: AccessPolicyProperties["permissionLevel"];

  /** The level of inheritance granted by this access policy. */
  readonly inheritanceLevel: AccessPolicyProperties["inheritanceLevel"];

  readonly #pool: Pool;

  constructor(data: AccessPolicyProperties, pool: Pool) {

    this.id = data.id;
    this.principalType = data.principalType;
    this.principalUserID = data.principalUserID;
    this.principalGroupID = data.principalGroupID;
    this.principalRoleID = data.principalRoleID;
    this.scopeType = data.scopeType;
    this.scopedWorkspaceID = data.scopedWorkspaceID;
    this.scopedProjectID = data.scopedProjectID;
    this.scopedItemID = data.scopedItemID;
    this.scopedActionID = data.scopedActionID;
    this.scopedRoleID = data.scopedRoleID;
    this.scopedGroupID = data.scopedGroupID;
    this.scopedUserID = data.scopedUserID;
    this.permissionLevel = data.permissionLevel;
    this.inheritanceLevel = data.inheritanceLevel;
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
    const values = [data.principalType, data.principalUserID, data.principalGroupID, data.principalRoleID, data.scopeType, data.scopedWorkspaceID, data.scopedProjectID, data.scopedItemID, data.scopedActionID, data.scopedRoleID, data.scopedGroupID, data.scopedUserID, data.permissionLevel, data.inheritanceLevel];
    const result = await poolClient.query(query, values);
    poolClient.release();

    // Convert the row to an AccessPolicy object.
    const accessPolicy = new AccessPolicy(result.rows[0], pool);

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

  /** 
   * Requests the server to return a list of access policies.
   * @param filterQuery A SlashstepQL filter to apply to the list of access policies.
   */
  static async list(filterQuery: string, pool: Pool): Promise<AccessPolicy[]> {

    // Get the list from the database.
    const poolClient = await pool.connect();
    const { whereClause, values } = SlashstepQLFilterSanitizer.sanitize({tableName: "hydrated_access_policies", filterQuery, defaultLimit: 1000});
    await poolClient.query(`set search_path to app`);
    const result = await poolClient.query(`select * from hydrated_access_policies${whereClause ? ` where ${whereClause}` : ""}`, values);
    poolClient.release();

    // Convert the list of rows to AccessPolicy objects.
    const accessPolicies = result.rows.map(row => new AccessPolicy({
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

    // Return the list.
    return accessPolicies;

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
  static async getByDeepestScope(actionID: string, pool: Pool, scope: Scope, userID: string | null = null): Promise<AccessPolicy> {

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

  // /**
  //  * Requests the server to delete this access policy.
  //  */
  // async delete(): Promise<void> {

  //   await this.#client.fetch(`/access-policies/${this.id}`, {
  //     method: "DELETE"
  //   });

  // }

  // /**
  //  * Requests the server to update this access policy.
  //  * 
  //  * @param data The data to update the AccessPolicy with.
  //  */
  // async update(data: Partial<AccessPolicyProperties>): Promise<AccessPolicy> {

  //   const editedAccessPolicyData = await this.#client.fetch(`/access-policies/${this.id}`, {
  //     method: "PATCH",
  //     body: JSON.stringify(data)
  //   });

  //   return new AccessPolicy(editedAccessPolicyData, this.#client);

  // }

}
