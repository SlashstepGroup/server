// import { CollectionType } from "#utilities/types.js";
// import Client from "src/utilities/Client.js";

// export type CollectionViewSortedField = {
//   fieldID: string;
//   isAscending: boolean;
//   method?: string;
// }

// export type CollectionViewProperties = {
//   id: string;
//   name: string;
//   displayName: string;
//   description?: string;
//   fieldIDs: string[];
//   sortedFields: CollectionViewSortedField[];
//   groupedFieldID?: string;
//   collectionType: CollectionType;
//   collectionID: string;
//   creationTime: Date;
//   updateTime: Date;
//   customItemOrder?: string[];
//   filterQuery?: string;
// }

// /**
//  * A CollectionView represents a layout of a project.
//  */
// export default class CollectionView {

//   static readonly name = "CollectionView";

//   /** The collection view's ID. */
//   readonly id: CollectionViewProperties["id"];

//   /** The collection view's name, if applicable. */
//   readonly name: CollectionViewProperties["name"];

//   /** The collection view's display name. */
//   readonly displayName: CollectionViewProperties["displayName"];

//   /** The collection view's description, if applicable. */
//   readonly description: CollectionViewProperties["description"];

//   /** The collection view's creation time. */
//   readonly creationTime: CollectionViewProperties["creationTime"];

//   /** The collection view's update time. */
//   readonly updateTime: CollectionViewProperties["updateTime"];

//   /** The collection view's field IDs. */
//   readonly fieldIDs: CollectionViewProperties["fieldIDs"];

//   /** The collection view's sorted fields. */
//   readonly sortedFields: CollectionViewProperties["sortedFields"];

//   /** The collection view's group by field ID, if applicable. */
//   readonly groupedFieldID: CollectionViewProperties["groupedFieldID"];

//   /** The ID of the collection view's collection. */
//   readonly collectionID: CollectionViewProperties["collectionID"];

//   /** The type of the collection view's collection. */
//   readonly collectionType: CollectionViewProperties["collectionType"];

//   /** 
//    * The collection view's filter query, if applicable. 
//    * 
//    * Only items that match this filter will be displayed in the view.
//    */
//   readonly filterQuery: CollectionViewProperties["filterQuery"];

//   /** 
//    * The collection view's item order overrides, if applicable. 
//    *
//    * An item in this list should show up before its next sibling in the view as long as the item has the same values for each sorted or grouped field.
//    * 
//    * ### Example
//    * For example, let's say a project has the following items: ["A", "B", "C", "D", "E"].
//    * These items have the same values for each sorted field (i.e. end date, point value, etc.).
//    * 
//    * If `customItemOrder` is ["D", "C", "B"], then the items will be displayed as ["A", "D", "C", "B", "E"].
//    * 
//    * But, let's say B has a sorted field that makes it come before C.
//    * In that case, the items will be displayed as ["A", "D", "B", "C", "E"].
//    * This is because the item order overrides are only applied when the items have the same values for each sorted field.
//    */
//   readonly customItemOrder: CollectionViewProperties["customItemOrder"];

//   /** The client used to make requests. */
//   readonly #client: Client;

//   constructor(data: CollectionViewProperties, client: Client) {

//     this.displayName = data.displayName;
//     this.description = data.description;
//     this.creationTime = data.creationTime;
//     this.updateTime = data.updateTime;
//     this.id = data.id;
//     this.name = data.name;
//     this.fieldIDs = data.fieldIDs;
//     this.sortedFields = data.sortedFields;
//     this.groupedFieldID = data.groupedFieldID;
//     this.collectionID = data.collectionID;
//     this.collectionType = data.collectionType;
//     this.customItemOrder = data.customItemOrder;
//     this.filterQuery = data.filterQuery;
//     this.#client = client;

//   }

//   /**
//    * Requests the server to create a new field.
//    * 
//    * @param data The data for the new Field, excluding the ID, creation time, and update time.
//    */
//   static async create(data: Omit<CollectionViewProperties, "id" | "creationTime" | "updateTime">, client: Client): Promise<CollectionView> {

//     const fieldProperties = await client.fetch(`/item-collection-views`, {
//       method: "POST",
//       body: JSON.stringify(data)
//     });

//     const field = new CollectionView(fieldProperties, client);

//     return field;

//   }

//   /** 
//    * Requests the server to return a list of collection views.
//    * @param filterQuery A SlashstepQL filter to apply to the list of collection views.
//    */
//   static async list(filterQuery: string, client: Client): Promise<CollectionView[]> {

//     const collectionViewPropertiesList = await client.fetch(`/collection-views?filter-query=${filterQuery}`);

//     if (!(collectionViewPropertiesList instanceof Array)) {

//       throw new Error(`Expected an array of collection views, but received ${typeof collectionViewPropertiesList}`);

//     }

//     const collectionViews = collectionViewPropertiesList.map((collectionViewProperties) => new CollectionView(collectionViewProperties, client));

//     return collectionViews;

//   }

//   /**
//    * Requests the server to return a specific collection view by ID.
//    * @param id The ID of the collection view to retrieve.
//    * @param client The client used to make requests.
//    * @returns The requested collection view.
//    */
//   static async get(id: string, client: Client): Promise<CollectionView> {

//     const collectionViewProperties = await client.fetch(`/collection-views/${id}`);

//     return new CollectionView(collectionViewProperties, client);

//   }

//   /**
//    * Requests the server to delete this CollectionView.
//    */
//   async delete(): Promise<void> {

//     await this.#client.fetch(`/item-collection-views/${this.id}`, {
//       method: "DELETE"
//     });

//   }

//   /**
//    * Requests the server to update this CollectionView.
//    *
//    * @param data The data to update the CollectionView with.
//    */
//   async update(data: Partial<CollectionViewProperties>): Promise<CollectionView> {

//     const editedInstanceData = await this.#client.fetch(`/collection-views/${this.id}`, {
//       method: "PATCH",
//       body: JSON.stringify(data)
//     });

//     return new CollectionView(editedInstanceData, this.#client);

//   }

// }