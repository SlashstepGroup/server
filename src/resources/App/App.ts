import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import ForbiddenError from "#errors/ForbiddenError.js";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";
import Principal, { PrincipalResourceClassMap } from "src/interfaces/Principal.js";
import type { default as AccessPolicy, AccessPolicyPermissionLevel, AccessPolicyPrincipalData, AccessPolicyScopeData } from "#resources/AccessPolicy/AccessPolicy.js";
import type { default as User } from "#resources/User/User.js";
import type { default as Workspace } from "#resources/Workspace/Workspace.js";
import type { default as RoleMembership } from "#resources/RoleMembership/RoleMembership.js";
import Resource from "src/interfaces/Resource.js";
import { StringUnion } from "#utilities/types.js";

export enum AppParentResourceType {
  Instance = "Instance",
  User = "User",
  Workspace = "Workspace"
}

export enum AppClientType {
  Public = "Public",
  Confidential = "Confidential"
}

export type AppProperties = {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  clientType: StringUnion<AppClientType>;
  clientSecretHash?: string | null;
  parentResourceType: AppParentResourceType | `${AppParentResourceType}`;
  parentUserID?: string;
  parentWorkspaceID?: string;
};

export type ExtendedAppProperties = AppProperties & {
  parentUser?: User;
  parentWorkspace?: Workspace;
}

export type AppScopeData = {
  scopedResourceType: "App";
  appID: string;
  userID?: string;
  workspaceID?: string;
}

export type AppQueryResult = {
  id: string;
  name: string;
  client_type: StringUnion<AppClientType>;
  display_name: string;
  description: string;
  parent_resource_type: AppParentResourceType | `${AppParentResourceType}`;
  parent_user_id: string;
  parent_workspace_id: string;
  client_secret_hash: string | null;
}

export default class App implements Resource<AppScopeData>, Principal {
  
  readonly resourceType = "App";

  /** The app's ID. */
  readonly id: AppProperties["id"];

  /** The app's name. */
  readonly name: AppProperties["name"];

  /** The app's display name. */
  readonly displayName: AppProperties["displayName"];

  /** The app's description, if applicable. */
  readonly description: AppProperties["description"];

  readonly parentResourceType: AppProperties["parentResourceType"];

  readonly parentUser: ExtendedAppProperties["parentUser"];

  readonly parentUserID: AppProperties["parentUserID"];

  readonly parentWorkspace: ExtendedAppProperties["parentWorkspace"];

  readonly parentWorkspaceID: AppProperties["parentWorkspaceID"];

  readonly clientType: AppProperties["clientType"];

  readonly #clientSecretHash: AppProperties["clientSecretHash"];

  /** The client used to make requests. */
  readonly #pool: Pool;

  constructor(data: ExtendedAppProperties, pool: Pool) {

    this.id = data.id;
    this.name = data.name;
    this.displayName = data.displayName;
    this.description = data.description;
    this.parentResourceType = data.parentResourceType;
    this.parentUser = data.parentUser;
    this.parentUserID = data.parentUserID;
    this.parentWorkspace = data.parentWorkspace;
    this.parentWorkspaceID = data.parentWorkspaceID;
    this.clientType = data.clientType;
    this.#clientSecretHash = data.clientSecretHash;
    this.#pool = pool;

  }

  /**
   * Requests the server to create a new app.
   *
   * @param data The data for the new app, excluding the ID.
   */
  static async create(data: Omit<AppProperties, "id">, pool: Pool): Promise<App> {

    // Insert the app data into the database.
    const poolClient = await pool.connect();
    
    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-app-row.sql"), "utf8");
      const values = [data.name, data.displayName, data.description, data.parentResourceType, data.parentUserID, data.parentWorkspaceID];
      const result = await poolClient.query(query, values);

      // Convert the row to an app object.
      const row = result.rows[0];
      const app = new App(App.getPropertiesFromRow(row), pool);

      // Return the user.
      return app;

    } finally {

      poolClient.release();

    }

  }

  static getPropertiesFromRow(rowData: AppQueryResult): AppProperties {
        
    return {
      id: rowData.id,
      name: rowData.name,
      clientType: rowData.client_type,
      displayName: rowData.display_name,
      description: rowData.description,
      parentResourceType: rowData.parent_resource_type,
      parentUserID: rowData.parent_user_id,
      parentWorkspaceID: rowData.parent_workspace_id,
      clientSecretHash: rowData.client_secret_hash
    };
    
  }

  /**
   * Requests the server for a specific user by ID.
   *
   * @param id The ID of the user to retrieve.
   */
  static async getByID(id: string, pool: Pool): Promise<App> {

    // Get the app data from the database.
    const poolClient = await pool.connect();
    const query = readFileSync(resolve(import.meta.dirname, "queries", "get-app-row.sql"), "utf8");
    const result = await poolClient.query(query, [id]);
    poolClient.release();

    // Convert the app data into an App object.
    const row = result.rows[0];

    if (!row) {

      throw new ResourceNotFoundError("App");

    }

    const app = new App({
      ...row,
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      description: row.description
    }, pool);

    // Return the app.
    return app;

  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();
    const createAppsTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-apps-table.sql"), "utf8");
    const createHydratedAppsViewQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-hydrated-apps-view.sql"), "utf8");
    await poolClient.query(createAppsTableQuery);
    await poolClient.query(createHydratedAppsViewQuery);
    poolClient.release();

  }

  getScopeData(): AppScopeData {

    return {
      scopedResourceType: "App",
      appID: this.id,
      userID: this.parentUserID,
      workspaceID: this.parentWorkspaceID
    }

  }

  static async getAccessPolicyWithDeepestScope(accessPolicyClass: typeof AccessPolicy, actionID: string, pool: Pool, principalData: AccessPolicyPrincipalData, scopeData: AppScopeData): Promise<AccessPolicy> {
  
    const scopedAccessPolicies = await accessPolicyClass.listScopedAccessPolicies(actionID, pool, principalData, scopeData);
    const appAccessPolicy = scopedAccessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === "App");
    const userAccessPolicy = scopedAccessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === "User");
    const workspaceAccessPolicy = scopedAccessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === "Workspace");
    const instanceAccessPolicy = scopedAccessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === "Instance");

    const deepestAccessPolicy = appAccessPolicy ?? userAccessPolicy ?? workspaceAccessPolicy ?? instanceAccessPolicy;

    if (!deepestAccessPolicy) {

      throw new ResourceNotFoundError("AccessPolicy");

    }

    return deepestAccessPolicy;

  }

  getPrincipalData(): AccessPolicyPrincipalData {

    return {
      principalType: "App",
      principalAppID: this.id
    };

  }

  async listRoleMemberships(roleMembershipClass: typeof RoleMembership, pool: Pool): Promise<RoleMembership[]> {

    const roleMemberships = await roleMembershipClass.list(`principalAppID = "${this.id}"`, pool);
    return roleMemberships;

  }

  async checkPermissions(resourceClasses: PrincipalResourceClassMap, actionID: string, scopeData: AccessPolicyScopeData = {scopedResourceType: "Instance"}, minimumPermissionLevel: AccessPolicyPermissionLevel | `${AccessPolicyPermissionLevel}` = "User") {
    
    const { Action, AccessPolicy, Role, RoleMembership } = resourceClasses;
    const action = await Action.getByID(actionID, this.#pool);

    const findAccessPolicyWithDeepestScope = async (principalData: AccessPolicyPrincipalData) => {

      try {

        return await AccessPolicy.getAccessPolicyWithDeepestScope(action.id, this.#pool, principalData, scopeData);

      } catch (error) {

        if (!(error instanceof ResourceNotFoundError)) {

          throw error;

        }

      }

    }

    const individualLevelAccessPolicy = await findAccessPolicyWithDeepestScope(this.getPrincipalData());
    if (individualLevelAccessPolicy) {

      return individualLevelAccessPolicy.permissionLevel >= minimumPermissionLevel;

    }

    const roleMemberships = await this.listRoleMemberships(RoleMembership, this.#pool);
    for (const roleMembership of roleMemberships) {

      // Any role with a permission level that is greater than or equal to the minimum permission level is enough to grant access.
      const role = await Role.getByID(roleMembership.roleID, this.#pool);
      const roleLevelAccessPolicy = await findAccessPolicyWithDeepestScope(role.getPrincipalData());
      if (roleLevelAccessPolicy && roleLevelAccessPolicy.permissionLevel >= minimumPermissionLevel) {

        return true;

      }

    }

    return false;

  }

  async verifyPermissions(resourceClasses: PrincipalResourceClassMap, actionID: string, scopeData: AccessPolicyScopeData = {scopedResourceType: "Instance"}, minimumPermissionLevel: AccessPolicyPermissionLevel | `${AccessPolicyPermissionLevel}` = "User"): Promise<void> {

    const canPrincipalAccess = await this.checkPermissions(resourceClasses, actionID, scopeData, minimumPermissionLevel);
    if (!canPrincipalAccess) {

      const action = await resourceClasses.Action.getByID(actionID, this.#pool);
      throw new ForbiddenError(action.name);

    }

  }

  /**
   * Requests the server to delete this user.
   */
  async delete(): Promise<void> {

    const poolClient = await this.#pool.connect();
    const query = readFileSync(resolve(import.meta.dirname, "queries", "delete-app-row.sql"), "utf8");
    await poolClient.query(query, [this.id]);
    poolClient.release();

  }

  getClientSecretHash(): string | null {

    return this.#clientSecretHash ?? null;

  }

}