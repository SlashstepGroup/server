import Item from "#resources/Item/Item.js";
import Project from "#resources/Project/Project.js";
import { Pool } from "pg";

export default class Server {

  constructor() {


  }

  static async initializeResourceTables(pool: Pool): Promise<void> {

    await Item.initializeTable(pool);
    await Project.initializeTable(pool);

  }

  static async setup(): Promise<void> {

    

  }

}