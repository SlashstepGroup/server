import { Pool } from "pg";

export type GroupProperties = {
  id: string;
  name: string;
  displayName: string;
  description?: string;
}

/**
 * A Group represents a collection of principals.
 */
export default class Group {

  /** The group's ID. */
  readonly id: GroupProperties["id"];

  /** The group's name. */
  readonly name: GroupProperties["name"];

  /** The group's display name. */
  readonly displayName: GroupProperties["displayName"];

  /** The group's description, if applicable. */
  readonly description: GroupProperties["description"];

  /** The pool used to send queries to the database. */
  readonly #pool: Pool

  constructor(data: GroupProperties, pool: Pool) {

    this.displayName = data.displayName;
    this.description = data.description;
    this.id = data.id;
    this.name = data.name;
    this.#pool = pool;

  }

  // /**
  //  * Requests the server to create a new group.
  //  *
  //  * @param data The data for the new group, excluding the ID.
  //  */
  // static async create(data: Omit<GroupProperties, "id">, client: Client): Promise<Group> {

  // }

  // /**
  //  * Requests the server to return a list of groups.
  //  *
  //  * @param filterQuery A SlashstepQL filter to apply to the list of groups.
  //  */
  // static async list(filterQuery: string, client: Client): Promise<Group[]> {

  //   const groupPropertiesList = await client.fetch(`/groups?filter-query=${filterQuery}`);

  //   if (!(groupPropertiesList instanceof Array)) {

  //     throw new Error(`Expected an array of groups, but received ${typeof groupPropertiesList}`);

  //   }

  //   const groups = groupPropertiesList.map((groupProperties) => new Group(groupProperties, client));

  //   return groups;

  // }

}