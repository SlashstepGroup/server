import { StringUnion } from "#utilities/types.js";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import preDefinedServerPolicies from "./pre-defined-server-policies.js";

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
  numberValue: number | null;
}

export type ConstructorServerPolicyProperties = {
  id: string;
  name: string;
  displayName: string;
  valueType: StringUnion<ServerPolicyValueType>;
  defaultNumberValue?: number | null;
  numberValue?: number | null;
}

export type ServerPolicyQueryResult = {
  id: string;
  name: string;
  display_name: string;
  value_type: StringUnion<ServerPolicyValueType>;
  default_number_value: number | null;
  number_value: number | null;
}

export type InitialServerPolicyProperties = Omit<BaseServerPolicyProperties, "id" | "numberValue" | "defaultNumberValue"> & {
  numberValue?: number | null;
  defaultNumberValue?: number | null;
}

export default class ServerPolicy {

  readonly id: BaseServerPolicyProperties["id"];

  readonly name: BaseServerPolicyProperties["name"];

  readonly displayName: BaseServerPolicyProperties["displayName"];

  readonly valueType: BaseServerPolicyProperties["valueType"];

  readonly numberValue: BaseServerPolicyProperties["numberValue"];

  readonly #pool: Pool;

  constructor(data: ConstructorServerPolicyProperties, pool: Pool) {

    this.id = data.id;
    this.name = data.name;
    this.displayName = data.displayName;
    this.valueType = data.valueType;
    this.numberValue = data.numberValue ?? null;
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

  static getPropertiesFromRow(rowData: ServerPolicyQueryResult): BaseServerPolicyProperties {
      
    return {
      id: rowData.id,
      name: rowData.name,
      displayName: rowData.display_name,
      valueType: rowData.value_type,
      numberValue: rowData.number_value,
      defaultNumberValue: rowData.default_number_value
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
        data.numberValue
      ];
      const result = await poolClient.query<ServerPolicyQueryResult>(query, values);

      const rowData = result.rows[0];
      const serverPolicy = new ServerPolicy(ServerPolicy.getPropertiesFromRow(rowData), pool);

      return serverPolicy;

    } finally {

      poolClient.release();

    }

  }

  static async initializePreDefinedServerPolicies(pool: Pool): Promise<ServerPolicy[]> {

    const poolClient = await pool.connect();
    const serverPolicies = [];

    try {

      for (const properties of preDefinedServerPolicies) {

        const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-server-policy-row.sql"), "utf8");
        const values = [
          properties.name, 
          properties.displayName, 
          properties.valueType,
          properties.defaultNumberValue
        ];
        const result = await poolClient.query<ServerPolicyQueryResult>(query, values);

        const rowData = result.rows[0];
        const serverPolicy = new ServerPolicy(ServerPolicy.getPropertiesFromRow(rowData), pool);
        serverPolicies.push(serverPolicy);

      }

    } finally {

      poolClient.release();

    }

    return serverPolicies;

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

}