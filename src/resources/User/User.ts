import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import ForbiddenError from "#errors/ForbiddenError.js";
import ResourceConflictError from "#errors/ResourceConflictError.js";
import { AccessPolicyPermissionLevel, AccessPolicyPrincipalData, AccessPolicyPrincipalType, AccessPolicyScopeData } from "#resources/AccessPolicy/AccessPolicy.js";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import type { default as Principal, PrincipalResourceClassMap } from "src/interfaces/Principal.js";
import type { default as Role, InitialWritableRoleProperties } from "#resources/Role/Role.js";
import type { default as RoleMembership } from "#resources/RoleMembership/RoleMembership.js";
import UnauthenticatedError from "#errors/UnauthenticatedError.js";

export type UserProperties = {
  id: string;
  username?: string | null;
  displayName?: string | null;
  hashedPassword?: string | null;
  isAnonymous: boolean;
  ipAddress?: string | null;
};

export type InitialUserProperties = Omit<UserProperties, "id">;

export type UserQueryResult = {
  id: string;
  username: string | null;
  display_name: string | null;
  is_anonymous: boolean;
  ip_address: string | null;
  hashed_password: string | null;
}

export type UserScopeData = {
  scopedResourceType: "User";
  userID: string;
}

export default class User implements Principal {
  
  /** The user's ID. */
  readonly id: UserProperties["id"];

  /** The user's username. */
  readonly username: UserProperties["username"];

  readonly displayName: UserProperties["displayName"];

  /** The client used to make requests. */
  readonly #pool: Pool;

  readonly isAnonymous: UserProperties["isAnonymous"];

  readonly #ipAddress: UserProperties["ipAddress"];

  readonly #hashedPassword: UserProperties["hashedPassword"];

  constructor(data: UserProperties, pool: Pool) {

    this.id = data.id;
    this.username = data.username;
    this.displayName = data.displayName;
    this.isAnonymous = data.isAnonymous;
    this.#ipAddress = data.ipAddress;
    this.#hashedPassword = data.hashedPassword;
    this.#pool = pool;

  }

  /**
   * Requests the server to create a new user.
   *
   * @param data The data for the new user, excluding the ID.
   */
  static async create(data: InitialUserProperties, pool: Pool): Promise<User> {

    // Insert the user data into the database.
    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-user-row.sql"), "utf8");
      const values = [
        data.username, 
        data.displayName, 
        data.hashedPassword, 
        data.isAnonymous, 
        data.ipAddress
      ];
      const result = await poolClient.query(query, values);

      // Convert the row to a user object.
      const row = result.rows[0];
      const user = new User(User.getPropertiesFromRow(row), pool);

      // Return the user.
      return user;

    } finally {

      poolClient.release();

    }

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

    const user = new User(User.getPropertiesFromRow(row), pool);

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

    const user = new User(User.getPropertiesFromRow(row), pool);

    // Return the user.
    return user;

  }

  /**
   * Gets an anonymous user by their IP address.
   * @param username The username of the user to retrieve.
   * @param client The client used to make requests.
   */
  static async getByIPAddress(ipAddress: string, pool: Pool): Promise<User> {

    // Get the user data from the database.
    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "get-user-row-by-ip-address.sql"), "utf8");
      const result = await poolClient.query(query, [ipAddress]);

      // Convert the user data into a User object.
      const row = result.rows[0];

      if (!row) {

        throw new ResourceNotFoundError("User");

      }

      const user = new User(User.getPropertiesFromRow(row), pool);

      // Return the user.
      return user;

    } finally {

      poolClient.release();

    }

  }

  static getPropertiesFromRow(rowData: UserQueryResult): UserProperties {
        
    return {
      id: rowData.id,
      username: rowData.username,
      displayName: rowData.display_name,
      isAnonymous: rowData.is_anonymous,
      ipAddress: rowData.ip_address,
      hashedPassword: rowData.hashed_password
    };
    
  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();
    const createUsersTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-users-table.sql"), "utf8");
    const createHydratedUsersViewQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-hydrated-users-view.sql"), "utf8");
    await poolClient.query(createUsersTableQuery);
    await poolClient.query(createHydratedUsersViewQuery);
    poolClient.release();

  }

  async listRoleMemberships(roleMembershipClass: typeof RoleMembership, pool: Pool): Promise<RoleMembership[]> {

    const roleMemberships = await roleMembershipClass.list(`principalUserID = "${this.id}"`, pool);
    return roleMemberships;

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

  getPrincipalData(): AccessPolicyPrincipalData {

    return {
      principalType: AccessPolicyPrincipalType.User,
      principalUserID: this.id
    };

  }

  async checkPermissions(resourceClasses: PrincipalResourceClassMap, actionID: string, scope: AccessPolicyScopeData = {scopedResourceType: "Instance"}, minimumPermissionLevel: AccessPolicyPermissionLevel = AccessPolicyPermissionLevel.User) {
  
    const { Action, AccessPolicy, Role, RoleMembership } = resourceClasses;
    const action = await Action.getByID(actionID, this.#pool);

    const findAccessPolicyWithDeepestScope = async (principalData: AccessPolicyPrincipalData) => {

      try {

        return await AccessPolicy.getAccessPolicyWithDeepestScope(action.id, this.#pool, principalData, scope);

      } catch (error) {

        if (!(error instanceof ResourceNotFoundError)) {

          throw error;

        }

      }

    }

    const individualLevelAccessPolicy = await findAccessPolicyWithDeepestScope(this.getPrincipalData());
    if (individualLevelAccessPolicy) {

      return individualLevelAccessPolicy.permissionLevel >= minimumPermissionLevel;

    }

    const roleMemberships = await this.listRoleMemberships(RoleMembership, this.#pool);
    for (const roleMembership of roleMemberships) {

      // Any role with a permission level that is greater than or equal to the minimum permission level is enough to grant access.
      const role = await Role.getByID(roleMembership.roleID, this.#pool);
      const roleLevelAccessPolicy = await findAccessPolicyWithDeepestScope(role.getPrincipalData());
      if (roleLevelAccessPolicy && roleLevelAccessPolicy.permissionLevel >= minimumPermissionLevel) {

        return true;

      }

    }

    return false;

  }

  getScopeData(): UserScopeData {

    return {
      scopedResourceType: "User",
      userID: this.id
    };

  }

  getIPAddress(): string {

    if (!this.#ipAddress) {

      throw new Error("IP address is not available for non-anonymous users. Consider getting the IP address from a session instead.");

    }

    return this.#ipAddress;

  }

  async verifyPermissions(resourceClasses: PrincipalResourceClassMap, actionID: string, scope: AccessPolicyScopeData = {scopedResourceType: "Instance"}, minimumPermissionLevel: AccessPolicyPermissionLevel = AccessPolicyPermissionLevel.User): Promise<void> {

    const canPrincipalAccess = await this.checkPermissions(resourceClasses, actionID, scope, minimumPermissionLevel);
    if (!canPrincipalAccess) {

      if (this.isAnonymous) {

        throw new UnauthenticatedError();

      } else {

        throw new ForbiddenError();

      }

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
          parentResourceType: "Instance"
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

    if (!this.#hashedPassword) {

      throw new Error("Hashed password is not available.");

    }

    return this.#hashedPassword;

  }

}