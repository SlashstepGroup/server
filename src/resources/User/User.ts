import AccessPolicy, { AccessPolicyPermissionLevel } from "#resources/AccessPolicy/AccessPolicy.js";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import Session from "#resources/Session/Session.js";

export type UserProperties = {
  id: string;
  username: string;
  displayName: string;
};

export default class User {
  
  /** The user's ID. */
  readonly id: UserProperties["id"];

  /** The user's username. */
  readonly username: UserProperties["username"];

  readonly displayName: UserProperties["displayName"];

  /** The client used to make requests. */
  readonly #pool: Pool;

  readonly #session?: Session;

  constructor(data: UserProperties, pool: Pool, session?: Session) {

    this.id = data.id;
    this.username = data.username;
    this.displayName = data.displayName;
    this.#pool = pool;
    this.#session = session;

  }

  /**
   * Requests the server to create a new user.
   *
   * @param data The data for the new user, excluding the ID.
   */
  static async create(data: Omit<UserProperties, "id">, pool: Pool): Promise<User> {

    // Insert the user data into the database.
    const poolClient = await pool.connect();
    const query = readFileSync(resolve(dirname(import.meta.dirname), "User", "queries", "insert-user-row.sql"), "utf8");
    const values = [data.username, data.displayName];
    const result = await poolClient.query(query, values);
    poolClient.release();

    // Convert the row to a user object.
    const row = result.rows[0];
    const user = new User({
      id: row.id,
      username: row.username,
      displayName: row.display_name
    }, pool);

    // Return the user.
    return user;

  }

  /**
   * Requests the server for a specific user by ID.
   *
   * @param id The ID of the user to retrieve.
   */
  static async getFromID(id: string, pool: Pool): Promise<User> {

    // Get the user data from the database.
    const poolClient = await pool.connect();
    const query = readFileSync(resolve(dirname(import.meta.dirname), "User", "queries", "get-user-row-by-id.sql"), "utf8");
    const result = await poolClient.query(query, [id]);
    poolClient.release();

    // Convert the user data into a User object.
    const row = result.rows[0];

    if (!row) {

      throw new ResourceNotFoundError("User");

    }

    const user = new User({
      id: row.id,
      username: row.username,
      displayName: row.display_name
    }, pool);

    // Return the user.
    return user;

  }

  /**
   * Requests the server for a specific user by username.
   * @param username The username of the user to retrieve.
   * @param client The client used to make requests.
   */
  static async getFromUsername(username: string, pool: Pool): Promise<User> {

    // Get the user data from the database.
    const poolClient = await pool.connect();
    const query = readFileSync(resolve(dirname(import.meta.dirname), "User", "queries", "get-user-row-by-username.sql"), "utf8");
    const result = await poolClient.query(query, [username]);
    poolClient.release();

    // Convert the user data into a User object.
    const row = result.rows[0];

    if (!row) {

      throw new ResourceNotFoundError("User");

    }

    const user = new User({
      id: row.id,
      username: row.username,
      displayName: row.display_name
    }, pool);

    // Return the user.
    return user;

  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();
    const createUsersTableQuery = readFileSync(resolve(dirname(import.meta.dirname), "User", "queries", "create-users-table.sql"), "utf8");
    await poolClient.query(createUsersTableQuery);
    poolClient.release();

  }

  /**
   * Requests the server to delete this user.
   */
  async delete(): Promise<void> {

    const poolClient = await this.#pool.connect();
    const query = readFileSync(resolve(dirname(import.meta.dirname), "User", "queries", "delete-user-row.sql"), "utf8");
    await poolClient.query(query, [this.id]);
    poolClient.release();

  }

}