import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Collection, { CollectionProperties } from "#resources/Collection/Collection.js";
import CollectionView from "#resources/CollectionView/CollectionView.js";
import Field from "#resources/Field/Field.js";
import Item, { ItemProperties } from "#resources/Item/Item.js";
import Milestone from "#resources/Milestone/Milestone.js";
import Client from "src/utilities/Client.js";

export type ProjectProperties = CollectionProperties & {
  parentResourceType: "Workspace";
}

/**
 * A Project represents a collection of tasks and milestones that are organized to achieve a specific goal.
 */
export default class Project extends Collection {

  /** The client used to make requests. */
  readonly #client: Client;

  constructor(data: ProjectProperties, client: Client) {

    super(data);
    this.#client = client;

  }

  /**
   * Requests the server to create a new project.
   *
   * @param data The data for the new project, excluding the ID, creation time, and update time.
   */
  static async create(data: Omit<ProjectProperties, "id" | "creationTime" | "updateTime">, client: Client): Promise<Project> {

    const projectProperties = await client.fetch(`/projects`, {
      method: "POST",
      body: JSON.stringify(data)
    });

    const project = new Project(projectProperties, client);

    return project;

  }

  /**
   * Requests the server for a list of projects.
   *
   * @param filterQuery The query to filter the projects.
   */
  static async list(filterQuery: string, client: Client): Promise<Project[]> {

    const projectsData = await client.fetch(`/projects?filter-query=${filterQuery}`);

    const projects = projectsData.map((projectData: ProjectProperties) => new Project(projectData, client));

    return projects;

  }

  /**
   * Requests the server for a specific project by ID.
   *
   * @param id The ID of the project to retrieve.
   */
  static async get(id: string, client: Client): Promise<Project> {

    const projectData = await client.fetch(`/projects/${id}`);

    return new Project(projectData, client);

  }

  /**
   * Requests the server to delete this project.
   */
  async delete(): Promise<void> {

    await this.#client.fetch(`/projects/${this.id}`, {
      method: "DELETE"
    });

  }

  /**
   * Requests the server to update this project.
   *
   * @param data The data to update the project with.
   */
  async update(data: Partial<Omit<ProjectProperties, "id" | "creationTime" | "updateTime">>): Promise<Project> {

    const editedInstanceData = await this.#client.fetch(`/projects/${this.id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });

    return new Project(editedInstanceData, this.#client);

  }

  /**
   * Requests the server to get an updated version of this project.
   */
  async refresh(): Promise<Project> {

    const project = await Project.get(this.id, this.#client);

    return project;

  }

  /**
   * Requests the server to get a list of resources associated with this project.
   */
  async listResources(resourceClass: typeof Item, filterQuery?: string): Promise<Item[]>;
  async listResources(resourceClass: typeof AccessPolicy, filterQuery?: string): Promise<AccessPolicy[]>;
  async listResources(resourceClass: typeof Field, filterQuery?: string): Promise<Field[]>;
  async listResources(resourceClass: typeof Milestone, filterQuery?: string): Promise<Milestone[]>;
  async listResources(resourceClass: typeof CollectionView, filterQuery?: string): Promise<CollectionView[]>;
  async listResources(resourceClass: typeof Item | typeof AccessPolicy | typeof Field | typeof Milestone | typeof CollectionView, filterQuery?: string): Promise<Item[] | AccessPolicy[] | Field[] | Milestone[] | CollectionView[]> {

    switch (resourceClass.name) {

      case "AccessPolicy":
        const accessPolicies = await resourceClass.list(`scopeID = "${this.id}" AND scopeType = "Project"${filterQuery ? ` AND (${filterQuery})` : ""}`, this.#client);
        return accessPolicies;

      case "Item":
        const items = await resourceClass.list(`projectID = "${this.id}"${filterQuery ? ` AND (${filterQuery})` : ""}`, this.#client);
        return items;

      case "Field":
        const fields = await resourceClass.list(`parentResourceType = "Project" AND parentResourceID = "${this.id}"${filterQuery ? ` AND (${filterQuery})` : ""}`, this.#client);
        return fields;

      case "Milestone":
        const milestones = await resourceClass.list(`parentResourceType = "Project" AND parentResourceID = "${this.id}"${filterQuery ? ` AND (${filterQuery})` : ""}`, this.#client);
        return milestones;

      case "CollectionView":
        const collectionViews = await resourceClass.list(`collectionType = "Project" AND collectionID = "${this.id}"${filterQuery ? ` AND (${filterQuery})` : ""}`, this.#client);
        return collectionViews;

      default:
        return [];

    }

  }

}
