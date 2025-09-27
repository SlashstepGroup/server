
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

  /** Principal can perform this action, along with managing the permission level of other principals. */
  Admin = "Admin"

}

export declare enum AccessPolicyInheritanceLevel {

  /** Child resources will not inherit this access policy. */
  Disabled = "Disabled",

  /** Child resources will inherit this access policy by default. */
  Recommended = "Recommended",

  /** Child resources will inherit this access policy and are required to have the selected permission level at minimum. */
  Required = "Required",

  /** Child resources will inherit this access policy and cannot change the policy. */
  Locked = "Locked"

}

export type AccessPolicyProperties = {
  id: string;
  userID?: string;
  scopeType: ResourceType;
  workspaceID?: string;
  projectID?: string;
  itemID?: string;
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
  
  /** The user ID that this access policy applies to. */
  readonly userID: AccessPolicyProperties["userID"];

  /** The type of resource this access policy applies to, such as "Workspace", "Project", etc. */
  readonly scopeType: AccessPolicyProperties["scopeType"];

  /** The ID of the workspace this access policy applies to. */
  readonly workspaceID: AccessPolicyProperties["workspaceID"];

  /** The ID of the project this access policy applies to. */
  readonly projectID: AccessPolicyProperties["projectID"];

  /** The ID of the item this access policy applies to. */
  readonly itemID: AccessPolicyProperties["itemID"];

  /** The ID of the action this access policy applies to. */
  readonly actionID: AccessPolicyProperties["actionID"];

  /** The level of permission granted by this access policy. */
  readonly permissionLevel: AccessPolicyProperties["permissionLevel"];

  readonly #pool: Pool;

  constructor(data: AccessPolicyProperties, pool: Pool) {

    this.id = data.id;
    this.userID = data.userID;
    this.scopeType = data.scopeType;
    this.workspaceID = data.workspaceID;
    this.projectID = data.projectID;
    this.itemID = data.itemID;
    this.actionID = data.actionID;
    this.permissionLevel = data.permissionLevel;
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
    const values = [data.userID, data.scopeType, data.workspaceID, data.projectID, data.itemID, data.actionID, data.permissionLevel, data.inheritanceLevel];
    const result = await poolClient.query(query, values);
    poolClient.release();

    // Convert the row to an AccessPolicy object.
    const accessPolicy = new AccessPolicy(result.rows[0], pool);

    // Return the access policy.
    return accessPolicy;

  }

  /** 
   * Requests the server to return a list of access policies.
   * @param filterQuery A SlashstepQL filter to apply to the list of access policies.
   */
  static async list(filterQuery: string, pool: Pool): Promise<AccessPolicy[]> {

    // Get the list from the database.
    const poolClient = await pool.connect();
    const { whereClause, values } = SlashstepQLFilterSanitizer.sanitize({tableName: "access_policies", filterQuery, defaultLimit: 1000});
    await poolClient.query(`set search_path to app`);
    const result = await poolClient.query(`select * from access_policies${whereClause ? ` where ${whereClause}` : ""}`, values);
    poolClient.release();

    // Convert the list of rows to AccessPolicy objects.
    const accessPolicies = result.rows.map(row => new AccessPolicy(row, pool));

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
    await poolClient.query(createAccessPoliciesTableQuery);
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

    const accessPolicies = await AccessPolicy.list(`action_id = ${actionID} and user_id = ${userID} and (${scopeArray.join(" or ")})`, pool);

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
