import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { Pool } from "pg";
import jsonwebtoken from "jsonwebtoken";
import { StringValue } from "ms";
import Action from "#resources/Action/Action.js";
import appAuthorizationCredentialPreDefinedActions from "./app-authorization-credential-pre-defined-actions.js";
import ResourceConflictError from "#errors/ResourceConflictError.js";

export enum AppAuthorizationCredentialAuthorizingResourceType {
  Instance = "Instance",
  Workspace = "Workspace",
  Project = "Project",
  User = "User"
}

export type BaseAppAuthorizationCredentialProperties = {
  id: string;
  accessTokenExpirationDate: Date;
  refreshTokenExpirationDate: Date;
  appAuthorizationID: string;
  refreshedAppAuthorizationCredentialID?: string | null;
}

export type AppAuthorizationCredentialQueryResult = {
  id: string;
  access_token_expiration_date: Date;
  refresh_token_expiration_date: Date;
  app_authorization_id: string;
  refreshed_app_authorization_credential_id: string | null;
}

export type AppAuthorizationCreationOptions = {
  pool: Pool;
}

export type AppAuthorizationCredentialGetByIDOptions = {
  pool: Pool;
}

export type AppAuthorizationCredentialConstructorOptions = {
  pool: Pool;
}

export type InitialAppAuthorizationCredentialProperties = Omit<BaseAppAuthorizationCredentialProperties, "id">;

export type EditableAppAuthorizationCredentialProperties = Omit<BaseAppAuthorizationCredentialProperties, "id" | "appAuthorizationID" | "accessTokenExpirationDate" | "refreshTokenExpirationDate">;

export default class AppAuthorizationCredential {

  readonly id: BaseAppAuthorizationCredentialProperties["id"];

  readonly appAuthorizationID: BaseAppAuthorizationCredentialProperties["appAuthorizationID"];

  readonly accessTokenExpirationDate: BaseAppAuthorizationCredentialProperties["accessTokenExpirationDate"];

  readonly refreshTokenExpirationDate: BaseAppAuthorizationCredentialProperties["refreshTokenExpirationDate"];

  readonly refreshedAppAuthorizationCredentialID: BaseAppAuthorizationCredentialProperties["refreshedAppAuthorizationCredentialID"];

  /** The client used to make requests. */
  readonly #pool: Pool;

  constructor(data: BaseAppAuthorizationCredentialProperties, options: AppAuthorizationCredentialConstructorOptions) {

    this.id = data.id;
    this.appAuthorizationID = data.appAuthorizationID;
    this.accessTokenExpirationDate = data.accessTokenExpirationDate;
    this.refreshTokenExpirationDate = data.refreshTokenExpirationDate;
    this.refreshedAppAuthorizationCredentialID = data.refreshedAppAuthorizationCredentialID;
    this.#pool = options.pool;

  }

  generateAccessToken(privateKey: string, expiresIn: StringValue) {
  
    const token = jsonwebtoken.sign({
      tokenType: "Access"
    }, privateKey, {
      algorithm: "RS256",
      expiresIn: expiresIn,
      subject: this.appAuthorizationID,
      jwtid: this.id
    });

    return token;

  }

  generateRefreshToken(privateKey: string, expiresIn: StringValue) {
  
    const token = jsonwebtoken.sign({
      tokenType: "Refresh"
    }, privateKey, {
      algorithm: "RS256",
      expiresIn: expiresIn,
      subject: this.appAuthorizationID,
      jwtid: this.id
    });

    return token;

  }

  static getPropertiesFromRow(rowData: AppAuthorizationCredentialQueryResult): BaseAppAuthorizationCredentialProperties {
    
    return {
      id: rowData.id,
      appAuthorizationID: rowData.app_authorization_id,
      accessTokenExpirationDate: rowData.access_token_expiration_date,
      refreshTokenExpirationDate: rowData.refresh_token_expiration_date,
      refreshedAppAuthorizationCredentialID: rowData.refreshed_app_authorization_credential_id
    };
    
  }

  static async getByID(id: string, options: AppAuthorizationCredentialGetByIDOptions): Promise<AppAuthorizationCredential> {

    const { pool } = options;
    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "get-app-authorization-credential-row.sql"), "utf8");
      const result = await poolClient.query(query, [id]);

      const rowData = result.rows[0];

      if (!rowData) {

        throw new ResourceNotFoundError("AppAuthorizationCredential");

      }

      const appAuthorizationCredential = new AppAuthorizationCredential(AppAuthorizationCredential.getPropertiesFromRow(rowData), {pool});

      return appAuthorizationCredential;

    } finally {

      poolClient.release();

    }

  }

  static async create(data: InitialAppAuthorizationCredentialProperties, pool: Pool): Promise<AppAuthorizationCredential> {

    const poolClient = await pool.connect();

    try {
      
      const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-app-authorization-credential-row.sql"), "utf8");
      const values = [
        data.appAuthorizationID,
        data.accessTokenExpirationDate,
        data.refreshTokenExpirationDate,
        data.refreshedAppAuthorizationCredentialID
      ];
      const result = await poolClient.query<AppAuthorizationCredentialQueryResult>(query, values);

      const rowData = result.rows[0];
      const accessPolicy = new AppAuthorizationCredential(AppAuthorizationCredential.getPropertiesFromRow(rowData), {pool});

      return accessPolicy;

    } finally {

      poolClient.release();

    }

  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();

    try {

      const createAppAuthorizationCredentialsTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-app-authorization-credentials-table.sql"), "utf8");
      const createHydratedAppAuthorizationCredentialsViewQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-hydrated-app-authorization-credentials-view.sql"), "utf8");
      await poolClient.query(createAppAuthorizationCredentialsTableQuery);
      await poolClient.query(createHydratedAppAuthorizationCredentialsViewQuery);

    } finally {

      poolClient.release();

    }

  }

  static async initializePreDefinedActions(actionClass: typeof Action, pool: Pool): Promise<Action[]> {

    const actionPropertiesList = appAuthorizationCredentialPreDefinedActions;
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

  async delete(): Promise<void> {

    const poolClient = await this.#pool.connect();
    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "delete-app-authorization-credential-row.sql"), "utf8");
      await poolClient.query(query, [this.id]);

    } finally {
      
      poolClient.release();

    }

  }

  async update(data: Partial<EditableAppAuthorizationCredentialProperties>): Promise<AppAuthorizationCredential> {

    const poolClient = await this.#pool.connect();

    try {

      await poolClient.query("begin;");
      let query = "update app_authorization_credentials set ";
      const values = [];

      const addValue = <T>(columnName: string, value: T) => {

        if (value === undefined) {

          return;

        }

        query += `${values.length > 0 ? ", " : ""}${columnName} = $${values.length + 1}`;
        values.push(value);

      }

      addValue("refreshedAppAuthorizationCredentialID", data.refreshedAppAuthorizationCredentialID);

      query += ` where id = $${values.length + 1} returning *;`;
      values.push(this.id);
      
      const result = await poolClient.query(query, values);
      await poolClient.query("commit;");

      // Convert the row to an OAuth authorization request object.
      const row = result.rows[0];
      const accessPolicy = new AppAuthorizationCredential(AppAuthorizationCredential.getPropertiesFromRow(row), {
        pool: this.#pool
      });

      return accessPolicy;

    } finally {

      poolClient.release();

    }

  }

}