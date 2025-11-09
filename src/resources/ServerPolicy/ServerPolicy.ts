import { StringUnion } from "#utilities/types.js";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import preDefinedServerPolicies from "./pre-defined-server-policies.js";
import ResourceConflictError from "#errors/ResourceConflictError.js";

export enum ServerPolicyValueType {
  String = "String",
  Number = "Number",
  Boolean = "Boolean"
}

export type BaseServerPolicyProperties = {
  id: string;
  name: string;
  displayName: string;
  valueType: StringUnion<ServerPolicyValueType>;
  defaultNumberValue: number | null;
  defaultBooleanValue: boolean | null;
  defaultStringValue: string | null;
  numberValue: number | null;
  booleanValue: boolean | null;
  stringValue: string | null;
}

export type ConstructorServerPolicyProperties = {
  id: BaseServerPolicyProperties["id"];
  name: BaseServerPolicyProperties["name"];
  displayName: BaseServerPolicyProperties["displayName"];
  valueType: BaseServerPolicyProperties["valueType"];
  defaultNumberValue?: BaseServerPolicyProperties["defaultNumberValue"];
  defaultBooleanValue?: BaseServerPolicyProperties["defaultBooleanValue"];
  defaultStringValue?: BaseServerPolicyProperties["defaultStringValue"];
  numberValue?: BaseServerPolicyProperties["numberValue"];
  booleanValue?: BaseServerPolicyProperties["booleanValue"];
  stringValue?: BaseServerPolicyProperties["stringValue"];
}

export type ServerPolicyQueryResult = {
  id: BaseServerPolicyProperties["id"];
  name: BaseServerPolicyProperties["name"];
  display_name: BaseServerPolicyProperties["displayName"];
  value_type: BaseServerPolicyProperties["valueType"];
  default_number_value: BaseServerPolicyProperties["defaultNumberValue"];
  default_boolean_value: BaseServerPolicyProperties["defaultBooleanValue"];
  default_string_value: BaseServerPolicyProperties["defaultStringValue"];
  number_value: BaseServerPolicyProperties["numberValue"];
  boolean_value: BaseServerPolicyProperties["booleanValue"];
  string_value: BaseServerPolicyProperties["stringValue"];
}

export type InitialServerPolicyProperties = Omit<BaseServerPolicyProperties, "id" | "numberValue" | "defaultNumberValue" | "booleanValue" | "defaultBooleanValue" | "stringValue" | "defaultStringValue"> & {
  numberValue?: BaseServerPolicyProperties["numberValue"];
  defaultNumberValue?: BaseServerPolicyProperties["defaultNumberValue"];
  booleanValue?: BaseServerPolicyProperties["booleanValue"];
  defaultBooleanValue?: BaseServerPolicyProperties["defaultBooleanValue"];
  stringValue?: BaseServerPolicyProperties["stringValue"];
  defaultStringValue?: BaseServerPolicyProperties["defaultStringValue"];
}

export default class ServerPolicy {

  readonly id: BaseServerPolicyProperties["id"];

  readonly name: BaseServerPolicyProperties["name"];

  readonly displayName: BaseServerPolicyProperties["displayName"];

  readonly valueType: BaseServerPolicyProperties["valueType"];

  readonly numberValue: BaseServerPolicyProperties["numberValue"];

  readonly booleanValue: BaseServerPolicyProperties["booleanValue"];

  readonly stringValue: BaseServerPolicyProperties["stringValue"];

  readonly defaultNumberValue: BaseServerPolicyProperties["defaultNumberValue"];

  readonly defaultBooleanValue: BaseServerPolicyProperties["defaultBooleanValue"];

  readonly defaultStringValue: BaseServerPolicyProperties["defaultStringValue"];

  readonly #pool: Pool;

  constructor(data: ConstructorServerPolicyProperties, pool: Pool) {

    this.id = data.id;
    this.name = data.name;
    this.displayName = data.displayName;
    this.valueType = data.valueType;
    this.numberValue = data.numberValue ?? null;
    this.booleanValue = data.booleanValue ?? null;
    this.stringValue = data.stringValue ?? null;
    this.defaultNumberValue = data.defaultNumberValue ?? null;
    this.defaultBooleanValue = data.defaultBooleanValue ?? null;
    this.defaultStringValue = data.defaultStringValue ?? null;
    this.#pool = pool;

  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();

    try {

      const createServerPoliciesTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-server-policies-table.sql"), "utf8");
      const createHydratedServerPoliciesViewQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-hydrated-server-policies-view.sql"), "utf8");
      await poolClient.query(createServerPoliciesTableQuery);
      await poolClient.query(createHydratedServerPoliciesViewQuery);

    } finally {

      poolClient.release();

    }

  }

  static async initializePreDefinedServerPolicies(pool: Pool): Promise<ServerPolicy[]> {

    const serverPolicies = [];

    for (const properties of preDefinedServerPolicies) {

      try {

        const serverPolicy = await ServerPolicy.create(properties, pool);
        serverPolicies.push(serverPolicy);

      } catch (error) {

        if (error instanceof ResourceConflictError) {

          const serverPolicy = await ServerPolicy.getByName(properties.name, pool);
          serverPolicies.push(serverPolicy);

        } else {

          throw error;

        }

      }

    }

    return serverPolicies;

  }

  static getPropertiesFromRow(rowData: ServerPolicyQueryResult): BaseServerPolicyProperties {
      
    return {
      id: rowData.id,
      name: rowData.name,
      displayName: rowData.display_name,
      valueType: rowData.value_type,
      defaultNumberValue: rowData.default_number_value,
      defaultBooleanValue: rowData.default_boolean_value,
      defaultStringValue: rowData.default_string_value,
      numberValue: rowData.number_value,
      booleanValue: rowData.boolean_value,
      stringValue: rowData.string_value
    };
    
  }

  static async getByID(id: string, pool: Pool): Promise<ServerPolicy> {

    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "get-server-policy-row-by-id.sql"), "utf8");
      const result = await poolClient.query(query, [id]);

      const rowData = result.rows[0];

      if (!rowData) {

        throw new ResourceNotFoundError("Server policy");

      }

      const serverPolicy = new ServerPolicy(ServerPolicy.getPropertiesFromRow(rowData), pool);

      return serverPolicy;

    } finally {

      poolClient.release();

    }

  }

  static async getByName(name: string, pool: Pool): Promise<ServerPolicy> {

    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "get-server-policy-row-by-name.sql"), "utf8");
      const result = await poolClient.query(query, [name]);

      const rowData = result.rows[0];

      if (!rowData) {

        throw new ResourceNotFoundError("Server policy");

      }

      const serverPolicy = new ServerPolicy(ServerPolicy.getPropertiesFromRow(rowData), pool);

      return serverPolicy;

    } finally {

      poolClient.release();

    }

  }

  static async create(data: InitialServerPolicyProperties, pool: Pool): Promise<ServerPolicy> {

    const poolClient = await pool.connect();

    try {
      
      const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-server-policy-row.sql"), "utf8");
      const values = [
        data.name,
        data.displayName,
        data.valueType,
        data.defaultNumberValue,
        data.defaultBooleanValue,
        data.defaultStringValue,
        data.numberValue,
        data.booleanValue,
        data.stringValue,
      ];
      const result = await poolClient.query<ServerPolicyQueryResult>(query, values);

      const rowData = result.rows[0];
      const serverPolicy = new ServerPolicy(ServerPolicy.getPropertiesFromRow(rowData), pool);

      return serverPolicy;

    } finally {

      poolClient.release();

    }

  }

  async delete(): Promise<void> {

    const poolClient = await this.#pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "delete-server-policy-row.sql"), "utf8");
      const result = await poolClient.query(query, [this.id]);

      if (result.rowCount !== 1) {

        throw new Error("The server policy was not deleted.");

      }

    } finally {

      poolClient.release();

    }

  }

  getNumberValue(): number {

    const numberValue = this.numberValue ?? this.defaultNumberValue;
    if (numberValue === null) {

      throw new Error(`The number value for server policy ${this.name} is not set.`);

    }

    return numberValue;

  }

}