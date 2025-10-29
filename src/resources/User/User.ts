import AccessPolicy, { AccessPolicyPermissionLevel, AccessPolicyPrincipalType, Scope } from "#resources/AccessPolicy/AccessPolicy.js";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import Session from "#resources/Session/Session.js";
import PermissionDeniedError from "#errors/PermissionDeniedError.js";
import Role, { InitialWritableRoleProperties, RoleParentResourceType } from "#resources/Role/Role.js";
import ResourceConflictError from "#errors/ResourceConflictError.js";
import Principal, { PrincipalResourceClassMap } from "src/interfaces/Principal.js";

export type UserProperties = {
  id: string;
  username: string;
  displayName: string;
  hashedPassword: string;
};

export default class User implements Principal {
  
  /** The user's ID. */
  readonly id: UserProperties["id"];

  /** The user's username. */
  readonly username: UserProperties["username"];

  readonly displayName: UserProperties["displayName"];

  /** The client used to make requests. */
  readonly #pool: Pool;

  readonly #session?: Session;

  readonly #hashedPassword: UserProperties["hashedPassword"];

  constructor(data: UserProperties, pool: Pool, session?: Session) {

    this.id = data.id;
    this.username = data.username;
    this.displayName = data.displayName;
    this.#hashedPassword = data.hashedPassword;
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
    const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-user-row.sql"), "utf8");
    const values = [data.username, data.displayName, data.hashedPassword];
    const result = await poolClient.query(query, values);
    poolClient.release();

    // Convert the row to a user object.
    const row = result.rows[0];
    const user = new User({
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      hashedPassword: row.hashed_password
    }, pool);

    // Return the user.
    return user;

  }

  /**
   * Requests the server for a specific user by ID.
   *
   * @param id The ID of the user to retrieve.
   */
  static async getByID(id: string, pool: Pool): Promise<User> {

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
      displayName: row.display_name,
      hashedPassword: row.hashed_password
    }, pool);

    // Return the user.
    return user;

  }

  /**
   * Requests the server for a specific user by username.
   * @param username The username of the user to retrieve.
   * @param client The client used to make requests.
   */
  static async getByUsername(username: string, pool: Pool): Promise<User> {

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
      displayName: row.display_name,
      hashedPassword: row.hashed_password
    }, pool);

    // Return the user.
    return user;

  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();
    const createUsersTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-users-table.sql"), "utf8");
    const createHydratedUsersViewQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-hydrated-users-view.sql"), "utf8");
    await poolClient.query(createUsersTableQuery);
    await poolClient.query(createHydratedUsersViewQuery);
    poolClient.release();

  }

  /**
   * Requests the server to delete this user.
   */
  async delete(): Promise<void> {

    const poolClient = await this.#pool.connect();
    const query = readFileSync(resolve(import.meta.dirname, "queries", "delete-user-row.sql"), "utf8");
    await poolClient.query(query, [this.id]);
    poolClient.release();

  }

  async checkPermissions(resourceClasses: PrincipalResourceClassMap, actionID: string, scope: Scope = {}, minimumPermissionLevel: AccessPolicyPermissionLevel = AccessPolicyPermissionLevel.User) {
  
    const { Action, AccessPolicy } = resourceClasses;
    const action = await Action.getByID(actionID, this.#pool);

    try {

      const accessPolicy = await AccessPolicy.getByDeepestScope(action.id, this.#pool, {
        principalType: AccessPolicyPrincipalType.User,
        principalUserID: this.id
      }, scope);
      return accessPolicy.permissionLevel >= minimumPermissionLevel;

    } catch (error) {

      if (error instanceof ResourceNotFoundError) {

        return false;

      }

      throw error;

    }

  }

  async verifyPermissions(resourceClasses: PrincipalResourceClassMap, actionID: string, scope: Scope = {}, minimumPermissionLevel: AccessPolicyPermissionLevel = AccessPolicyPermissionLevel.User): Promise<void> {

    const canPrincipalAccess = await this.checkPermissions(resourceClasses, actionID, scope, minimumPermissionLevel);
    if (!canPrincipalAccess) {

      throw new PermissionDeniedError();

    }

  }
  
  static async initializePreDefinedRoles(roleClass: typeof Role, pool: Pool): Promise<Role[]> {

    const roleDataList: Omit<InitialWritableRoleProperties, "parentResourceType">[] = [
      {
        name: "unauthenticated-users",
        displayName: "Unauthenticated users",
        description: "Principals who are not logged in."
      }
    ];
    const roles = [];

    for (const roleData of roleDataList) {

      try {

        const role = await roleClass.create({
          ...roleData,
          isPreDefined: true,
          parentResourceType: RoleParentResourceType.Instance
        }, pool);
        roles.push(role);

      } catch (error) {

        if (error instanceof ResourceConflictError) {

          const role = await roleClass.getByName(roleData.name, pool);
          roles.push(role);

        } else {

          throw error;

        }
        
      }

    }

    return roles;

  }

  getHashedPassword(): string {

    return this.#hashedPassword;

  }

}