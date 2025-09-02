// import Client from "src/utilities/Client.js";

// export type InstanceProperties = {
//   displayName: string;
//   description?: string;
//   creationTime: Date;
//   updateTime: Date;
// }

// /**
//  * An Instance represents an instance of the Slashstep application.
//  */
// export default class Instance {

//   /** The instance's display name. */
//   readonly displayName: InstanceProperties["displayName"];

//   /** The instance's description, if applicable. */
//   readonly description?: InstanceProperties["description"];

//   /** The instance's creation time. */
//   readonly creationTime: InstanceProperties["creationTime"];

//   /** The instance's update time. */
//   readonly updateTime: InstanceProperties["updateTime"];

//   /** The client used to make requests. */
//   readonly #client: Client;

//   constructor(data: InstanceProperties, client: Client) {

//     this.displayName = data.displayName;
//     this.description = data.description;
//     this.creationTime = data.creationTime;
//     this.updateTime = data.updateTime;
//     this.#client = client;

//   }

//   /**
//    * Requests the server to update this Instance.
//    *
//    * @param data The data to update the Instance with.
//    */
//   async update(data: Partial<InstanceProperties>): Promise<Instance> {

//     const editedInstanceData = await this.#client.fetch(`/instance`, {
//       method: "PATCH",
//       body: JSON.stringify(data)
//     });

//     return new Instance(editedInstanceData, this.#client);

//   }

// }