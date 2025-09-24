import Item from "#resources/Item/Item.js";
import Project from "#resources/Project/Project.js";
import Workspace from "#resources/Workspace/Workspace.js";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";

export default class Server {

  constructor() {


  }

  static async initializeResourceTables(pool: Pool): Promise<void> {

    const poolClient = await pool.connect();
    const createProjectsTableQuery = readFileSync(resolve(dirname(import.meta.dirname), "Server", "queries", "create-app-schema.sql"), "utf8");
    const createUUIDv7FunctionsQuery = readFileSync(resolve(dirname(import.meta.dirname), "Server", "queries", "create-uuidv7-functions.sql"), "utf8");
    await poolClient.query(createProjectsTableQuery);
    await poolClient.query(createUUIDv7FunctionsQuery);
    poolClient.release();
    await Workspace.initializeTable(pool);
    await Project.initializeTable(pool);
    await Item.initializeTable(pool);

  }

  static async setup(): Promise<void> {

    

  }

}