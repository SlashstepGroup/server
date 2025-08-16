
import { ResourceType } from "#utilities/types.js";

export enum AccessPolicyPermissionLevel {
  
  /** Principal cannot perform this action. */
  None,

  /** Principal can perform this action. */
  User,

  /** Principal can perform this action, along with managing the permission level of other principals. */
  Admin

}

export type AccessPolicyProperties = {
  id: string;
  principalType: "User" | "Group";
  principalID: string;
  scopeType: ResourceType;
  scopeID?: string;
  actionID: string;
  permissionLevel: AccessPolicyPermissionLevel;
}

/**
 * An AccessPolicy defines the permissions a principal has on a resource.
 */
export default class AccessPolicy {

  static readonly name = "AccessPolicy";

  /** The access policy's ID. */
  readonly id: AccessPolicyProperties["id"];

  /** The principal ID that this access policy applies to. */
  readonly principalID: AccessPolicyProperties["principalID"];

  /** The type of principal this access policy applies to, such as "User" or "Group". */
  readonly principalType: AccessPolicyProperties["principalType"];

  /** The type of resource this access policy applies to, such as "Workspace", "Project", etc. */
  readonly scopeType: AccessPolicyProperties["scopeType"];

  /** The ID of the resource this access policy applies to. Currently, there is no ID if the scope type is "Instance". */
  readonly scopeID: AccessPolicyProperties["scopeID"];

  /** The ID of the action this access policy applies to. */
  readonly actionID: AccessPolicyProperties["actionID"];

  /** The level of permission granted by this access policy. */
  readonly permissionLevel: AccessPolicyProperties["permissionLevel"];

  constructor(data: AccessPolicyProperties) {

    this.id = data.id;
    this.principalID = data.principalID;
    this.principalType = data.principalType;
    this.scopeType = data.scopeType;
    this.scopeID = data.scopeID;
    this.actionID = data.actionID;
    this.permissionLevel = data.permissionLevel;

  }

  /**
   * Creates an access policy.
   * 
   * @param data The data for the new AccessPolicy, excluding the ID.
   * @returns The created AccessPolicy.
   */
  static async create(data: Omit<AccessPolicyProperties, "id">, client: Client): Promise<AccessPolicy> {

    const postgresSQLClient = new PostgreSQLClient();

    try {

      await postgresSQLClient.connect();

    } catch (error: unknown) {


    } finally {

      await postgresSQLClient.end();

    }

  }

  /** 
   * Requests the server to return a list of access policies.
   * @param filterQuery A GazeQL filter to apply to the list of access policies.
   */
  static async list(filterQuery: string, client: Client): Promise<AccessPolicy[]> {

    const accessPolicyPropertiesList = await client.fetch(`/access-policies?filter-query=${filterQuery}`);

    if (!(accessPolicyPropertiesList instanceof Array)) {

      throw new Error(`Expected an array of access policies, but received ${typeof accessPolicyPropertiesList}`);

    }

    const accessPolicies = accessPolicyPropertiesList.map((accessPolicyProperties) => new AccessPolicy(accessPolicyProperties, client));

    return accessPolicies;

  }

  /**
   * Requests the server to return a specific access policy by ID.
   * @param id The ID of the access policy to retrieve.
   * @param client The client used to make requests.
   * @returns The requested access policy.
   */
  static async get(id: string, client: Client): Promise<AccessPolicy> {

    const accessPolicyProperties = await client.fetch(`/access-policies/${id}`);

    return new AccessPolicy(accessPolicyProperties, client);

  }

  /**
   * Requests the server to delete this access policy.
   */
  async delete(): Promise<void> {

    await this.#client.fetch(`/access-policies/${this.id}`, {
      method: "DELETE"
    });

  }

  /**
   * Requests the server to update this access policy.
   * 
   * @param data The data to update the AccessPolicy with.
   */
  async update(data: Partial<AccessPolicyProperties>): Promise<AccessPolicy> {

    const editedAccessPolicyData = await this.#client.fetch(`/access-policies/${this.id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });

    return new AccessPolicy(editedAccessPolicyData, this.#client);

  }

}
