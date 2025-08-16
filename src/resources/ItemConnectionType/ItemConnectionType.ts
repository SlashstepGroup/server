import { ResourceType } from "#utilities/types.js";
import Client from "../../utilities/Client.js";

export type ItemConnectionTypeProperties = {
  id: string;
  name: string;
  inwardDescription: string;
  outwardDescription: string;
  parentResourceType: ResourceType;
  parentResourceID: string;
}

/**
 * An ItemConnectionType is a type of a connection between two items.
 */
export default class ItemConnectionType {

  /** The connection type's ID. */
  readonly id: ItemConnectionTypeProperties["id"];

  /** The connection type's name. */
  readonly name: ItemConnectionTypeProperties["name"];

  /** The inward description of the connection type. */
  readonly inwardDescription: ItemConnectionTypeProperties["inwardDescription"];

  /** The outward description of the connection type. */
  readonly outwardDescription: ItemConnectionTypeProperties["outwardDescription"];

  /** The resource type that this connection type belongs to. */
  readonly parentResourceType: ItemConnectionTypeProperties["parentResourceType"];

  /** The ID of the resource that this connection type belongs to. */
  readonly parentResourceID: ItemConnectionTypeProperties["parentResourceID"];

  /** The client used to make requests. */
  readonly #client: Client;

  constructor(data: ItemConnectionTypeProperties, client: Client) {

    this.id = data.id;
    this.name = data.name;
    this.inwardDescription = data.inwardDescription;
    this.outwardDescription = data.outwardDescription;
    this.parentResourceType = data.parentResourceType;
    this.parentResourceID = data.parentResourceID;
    this.#client = client;

  }

  /**
   * Requests the server to create a new itemConnectionType.
   *
   * @param data The data for the new ItemConnectionType, excluding the ID.
   */
  static async create(data: Omit<ItemConnectionTypeProperties, "id">, client: Client): Promise<ItemConnectionType> {

    const actionProperties = await client.fetch("/item-connection-types", {
      method: "POST",
      body: JSON.stringify(data)
    });

    const itemConnectionType = new ItemConnectionType(actionProperties, client);

    return itemConnectionType;

  }

  /**
   * Requests the server to return a specific itemConnectionType by ID.
   * @param id The ID of the itemConnectionType to retrieve.
   * @param client The client used to make requests.
   * @returns The requested itemConnectionType.
   */
  static async get(id: string, client: Client): Promise<ItemConnectionType> {

    const itemConnectionTypeProperties = await client.fetch(`/item-connection-types/${id}`);

    return new ItemConnectionType(itemConnectionTypeProperties, client);

  }

  /**
   * Requests the server to return a list of item connection types.
   *
   * @param filterQuery A GazeQL filter to apply to the list of item connection types.
   */
  static async list(filterQuery: string,  client: Client): Promise<ItemConnectionType[]> {

    const itemConnectionTypePropertiesList = await client.fetch(`/item-connection-types?filter-query=${filterQuery}`);

    if (!(itemConnectionTypePropertiesList instanceof Array)) {

      throw new Error(`Expected an array of item connection types, but received ${typeof itemConnectionTypePropertiesList}`);

    }

    const itemConnectionTypes = itemConnectionTypePropertiesList.map((itemConnectionTypeProperties) => new ItemConnectionType(itemConnectionTypeProperties, client));

    return itemConnectionTypes;

  }

}