import { Pool } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";
import { PartialBy } from "#utilities/types.js";

export type BaseHTTPRequestProperties = {
  id: string;
  method: string;
  url: string;
  ipAddress: string;
  headers: string;
  statusCode?: number | null;
  expirationDate: Date;
}

export type HTTPRequestQueryResult = {
  id: string;
  method: string;
  url: string;
  ip_address: string;
  headers: string;
  status_code: number | null;
  expiration_date: Date;
}

export type InitialHTTPRequestProperties = PartialBy<Omit<BaseHTTPRequestProperties, "id">, "expirationDate">;

export default class HTTPRequest {

  static readonly name = "HTTPRequest";

  /** The HTTP request's ID. */
  readonly id: BaseHTTPRequestProperties["id"];

  /** The HTTP request's method. */
  readonly method: BaseHTTPRequestProperties["method"];

  /** The HTTP request's URL. */
  readonly url: BaseHTTPRequestProperties["url"];

  /** The HTTP request's IP address. */
  readonly ipAddress: BaseHTTPRequestProperties["ipAddress"];

  /** The HTTP request's headers. */
  readonly headers: BaseHTTPRequestProperties["headers"];

  /** The HTTP request's status code. */
  readonly statusCode: BaseHTTPRequestProperties["statusCode"];

  /** The HTTP request's expiration date. */
  readonly expirationDate: BaseHTTPRequestProperties["expirationDate"];

  readonly #pool: Pool;

  constructor(data: BaseHTTPRequestProperties, pool: Pool) {

    this.id = data.id;
    this.method = data.method;
    this.url = data.url;
    this.ipAddress = data.ipAddress;
    this.headers = data.headers;
    this.statusCode = data.statusCode;
    this.expirationDate = data.expirationDate;
    this.#pool = pool;

  }

  /**
   * Requests the server to create a new HTTP request.
   *
   * @param data The data for the new HTTP request, excluding the ID.
   */
  static async create(data: InitialHTTPRequestProperties, pool: Pool): Promise<HTTPRequest> {

    // Insert the HTTP request into the database.
    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-http-request-row.sql"), "utf8");
      const values = [
        data.method,
        data.url,
        data.ipAddress,
        data.headers,
        data.statusCode,
        data.expirationDate
      ];
      const result = await poolClient.query(query, values);

      // Convert the row to an HTTP request object.
      const row = result.rows[0];
      const httpRequest = new HTTPRequest(HTTPRequest.getPropertiesFromRow(row), pool);

      // Return the HTTP request.
      return httpRequest;

    } finally {

      poolClient.release();

    }

  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();

    try {

      const createHTTPRequestsTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-http-requests-table.sql"), "utf8");
      const createHydratedHTTPRequestsViewQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-hydrated-http-requests-view.sql"), "utf8");
      await poolClient.query(createHTTPRequestsTableQuery);
      await poolClient.query(createHydratedHTTPRequestsViewQuery);

    } finally {

      poolClient.release();

    }

  }

  static getPropertiesFromRow(rowData: HTTPRequestQueryResult): BaseHTTPRequestProperties {
        
    return {
      id: rowData.id,
      method: rowData.method,
      url: rowData.url,
      ipAddress: rowData.ip_address,
      headers: rowData.headers,
      statusCode: rowData.status_code,
      expirationDate: rowData.expiration_date
    };
    
  }

  async update(data: Partial<BaseHTTPRequestProperties>): Promise<HTTPRequest> {

    const poolClient = await this.#pool.connect();

    try {

      await poolClient.query("begin;");
      let query = "update http_requests set ";
      const values = [];

      const addValue = <T>(columnName: string, value: T) => {

        if (value === undefined) {

          return;

        }

        query += `${values.length > 0 ? ", " : ""}${columnName} = $${values.length + 1}`;
        values.push(value);

      }
      addValue("method", data.method);
      addValue("url", data.url);
      addValue("ip_address", data.ipAddress);
      addValue("headers", data.headers);
      addValue("status_code", data.statusCode);
      addValue("expiration_date", data.expirationDate);

      query += ` where id = $${values.length + 1} returning *;`;
      values.push(this.id);
      
      const result = await poolClient.query(query, values);
      await poolClient.query("commit;");

      // Convert the row to an access policy object.
      const row = result.rows[0];
      const httpRequest = new HTTPRequest(HTTPRequest.getPropertiesFromRow(row), this.#pool);

      return httpRequest;

    } catch (error) {
      
      await poolClient.query("rollback;");
      throw error;
      
    } finally {

      poolClient.release();

    }

  }

}