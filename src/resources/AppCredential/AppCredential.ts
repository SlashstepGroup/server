import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { Pool } from "pg";
import jsonwebtoken from "jsonwebtoken";

export type BaseAppCredentialProperties = {
  id: string;
  appID: string;
  expirationDate: Date;
  creationIP: string;
}

export type ExtendedAppCredentialProperties = BaseAppCredentialProperties & {
  token?: string;
}

export type AppCredentialQueryResult = {
  id: string;
  app_id: string;
  expiration_date: Date;
  creation_ip: string;
}

export type InitialAppCredentialProperties = Omit<BaseAppCredentialProperties, "id">;

export default class AppCredential {

  id: ExtendedAppCredentialProperties["id"];

  appID: ExtendedAppCredentialProperties["appID"];

  expirationDate: ExtendedAppCredentialProperties["expirationDate"];

  creationIP: ExtendedAppCredentialProperties["creationIP"];

  /** The client used to make requests. */
  readonly #pool: Pool;

  #token?: ExtendedAppCredentialProperties["token"];

  constructor(data: ExtendedAppCredentialProperties, pool: Pool) {

    this.id = data.id;
    this.appID = data.appID;
    this.expirationDate = data.expirationDate;
    this.creationIP = data.creationIP;
    this.#token = data.token;
    this.#pool = pool;

  }

  static getPropertiesFromRow(rowData: AppCredentialQueryResult): BaseAppCredentialProperties {
    
    return {
      id: rowData.id,
      appID: rowData.app_id,
      expirationDate: rowData.expiration_date,
      creationIP: rowData.creation_ip
    };
    
  }

  /**
   * Creates the accessPolicies table in the database.
   * @param pool 
   */
  static async initializeTable(pool: Pool): Promise<void> {

    // Create the table.
    const poolClient = await pool.connect();
    try {

      const createAppCredentialsTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-app-credentials-table.sql"), "utf8");
      const createHydratedAppCredentialsViewQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-hydrated-app-credentials-view.sql"), "utf8");
      await poolClient.query(createAppCredentialsTableQuery);
      await poolClient.query(createHydratedAppCredentialsViewQuery);

    } finally {

      poolClient.release();

    }

  }

  static async getByID(id: string, pool: Pool): Promise<AppCredential> {

    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "get-app-credential-row.sql"), "utf8");
      const result = await poolClient.query(query, [id]);

      const rowData = result.rows[0];

      if (!rowData) {

        throw new ResourceNotFoundError("AppCredential");

      }

      const appCredential = new AppCredential(AppCredential.getPropertiesFromRow(rowData), pool);

      return appCredential;

    } finally {

      poolClient.release();

    }

  }

  static async create(data: InitialAppCredentialProperties, pool: Pool): Promise<AppCredential> {

    const poolClient = await pool.connect();

    try {
      
      const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-app-credential-row.sql"), "utf8");
      const values = [
        data.appID, 
        data.expirationDate,
        data.creationIP
      ];
      const result = await poolClient.query<AppCredentialQueryResult>(query, values);

      const rowData = result.rows[0];
      const accessPolicy = new AppCredential(AppCredential.getPropertiesFromRow(rowData), pool);

      return accessPolicy;

    } finally {

      poolClient.release();

    }

  }

  generateJSONWebToken(privateKey: string): string {

    const token = jsonwebtoken.sign({}, privateKey, {
      algorithm: "RS256",
      expiresIn: "30d",
      subject: this.appID,
      jwtid: this.id
    });

    return token;

  }

  async delete(): Promise<void> {

    const poolClient = await this.#pool.connect();
    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "delete-app-credential-row.sql"), "utf8");
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