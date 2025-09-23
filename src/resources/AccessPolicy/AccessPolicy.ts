
// import SlashstepQLFilterSanitizer from "#utilities/SlashstepQLFilterSanitizer.js";
// import { ResourceType } from "#utilities/types.js";
// import { Pool } from "pg";

// export enum AccessPolicyPermissionLevel {
  
//   /** Principal cannot perform this action. */
//   None,

//   /** Principal can perform this action. */
//   User,

//   /** Principal can perform this action, along with managing the permission level of other principals. */
//   Admin

// }

// export type AccessPolicyProperties = {
//   id: string;
//   principalType: "User" | "Group";
//   principalID: string;
//   scopeType: ResourceType;
//   scopeID?: string;
//   actionID: string;
//   permissionLevel: AccessPolicyPermissionLevel;
// }

// /**
//  * An AccessPolicy defines the permissions a principal has on a resource.
//  */
// export default class AccessPolicy {

//   static readonly name = "AccessPolicy";

//   /** The access policy's ID. */
//   readonly id: AccessPolicyProperties["id"];

//   /** The principal ID that this access policy applies to. */
//   readonly principalID: AccessPolicyProperties["principalID"];

//   /** The type of principal this access policy applies to, such as "User" or "Group". */
//   readonly principalType: AccessPolicyProperties["principalType"];

//   /** The type of resource this access policy applies to, such as "Workspace", "Project", etc. */
//   readonly scopeType: AccessPolicyProperties["scopeType"];

//   /** The ID of the resource this access policy applies to. Currently, there is no ID if the scope type is "Instance". */
//   readonly scopeID: AccessPolicyProperties["scopeID"];

//   /** The ID of the action this access policy applies to. */
//   readonly actionID: AccessPolicyProperties["actionID"];

//   /** The level of permission granted by this access policy. */
//   readonly permissionLevel: AccessPolicyProperties["permissionLevel"];

//   constructor(data: AccessPolicyProperties) {

//     this.id = data.id;
//     this.principalID = data.principalID;
//     this.principalType = data.principalType;
//     this.scopeType = data.scopeType;
//     this.scopeID = data.scopeID;
//     this.actionID = data.actionID;
//     this.permissionLevel = data.permissionLevel;

//   }

//   /**
//    * Creates an access policy.
//    * 
//    * @param data The data for the new AccessPolicy, excluding the ID.
//    * @returns The created AccessPolicy.
//    */
//   static async create(data: Omit<AccessPolicyProperties, "id">, pool: Pool): Promise<AccessPolicy> {

//     // Insert the access policy into the database.
//     const poolClient = await pool.connect();
//     const query = `insert into accessPolicies (principalType, principalID, scopeType, scopeID, actionID, permissionLevel) values ($1, $2, $3, $4, $5, $6) returning *`;
//     const values = [data.principalType, data.principalID, data.scopeType, data.scopeID, data.actionID, data.permissionLevel];
//     const result = await poolClient.query(query, values);
//     poolClient.release();

//     // Convert the row to an AccessPolicy object.
//     const accessPolicy = new AccessPolicy(result.rows[0]);

//     // Return the access policy.
//     return accessPolicy;

//   }

//   /** 
//    * Requests the server to return a list of access policies.
//    * @param filterQuery A SlashstepQL filter to apply to the list of access policies.
//    */
//   static async list(filterQuery: string, pool: Pool): Promise<AccessPolicy[]> {

//     // Get the list from the database.
//     const poolClient = await pool.connect();
//     const { query, values } = SlashstepQLFilterSanitizer.sanitize({tableName: "accessPolicies", filterQuery});
//     const result = await poolClient.query(query, values);
//     poolClient.release();

//     // Convert the list of rows to AccessPolicy objects.
//     // const accessPolicies = result.rows.map(row => new AccessPolicy(row));
//     const accessPolicies: AccessPolicy[] = [];

//     // Return the list.
//     return accessPolicies;

//   }

//   /**
//    * Creates the accessPolicies table in the database.
//    * @param pool 
//    */
//   static async createTable(pool: Pool): Promise<void> {

//     // Create the table.
//     await pool.query(`create table if not exists accessPolicies (
//       id UUID primary key,
//       principalType text not null,
//       principalID text not null,
//       scopeType text not null,
//       scopeID text,
//       actionID text not null,
//       permissionLevel text not null
//     );`);

//   }

//   // /**
//   //  * Requests the server to return a specific access policy by ID.
//   //  * @param id The ID of the access policy to retrieve.
//   //  * @param client The client used to make requests.
//   //  * @returns The requested access policy.
//   //  */
//   // static async get(id: string, pool: Pool): Promise<AccessPolicy> {

//   //   // Get the access policy from the database.
//   //   const poolClient = await pool.connect();
//   //   const result = await poolClient.query(`select * from accessPolicies where id = $1`, [id]);
//   //   poolClient.release();

//   // }

//   // /**
//   //  * Requests the server to delete this access policy.
//   //  */
//   // async delete(): Promise<void> {

//   //   await this.#client.fetch(`/access-policies/${this.id}`, {
//   //     method: "DELETE"
//   //   });

//   // }

//   // /**
//   //  * Requests the server to update this access policy.
//   //  * 
//   //  * @param data The data to update the AccessPolicy with.
//   //  */
//   // async update(data: Partial<AccessPolicyProperties>): Promise<AccessPolicy> {

//   //   const editedAccessPolicyData = await this.#client.fetch(`/access-policies/${this.id}`, {
//   //     method: "PATCH",
//   //     body: JSON.stringify(data)
//   //   });

//   //   return new AccessPolicy(editedAccessPolicyData, this.#client);

//   // }

// }
