// import Client from "#utilities/Client.js";

// export type WorkspaceProperties = {
//   id: string;
//   name: string;
//   displayName: string;
//   description?: string;
// };

// export default class Workspace {

//   /** The workspace's ID. */
//   readonly id: WorkspaceProperties["id"];

//   /** The workspace's name. */
//   readonly name: WorkspaceProperties["name"];

//   /** The workspace's display name. */
//   readonly displayName: WorkspaceProperties["displayName"];

//   /** The workspace's description, if applicable. */
//   readonly description: WorkspaceProperties["description"];

//   /** The client used to make requests. */
//   readonly #client: Client;

//   constructor(data: WorkspaceProperties, client: Client) {

//     this.id = data.id;
//     this.name = data.name;
//     this.displayName = data.displayName;
//     this.description = data.description;
//     this.#client = client;

//   }

//   /**
//    * Requests the server to create a new workspace.
//    *
//    * @param data The data for the new workspace, excluding the ID.
//    */
//   static async create(data: Omit<WorkspaceProperties, "id">, client: Client): Promise<Workspace> {

//     const workspaceProperties = await client.fetch("/workspaces", {
//       method: "POST",
//       body: JSON.stringify(data)
//     });

//     const workspace = new Workspace(workspaceProperties, client);

//     return workspace;

//   }

//   /**
//    * Requests the server for a specific workspace by ID.
//    *
//    * @param id The ID of the workspace to retrieve.
//    */
//   static async getFromID(id: string, client: Client): Promise<Workspace> {

//     const workspaceData = await client.fetch(`/workspaces/${id}`);

//     return new Workspace(workspaceData, client);

//   }

//   /**
//    * Requests the server for a specific workspace by name.
//    */
//   static async getFromName(name: string, client: Client): Promise<Workspace> {

//     const workspaceData = await client.fetch(`/workspaces?name=${name}`);

//     return new Workspace(workspaceData, client);

//   }

//   /**
//    * Requests the server to delete this workspace.
//    */
//   async delete(): Promise<void> {

//     await this.#client.fetch(`/workspaces/${this.id}`, {
//       method: "DELETE"
//     });

//   }

//   /**
//    * Requests the server to update this workspace.
//    */
//   async update(data: Partial<WorkspaceProperties>): Promise<void> {

//     await this.#client.fetch(`/workspaces/${this.id}`, {
//       method: "PATCH",
//       body: JSON.stringify(data)
//     });

//   }

// }