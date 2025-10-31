import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { strictEqual } from "node:assert";
import { default as SlashstepServer } from "#utilities/Server/Server.js";
import getAccessPolicyRouter from "./GET.js";
import AccessPolicy, { AccessPolicyInheritanceLevel, AccessPolicyPermissionLevel, AccessPolicyPrincipalType, AccessPolicyScopedResourceType, BaseAccessPolicyProperties } from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import Role from "#resources/Role/Role.js";
import User from "#resources/User/User.js";
import Session from "#resources/Session/Session.js";
import TestEnvironment from "#utilities/TestEnvironment/TestEnvironment.js";
import { v7 as generateUUIDv7 } from "uuid";

describe("Route: GET /access-policies", async () => {

  const testEnvironment = new TestEnvironment();
  let slashstepServer: SlashstepServer;

  before(async () => {

    await testEnvironment.startOpenBaoContainer();
    await testEnvironment.initializeOpenBaoClient();
    await testEnvironment.createJWTKeyPair();
    await testEnvironment.startPostgreSQLContainer();
    slashstepServer = await testEnvironment.initializeSlashstepServer();
    slashstepServer.app.get("/access-policies", getAccessPolicyRouter);
    await testEnvironment.initializeHTTPServer();

  });

  beforeEach(async () => {

    await testEnvironment.slashstepServer?.initializeResourceTables();
    await testEnvironment.slashstepServer?.initializePreDefinedResources();

  });

  afterEach(async () => {

    await testEnvironment.resetPostgreSQLSchema();

  });

  after(async () => {

    await testEnvironment.destroy();

  })

  it("can return a 200 status code and the requested access policies", async () => {

    // Grant unauthenticated users access to the action.
    const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", slashstepServer.pool);
    const listAccessPolicyAction = await Action.getByName("slashstep.accessPolicies.list", slashstepServer.pool);
    const accessPolicy = await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: unauthenticatedUsersRole.id,
      actionID: listAccessPolicyAction.id,
      permissionLevel: AccessPolicyPermissionLevel.User,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);
    
    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies`);
    strictEqual(response.status, 200);

    const jsonResponse = await response.json();
    strictEqual(jsonResponse.totalItemCount >= 1, true);
    strictEqual(jsonResponse.items instanceof Array, true);
    
    const accessPolicyResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies?query=id = "${accessPolicy.id}"`);
    strictEqual(accessPolicyResponse.status, 200);

    const accessPolicyJSONResponse = await accessPolicyResponse.json();
    strictEqual(accessPolicyJSONResponse.totalItemCount, 1);
    strictEqual(accessPolicyJSONResponse.items instanceof Array, true);
    strictEqual((accessPolicyJSONResponse.items as BaseAccessPolicyProperties[]).find((accessPolicyData) => accessPolicyData.id === accessPolicy.id) !== undefined, true);

  });

  it("can return up to 1,000 access policies by default", async () => {

    // Grant unauthenticated users access to the action.
    const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", slashstepServer.pool);
    const listAccessPolicyAction = await Action.getByName("slashstep.accessPolicies.list", slashstepServer.pool);
    await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: unauthenticatedUsersRole.id,
      actionID: listAccessPolicyAction.id,
      permissionLevel: AccessPolicyPermissionLevel.User,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

    const originalAccessPolicyCount = await AccessPolicy.count("", slashstepServer.pool);
    const newActionCount = Math.max(0, 1001 - originalAccessPolicyCount);
    const accessPolicies = [];
    for (let i = 0; newActionCount > i; i++) {

      const createRandomAction = async () => {

        const action = await Action.create({
          name: `slashstep.${generateUUIDv7()}.${generateUUIDv7()}`,
          displayName: TestEnvironment.generateRandomString(16),
          description: TestEnvironment.generateRandomString(128)
        }, slashstepServer.pool);

        return action;

      }

      const action = await createRandomAction();
      const accessPolicy = await AccessPolicy.create({
        principalRoleID: unauthenticatedUsersRole.id,
        actionID: action.id,
        principalType: AccessPolicyPrincipalType.Role,
        permissionLevel: AccessPolicyPermissionLevel.Admin,
        inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
        scopedResourceType: AccessPolicyScopedResourceType.Action,
        scopedActionID: action.id
      }, slashstepServer.pool);
      accessPolicies.push(accessPolicy);

    }
    
    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies`);
    strictEqual(response.status, 200);

    const jsonResponse = await response.json();
    strictEqual(jsonResponse.totalItemCount, originalAccessPolicyCount + newActionCount);
    strictEqual(jsonResponse.items instanceof Array, true);
    strictEqual(jsonResponse.items.length, 1000);

    const offsetResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies?query=offset 1000`);
    strictEqual(response.status, 200);

    const jsonOffsetResponse = await offsetResponse.json();
    strictEqual(jsonOffsetResponse.totalItemCount, originalAccessPolicyCount + newActionCount);
    strictEqual(jsonOffsetResponse.items instanceof Array, true);
    strictEqual(jsonOffsetResponse.items.length, 1);

  });

  it("can return a 400 if the query is invalid", async () => {

    // Grant unauthenticated users access to the action.
    const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", slashstepServer.pool);
    const getAccessPolicyAction = await Action.getByName("slashstep.accessPolicies.list", slashstepServer.pool);
    await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: unauthenticatedUsersRole.id,
      actionID: getAccessPolicyAction.id,
      permissionLevel: AccessPolicyPermissionLevel.User,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

    const sqlInjectionResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies?query=1 = 1; DROP access_policies CASCADE; select * from users`);
    strictEqual(sqlInjectionResponse.status, 400);

    const numberResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies?query=1`);
    strictEqual(numberResponse.status, 400);

    const unallowedKeyResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies?query=test = "test"`);
    strictEqual(unallowedKeyResponse.status, 400);

  });

  it("can return a 401 status code if the user needs authentication", async () => {

    const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", slashstepServer.pool);
    const listAccessPoliciesAction = await Action.getByName("slashstep.accessPolicies.list", slashstepServer.pool);
    await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: unauthenticatedUsersRole.id,
      actionID: listAccessPoliciesAction.id,
      permissionLevel: AccessPolicyPermissionLevel.None,
      inheritanceLevel: AccessPolicyInheritanceLevel.Disabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies`);
    strictEqual(response.status, 401);

  });

  it("can return a 403 status code if the user doesn't have permission to list access policies", async () => {

    // Grant unauthenticated users access to the action.
    const user = await User.create({
      username: TestEnvironment.generateRandomString(4),
      displayName: TestEnvironment.generateRandomString(16),
      hashedPassword: TestEnvironment.generateRandomString(64)
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

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies`, {
      headers: {
        cookie: `sessionToken=${sessionToken}`
      },
    });
    
    strictEqual(response.status, 403);

  });

})