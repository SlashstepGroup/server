// import Client from "../../utilities/Client.js";

// export type ActivityLogProperties = {
//   id: string;
//   timestamp: Date;
//   actorID: string;
//   actionID: string;
//   actorIPAddress?: string;
//   delegateID?: string;
//   targetIDs: string[];
//   previousValue?: string;
//   newValue?: string;
//   reason?: string;
// }

// /**
//  * An ActivityLog is an immutable representation of an action taken by an actor on a target.
//  */
// export default class ActivityLog {

//   /** The log's ID. */
//   readonly id: ActivityLogProperties["id"];

//   /** The activity log action ID. */
//   readonly actionID: ActivityLogProperties["actionID"];

//   /** The activity log timestamp. */
//   readonly timestamp: ActivityLogProperties["timestamp"];

//   /** The activity log actor ID. */
//   readonly actorID: ActivityLogProperties["actorID"];

//   /** The activity log actor IP address, if applicable. */
//   readonly actorIPAddress: ActivityLogProperties["actorIPAddress"];

//   /** The activity log delegate ID, if applicable. */
//   readonly delegateID: ActivityLogProperties["delegateID"];
  
//   /** The activity log target IDs. */
//   readonly targetIDs: ActivityLogProperties["targetIDs"];

//   /** The activity log previous value, if applicable. */
//   readonly previousValue: ActivityLogProperties["previousValue"];

//   /** The activity log new value, if applicable. */
//   readonly newValue: ActivityLogProperties["newValue"];

//   /** The activity log reason, if applicable. */
//   readonly reason: ActivityLogProperties["reason"];

//   constructor(data: ActivityLogProperties) {

//     this.id = data.id;
//     this.actionID = data.actionID;
//     this.timestamp = data.timestamp;
//     this.actorID = data.actorID;
//     this.actorIPAddress = data.actorIPAddress;
//     this.delegateID = data.delegateID;
//     this.targetIDs = data.targetIDs;
//     this.previousValue = data.previousValue;
//     this.newValue = data.newValue;
//     this.reason = data.reason;

//   }

//   /**
//    * Requests the server to create a new activityLog.
//    * 
//    * @param data The data for the new ActivityLog, excluding the ID.
//    */
//   static async create(data: Omit<ActivityLogProperties, "id">, client: Client): Promise<ActivityLog> {

//     const actionProperties = await client.fetch("/activity-logs", {
//       method: "POST",
//       body: JSON.stringify(data)
//     });

//     const activityLog = new ActivityLog(actionProperties);

//     return activityLog;

//   }

//   /**
//    * Requests the server to return a specific activityLog by ID.
//    * @param id The ID of the activityLog to retrieve.
//    * @param client The client used to make requests.
//    * @returns The requested activityLog.
//    */
//   static async get(id: string, client: Client): Promise<ActivityLog> {

//     const activityLogProperties = await client.fetch(`/activity-logs/${id}`);

//     return new ActivityLog(activityLogProperties);

//   }

//   /**
//    * Requests the server to return a list of activity-logs.
//    * 
//    * @param filterQuery A WaltzQL filter to apply to the list of activity-logs.
//    */
//   static async list(filterQuery: string,  client: Client): Promise<ActivityLog[]> {

//     const activityLogPropertiesList = await client.fetch(`/activity-logs?filter-query=${filterQuery}`);

//     if (!(activityLogPropertiesList instanceof Array)) {

//       throw new Error(`Expected an array of activity-logs, but received ${typeof activityLogPropertiesList}`);

//     }

//     const activityLogs = activityLogPropertiesList.map((activityLogProperties) => new ActivityLog(activityLogProperties));

//     return activityLogs;

//   }

// }