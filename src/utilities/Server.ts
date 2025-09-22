import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Item from "#resources/Item/Item.js";
import Project from "#resources/Project/Project.js";
import { Client, Pool } from "node_modules/@types/pg/index.js";
import readline from "readline/promises";
import { Writable } from "stream";

export default class Server {

  constructor() {


  }

  static async setupDatabase(client: Client): Promise<void> {

  }

  static async initializeResourceTables(pool: Pool): Promise<void> {

    await Item.initializeTable(pool);
    await Project.initializeTable(pool);

  }

  static async setup(): Promise<void> {

    

  }

}