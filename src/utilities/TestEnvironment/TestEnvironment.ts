import { default as SlashstepServer } from "#utilities/Server/Server.js";
import { randomBytes } from "node:crypto";
import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { Client as VaultClient } from "@litehex/node-vault";
import { AddressInfo, Socket } from "node:net";
import { Server as HTTPServer } from "node:http";
import { generateKeyPairSync } from "crypto";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";

export default class TestEnvironment {

  slashstepServer: SlashstepServer | null = null;
  httpServer: HTTPServer | null = null;
  openBaoContainer: StartedTestContainer | null = null;
  openBaoRootToken: string | null = null;
  openBaoClient: VaultClient | null = null;
  postgreSQLContainer: StartedPostgreSqlContainer | null = null;
  httpServerSockets = new Set<Socket>();

  constructor() {}

  static generateRandomString(length: number) {

    return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);

  }

  async startOpenBaoContainer(): Promise<StartedTestContainer> {

    if (this.openBaoContainer) {

      return this.openBaoContainer;

    }

    const container = await (
      new GenericContainer("openbao/openbao:latest:sha256-48174d0c98dbb955731c5d54a7e7083987fd25a7fb5d793181db8576ada8ed64.sig")
      .withLogConsumer((stream) => {

        stream.on("data", (data) => {

          if (data.toString().includes("Root Token: ")) {
            
            this.openBaoRootToken = data.toString().split("Root Token: ")[1].trim();

          }

        })

      })
      .withEnvironment({
        VAULT_ADDR: "http://127.0.0.1:8200",
      })
      .withWaitStrategy(Wait.forHttp("/v1/sys/health", 8200).forStatusCode(200))
      .withExposedPorts(8200)
    ).start();

    const timeout = setTimeout(() => {
      
      throw new Error("Timed out waiting for OpenBao to start.");

    }, 3000);

    while (!this.openBaoRootToken) {

      await new Promise((resolveSleep) => setTimeout(resolveSleep, 100));

    }

    clearTimeout(timeout);

    this.openBaoContainer = container;

    return container;

  }

  async initializeOpenBaoClient(): Promise<VaultClient> {

    if (!this.openBaoRootToken) {

      throw new Error("Root token not found.");

    }

    if (!this.openBaoContainer) {

      throw new Error("OpenBao container not found.");

    }

    const vaultClient = new VaultClient({
      endpoint: `http://${this.openBaoContainer.getHost()}:${this.openBaoContainer.getMappedPort(8200)}`,
      token: this.openBaoRootToken
    });

    this.openBaoClient = vaultClient;

    return vaultClient;

  }

  async initializeSlashstepServer(): Promise<SlashstepServer> {

    if (this.slashstepServer) {

      return this.slashstepServer;

    }

    if (!this.postgreSQLContainer) {

      throw new Error("PostgreSQL container not found.");

    }

    const slashstepServer = new SlashstepServer({
      environment: "development",
      postgreSQLUsername: this.postgreSQLContainer.getUsername(),
      postgreSQLPassword: this.postgreSQLContainer.getPassword(),
      postgreSQLHost: this.postgreSQLContainer.getHost(),
      postgreSQLPort: this.postgreSQLContainer.getPort(),
      postgreSQLDatabaseName: this.postgreSQLContainer.getDatabase(),
      port: 0 // Node will assign a random open port.
    });

    if (this.openBaoClient) {

      slashstepServer.vaultClient = this.openBaoClient;

    }

    slashstepServer.setupMiddleware();

    this.slashstepServer = slashstepServer;

    return slashstepServer;

  }

  getHTTPServerAddress(): AddressInfo {

    if (!this.httpServer) {

      throw new Error("HTTP server not found.");

    }

    const address = this.httpServer.address();

    if (!address) {

      throw new Error("HTTP server address not found.");

    }

    if (typeof(address) === "string") {

      throw new Error("HTTP server address is not an address info object.");

    }

    return address;

  }

  async initializeHTTPServer(): Promise<HTTPServer> {

    if (this.httpServer) {

      return this.httpServer;

    }

    if (!this.slashstepServer) {

      throw new Error("Slashstep server not found.");

    }

    const httpServer = await this.slashstepServer.listen();
    httpServer.on("connection", (socket) => {

      this.httpServerSockets.add(socket);

      httpServer.once("close", () => {

        this.httpServerSockets.delete(socket);

      });

    });

    this.httpServer = httpServer;

    return httpServer;

  }

  async resetPostgreSQLSchema(): Promise<void> {

    if (!this.slashstepServer) {

      throw new Error("Slashstep server not found.");

    }

    
    const client = await this.slashstepServer.pool.connect();
    try {
    
      await client.query("drop schema if exists app cascade;");

    } finally {

      client.release();

    }
    
  }

  async startPostgreSQLContainer(): Promise<StartedPostgreSqlContainer> {

    if (this.postgreSQLContainer) {

      return this.postgreSQLContainer;

    }

    const postgreSQLContainer = await (new PostgreSqlContainer("postgres:18").withWaitStrategy(Wait.forHealthCheck()).withUsername("postgres")).start();
    this.postgreSQLContainer = postgreSQLContainer;

    return postgreSQLContainer;

  }

  async createJWTKeyPair(): Promise<void> {

    if (!this.openBaoClient) {

      throw new Error("OpenBao client not found.");

    }

    const keyPair = generateKeyPairSync("rsa", {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: "spki",
        format: "pem"
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem"
      }
    });

    let result = await this.openBaoClient.mount({
      mountPath: "slashstep-server",
      type: "kv-v2"
    });

    if (result.error) {

      throw result.error;

    }

    result = await this.openBaoClient.kv2.write({
      mountPath: "slashstep-server",
      path: "jwt-private-key",
      data: {
        value: keyPair.privateKey
      }
    });

    if (result.error) {

      throw result.error;

    }

    result = await this.openBaoClient.kv2.write({
      mountPath: "slashstep-server",
      path: "jwt-public-key",
      data: {
        value: keyPair.publicKey
      }
    });

    if (result.error) {

      throw result.error;

    }

  }

  async destroy(): Promise<void> {

    if (this.httpServer) {
      
      await new Promise<void>((resolve) => {
        
        if (this.httpServer) {

          this.httpServer.close(() => resolve());
          
          for (const socket of this.httpServerSockets) {
          
            socket.destroy();

          }

        } else {

          resolve();

        }
      
      });

      this.httpServer = null;

    }
    
    if (this.slashstepServer) {

      await this.slashstepServer.pool.end();
      this.slashstepServer = null;

    }
    
    if (this.postgreSQLContainer) {

      await this.postgreSQLContainer.stop();
      this.postgreSQLContainer = null;

    }

    if (this.openBaoContainer) {

      await this.openBaoContainer.stop();
      this.openBaoContainer = null;

    }

  }

}