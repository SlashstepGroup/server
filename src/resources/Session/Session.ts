import User from "#resources/User/User.js";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import jsonwebtoken from "jsonwebtoken";

export type SessionProperties = {
  id: string;
  userID: string;
  expirationDate: Date;
  creationIP: string;
  token?: string;
  user?: User;
};

export type InitialSessionTokenProperties = {
  userID: string;
  sessionID: string;
}

/**
 * A Session represents a user's session in the Slashstep application.
 */
export default class Session {

  /** The ID of the session. */
  readonly id: SessionProperties["id"];

  /** The user ID associated with this session. */
  readonly userID: SessionProperties["userID"];

  /** The expiration date of the session. */
  readonly expirationDate: SessionProperties["expirationDate"];

  /** The IP address from which the session was created. */
  readonly creationIP: SessionProperties["creationIP"];

  /** The token associated with the session, if applicable. */
  readonly token: SessionProperties["token"];

  readonly user?: User;

  readonly #pool: Pool;

  constructor(properties: SessionProperties, pool: Pool) {

    this.id = properties.id;
    this.userID = properties.userID;
    this.user = properties.user;
    this.expirationDate = properties.expirationDate;
    this.creationIP = properties.creationIP;
    this.token = properties.token;
    this.#pool = pool;

  }

  static generateJSONWebToken(properties: InitialSessionTokenProperties, privateKey: string) {

    const token = jsonwebtoken.sign({}, privateKey, {
      algorithm: "RS256",
      expiresIn: "1h",
      subject: properties.userID,
      jwtid: properties.sessionID
    });

    return token;

  }

  static async create(data: Omit<SessionProperties, "id" | "user">, pool: Pool): Promise<Session> {
    
    // Insert the session data into the database.
    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-session-row.sql"), "utf8");
      const values = [data.userID, data.expirationDate, data.creationIP];
      const result = await poolClient.query(query, values);

      // Convert the row to a session object.
      const row = result.rows[0];
      const session = new Session({
        id: row.id,
        userID: row.user_id,
        expirationDate: row.expiration_date,
        creationIP: row.creation_ip,
        token: data.token
      }, pool);

      // Return the session.
      return session;

    } finally {
      
      poolClient.release();

    }

  }

  /**
   * Requests the server for a specific session by ID.
   * @param id The ID of the session to retrieve.
   */
  static async get(id: string, pool: Pool): Promise<Session> {
    
    // Get the session data from the database.
    const poolClient = await pool.connect();
    const query = readFileSync(resolve(dirname(import.meta.dirname), "Session", "queries", "get-session-row.sql"), "utf8");
    const result = await poolClient.query(query, [id]);
    poolClient.release();

    // Convert the session data into a Session object.
    const row = result.rows[0];
    if (!row) {

      throw new ResourceNotFoundError("Session");

    }

    const session = new Session({
      id: row.id,
      userID: row.user_id,
      expirationDate: row.expiration_date,
      creationIP: row.creation_ip
    }, pool);

    // Return the session.
    return session;

  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();
    const createSessionsTableQuery = readFileSync(resolve(dirname(import.meta.dirname), "Session", "queries", "create-sessions-table.sql"), "utf8");
    const createHydratedSessionsViewQuery = readFileSync(resolve(dirname(import.meta.dirname), "Session", "queries", "create-hydrated-sessions-view.sql"), "utf8");
    await poolClient.query(createSessionsTableQuery);
    await poolClient.query(createHydratedSessionsViewQuery);
    poolClient.release();

  }

  async delete(): Promise<void> {

    const poolClient = await this.#pool.connect();
    const query = readFileSync(resolve(dirname(import.meta.dirname), "Session", "queries", "delete-session-row.sql"), "utf8");
    await poolClient.query(query, [this.id]);
    poolClient.release();

  }

}