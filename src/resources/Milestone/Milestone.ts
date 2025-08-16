import Collection, { CollectionProperties } from "#resources/Collection/Collection.js";
import Client from "src/utilities/Client.js";

export type MilestoneProperties = CollectionProperties & {
  parentResourceType: "Project" | "Workspace";
}

/**
 * A Milestone represents a specific goal — such as a release or major deliverable — within a project or a workspace.
 */
export default class Milestone extends Collection {

  static readonly name = "Milestone";

  /** The client used to make requests. */
  readonly #client: Client;

  constructor(data: MilestoneProperties, client: Client) {

    super(data);
    this.#client = client;

  }

  /**
   * Requests the server to create a new milestone.
   *
   * @param data The data for the new milestone, excluding the ID, creation time, and update time.
   */
  static async create(data: Omit<MilestoneProperties, "id" | "creationTime" | "updateTime">, client: Client): Promise<Milestone> {

    const milestoneProperties = await client.fetch(`/milestones`, {
      method: "POST",
      body: JSON.stringify(data)
    });

    const milestone = new Milestone(milestoneProperties, client);

    return milestone;

  }

  /**
   * Requests the server for a list of milestones.
   *
   * @param filterQuery The query to filter the milestones.
   */
  static async list(filterQuery: string, client: Client): Promise<Milestone[]> {

    const milestonesData = await client.fetch(`/milestones?filter-query=${filterQuery}`);

    const milestones = milestonesData.map((milestoneData: MilestoneProperties) => new Milestone(milestoneData, client));

    return milestones;

  }

  /**
   * Requests the server for a specific milestone by ID.
   *
   * @param id The ID of the milestone to retrieve.
   */
  static async get(id: string, client: Client): Promise<Milestone> {

    const milestoneData = await client.fetch(`/milestones/${id}`);

    return new Milestone(milestoneData, client);

  }

  /**
   * Requests the server to delete this milestone.
   */
  async delete(): Promise<void> {

    await this.#client.fetch(`/milestones/${this.id}`, {
      method: "DELETE"
    });

  }

  /**
   * Requests the server to update this milestone.
   *
   * @param data The data to update the milestone with.
   */
  async update(data: Partial<Omit<MilestoneProperties, "id" | "creationTime" | "updateTime">>): Promise<Milestone> {

    const editedInstanceData = await this.#client.fetch(`/milestones/${this.id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });

    return new Milestone(editedInstanceData, this.#client);

  }

  /**
   * Requests the server to get an updated version of this milestone.
   */
  async refresh(): Promise<Milestone> {

    const milestone = await Milestone.get(this.id, this.#client);

    return milestone;

  }

}