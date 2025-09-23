import Item from "#resources/Item/Item.js";
import Project from "#resources/Project/Project.js";
import Workspace from "#resources/Workspace/Workspace.js";
import { Pool } from "pg";

export default class Server {

  constructor() {


  }

  static async initializeResourceTables(pool: Pool): Promise<void> {

    await Workspace.initializeTable(pool);
    await Project.initializeTable(pool);
    await Item.initializeTable(pool);

  }

  static async setup(): Promise<void> {

    

  }

}