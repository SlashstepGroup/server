import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import { Client, Pool } from "pg";
import readline from "readline/promises";
import { Writable } from "stream";

export default class Server {

  constructor() {


  }

  static async setupDatabase(client: Client): Promise<void> {

  }

  static async createResourceTables(pool: Pool): Promise<void> {

    await AccessPolicy.createTable(pool);

  }

  static async setup(): Promise<void> {

    

  }

}