// import User from "#resources/User/User.js";
// import Client from "#utilities/Client.js";

// export type SessionProperties = {
//   id: string;
//   userID: string;
//   expirationDate: Date;
//   creationIP?: string;
//   token?: string;
// };

// /**
//  * A Session represents a user's session in the Slashstep application.
//  */
// export default class Session {

//   /** The ID of the session. */
//   readonly id: SessionProperties["id"];

//   /** The user ID associated with this session, if applicable. */
//   readonly userID: SessionProperties["userID"];

//   /** The expiration date of the session, if applicable. */
//   readonly expirationDate: SessionProperties["expirationDate"];

//   /** The IP address from which the session was created, if applicable. */
//   readonly creationIP: SessionProperties["creationIP"];

//   /** The token associated with the session, if applicable. */
//   readonly token: SessionProperties["token"];

//   /** Cached user associated with this session, if applicable. */
//   #cachedUser?: User;

//   /** The client used to make requests. */
//   readonly #client: Client;

//   constructor(properties: SessionProperties, client: Client) {

//     this.id = properties.id;
//     this.userID = properties.userID;
//     this.expirationDate = properties.expirationDate;
//     this.creationIP = properties.creationIP;
//     this.token = properties.token;
//     this.#client = client;

//   }

//   static async create(authenticationProperties: { username: string; password: string }, client: Client): Promise<Session> {

//     const sessionProperties = await client.fetch("/user/sessions", {
//       method: "POST",
//       body: JSON.stringify(authenticationProperties)
//     });

//     const session = new Session(sessionProperties, client);

//     return session;

//   }

//   /**
//    * Requests the server for a specific session by ID.
//    * @param id The ID of the session to retrieve.
//    */
//   static async get(id: string, client: Client): Promise<Session> {

//     const sessionData = await client.fetch(`/sessions/${id}`);

//     return new Session(sessionData, client);

//   }

//   /**
//    * Requests the server for a specific user by token.
//    * @param token The token of the user to retrieve.
//    * @param client The client used to make requests.
//    */
//   static async getFromToken(token: string, client: Client): Promise<User> {

//     const userData = await client.fetch(`/sessions`, {
//       body: JSON.stringify({ token }),
//     });

//     return new User(userData, client);

//   }

//   async delete(): Promise<void> {

//     await this.#client.fetch(`/sessions/${this.id}`, {
//       method: "DELETE"
//     });

//   }

//   async getUser(shouldRefreshCache = false): Promise<User> {

//     if (!this.userID) {

//       throw new Error("Cannot get user from session without a user ID.");

//     }

//     if (!this.#cachedUser || shouldRefreshCache) {

//       this.#cachedUser = await User.getFromID(this.userID, this.#client);

//     }

//     return this.#cachedUser;

//   }

// }