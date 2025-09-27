import Item from "#resources/Item/Item.js";
import Project from "#resources/Project/Project.js";
import Workspace from "#resources/Workspace/Workspace.js";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import User from "#resources/User/User.js";
import App from "#resources/App/App.js";
import ActionLog from "#resources/ActionLog/ActionLog.js";
import Session from "#resources/Session/Session.js";

export default class Server {

  constructor() {}

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
    await User.initializeTable(pool);
    await App.initializeTable(pool);
    await Action.initializeTable(pool);
    await AccessPolicy.initializeTable(pool);
    await ActionLog.initializeTable(pool);
    await Session.initializeTable(pool);

  }

  static async setup(): Promise<void> {

    

  }

}