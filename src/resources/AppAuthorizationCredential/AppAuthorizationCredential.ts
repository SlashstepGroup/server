import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { Pool } from "pg";

export enum AppAuthorizationCredentialAuthorizingResourceType {
  Instance = "Instance",
  Workspace = "Workspace",
  Project = "Project",
  User = "User"
}

export type BaseAppAuthorizationCredentialProperties = {
  id: string;
  expirationDate: Date;
  appAuthorizationID: string;
}

export type ExtendedAppAuthorizationCredentialProperties = BaseAppAuthorizationCredentialProperties & {
  token?: string;
}

export type AppAuthorizationCredentialQueryResult = {
  id: string;
  app_id: string;
  expiration_date: Date;
  app_authorization_id: string;
}

export type InitialAppAuthorizationCredentialProperties = Omit<BaseAppAuthorizationCredentialProperties, "id">;

export default class AppAuthorizationCredential {

  id: ExtendedAppAuthorizationCredentialProperties["id"];

  appAuthorizationID: ExtendedAppAuthorizationCredentialProperties["appAuthorizationID"];

  /** The client used to make requests. */
  readonly #pool: Pool;

  #token?: ExtendedAppAuthorizationCredentialProperties["token"];

  constructor(data: ExtendedAppAuthorizationCredentialProperties, pool: Pool) {

    this.id = data.id;
    this.appAuthorizationID = data.appAuthorizationID;
    this.#token = data.token;
    this.#pool = pool;

  }

  static getPropertiesFromRow(rowData: AppAuthorizationCredentialQueryResult): BaseAppAuthorizationCredentialProperties {
    
    return {
      id: rowData.id,
      appAuthorizationID: rowData.app_authorization_id,
      expirationDate: rowData.expiration_date
    };
    
  }

  static async getByID(id: string, pool: Pool): Promise<AppAuthorizationCredential> {

    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "get-app-authorization-credential-row.sql"), "utf8");
      const result = await poolClient.query(query, [id]);

      const rowData = result.rows[0];

      if (!rowData) {

        throw new ResourceNotFoundError("AppAuthorizationCredential");

      }

      const appAuthorizationCredential = new AppAuthorizationCredential(AppAuthorizationCredential.getPropertiesFromRow(rowData), pool);

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
        data.expirationDate
      ];
      const result = await poolClient.query<AppAuthorizationCredentialQueryResult>(query, values);

      const rowData = result.rows[0];
      const accessPolicy = new AppAuthorizationCredential(AppAuthorizationCredential.getPropertiesFromRow(rowData), pool);

      return accessPolicy;

    } finally {

      poolClient.release();

    }

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

  getToken(): string {

    if (!this.#token) {

      throw new Error("Token is not set.");

    }

    return this.#token;
    
  }

  setToken(token: string): void {

    this.#token = token;

  }

}