// import Client from "../../utilities/Client.js";

// export type ActionProperties = {
//   id: string;
//   name: string;
//   appID?: string;
//   displayName: string;
//   description: string;
// }

// /**
//  * An Action is a type of process that is performed by an actor.
//  */
// export default class Action {

//   /** The action's ID. */
//   readonly id: ActionProperties["id"];

//   /** The action's name. */
//   readonly name: ActionProperties["name"];

//   /** The action's display name. */
//   readonly displayName: ActionProperties["displayName"];

//   /** The action's description. */
//   readonly description: ActionProperties["description"];

//   /** The action's application ID. If there isn't one, then the action is directly associated with the instance. */
//   readonly appID: ActionProperties["appID"];

//   /** The client used to make requests. */
//   readonly #client: Client;

//   constructor(data: ActionProperties, client: Client) {

//     this.id = data.id;
//     this.name = data.name;
//     this.displayName = data.displayName;
//     this.description = data.description;
//     this.appID = data.appID;
//     this.#client = client;

//   }

//   /**
//    * Requests the server to create a new action.
//    * 
//    * @param data The data for the new Action, excluding the ID.
//    */
//   static async create(data: Omit<ActionProperties, "id">, client: Client): Promise<Action> {

//     const actionProperties = await client.fetch("/actions", {
//       method: "POST",
//       body: JSON.stringify(data)
//     });

//     const action = new Action(actionProperties, client);

//     return action;

//   }

//   /**
//    * Requests the server to return a specific action by ID.
//    * @param id The ID of the action to retrieve.
//    * @param client The client used to make requests.
//    * @returns The requested action.
//    */
//   static async get(id: string, client: Client): Promise<Action> {

//     const actionProperties = await client.fetch(`/actions/${id}`);

//     return new Action(actionProperties, client);

//   }

//   /** 
//    * Requests the server to return a list of actions.
//    * 
//    * @param filterQuery A SlashstepQL filter to apply to the list of actions.
//    */
//   static async list(filterQuery: string, client: Client): Promise<Action[]> {

//     const actionPropertiesList = await client.fetch(`/actions?filter-query=${filterQuery}`);

//     if (!(actionPropertiesList instanceof Array)) {

//       throw new Error(`Expected an array of actions, but received ${typeof actionPropertiesList}`);

//     }

//     const actions = actionPropertiesList.map((actionProperties) => new Action(actionProperties, client));

//     return actions;

//   }

//   /**
//    * Requests the server to delete this action.
//    * 
//    * This method only works for app accounts.
//    */
//   async delete(): Promise<void> {

//     await this.#client.fetch(`/actions/${this.id}`, {
//       method: "DELETE",
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });

//   }

//   /**
//    * Requests the server to update this action.
//    * 
//    * This method only works for app accounts.
//    * 
//    * @param data The data to update the Action with.
//    */
//   async update(data: Partial<ActionProperties>): Promise<Action> {

//     const editedActionData = await this.#client.fetch(`/actions/${this.id}`, {
//       method: "PATCH",
//       body: JSON.stringify(data)
//     });

//     return new Action(editedActionData, this.#client);

//   }

// }