// import Client from "#utilities/Client.js";

// export type UserProperties = {
//   id: string;
//   username: string;
// };

// export default class User {
  
//   /** The user's ID. */
//   readonly id: UserProperties["id"];

//   /** The user's username. */
//   readonly username: UserProperties["username"];

//   /** The client used to make requests. */
//   readonly #client: Client;

//   constructor(data: UserProperties, client: Client) {

//     this.id = data.id;
//     this.username = data.username;
//     this.#client = client;

//   }

//   /**
//    * Requests the server to create a new user.
//    *
//    * @param data The data for the new user, excluding the ID.
//    */
//   static async create(data: Omit<UserProperties, "id">, client: Client): Promise<User> {

//     const userProperties = await client.fetch("/users", {
//       method: "POST",
//       body: JSON.stringify(data)
//     });

//     const user = new User(userProperties, client);

//     return user;

//   }

//   /**
//    * Requests the server for a specific user by ID.
//    *
//    * @param id The ID of the user to retrieve.
//    */
//   static async getFromID(id: string, client: Client): Promise<User> {

//     const userData = await client.fetch(`/users/${id}`);

//     return new User(userData, client);

//   }

//   /**
//    * Requests the server for a specific user by username.
//    * @param username The username of the user to retrieve.
//    * @param client The client used to make requests.
//    */
//   static async getFromUsername(username: string, client: Client): Promise<User> {

//     const userData = await client.fetch(`/users?username=${username}`);

//     return new User(userData, client);

//   }

//   /**
//    * Requests the server to delete this user.
//    */
//   async delete(): Promise<void> {

//     await this.#client.fetch(`/users/${this.id}`, {
//       method: "DELETE"
//     });

//   }

//   /**
//    * Requests the server to update this user.
//    */
//   async update(data: Partial<UserProperties>): Promise<void> {

//     await this.#client.fetch(`/users/${this.id}`, {
//       method: "PATCH",
//       body: JSON.stringify(data)
//     });

//   }

// }