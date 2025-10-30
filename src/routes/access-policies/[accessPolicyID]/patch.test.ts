import { default as SlashstepServer } from "#utilities/Server/Server.js";
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { strictEqual } from "node:assert";
import updateAccessPolicyRouter from "./patch.js";
import { v7 as generateUUIDv7 } from "uuid";
import AccessPolicy, { AccessPolicyInheritanceLevel, AccessPolicyPermissionLevel, AccessPolicyPrincipalType, AccessPolicyScopedResourceType } from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import Role from "#resources/Role/Role.js";
import User from "#resources/User/User.js";
import Session from "#resources/Session/Session.js";
import TestEnvironment from "#utilities/TestEnvironment/TestEnvironment.js";

describe("Route: PATCH /access-policies/:id", async () => {

  const testEnvironment = new TestEnvironment();
  let slashstepServer: SlashstepServer;

  before(async () => {

    await testEnvironment.startOpenBaoContainer();
    await testEnvironment.initializeOpenBaoClient();
    await testEnvironment.createJWTKeyPair();
    await testEnvironment.startPostgreSQLContainer();
    slashstepServer = await testEnvironment.initializeSlashstepServer();
    slashstepServer.app.use("/access-policies/:accessPolicyID", updateAccessPolicyRouter);
    await testEnvironment.initializeHTTPServer();

  });

  beforeEach(async () => {

    await slashstepServer.initializeResourceTables();
    await slashstepServer.initializePreDefinedResources();

  });

  afterEach(async () => {

    await testEnvironment.resetPostgreSQLSchema();

  });

  after(async () => {

    await testEnvironment.destroy();

  })

  it("can return a 200 status code and return the updated access policy if successful", async () => {

    // Grant unauthenticated users access to the action.
    const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", slashstepServer.pool);
    const getAccessPolicyAction = await Action.getByName("slashstep.accessPolicies.update", slashstepServer.pool);
    const accessPolicy = await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: unauthenticatedUsersRole.id,
      actionID: getAccessPolicyAction.id,
      permissionLevel: AccessPolicyPermissionLevel.Editor,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies/${accessPolicy.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        permissionLevel: "User",
        inheritanceLevel: "Disabled"
      })
    });

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
    strictEqual(jsonResponse.permissionLevel, "User");
    strictEqual(jsonResponse.inheritanceLevel, "Disabled");

  });

  it("can return a 400 if the access policy ID is not a UUID", async () => {

    // Grant unauthenticated users access to the action.
    const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", slashstepServer.pool);
    const deleteAccessPolicyAction = await Action.getByName("slashstep.accessPolicies.update", slashstepServer.pool);
    await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: unauthenticatedUsersRole.id,
      actionID: deleteAccessPolicyAction.id,
      permissionLevel: AccessPolicyPermissionLevel.User,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

    const numberResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies/1`, {
      method: "PATCH"
    });
    strictEqual(numberResponse.status, 400);

    const stringResponse = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies/not-a-uuid`, {
      method: "PATCH"
    });
    strictEqual(stringResponse.status, 400);

  });

  it("can return a 401 status code if the user needs authentication", async () => {
    
    const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", slashstepServer.pool);
    const getAccessPolicyAction = await Action.getByName("slashstep.accessPolicies.get", slashstepServer.pool);
    const accessPolicy = await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: unauthenticatedUsersRole.id,
      actionID: getAccessPolicyAction.id,
      permissionLevel: AccessPolicyPermissionLevel.None,
      inheritanceLevel: AccessPolicyInheritanceLevel.Disabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies/${accessPolicy.id}`, {
      method: "PATCH"
    });
    strictEqual(response.status, 401);

  });

  it("can return a 403 status code if the user doesn't have permission to update the requested access policy", async () => {

    // Grant unauthenticated users access to the action.
    const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", slashstepServer.pool);
    const getAccessPolicyAction = await Action.getByName("slashstep.accessPolicies.update", slashstepServer.pool);
    const accessPolicy = await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: unauthenticatedUsersRole.id,
      actionID: getAccessPolicyAction.id,
      permissionLevel: AccessPolicyPermissionLevel.User,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

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

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies/${accessPolicy.id}`, {
      method: "PATCH",
      headers: {
        cookie: `sessionToken=${sessionToken}`
      },
    });
    
    strictEqual(response.status, 403);

  });

  it("can return a 404 status code if the requested access policy doesn't exist", async () => {

    // Grant unauthenticated users access to the action.
    const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", slashstepServer.pool);
    const getAccessPolicyAction = await Action.getByName("slashstep.accessPolicies.update", slashstepServer.pool);
    await AccessPolicy.create({
      principalType: AccessPolicyPrincipalType.Role,
      principalRoleID: unauthenticatedUsersRole.id,
      actionID: getAccessPolicyAction.id,
      permissionLevel: AccessPolicyPermissionLevel.User,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

    const response = await fetch(`https://localhost:${testEnvironment.getHTTPServerAddress().port}/access-policies/${generateUUIDv7()}`, {
      method: "PATCH"
    });
    strictEqual(response.status, 404);

  });

})