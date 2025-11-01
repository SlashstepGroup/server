import { Pool } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import { PrincipalResourceClassMap } from "src/interfaces/Principal.js";
import { default as AccessPolicy, AccessPolicyPermissionLevel, AccessPolicyPrincipalData, AccessPolicyPrincipalType, AccessPolicyScopeData, AccessPolicyScopedResourceType } from "#resources/AccessPolicy/AccessPolicy.js";
import ForbiddenError from "#errors/ForbiddenError.js";
import User from "#resources/User/User.js";
import Workspace from "#resources/Workspace/Workspace.js";

export enum AppParentResourceType {
  Instance = "Instance",
  User = "User",
  Workspace = "Workspace"
}

export type AppProperties = {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  parentResourceType: AppParentResourceType | `${AppParentResourceType}`;
  parentUserID?: string;
  parentWorkspaceID?: string;
};

export type ExtendedAppProperties = AppProperties & {
  parentUser?: User;
  parentWorkspace?: Workspace;
}

export type AppScopeData = {
  scopedResourceType: AccessPolicyScopedResourceType.App;
  appID: string;
  userID?: string;
  workspaceID?: string;
}

export type AppQueryResult = {
  id: string;
  name: string;
  display_name: string;
  description: string;
  parent_resource_type: AppParentResourceType | `${AppParentResourceType}`;
  parent_user_id: string;
  parent_workspace_id: string;
}

export default class App {
  
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
      displayName: rowData.display_name,
      description: rowData.description,
      parentResourceType: rowData.parent_resource_type,
      parentUserID: rowData.parent_user_id,
      parentWorkspaceID: rowData.parent_workspace_id
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
      scopedResourceType: AccessPolicyScopedResourceType.App,
      appID: this.id,
      userID: this.parentUserID,
      workspaceID: this.parentWorkspaceID
    }

  }

  static async getAccessPolicyWithDeepestScope(accessPolicyClass: typeof AccessPolicy, actionID: string, pool: Pool, principalData: AccessPolicyPrincipalData, scopeData: AppScopeData): Promise<AccessPolicy> {
  
    const scopedAccessPolicies = await accessPolicyClass.listScopedAccessPolicies(actionID, pool, principalData, scopeData);
    const appAccessPolicy = scopedAccessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === AccessPolicyScopedResourceType.App);
    const userAccessPolicy = scopedAccessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === AccessPolicyScopedResourceType.User);
    const workspaceAccessPolicy = scopedAccessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === AccessPolicyScopedResourceType.Workspace);
    const instanceAccessPolicy = scopedAccessPolicies.find(accessPolicy => accessPolicy.scopedResourceType === AccessPolicyScopedResourceType.Instance);

    const deepestAccessPolicy = appAccessPolicy ?? userAccessPolicy ?? workspaceAccessPolicy ?? instanceAccessPolicy;

    if (!deepestAccessPolicy) {

      throw new ResourceNotFoundError("AccessPolicy");

    }

    return deepestAccessPolicy;

  }

  async checkPermissions(resourceClasses: PrincipalResourceClassMap, actionID: string, scopeData: AccessPolicyScopeData, minimumPermissionLevel: AccessPolicyPermissionLevel = AccessPolicyPermissionLevel.User) {
    
    const { Action, AccessPolicy } = resourceClasses;
    const action = await Action.getByID(actionID, this.#pool);

    try {

      const accessPolicy = await AccessPolicy.getAccessPolicyWithDeepestScope(action.id, this.#pool, {
        principalType: AccessPolicyPrincipalType.App,
        principalAppID: this.id
      }, scopeData);
      return accessPolicy.permissionLevel >= minimumPermissionLevel;

    } catch (error) {

      if (error instanceof ResourceNotFoundError) {

        return false;

      }

      throw error;

    }

  }

  async verifyPermissions(resourceClasses: PrincipalResourceClassMap, actionID: string, scopeData: AccessPolicyScopeData, minimumPermissionLevel: AccessPolicyPermissionLevel = AccessPolicyPermissionLevel.User): Promise<void> {

    const canPrincipalAccess = await this.checkPermissions(resourceClasses, actionID, scopeData, minimumPermissionLevel);
    if (!canPrincipalAccess) {

      throw new ForbiddenError();

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

}