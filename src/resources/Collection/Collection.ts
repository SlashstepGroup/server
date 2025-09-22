export type CollectionProperties = {
  id: string;
  name: string;
  displayName: string;
  description?: string;
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

  /** The start date of the collection, if applicable. */
  readonly startDate: CollectionProperties["startDate"];

  /** The end date of the collection, if applicable. */
  readonly endDate: CollectionProperties["endDate"];

  constructor(data: CollectionProperties) {

    this.id = data.id;
    this.name = data.name;
    this.displayName = data.displayName;
    this.description = data.description;
    this.startDate = data.startDate;
    this.endDate = data.endDate;

  }

}