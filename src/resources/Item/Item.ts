import Project from "#resources/Project/Project.js";
import Client from "src/utilities/Client.js";

export type ItemProperties = {
  id: string;
  name: string;
  description?: string;
  projectID: string;
}

/**
 * A Project represents a collection of tasks and milestones that are organized to achieve a specific goal.
 */
export default class Item {

  static readonly name = "Item";

  /** The ID of the item. */
  readonly id: ItemProperties["id"];

  /** The name of the item. */
  readonly name: ItemProperties["name"];

  /** The description of the item, if applicable. */
  readonly description: ItemProperties["description"];

  /** The ID of the project this item belongs to. */
  readonly projectID: ItemProperties["projectID"];

  /** The client used to make requests. */
  readonly #client: Client;

  constructor(data: ItemProperties, client: Client) {

    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.projectID = data.projectID;
    this.#client = client;

  }

  /**
   * Requests the server to create a new item.
   *
   * @param data The data for the new item, excluding the ID, creation time, and update time.
   */
  static async create(data: Omit<ItemProperties, "id">, client: Client): Promise<Item> {

    const itemProperties = await client.fetch(`/items`, {
      method: "POST",
      body: JSON.stringify(data)
    });

    const item = new Item(itemProperties, client);

    return item;

  }

  /**
   * Requests the server for a list of items.
   *
   * @param filterQuery The query to filter the items.
   */
  static async list(filterQuery: string, client: Client): Promise<Item[]> {

    const itemsData = await client.fetch(`/items?filter-query=${filterQuery}`);

    const items = itemsData.map((itemData: ItemProperties) => new Item(itemData, client));

    return items;

  }

  /**
   * Requests the server for a specific item by ID.
   *
   * @param id The ID of the item to retrieve.
   */
  static async get(id: string, client: Client): Promise<Item> {

    const itemData = await client.fetch(`/items/${id}`);

    return new Item(itemData, client);

  }

  /**
   * Requests the server to delete this item.
   */
  async delete(): Promise<void> {

    await this.#client.fetch(`/items/${this.id}`, {
      method: "DELETE"
    });

  }

  /**
   * Requests the server to update this project.
   *
   * @param data The data to update the item with.
   */
  async update(data: Partial<Omit<ItemProperties, "id" | "creationTime" | "updateTime">>): Promise<Item> {

    const editedInstanceData = await this.#client.fetch(`/items/${this.id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });

    return new Item(editedInstanceData, this.#client);

  }

  /**
   * Requests the server to get an updated version of this project.
   */
  async refresh(): Promise<Item> {

    const item = await Item.get(this.id, this.#client);

    return item;

  }

  async getProject(projectClass: typeof Project): Promise<Project> {

    const project = await projectClass.get(this.projectID, this.#client);

    return project;

  }

}