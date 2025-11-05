import { Pool } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";
import { StringUnion } from "#utilities/types.js";

export enum ServerLogEntryLevel {
  Success = "Success",
  Info = "Info",
  Pending = "Pending",
  Warning = "Warning",
  Error = "Error",
  Critical = "Critical"
}

export type BaseServerLogEntryProperties = {
  id: string;
  message: string;
  httpRequestID?: string | null;
  level: StringUnion<ServerLogEntryLevel>;
}

export type ServerLogEntryQueryResult = {
  id: string;
  message: string;
  http_request_id: string | null;
  level: StringUnion<ServerLogEntryLevel>;
}

export type InitialServerLogEntryProperties = Omit<BaseServerLogEntryProperties, "id">;

export default class ServerLogEntry {

  static readonly name = "ServerLogEntry";

  /** The server log entry's ID. */
  readonly id: BaseServerLogEntryProperties["id"];

  /** The server log entry's message. */
  readonly message: BaseServerLogEntryProperties["message"];

  /** The server log entry's HTTP request ID, if applicable. */
  readonly httpRequestID: BaseServerLogEntryProperties["httpRequestID"];

  /** The server log entry's level. */
  readonly level: BaseServerLogEntryProperties["level"];

  readonly #pool: Pool;

  constructor(data: BaseServerLogEntryProperties, pool: Pool) {

    this.id = data.id;
    this.message = data.message;
    this.httpRequestID = data.httpRequestID;
    this.level = data.level;
    this.#pool = pool;

  }

  /**
   * Requests the server to create a new server log entry.
   *
   * @param data The data for the new server log entry, excluding the ID.
   */
  static async create(data: InitialServerLogEntryProperties, pool: Pool, shouldLogToConsole: boolean = false): Promise<ServerLogEntry> {

    // Insert the server log entry into the database.
    const poolClient = await pool.connect();

    try {

      const query = readFileSync(resolve(import.meta.dirname, "queries", "insert-server-log-entry-row.sql"), "utf8");
      const values = [
        data.message,
        data.httpRequestID,
        data.level
      ];
      const result = await poolClient.query(query, values);

      // Convert the row to an server log entry object.
      const row = result.rows[0];
      const serverLogEntry = new ServerLogEntry(ServerLogEntry.getPropertiesFromRow(row), pool);

      // Return the server log entry.
      if (shouldLogToConsole) {

        serverLogEntry.logToConsole();

      }

      return serverLogEntry;

    } finally {

      poolClient.release();

    }

  }

  static async initializeTable(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();

    try {

      const createServerLogEntriesTableQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-server-log-entries-table.sql"), "utf8");
      const createHydratedServerLogEntriesViewQuery = readFileSync(resolve(import.meta.dirname, "queries", "create-hydrated-server-log-entries-view.sql"), "utf8");
      await poolClient.query(createServerLogEntriesTableQuery);
      await poolClient.query(createHydratedServerLogEntriesViewQuery);

    } finally {

      poolClient.release();

    }

  }

  static getPropertiesFromRow(rowData: ServerLogEntryQueryResult): BaseServerLogEntryProperties {
        
    return {
      id: rowData.id,
      message: rowData.message,
      httpRequestID: rowData.http_request_id,
      level: rowData.level
    };
    
  }

  async delete(): Promise<void> {

    const poolClient = await this.#pool.connect();

    try {

      await poolClient.query("begin;");
      const query = readFileSync(resolve(import.meta.dirname, "queries", "delete-server-log-entry-row.sql"), "utf8");
      await poolClient.query(query, [this.id]);
      await poolClient.query("commit;");

    } finally {

      poolClient.release();

    }

  }

  getLogString(): string {

    const levelColorMap: Record<ServerLogEntryLevel, string> = {
      [ServerLogEntryLevel.Success]: "\x1b[32m",
      [ServerLogEntryLevel.Info]: "\x1b[37m",
      [ServerLogEntryLevel.Pending]: "\x1b[36m",
      [ServerLogEntryLevel.Warning]: "\x1b[33m",
      [ServerLogEntryLevel.Error]: "\x1b[31m",
      [ServerLogEntryLevel.Critical]: "\x1b[41m"
    };
    const levelColor = levelColorMap[this.level];
    const levelPrefix = this.level ? `[${this.level}]` : "";
    const requestPrefix = this.httpRequestID ? `[${this.httpRequestID}]` : "";
    const formatResetSuffix = "\x1b[0m";

    return `${levelColor}${levelPrefix} ${requestPrefix} ${this.message}${formatResetSuffix}`
    
  }

  logToConsole() {

    switch (this.level) {

      case ServerLogEntryLevel.Critical:
      case ServerLogEntryLevel.Error:
        console.error(this.getLogString());
        break;

      case ServerLogEntryLevel.Warning:
        console.warn(this.getLogString());
        break;

      default:
        console.log(this.getLogString());
        break;

    }

  }

}