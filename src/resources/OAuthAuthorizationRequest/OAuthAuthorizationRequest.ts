import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import type { default as AppAuthorization, BaseAppAuthorizationProperties } from "#resources/AppAuthorization/AppAuthorization.js";
import SlashstepQLFilterSanitizer from "#utilities/SlashstepQLFilterSanitizer.js";
import StringEncryptor from "#utilities/StringEncryptor/StringEncryptor.js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { Pool } from "pg";

export type OAuthAuthorizationRequestProperties = {
  id: string;
  encryptedCode: string | null;
  codeChallenge: string | null;
  appAuthorizationID: string;
  expirationDate: Date;
}

export type ConstructorOAuthAuthorizationRequestProperties = {
  id: string;
  encryptedCode?: string | null;
  codeChallenge?: string | null;
  appAuthorizationID: string;
  expirationDate: Date;
}

export type OAuthAuthorizationRequestConstructorOptions = {
  pool: Pool;
}

export type OAuthAuthorizationRequestCreationOptions = {
  pool: Pool;
}

export type OAuthAuthorizationRequestGetOptions = {
  pool: Pool;
  includedResources?: OAuthAuthorizationRequestIncludedResourceClassMap;
}

export type OAuthAuthorizationRequestListOptions = OAuthAuthorizationRequestGetOptions;

export type OAuthAuthorizationRequestQueryResult = {
  id: string;
  encrypted_code: string | null;
  code_challenge: string | null;
  app_authorization_id: string;
  app_authorization: BaseAppAuthorizationProperties | null;
  expiration_date: Date;
}

export type EditableOAuthAuthorizationRequestProperties = Omit<ConstructorOAuthAuthorizationRequestProperties, "id" | "expirationDate">;

export type OAuthAuthorizationRequestIncludedResourceClassMap = {
  appAuthorization?: typeof AppAuthorization;
}

export type OAuthAuthorizationRequestIncludedResourceMap = {
  [key in keyof OAuthAuthorizationRequestIncludedResourceClassMap]?: InstanceType<NonNullable<OAuthAuthorizationRequestIncludedResourceClassMap[key]>>;
}

export default class OAuthAuthorizationRequest {

  static readonly allowedQueryFields = {
    id: "id", 
    encryptedCode: "encrypted_code", 
    codeChallenge: "code_challenge", 
    appAuthorizationID: "app_authorization_id", 
    expirationDate: "expiration_date"
  };

  readonly id: OAuthAuthorizationRequestProperties["id"];

  readonly codeChallenge: OAuthAuthorizationRequestProperties["codeChallenge"];

  readonly appAuthorizationID: OAuthAuthorizationRequestProperties["appAuthorizationID"];

  readonly expirationDate: OAuthAuthorizationRequestProperties["expirationDate"];

  readonly #encryptedCode: OAuthAuthorizationRequestProperties["encryptedCode"];

  readonly #pool: Pool;

  constructor(data: ConstructorOAuthAuthorizationRequestProperties, options: OAuthAuthorizationRequestConstructorOptions) {

    this.id = data.id;
    this.#encryptedCode = data.encryptedCode ?? null;
    this.codeChallenge = data.codeChallenge ?? null;
    this.appAuthorizationID = data.appAuthorizationID;
    this.expirationDate = data.expirationDate;
    this.#pool = options.pool;

  }

  static async create(data: Omit<ConstructorOAuthAuthorizationRequestProperties, "id">, options: OAuthAuthorizationRequestCreationOptions): Promise<OAuthAuthorizationRequest> {

    // Insert the OAuth authorization request into the database.
    const poolClient = await options.pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-oauth-authorization-request-row.sql"), "utf8");
      const values = [
        data.encryptedCode,
        data.codeChallenge,
        data.appAuthorizationID,
        data.expirationDate
      ];
      const result = await poolClient.query(query, values);

      // Convert the row to an OAuth authorization request object.
      const rowData = result.rows[0];
      const accessPolicy = new OAuthAuthorizationRequest(OAuthAuthorizationRequest.getPropertiesFromRow(rowData), {
        pool: options.pool
      });

      // Return the OAuth authorization request.
      return accessPolicy;

    } finally {

      poolClient.release();

    }

  }

  static async getByID(id: string, options: OAuthAuthorizationRequestGetOptions): Promise<OAuthAuthorizationRequest> {

    const { pool } = options;
    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "get-oauth-authorization-request-row-by-id.sql"), "utf8");
      const result = await poolClient.query(query, [id]);

      const rowData = result.rows[0];

      if (!rowData) {

        throw new ResourceNotFoundError("OAuthAuthorizationRequest");

      }

      const oauthAuthorizationRequest = new OAuthAuthorizationRequest(OAuthAuthorizationRequest.getPropertiesFromRow(rowData), options);

      return oauthAuthorizationRequest;

    } finally {

      poolClient.release();

    }

  }

  static mapIncludedResources(rowData: OAuthAuthorizationRequestQueryResult, includedResources: OAuthAuthorizationRequestIncludedResourceClassMap, pool: Pool): OAuthAuthorizationRequestIncludedResourceMap {

    const mappedResources: OAuthAuthorizationRequestIncludedResourceMap = {
      appAuthorization: includedResources.appAuthorization && rowData.app_authorization ? new includedResources.appAuthorization(rowData.app_authorization, pool) : undefined
    };

    return mappedResources;

  }

  static async list(filterQuery: string, options: OAuthAuthorizationRequestListOptions): Promise<OAuthAuthorizationRequest[]> {

    const { pool, includedResources } = options;
    const poolClient = await pool.connect();

    try {

      const { whereClause, values, limit, offset } = SlashstepQLFilterSanitizer.sanitize({
        tableName: "hydrated_oauth_authorization_requests", 
        filterQuery, 
        defaultLimit: 1000, 
        allowedQueryFields: this.allowedQueryFields
      });
      const result = await poolClient.query(`select * from hydrated_oauth_authorization_requests${whereClause ? ` where ${whereClause}` : ""}${limit !== undefined ? ` limit ${limit}` : ""}${offset !== undefined ? ` offset ${offset}` : ""}`, values);
      const oauthAuthorizationRequests = result.rows.map((row) => {
        
        const oauthAuthorizationRequestProperties = OAuthAuthorizationRequest.getPropertiesFromRow(row);
        const mappedResources = includedResources ? OAuthAuthorizationRequest.mapIncludedResources(row, includedResources, pool) : {};
        const oauthAuthorizationRequest = new OAuthAuthorizationRequest({
          ...oauthAuthorizationRequestProperties,
          ...mappedResources
        }, {pool});

        return oauthAuthorizationRequest;
      
      });

      return oauthAuthorizationRequests;

    } finally {

      poolClient.release();

    }

  }

  static async count(filterQuery: string, pool: Pool): Promise<number> {

    // Get the list from the database.
    const poolClient = await pool.connect();

    try {

      const { whereClause, values } = SlashstepQLFilterSanitizer.sanitize({
        tableName: "hydrated_oauth_authorization_requests",
        filterQuery,
        shouldIgnoreOffset: true,
        shouldIgnoreLimit: true,
        allowedQueryFields: this.allowedQueryFields
      });
      const result = await poolClient.query(`select count(*) from hydrated_oauth_authorization_requests${whereClause ? ` where ${whereClause}` : ""}`, values);
      
      // Convert the list of rows to AccessPolicy objects.
      const count = parseInt(result.rows[0].count, 10);

      // Return the list.
      return count;

    } finally {

      poolClient.release();

    }

  }

  static async listByAppAuthorizationID(appAuthorizationID: string, options: OAuthAuthorizationRequestListOptions): Promise<OAuthAuthorizationRequest[]> {

    const oauthAuthorizationRequests = await OAuthAuthorizationRequest.list(`appAuthorizationID = "${appAuthorizationID}"`, options);
    return oauthAuthorizationRequests;

  }

  static async getByDecryptedCode(decryptedCode: string, appAuthorizationID: string, decryptionKey: string, options: OAuthAuthorizationRequestListOptions): Promise<OAuthAuthorizationRequest> {

    const oauthAuthorizationRequests = await OAuthAuthorizationRequest.listByAppAuthorizationID(appAuthorizationID, options);
    for (const oauthAuthorizationRequest of oauthAuthorizationRequests) {

      const encryptedCode = oauthAuthorizationRequest.getEncryptedCode();
      if (!encryptedCode) {

        continue;

      }

      if (StringEncryptor.decryptString(encryptedCode, decryptionKey) === decryptedCode) {

        return oauthAuthorizationRequest;

      }

    }

    throw new ResourceNotFoundError("OAuthAuthorizationRequest");

  }

  static getPropertiesFromRow(rowData: OAuthAuthorizationRequestQueryResult): OAuthAuthorizationRequestProperties {
    
    return {
      id: rowData.id,
      encryptedCode: rowData.encrypted_code,
      codeChallenge: rowData.code_challenge,
      appAuthorizationID: rowData.app_authorization_id,
      expirationDate: rowData.expiration_date
    };
    
  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();

    try {

      const createOAuthAuthorizationRequestsTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-oauth-authorization-requests-table.sql"), "utf8");
      const createHydratedOAuthAuthorizationRequestsViewQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-hydrated-oauth-authorization-requests-view.sql"), "utf8");
      await poolClient.query(createOAuthAuthorizationRequestsTableQuery);
      await poolClient.query(createHydratedOAuthAuthorizationRequestsViewQuery);

    } finally {

      poolClient.release();

    }

  }

  async update(data: Partial<EditableOAuthAuthorizationRequestProperties>): Promise<OAuthAuthorizationRequest> {

    const poolClient = await this.#pool.connect();

    try {

      await poolClient.query("begin;");
      let query = "update oauth_authorization_requests set ";
      const values = [];

      const addValue = <T>(columnName: string, value: T) => {

        if (value === undefined) {

          return;

        }

        query += `${values.length > 0 ? ", " : ""}${columnName} = $${values.length + 1}`;
        values.push(value);

      }

      addValue("encrypted_code", data.encryptedCode);
      addValue("code_challenge", data.codeChallenge);

      query += ` where id = $${values.length + 1} returning *;`;
      values.push(this.id);
      
      const result = await poolClient.query(query, values);
      await poolClient.query("commit;");

      // Convert the row to an OAuth authorization request object.
      const row = result.rows[0];
      const accessPolicy = new OAuthAuthorizationRequest(OAuthAuthorizationRequest.getPropertiesFromRow(row), {
        pool: this.#pool
      });

      return accessPolicy;

    } finally {

      poolClient.release();

    }

  }

  async delete(): Promise<void> {

    const poolClient = await this.#pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "delete-oauth-authorization-request-row.sql"), "utf8");
      await poolClient.query(query, [this.id]);

    } finally {
      
      poolClient.release();

    }

  }

  getEncryptedCode(): string | null {

    return this.#encryptedCode;

  }

}