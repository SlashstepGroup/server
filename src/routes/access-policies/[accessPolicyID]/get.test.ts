import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { strictEqual } from "node:assert";
import Server from "#utilities/Server/Server.js";
import { Server as HTTPServer } from "http";
import getAccessPolicyRouter from "./get.js";
import { v7 as generateUUIDv7 } from "uuid";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Wait } from "testcontainers";
import AccessPolicy, { AccessPolicyInheritanceLevel, AccessPolicyPermissionLevel, AccessPolicyPrincipalType, AccessPolicyScopedResourceType } from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import Role from "#resources/Role/Role.js";
import User from "#resources/User/User.js";
import { randomBytes } from "node:crypto";
import Session from "#resources/Session/Session.js";
import { readFileSync } from "node:fs";
import { GenericContainer, StartedTestContainer } from "testcontainers";
import { Client as VaultClient } from "@litehex/node-vault";
import { generateKeyPairSync } from "crypto";
import { Readable } from "node:stream";

describe("Route: GET /access-policies/:id", async () => {

  let openbaoContainer: StartedTestContainer;
  let postgreSQLContainer: StartedPostgreSqlContainer;
  let httpServer: HTTPServer;
  let slashstepServer: Server;

  const generateRandomString = (length: number) => randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);

  before(async () => {

    // Start a OpenBao development server. 
    let rootToken: string | null = null;

    openbaoContainer = await (
      new GenericContainer("openbao")
      .withLogConsumer((stream) => {

        stream.on("data", (data) => {

          if (data.toString().includes("Root Token: ")) {
            
            rootToken = data.toString().split("Root Token: ")[1].trim();

          }

        })

      })
      .withEnvironment({
        VAULT_ADDR: "http://127.0.0.1:8200",
      })
      .withWaitStrategy(Wait.forHttp("/v1/sys/health", 8200).forStatusCode(200))
      .withExposedPorts(8200)
    ).start();

    if (!rootToken) {

      throw new Error("Root token not found.");

    }

    // Save a key pair for the JWT signing.
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

    const vaultClient = new VaultClient({
      endpoint: `http://${openbaoContainer.getHost()}:${openbaoContainer.getMappedPort(8200)}`,
      token: rootToken
    });

    let result = await vaultClient.mount({
      mountPath: "slashstep-server",
      type: "kv-v2"
    });

    if (result.error) {

      throw result.error;

    }

    result = await vaultClient.kv2.write({
      mountPath: "slashstep-server",
      path: "jwt-private-key",
      data: {
        value: keyPair.privateKey
      }
    });

    if (result.error) {

      throw result.error;

    }

    result = await vaultClient.kv2.write({
      mountPath: "slashstep-server",
      path: "jwt-public-key",
      data: {
        value: keyPair.publicKey
      }
    });

    if (result.error) {

      throw result.error;

    }

    postgreSQLContainer = await (new PostgreSqlContainer("postgres:18").withWaitStrategy(Wait.forHealthCheck()).withUsername("postgres")).start();

    slashstepServer = new Server({
      environment: "development",
      postgreSQLUsername: postgreSQLContainer.getUsername(),
      postgreSQLPassword: postgreSQLContainer.getPassword(),
      postgreSQLHost: postgreSQLContainer.getHost(),
      postgreSQLPort: postgreSQLContainer.getPort(),
      postgreSQLDatabaseName: postgreSQLContainer.getDatabase(),
      port: 3000
    });
    slashstepServer.setupMiddleware();
    slashstepServer.app.use("/access-policies/:accessPolicyID", getAccessPolicyRouter);
    slashstepServer.vaultClient = vaultClient;
    httpServer = await slashstepServer.listen();

  });

  beforeEach(async () => {

    await slashstepServer.initializeResourceTables();
    await slashstepServer.initializePreDefinedResources();

  });

  afterEach(async () => {

    try {

      const client = await slashstepServer.pool.connect();
      await client.query("drop schema if exists app cascade;");
      client.release();

    } catch (error) {

      throw error;

    }

  });

  after(async () => {

    await new Promise((resolve) => httpServer.close(resolve));
    await slashstepServer.pool.end();
    await postgreSQLContainer.stop();

  })

  it("can return a 200 status code and the requested access policy", async () => {

    // Grant unauthenticated users access to the action.
    const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", slashstepServer.pool);
    const getAccessPolicyAction = await Action.getByName("slashstep.accessPolicies.get", slashstepServer.pool);
    const accessPolicy = await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: unauthenticatedUsersRole.id,
      actionID: getAccessPolicyAction.id,
      permissionLevel: AccessPolicyPermissionLevel.User,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

    const response = await fetch(`https://localhost:3000/access-policies/${accessPolicy.id}`);
    strictEqual(response.status, 200);

    const jsonResponse = await response.json();
    strictEqual(jsonResponse.id, accessPolicy.id);
    strictEqual(jsonResponse.principalType, accessPolicy.principalType);
    strictEqual(jsonResponse.principalUserID, accessPolicy.principalUserID);
    strictEqual(jsonResponse.principalGroupID, accessPolicy.principalGroupID);
    strictEqual(jsonResponse.principalRoleID, accessPolicy.principalRoleID);
    strictEqual(jsonResponse.scopedResourceType, accessPolicy.scopedResourceType);
    strictEqual(jsonResponse.scopedWorkspaceID, accessPolicy.scopedWorkspaceID);
    strictEqual(jsonResponse.scopedProjectID, accessPolicy.scopedProjectID);
    strictEqual(jsonResponse.scopedItemID, accessPolicy.scopedItemID);
    strictEqual(jsonResponse.scopedActionID, accessPolicy.scopedActionID);
    strictEqual(jsonResponse.scopedRoleID, accessPolicy.scopedRoleID);
    strictEqual(jsonResponse.scopedGroupID, accessPolicy.scopedGroupID);
    strictEqual(jsonResponse.scopedUserID, accessPolicy.scopedUserID);
    strictEqual(jsonResponse.scopedAppID, accessPolicy.scopedAppID);
    strictEqual(jsonResponse.scopedMilestoneID, accessPolicy.scopedMilestoneID);
    strictEqual(jsonResponse.actionID, accessPolicy.actionID);
    strictEqual(jsonResponse.permissionLevel, accessPolicy.permissionLevel);
    strictEqual(jsonResponse.inheritanceLevel, accessPolicy.inheritanceLevel);

  });

  it("can return a 400 if the access policy ID is not a UUID", async () => {

    // Grant unauthenticated users access to the action.
    const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", slashstepServer.pool);
    const getAccessPolicyAction = await Action.getByName("slashstep.accessPolicies.get", slashstepServer.pool);
    await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: unauthenticatedUsersRole.id,
      actionID: getAccessPolicyAction.id,
      permissionLevel: AccessPolicyPermissionLevel.User,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

    const numberResponse = await fetch(`https://localhost:3000/access-policies/1`);
    strictEqual(numberResponse.status, 400);

    const stringResponse = await fetch(`https://localhost:3000/access-policies/not-a-uuid`);
    strictEqual(stringResponse.status, 400);

  });

  it("can return a 401 status code if the user needs authentication", async () => {

    const response = await fetch(`https://localhost:3000/access-policies/${generateUUIDv7()}`);
    strictEqual(response.status, 401);

  });

  it("can return a 403 status code if the user doesn't have permission to view the requested access policy", async () => {

    // Grant unauthenticated users access to the action.
    const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", slashstepServer.pool);
    const getAccessPolicyAction = await Action.getByName("slashstep.accessPolicies.get", slashstepServer.pool);
    const accessPolicy = await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: unauthenticatedUsersRole.id,
      actionID: getAccessPolicyAction.id,
      permissionLevel: AccessPolicyPermissionLevel.User,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

    const user = await User.create({
      username: generateRandomString(4),
      displayName: generateRandomString(16),
      hashedPassword: generateRandomString(64)
    }, slashstepServer.pool);

    const session = await Session.create({
      userID: user.id,
      expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      creationIP: "127.0.0.1"
    }, slashstepServer.pool);
    
    const jwtPrivateKey = await slashstepServer.getJWTPrivateKey();

    const sessionToken = Session.generateJSONWebToken({
      userID: session.userID,
      sessionID: session.id
    }, jwtPrivateKey);

    const response = await fetch(`https://localhost:3000/access-policies/${accessPolicy.id}`, {
      headers: {
        cookie: `sessionToken=${sessionToken}`
      },
    });
    
    strictEqual(response.status, 403);

  });

  it("can return a 404 status code if the requested access policy doesn't exist", async () => {

    // Grant unauthenticated users access to the action.
    const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", slashstepServer.pool);
    const getAccessPolicyAction = await Action.getByName("slashstep.accessPolicies.get", slashstepServer.pool);
    await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: unauthenticatedUsersRole.id,
      actionID: getAccessPolicyAction.id,
      permissionLevel: AccessPolicyPermissionLevel.User,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

    const response = await fetch(`https://localhost:3000/access-policies/${generateUUIDv7()}`);
    strictEqual(response.status, 404);

  });

})