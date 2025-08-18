// import Client from "../../utilities/Client.js";

// export type ItemConnectionProperties = {
//   id: string;
//   typeID: string;
//   inwardItemID: string;
//   outwardItemID: string;
// }

// /**
//  * An ItemConnection is a connection between two items.
//  */
// export default class ItemConnection {

//   /** The connection's ID. */
//   readonly id: ItemConnectionProperties["id"];

//   /** The connection's type ID. */
//   readonly typeID: ItemConnectionProperties["typeID"];

//   /** The inward item ID of this connection. */
//   readonly inwardItemID: ItemConnectionProperties["inwardItemID"];

//   /** The outward item ID of this connection. */
//   readonly outwardItemID: ItemConnectionProperties["outwardItemID"];

//   /** The client used to make requests. */
//   readonly #client: Client;

//   constructor(data: ItemConnectionProperties, client: Client) {

//     this.id = data.id;
//     this.typeID = data.typeID;
//     this.inwardItemID = data.inwardItemID;
//     this.outwardItemID = data.outwardItemID;
//     this.#client = client;

//   }

//   /**
//    * Requests the server to create a new item connection.
//    *
//    * @param data The data for the new item connection, excluding the ID.
//    */
//   static async create(data: Omit<ItemConnectionProperties, "id">, client: Client): Promise<ItemConnection> {

//     const actionProperties = await client.fetch("/item-connections", {
//       method: "POST",
//       body: JSON.stringify(data)
//     });

//     const itemConnection = new ItemConnection(actionProperties, client);

//     return itemConnection;

//   }

//   /**
//    * Requests the server to return a specific item connection by ID.
//    * @param id The ID of the item connection to retrieve.
//    * @param client The client used to make requests.
//    * @returns The requested item connection.
//    */
//   static async get(id: string, client: Client): Promise<ItemConnection> {

//     const itemConnectionProperties = await client.fetch(`/item-connections/${id}`);

//     return new ItemConnection(itemConnectionProperties, client);

//   }

//   /**
//    * Requests the server to return a list of item connections.
//    *
//    * @param filterQuery A GazeQL filter to apply to the list of item connections.
//    */
//   static async list(filterQuery: string,  client: Client): Promise<ItemConnection[]> {

//     const itemConnectionPropertiesList = await client.fetch(`/item-connections?filter-query=${filterQuery}`);

//     if (!(itemConnectionPropertiesList instanceof Array)) {

//       throw new Error(`Expected an array of item connections, but received ${typeof itemConnectionPropertiesList}`);

//     }

//     const itemConnections = itemConnectionPropertiesList.map((itemConnectionProperties) => new ItemConnection(itemConnectionProperties, client));

//     return itemConnections;

//   }

//   /**
//    * Requests the server to delete this item connection.
//    */
//   async delete(): Promise<void> {

//     await this.#client.fetch(`/item-connections/${this.id}`, {
//       method: "DELETE"
//     });

//   }

//   /**
//    * Requests the server to update this item connection.
//    *
//    * @param data The data to update the item connection with.
//    */
//   async update(data: Partial<ItemConnectionProperties>): Promise<ItemConnection> {

//     const editedItemConnectionData = await this.#client.fetch(`/item-connections/${this.id}`, {
//       method: "PATCH",
//       body: JSON.stringify(data)
//     });

//     return new ItemConnection(editedItemConnectionData, this.#client);

//   }

// }