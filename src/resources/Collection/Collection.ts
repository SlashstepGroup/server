export type CollectionProperties = {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  parentResourceType: string;
  parentResourceID: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * A Collection represents a group of items, such as a project or a milestone.
 */
export default abstract class Collection {

  /** The ID of the collection. */
  readonly id: CollectionProperties["id"];

  /** The name of the collection. */
  readonly name: CollectionProperties["name"];

  /** The display name of the collection. */
  readonly displayName: CollectionProperties["displayName"];

  /** The description of the collection. */
  readonly description: CollectionProperties["description"];

  /** The parent resource type of the collection, such as "Project" or "Workspace". */
  readonly parentResourceType: CollectionProperties["parentResourceType"];

  /** The ID of the parent resource. */
  readonly parentResourceID: CollectionProperties["parentResourceID"];

  /** The start date of the collection, if applicable. */
  readonly startDate: CollectionProperties["startDate"];

  /** The end date of the collection, if applicable. */
  readonly endDate: CollectionProperties["endDate"];

  constructor(data: CollectionProperties) {

    this.id = data.id;
    this.name = data.name;
    this.displayName = data.displayName;
    this.description = data.description;
    this.parentResourceType = data.parentResourceType;
    this.parentResourceID = data.parentResourceID;
    this.startDate = data.startDate;
    this.endDate = data.endDate;

  }

}