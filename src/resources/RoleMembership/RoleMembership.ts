import { DatabaseError, Pool } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path"
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import ResourceConflictError from "#errors/ResourceConflictError.js";
import SlashstepQLFilterSanitizer from "#utilities/SlashstepQLFilterSanitizer.js";

export enum RoleMembershipPrincipalType {
  User = "User",
  Group = "Group",
  App = "App"
}

export type BaseRoleMembershipProperties = {
  id: string;
  roleID: string;
  principalType: RoleMembershipPrincipalType | `${RoleMembershipPrincipalType}`;
  principalUserID?: string | null;
  principalGroupID?: string | null;
  principalAppID?: string | null;
}

export type InitialRoleMembershipProperties = Omit<BaseRoleMembershipProperties, "id">;

export type RoleMembershipQueryResult = {
  id: string;
  role_id: string;
  principal_type: RoleMembershipPrincipalType;
  principal_user_id: string;
  principal_group_id: string;
  principal_app_id: string;
}

export default class RoleMembership {
  
  static readonly allowedQueryFields = {
    id: "id", 
    roleID: "role_id", 
    principalType: "principal_type", 
    principalUserID: "principal_user_id", 
    principalGroupID: "principal_group_id", 
    principalAppID: "principal_app_id"
  }

  /** The role membership's ID. */
  readonly id: BaseRoleMembershipProperties["id"];

  /** The role membership's role ID. */
  readonly roleID: BaseRoleMembershipProperties["roleID"];

  /** The type of principal this role membership applies to. */
  readonly principalType: BaseRoleMembershipProperties["principalType"];

  /** The user principal this role membership applies to, if applicable. */
  readonly principalUserID: BaseRoleMembershipProperties["principalUserID"];

  /** The group principal this role membership applies to, if applicable. */
  readonly principalGroupID: BaseRoleMembershipProperties["principalGroupID"];

  /** The app principal this role membership applies to, if applicable. */
  readonly principalAppID: BaseRoleMembershipProperties["principalAppID"];

  /** The pool used to send queries to the database. */
  readonly #pool: Pool

  constructor(data: BaseRoleMembershipProperties, pool: Pool) {

    this.id = data.id;
    this.roleID = data.roleID;
    this.principalType = data.principalType;
    this.principalUserID = data.principalUserID;
    this.principalGroupID = data.principalGroupID;
    this.principalAppID = data.principalAppID;
    this.#pool = pool;

  }

  /**
   * Creates the groups table in the database.
   * @param pool 
   */
  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();

    try {

      const createRoleMembershipsTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-role-memberships-table.sql"), "utf8");
      const createHydratedRoleMembershipsViewQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-hydrated-role-memberships-view.sql"), "utf8");
      await poolClient.query(createRoleMembershipsTableQuery);
      await poolClient.query(createHydratedRoleMembershipsViewQuery);

    } finally {

      poolClient.release();

    }

  }

  /**
   * Creates a role.
   * @param data The data for the new role.
   * @param pool The pool to use to send queries to the database.
   * @returns The created role.
   */
  static async create(data: InitialRoleMembershipProperties, pool: Pool): Promise<RoleMembership> {

    // Insert the role into the database.
    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-role-membership-row.sql"), "utf8");
      const values = [
        data.roleID,
        data.principalType,
        data.principalUserID,
        data.principalGroupID,
        data.principalAppID
      ];
      const result = await poolClient.query<RoleMembershipQueryResult>(query, values);

      // Convert the row to a role object.
      const rowData = result.rows[0];
      const role = new RoleMembership(RoleMembership.getPropertiesFromRow(rowData), pool);

      // Return the role.
      return role;

    } catch (error) {
      
      if (error instanceof DatabaseError && error.code === "23505") {

        throw new ResourceConflictError("Role");
        
      }

      throw error;
      
    } finally {

      poolClient.release();

    }

  }

  static getPropertiesFromRow(rowData: RoleMembershipQueryResult): BaseRoleMembershipProperties {
    
    return {
      id: rowData.id,
      roleID: rowData.role_id,
      principalType: rowData.principal_type,
      principalUserID: rowData.principal_user_id,
      principalGroupID: rowData.principal_group_id,
      principalAppID: rowData.principal_app_id
    };
    
  }

  static async getByID(id: string, pool: Pool): Promise<RoleMembership> {

    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "get-role-membership-row-by-id.sql"), "utf8");
      const result = await poolClient.query(query, [id]);
      const row = result.rows[0];

      if (!row) {

        throw new ResourceNotFoundError("RoleMembership");

      }

      const roleMembership = new RoleMembership(RoleMembership.getPropertiesFromRow(row), pool);

      return roleMembership;

    } finally {

      poolClient.release();

    }

  }

  /** 
   * Requests the server to return a list of actions.
   * 
   * @param filterQuery A SlashstepQL filter to apply to the list of actions.
   */
  static async list(filterQuery: string, pool: Pool): Promise<RoleMembership[]> {

    // Get the list from the database.
    const poolClient = await pool.connect();
    try {

      const { whereClause, values, limit, offset } = SlashstepQLFilterSanitizer.sanitize({
        tableName: "hydrated_role_memberships", 
        filterQuery, 
        defaultLimit: 1000, 
        allowedQueryFields: this.allowedQueryFields
      });
      const result = await poolClient.query(`select * from hydrated_role_memberships${whereClause ? ` where ${whereClause}` : ""}${limit !== undefined ? ` limit ${limit}` : ""}${offset !== undefined ? ` offset ${offset}` : ""}`, values);
      const roleMemberships = result.rows.map((row) => {
        
        const roleMembershipProperties = RoleMembership.getPropertiesFromRow(row);
        const action = new RoleMembership(roleMembershipProperties, pool);
        return action;
      
      });

      return roleMemberships;

    } finally {

      poolClient.release();

    }

  }

  async delete(): Promise<void> {

    const poolClient = await this.#pool.connect();

    try {

      await poolClient.query("begin;");
      const query = readFileSync(resolve(import.meta.dirname, "queries", "delete-role-membership-row.sql"), "utf8");
      await poolClient.query(query, [this.id]);
      await poolClient.query("commit;"); 

    } finally {

      poolClient.release();

    }

  }

}