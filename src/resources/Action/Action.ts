import { DatabaseError, Pool } from "pg";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import SlashstepQLFilterSanitizer from "#utilities/SlashstepQLFilterSanitizer.js";
import ResourceConflictError from "#errors/ResourceConflictError.js";
import type { default as Role } from "#resources/Role/Role.js";
import type { default as AccessPolicy, AccessPolicyPermissionLevel } from "#resources/AccessPolicy/AccessPolicy.js";
import Resource from "src/interfaces/Resource.js";
import BadRequestError from "#errors/BadRequestError.js";

export type BaseActionProperties = {
  id: string;
  name: string;
  appID?: string | null;
  displayName: string;
  description: string;
}

export type ActionQueryResult = {
  id: string;
  name: string;
  app_id?: string | null;
  display_name: string;
  description: string;
}

export type ActionScopeData = {
  actionID: string;
  appID?: string | null;
}

export type InitialWritableActionProperties = Omit<BaseActionProperties, "id">;

/**
 * An Action is a type of process that is performed by an actor.
 */
export default class Action implements Resource<ActionScopeData> {

  static readonly name = "Action";

  static readonly allowedQueryFields = {
    id: "id", 
    name: "name", 
    displayName: "display_name", 
    description: "description", 
    appID: "app_id"
  }

  /** The action's ID. */
  readonly id: BaseActionProperties["id"];

  /** The action's name. */
  readonly name: BaseActionProperties["name"];

  /** The action's display name. */
  readonly displayName: BaseActionProperties["displayName"];

  /** The action's description. */
  readonly description: BaseActionProperties["description"];

  /** The action's application ID. If there isn't one, then the action is directly associated with the instance. */
  readonly appID: BaseActionProperties["appID"];

  /** The client used to make requests. */
  readonly #pool: Pool;

  constructor(data: BaseActionProperties, pool: Pool) {

    this.id = data.id;
    this.name = data.name;
    this.displayName = data.displayName;
    this.description = data.description;
    this.appID = data.appID ?? null;
    this.#pool = pool;

  }

  /**
   * Requests the server to create a new action.
   * 
   * @param data The data for the new Action, excluding the ID.
   */
  static async create(data: Omit<BaseActionProperties, "id">, pool: Pool): Promise<Action> {

    // Insert the access policy into the database.
    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-action-row.sql"), "utf8");
      const values = [data.name, data.displayName, data.description, data.appID];
      const result = await poolClient.query(query, values);

      // Convert the row to an Action object.
      const actionRow = result.rows[0];
      const actionProperties = Action.getPropertiesFromRow(actionRow);
      const accessPolicy = new Action(actionProperties, pool);

      // Return the access policy.
      return accessPolicy;

    } catch (error) {
      
      if (error instanceof DatabaseError && error.code === "23505") {

        throw new ResourceConflictError("Action");

      }

      throw error;
      
    } finally {

      poolClient.release();

    }

  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();
    const createActionsTableQuery = readFileSync(resolve(dirname(import.meta.dirname), "Action", "queries", "create-actions-table.sql"), "utf8");
    const createHydratedActionsViewQuery = readFileSync(resolve(dirname(import.meta.dirname), "Action", "queries", "create-hydrated-actions-view.sql"), "utf8");
    const insertDefaultActionsQuery = readFileSync(resolve(dirname(import.meta.dirname), "Action", "queries", "insert-default-actions.sql"), "utf8");
    await poolClient.query(createActionsTableQuery);
    await poolClient.query(insertDefaultActionsQuery);
    await poolClient.query(createHydratedActionsViewQuery);
    poolClient.release();

  }

  static getPropertiesFromRow(rowData: ActionQueryResult): BaseActionProperties {
        
    return {
      id: rowData.id,
      name: rowData.name,
      displayName: rowData.display_name,
      description: rowData.description,
      appID: rowData.app_id
    };
    
  }

  /**
   * Requests the server to return a specific action by ID.
   * @param id The ID of the action to retrieve.
   * @returns The requested action.
   */
  static async getByID(id: string, pool: Pool): Promise<Action> {

    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "get-action-row-by-id.sql"), "utf8");
      const result = await poolClient.query(query, [id]);

      // Make sure the action data exists.
      const data = result.rows[0];

      if (!data) {

        throw new ResourceNotFoundError("Action");

      }

      // Return the action.
      const action = new Action(data, pool);
      return action;

    } catch (error) {
      
      if (error instanceof DatabaseError && error.code === "22P02") {

        throw new BadRequestError("The action ID must be a UUID.");

      }

      throw error;

    } finally {

      poolClient.release();

    }

  }

  /**
   * Requests the server to return a specific action by ID.
   * @param id The ID of the action to retrieve.
   * @returns The requested action.
   */
  static async getByName(name: string, pool: Pool, isDefaultAction: boolean = false): Promise<Action> {

    // Get the action data from the database.
    const poolClient = await pool.connect();
    const query = readFileSync(resolve(dirname(import.meta.dirname), "Action", "queries", "get-action-row-by-name.sql"), "utf8");
    const result = await poolClient.query(query, [name]);
    poolClient.release();

    // Make sure the action data exists.
    const data = result.rows[0];

    if (!data) {

      if (isDefaultAction) {

        throw new Error(`The ${name} action does not exist. You may need to set up the default actions again.`);

      } else {

        throw new ResourceNotFoundError("Action");

      }

    }

    // Return the action.
    const action = new Action(data, pool);
    return action;

  }

  static async getPreDefinedActionByName(name: string, pool: Pool): Promise<Action> {
    
    try {

      return await Action.getByName(name, pool);

    } catch (error) {

      if (error instanceof ResourceNotFoundError) {

        throw new Error(`The ${name} action does not exist. You may need to set up the pre-defined actions.`);

      }

      throw error;

    }

  }

  static async initializePreDefinedRoleAccessPolicies(classes: {"AccessPolicy": typeof AccessPolicy, "Role": typeof Role}, pool: Pool): Promise<AccessPolicy[]> {

    const permissions: {
      [preDefinedRoleName: string]: {
        actionName: string;
        permissionLevel: AccessPolicyPermissionLevel | `${AccessPolicyPermissionLevel}`
      }[];
    } = {
      "action-admins": [
        {
          actionName: "slashstep.actions.get",
          permissionLevel: "Admin",
        },
        {
          actionName: "slashstep.actions.list",
          permissionLevel: "Admin",
        },
        {
          actionName: "slashstep.actions.update",
          permissionLevel: "Admin",
        },
        {
          actionName: "slashstep.actions.delete",
          permissionLevel: "Admin"
        },
        {
          actionName: "slashstep.actions.create",
          permissionLevel: "Admin"
        }
      ],
      "action-editors": [
        {
          actionName: "slashstep.actions.get",
          permissionLevel: "Editor"
        },
        {
          actionName: "slashstep.actions.list",
          permissionLevel: "Editor"
        },
        {
          actionName: "slashstep.actions.update",
          permissionLevel: "Editor"
        },
        {
          actionName: "slashstep.actions.delete",
          permissionLevel: "Editor"
        },
        {
          actionName: "slashstep.actions.create",
          permissionLevel: "Editor"
        }
      ],
      "action-users": [
        {
          actionName: "slashstep.actions.get",
          permissionLevel: "User"
        },
        {
          actionName: "slashstep.actions.list",
          permissionLevel: "User"
        },
        {
          actionName: "slashstep.actions.update",
          permissionLevel: "User"
        },
        {
          actionName: "slashstep.accessPolicies.delete",
          permissionLevel: "User"
        },
        {
          actionName: "slashstep.users.register",
          permissionLevel: "User"
        }
      ],
      "read-only-action-users": [
        {
          actionName: "slashstep.actions.get",
          permissionLevel: "User"
        },
        {
          actionName: "slashstep.actions.list",
          permissionLevel: "User"
        }
      ]
    };

    const accessPolicies = [];

    for (const preDefinedRoleName of Object.keys(permissions)) {

      const preDefinedRole = await classes.Role.getByName(preDefinedRoleName, pool);

      for (const permission of permissions[preDefinedRoleName]) {

        const action = await Action.getByName(permission.actionName, pool);
        const accessPolicy = await classes.AccessPolicy.create({
          principalType: "Role",
          principalRoleID: preDefinedRole.id,
          actionID: action.id,
          permissionLevel: permission.permissionLevel,
          inheritanceLevel: "Enabled",
          scopedResourceType: "Instance"
        }, pool);

        accessPolicies.push(accessPolicy);

      }

    }

    return accessPolicies;

  }

  static async initializeActions(pool: Pool): Promise<Action[]> {

    const actionPropertiesList: InitialWritableActionProperties[] = [
      {
        name: "slashstep.actions.get",
        displayName: "Get action",
        description: "View an action."
      },
      {
        name: "slashstep.actions.list",
        displayName: "List actions",
        description: "List actions on a particular scope."
      },
      {
        name: "slashstep.actions.create",
        displayName: "Create actions",
        description: "Create actions on a particular scope."
      },
      {
        name: "slashstep.actions.update",
        displayName: "Update actions",
        description: "Update access policies on a particular scope."
      },
      {
        name: "slashstep.actions.delete",
        displayName: "Delete actions",
        description: "Delete actions on a particular scope."
      }
    ];

    const actions = [];
    for (const actionProperties of actionPropertiesList) {

      try {

        const action = await Action.create(actionProperties, pool);
        actions.push(action);

      } catch (error) {

        if (error instanceof ResourceConflictError) {

          const action = await Action.getByName(actionProperties.name, pool);
          actions.push(action);

        } else {

          throw error;

        }

      }

    }

    return actions;

  }

  static async initializePreDefinedRoles(roleClass: typeof Role, pool: Pool): Promise<Role[]> {
  
    const roleDataList: Omit<InitialWritableActionProperties, "parentResourceType">[] = [
      {
        name: "action-admins",
        displayName: "Action admins",
        description: "Principals with full control over actions."
      },
      {
        name: "action-editors",
        displayName: "Action editors",
        description: "Principals with editor access over actions."
      },
      {
        name: "action-users",
        displayName: "Action users",
        description: "Principals with user access over actions."
      },
      {
        name: "read-only-action-users",
        displayName: "Read-only action users",
        description: "Principals with read-only user access over actions."
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

  /** 
   * Requests the server to return a list of actions.
   * 
   * @param filterQuery A SlashstepQL filter to apply to the list of actions.
   */
  static async list(filterQuery: string, pool: Pool): Promise<Action[]> {

    // Get the list from the database.
    const poolClient = await pool.connect();
    try {

      const { whereClause, values, limit, offset } = SlashstepQLFilterSanitizer.sanitize({
        tableName: "hydrated_actions", 
        filterQuery, 
        defaultLimit: 1000, 
        allowedQueryFields: this.allowedQueryFields
      });
      const result = await poolClient.query(`select * from hydrated_actions${whereClause ? ` where ${whereClause}` : ""}${limit !== undefined ? ` limit ${limit}` : ""}${offset !== undefined ? ` offset ${offset}` : ""}`, values);
      const actions = result.rows.map((row) => {
        
        const actionProperties = Action.getPropertiesFromRow(row);
        const action = new Action(actionProperties, pool);
        return action;
      
      });

      return actions;

    } finally {

      poolClient.release();

    }

  }

  static async count(filterQuery: string, pool: Pool): Promise<number> {

    // Get the list from the database.
    const poolClient = await pool.connect();

    try {

      const { whereClause, values } = SlashstepQLFilterSanitizer.sanitize({
        tableName: "hydrated_actions",
        filterQuery,
        shouldIgnoreOffset: true,
        shouldIgnoreLimit: true,
        allowedQueryFields: this.allowedQueryFields
      });
      const result = await poolClient.query(`select count(*) from hydrated_actions${whereClause ? ` where ${whereClause}` : ""}`, values);
      
      // Convert the list of rows to AccessPolicy objects.
      const count = parseInt(result.rows[0].count, 10);

      // Return the list.
      return count;

    } finally {

      poolClient.release();

    }

  }

  getScopeData(): ActionScopeData {

    return {
      actionID: this.id,
      appID: this.appID
    };

  }

  /**
   * Requests the server to delete this action.
   * 
   * This method only works for app accounts.
   */
  async delete(): Promise<void> {

    const query = readFileSync(resolve(dirname(import.meta.dirname), "Action", "queries", "delete-action-row.sql"), "utf8");
    const poolClient = await this.#pool.connect();
    await poolClient.query(query, [this.id]);
    poolClient.release();

  }

}