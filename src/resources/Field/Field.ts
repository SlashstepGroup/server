// import Client from "#utilities/Client.js";
// import { ResourceType } from "#utilities/types.js";

// export type SelectFieldProperties = FieldProperties<"Select", {
//   choices: Choice[];
//   defaultValue?: string[];
//   minimumChoices?: number;
//   maximumChoices?: number;
// }>

// export type ResourceFieldProperties = FieldProperties<"Resource", {
//   resourceType?: ResourceType;
//   filterQuery?: string;
//   defaultValue?: string[];
//   minimumChoices?: number;
//   maximumChoices?: number;
// }>

// export type ItemConnectionFieldProperties = FieldProperties<"ItemConnection", {
//   minimumChoices?: number;
//   maximumChoices?: number;
// }>

// export type NumberFieldProperties = FieldProperties<"Number", {
//   minimumValue?: number;
//   maximumValue?: number;
//   defaultValue?: number;
// }>

// export type DateFieldProperties = FieldProperties<"Date", {
//   minimumValue?: Date;
//   maximumValue?: Date;
//   defaultValue?: Date;
// }>

// export type BooleanFieldProperties = FieldProperties<"Boolean", {
//   defaultValue?: boolean;
// }>

// export type StakeholderFieldProperties = FieldProperties<"Stakeholder", {
//   areReviewsEnabled?: boolean;
//   defaultValue?: string[]; /** Principal IDs */
//   filterQuery?: string;
//   minimumChoices?: number;
//   maximumChoices?: number;
// }>

// export type Choice = {
//   id: string;
//   name: string;
//   colorHex: string;
// }

// export type FieldProperties<FieldType extends string = string, Attributes extends Record<string, unknown> = Record<string, unknown>> = {
//   id: string;
//   name: string;
//   displayName: string;
//   type: FieldType;
//   description?: string;
//   parentResourceID: string;
//   parentResourceType: "Workspace" | "Project";
//   attributes: Attributes;
// }


// /**
//  * A Field is a type of data structure that holds a value for a specific item.
//  */
// export default class Field<SelectedFieldProperties extends FieldProperties = FieldProperties> {

//   static readonly name = "Field";

//   /** The field's ID. */
//   readonly id: SelectedFieldProperties["id"];

//   /** The field's name. */
//   readonly name: SelectedFieldProperties["name"];

//   /** The field's display name. */
//   readonly displayName: SelectedFieldProperties["displayName"];

//   /** The field's description, if applicable. */
//   readonly description: SelectedFieldProperties["description"];

//   /** The field's parent resource ID. */
//   readonly parentResourceID: SelectedFieldProperties["parentResourceID"];

//   /** The field's parent resource type, such as "Workspace" or "Project". */
//   readonly parentResourceType: SelectedFieldProperties["parentResourceType"];

//   /** The field's type. */
//   readonly type: SelectedFieldProperties["type"];

//   /** The field's attributes, if applicable. */
//   readonly attributes: SelectedFieldProperties["attributes"];

//   /** The client used to make requests. */
//   readonly #client: Client;

//   constructor(data: SelectedFieldProperties, client: Client) {

//     this.id = data.id;
//     this.name = data.name;
//     this.displayName = data.displayName;
//     this.description = data.description;
//     this.parentResourceID = data.parentResourceID;
//     this.parentResourceType = data.parentResourceType;
//     this.type = data.type;
//     this.attributes = data.attributes;
//     this.#client = client;

//   }

//   /**
//    * Requests the server for a list of fields. 
//    * 
//    * Attempts to return the specific field type if known, otherwise returns a generic Field.
//    * 
//    * @param data The data for the new Field, excluding the ID.
//    */
//   static async list(filterQuery: string, client: Client): Promise<(Field<SelectFieldProperties> | Field<ResourceFieldProperties> | Field<StakeholderFieldProperties> | Field<BooleanFieldProperties> | Field<ItemConnectionFieldProperties> | Field<NumberFieldProperties> | Field<DateFieldProperties>)[]> {

//     const fieldsData = await client.fetch(`/fields?filter-query=${filterQuery}`);

//     const fields = fieldsData.map((fieldData: FieldProperties) => new Field(fieldData, client));

//     return fields;

//   }

//   /**
//    * Requests the server to update this field.
//    * 
//    * @param data The data to update the field with.
//    */
//   async update(data: Omit<Partial<SelectedFieldProperties>, "id" | "type" | "creationTime" | "updateTime">): Promise<Field<SelectedFieldProperties>> {

//     const editedFieldData = await this.#client.fetch(`/fields/${this.id}`, {
//       method: "PATCH",
//       body: JSON.stringify(data)
//     });

//     return new Field(editedFieldData, this.#client);

//   }

//   /**
//    * Requests the server to delete this field.
//    */
//   async delete(): Promise<void> {

//     await this.#client.fetch(`/fields/${this.id}`, {
//       method: "DELETE"
//     });

//   }

// }