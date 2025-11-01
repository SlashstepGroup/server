import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import type { default as App } from "#resources/App/App.js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { Pool } from "pg";

export enum AppAuthorizationAuthorizingResourceType {
  Instance = "Instance",
  Workspace = "Workspace",
  Project = "Project",
  User = "User"
}

export type BaseAppAuthorizationProperties = {
  id: string;
  appID: string;
  authorizingResourceType: AppAuthorizationAuthorizingResourceType | `${AppAuthorizationAuthorizingResourceType}`;
  authorizingProjectID?: string;
  authorizingUserID?: string;
  authorizingWorkspaceID?: string;
}

export type ExtendedAppAuthorizationCredentialProperties = BaseAppAuthorizationProperties & {
  app?: App;
}

export type AppAuthorizationQueryResult = {
  id: string;
  app_id: string;
  authorizing_resource_type: AppAuthorizationAuthorizingResourceType;
  authorizing_project_id: string;
  authorizing_user_id: string;
  authorizing_workspace_id: string;
}

export type InitialAppAuthorizationCredentialProperties = Omit<BaseAppAuthorizationProperties, "id">;

export default class AppAuthorization {

  id: BaseAppAuthorizationProperties["id"];

  appID: BaseAppAuthorizationProperties["appID"];

  authorizingResourceType: BaseAppAuthorizationProperties["authorizingResourceType"];

  authorizingProjectID: BaseAppAuthorizationProperties["authorizingProjectID"];

  authorizingUserID: BaseAppAuthorizationProperties["authorizingUserID"];

  authorizingWorkspaceID: BaseAppAuthorizationProperties["authorizingWorkspaceID"];

  app?: ExtendedAppAuthorizationCredentialProperties["app"];

  /** The client used to make requests. */
  readonly #pool: Pool;

  constructor(data: BaseAppAuthorizationProperties, pool: Pool) {

    this.id = data.id;
    this.appID = data.appID;
    this.authorizingResourceType = data.authorizingResourceType;
    this.authorizingProjectID = data.authorizingProjectID;
    this.authorizingUserID = data.authorizingUserID;
    this.authorizingWorkspaceID = data.authorizingWorkspaceID;
    this.#pool = pool;

  }

  static getPropertiesFromRow(rowData: AppAuthorizationQueryResult): BaseAppAuthorizationProperties {
    
    return {
      id: rowData.id,
      appID: rowData.app_id,
      authorizingResourceType: rowData.authorizing_resource_type,
      authorizingProjectID: rowData.authorizing_project_id,
      authorizingUserID: rowData.authorizing_user_id,
      authorizingWorkspaceID: rowData.authorizing_workspace_id
    };
    
  }

  static async getByID(id: string, pool: Pool): Promise<AppAuthorization> {

    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "get-app-authorization-row.sql"), "utf8");
      const result = await poolClient.query(query, [id]);

      const rowData = result.rows[0];

      if (!rowData) {

        throw new ResourceNotFoundError("AppAuthorization");

      }

      const appAuthorizationCredential = new AppAuthorization(AppAuthorization.getPropertiesFromRow(rowData), pool);

      return appAuthorizationCredential;

    } finally {

      poolClient.release();

    }

  }


  static async create(data: InitialAppAuthorizationCredentialProperties, pool: Pool): Promise<AppAuthorization> {

    const poolClient = await pool.connect();

    try {
      
      const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-app-authorization-row.sql"), "utf8");
      const values = [
        data.appID,
        data.authorizingResourceType,
        data.authorizingProjectID,
        data.authorizingUserID,
        data.authorizingWorkspaceID
      ];
      const result = await poolClient.query<AppAuthorizationQueryResult>(query, values);

      const rowData = result.rows[0];
      const accessPolicy = new AppAuthorization(AppAuthorization.getPropertiesFromRow(rowData), pool);

      return accessPolicy;

    } finally {

      poolClient.release();

    }

  }

  async delete(): Promise<void> {

    const poolClient = await this.#pool.connect();
    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "delete-app-authorization-row.sql"), "utf8");
      await poolClient.query(query, [this.id]);

    } finally {
      
      poolClient.release();

    }

  }

}