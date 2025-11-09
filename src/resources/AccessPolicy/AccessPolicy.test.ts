/**
 * Tests for the AccessPolicy class.
 * 
 * Programmers: 
 * - Christian Toney (https://christiantoney.com)
 * 
 * © 2025 Beastslash LLC
 */

import { after, afterEach, before, beforeEach, describe, it } from "node:test"
import { fail, strictEqual, notStrictEqual, rejects } from "node:assert";
import AccessPolicy, { AccessPolicyInheritanceLevel, AccessPolicyPermissionLevel, AccessPolicyPrincipalType, AccessPolicyScopedResourceType } from "./AccessPolicy.js";
import { default as SlashstepServer } from "#resources/Server/Server.js";
import User from "#resources/User/User.js";
import Action from "#resources/Action/Action.js";
import { randomBytes } from "crypto";
import Group from "#resources/Group/Group.js";
import App, { AppClientType, AppParentResourceType } from "#resources/App/App.js";
import Item from "#resources/Item/Item.js";
import Milestone, { MilestoneParentResourceType } from "#resources/Milestone/Milestone.js";
import Project from "#resources/Project/Project.js";
import Role, { RoleParentResourceType } from "#resources/Role/Role.js";
import Workspace from "#resources/Workspace/Workspace.js";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import { v7 as generateUUIDv7 } from "uuid";
import TestEnvironment from "#utilities/TestEnvironment/TestEnvironment.js";

// TODO: Unskip this test.
describe("Class: AccessPolicy", async () => {

  const testEnvironment = new TestEnvironment();
  let slashstepServer: SlashstepServer;

  const generateRandomString = (length: number) => randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);

  const createRandomAction = async () => {

    const action = await Action.create({
      name: `slashstep.${generateUUIDv7()}.${generateUUIDv7()}`,
      displayName: generateRandomString(16),
      description: generateRandomString(128)
    }, slashstepServer.pool);

    return action;

  }

  const createRandomUser = async () => {

    const user = await User.create({
      username: generateUUIDv7().replaceAll("-", ""), // This should be exactly 32 characters
      displayName: generateRandomString(32),
      hashedPassword: generateRandomString(64),
      isAnonymous: false
    }, slashstepServer.pool);

    return user;

  }

  const createRandomRole = async () => {

    const role = await Role.create({
      name: `slashstep.${generateUUIDv7()}`,
      displayName: generateRandomString(16),
      description: generateRandomString(128),
      parentResourceType: RoleParentResourceType.Instance
    }, slashstepServer.pool);

    return role;

  }

  const createRandomGroup = async () => {
    
    const group = await Group.create({
      name: `slashstep.${generateUUIDv7()}.${generateUUIDv7()}`,
      displayName: generateRandomString(16),
      description: generateRandomString(128)
    }, slashstepServer.pool);

    return group;

  }

  const createRandomWorkspace = async () => {

    const workspace = await Workspace.create({
      name: `slashstep.${generateUUIDv7()}.${generateUUIDv7()}`,
      displayName: generateRandomString(16),
      description: generateRandomString(128)
    }, slashstepServer.pool);

    return workspace;

  }

  const createRandomProject = async (workspaceID: string) => {

    const project = await Project.create({
      name: `slashstep.${generateUUIDv7()}`,
      displayName: generateRandomString(16),
      description: generateRandomString(128),
      key: generateRandomString(16),
      workspaceID
    }, slashstepServer.pool);

    return project;

  }

  const createRandomItem = async (projectID: string) => {

    const item = await Item.create({
      summary: generateRandomString(256),
      projectID
    }, slashstepServer.pool);

    return item;

  }

  const createRandomMilestone = async (projectID: string) => {

    const milestone = await Milestone.create({
      name: `slashstep.${generateUUIDv7()}.${generateUUIDv7()}`,
      parentResourceType: MilestoneParentResourceType.Project,
      displayName: generateRandomString(16),
      description: generateRandomString(128),
      parentProjectID: projectID
    }, slashstepServer.pool);

    return milestone;

  }

  const createRandomApp = async () => {

    const app = await App.create({
      name: `slashstep.${generateUUIDv7()}.${generateUUIDv7()}`,
      displayName: generateRandomString(16),
      description: generateRandomString(128),
      parentResourceType: AppParentResourceType.Instance,
      clientType: AppClientType.Public
    }, slashstepServer.pool);

    return app;

  }

  before(async () => {

    await testEnvironment.startOpenBaoContainer();
    await testEnvironment.initializeOpenBaoClient();
    await testEnvironment.createJWTKeyPair();
    await testEnvironment.startPostgreSQLContainer();
    slashstepServer = await testEnvironment.initializeSlashstepServer();
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

  });

  it("can initialize an access_policies table in a database", {timeout: 500}, async () => {

    await AccessPolicy.initializeTable(slashstepServer.pool);

  });

  it("can create an access policy", {timeout: 500}, async () => {

    const action = await createRandomAction();
    const user = await createRandomUser();

    const accessPolicyProperties: Parameters<(typeof AccessPolicy)["create"]>[0] = {
      principalType: AccessPolicyPrincipalType.User,
      scopedResourceType: AccessPolicyScopedResourceType.Instance,
      actionID: action.id,
      permissionLevel: AccessPolicyPermissionLevel.Admin,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      principalUserID: user.id
    };

    const accessPolicy = await AccessPolicy.create(accessPolicyProperties, slashstepServer.pool);

    // Verify the properties are the same.
    // It may seem obvious at first, but this test mitigates human error 
    // (i.e. accidentally assigning the wrong property, forgetting an optional property, etc.).
    strictEqual(accessPolicy instanceof AccessPolicy, true);
    strictEqual(typeof(accessPolicy.id), "string");
    strictEqual(accessPolicy.principalType, accessPolicyProperties.principalType);
    strictEqual(accessPolicy.scopedResourceType, accessPolicyProperties.scopedResourceType);
    strictEqual(accessPolicy.actionID, accessPolicyProperties.actionID);
    strictEqual(accessPolicy.permissionLevel, accessPolicyProperties.permissionLevel);
    strictEqual(accessPolicy.inheritanceLevel, accessPolicyProperties.inheritanceLevel);

  });

  it("can return a list of access policies without a query", {timeout: 1000}, async () => {

    // Make sure there isn't any access policies right now.
    const initialAccessPolicyCount = await AccessPolicy.count("", slashstepServer.pool);

    const maximumActionCount = 25;
    const accessPolicies = [];
    for (let i = 0; maximumActionCount > i; i++) {

      const action = await createRandomAction();
      const user = await createRandomUser();
      const accessPolicy = await AccessPolicy.create({
        principalUserID: user.id,
        actionID: action.id,
        principalType: AccessPolicyPrincipalType.User,
        permissionLevel: AccessPolicyPermissionLevel.Admin,
        inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
        scopedResourceType: AccessPolicyScopedResourceType.Action,
        scopedActionID: action.id
      }, slashstepServer.pool);
      accessPolicies.push(accessPolicy);

    }

    const updatedAccessPolicyList = await AccessPolicy.list("", slashstepServer.pool);
    strictEqual(updatedAccessPolicyList.length, initialAccessPolicyCount + accessPolicies.length);

    for (const accessPolicy of accessPolicies) {

      notStrictEqual(updatedAccessPolicyList.findIndex((possibleAccessPolicy) => possibleAccessPolicy.id === accessPolicy.id), -1);

    }

  });

  it("can return a list of access policies with a query", {timeout: 1000}, async () => {

    // Make sure there isn't any access policies right now.
    const action = await createRandomAction();
    const initialAccessPolicyList = await AccessPolicy.list(`actionID = "${action.id}"`, slashstepServer.pool);
    strictEqual(initialAccessPolicyList.length, 0);

    const maximumActionCount = 25;
    const accessPolicies = [];
    let latestUserID;
    for (let i = 0; maximumActionCount > i; i++) {

      const user = await createRandomUser();
      latestUserID = user.id;

      const accessPolicy = await AccessPolicy.create({
        principalUserID: user.id,
        actionID: action.id,
        principalType: AccessPolicyPrincipalType.User,
        permissionLevel: AccessPolicyPermissionLevel.Admin,
        inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
        scopedResourceType: AccessPolicyScopedResourceType.Action,
        scopedActionID: action.id
      }, slashstepServer.pool);
      accessPolicies.push(accessPolicy);

    }

    const updatedAccessPolicyList = await AccessPolicy.list(`actionID = "${action.id}"`, slashstepServer.pool);
    strictEqual(updatedAccessPolicyList.length, accessPolicies.length);

    for (const accessPolicy of accessPolicies) {

      notStrictEqual(updatedAccessPolicyList.findIndex((possibleAccessPolicy) => possibleAccessPolicy.id === accessPolicy.id), -1);

    }

    const singleAccessPolicyList = await AccessPolicy.list(`actionID = "${action.id}" and principalUserID = "${latestUserID}"`, slashstepServer.pool);
    strictEqual(singleAccessPolicyList.length, 1);

  });

  it("can return a list of access policies with related resources", {timeout: 1000}, async () => {

    // Make some access policies.
    const accessPolicies = [];
    const action = await createRandomAction();
    const defaultProperties = {
      actionID: action.id,
      permissionLevel: AccessPolicyPermissionLevel.Admin,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
    }

    const user = await createRandomUser();
    const role = await createRandomRole();
    const group = await createRandomGroup();
    const workspace = await createRandomWorkspace();
    const project = await createRandomProject(workspace.id);
    const item = await createRandomItem(project.id);
    const milestone = await createRandomMilestone(project.id);
    const app = await createRandomApp();

    const scopePropertyGroups = [
      {
        scopedResourceType: AccessPolicyScopedResourceType.Action,
        scopedActionID: action.id
      },
      {
        scopedResourceType: AccessPolicyScopedResourceType.App,
        scopedAppID: app.id
      },
      {
        scopedResourceType: AccessPolicyScopedResourceType.Group,
        scopedGroupID: group.id
      },
      {
        scopedResourceType: AccessPolicyScopedResourceType.Item,
        scopedItemID: item.id
      },
      {
        scopedResourceType: AccessPolicyScopedResourceType.Milestone,
        scopedMilestoneID: milestone.id
      },
      {
        scopedResourceType: AccessPolicyScopedResourceType.Project,
        scopedProjectID: project.id
      },
      {
        scopedResourceType: AccessPolicyScopedResourceType.Role,
        scopedRoleID: role.id
      },
      {
        scopedResourceType: AccessPolicyScopedResourceType.User,
        scopedUserID: user.id
      },
      {
        scopedResourceType: AccessPolicyScopedResourceType.Workspace,
        scopedWorkspaceID: workspace.id
      }
    ];

    const principalPropertyGroups = [
      {
        principalType: AccessPolicyPrincipalType.User,
        principalUserID: user.id
      },
      {
        principalType: AccessPolicyPrincipalType.Group,
        principalGroupID: group.id
      },
      {
        principalType: AccessPolicyPrincipalType.Role,
        principalRoleID: role.id
      },
      {
        principalType: AccessPolicyPrincipalType.App,
        principalAppID: app.id
      }
    ]

    const initialAccessPolicyCount = await AccessPolicy.count("", slashstepServer.pool);
    for (const principalPropertyGroup of principalPropertyGroups) {

      for (const scopePropertyGroup of scopePropertyGroups) {

        const accessPolicy = await AccessPolicy.create({
          ...defaultProperties,
          ...principalPropertyGroup,
          ...scopePropertyGroup
        }, slashstepServer.pool);

        accessPolicies.push(accessPolicy);

      }

    }

    // Verify the access policies.
    const updatedAccessPolicyList = await AccessPolicy.list(`offset ${initialAccessPolicyCount}`, slashstepServer.pool, {
      principalGroup: Group,
      principalUser: User,
      principalRole: Role,
      principalApp: App,
      scopedAction: Action,
      scopedApp: App,
      scopedGroup: Group,
      scopedItem: Item,
      scopedMilestone: Milestone,
      scopedProject: Project,
      scopedRole: Role,
      scopedUser: User,
      scopedWorkspace: Workspace,
      action: Action,
    });
    strictEqual(updatedAccessPolicyList.length, accessPolicies.length);

    for (const accessPolicy of updatedAccessPolicyList) {

      switch (accessPolicy.principalType) {

        case AccessPolicyPrincipalType.User:
          strictEqual(accessPolicy.principalUser?.id, user.id);
          break;

        case AccessPolicyPrincipalType.Group:
          strictEqual(accessPolicy.principalGroup?.id, group.id);
          break;

        case AccessPolicyPrincipalType.Role:
          strictEqual(accessPolicy.principalRole?.id, role.id);
          break;

        case AccessPolicyPrincipalType.App:
          strictEqual(accessPolicy.principalApp?.id, app.id);
          break;

        default:
          fail(`Unexpected principal type: ${accessPolicy.principalType}`);

      }

      switch (accessPolicy.scopedResourceType) {

        case AccessPolicyScopedResourceType.Action:
          strictEqual(accessPolicy.scopedAction?.id, action.id);
          break;
          
        case AccessPolicyScopedResourceType.App:
          strictEqual(accessPolicy.scopedApp?.id, app.id);
          break;
          
        case AccessPolicyScopedResourceType.Group:
          strictEqual(accessPolicy.scopedGroup?.id, group.id);
          break;
          
        case AccessPolicyScopedResourceType.Item:
          strictEqual(accessPolicy.scopedItem?.id, item.id);
          break;
          
        case AccessPolicyScopedResourceType.Milestone:
          strictEqual(accessPolicy.scopedMilestone?.id, milestone.id);
          break;
          
        case AccessPolicyScopedResourceType.Project:
          strictEqual(accessPolicy.scopedProject?.id, project.id);
          break;
          
        case AccessPolicyScopedResourceType.Role:
          strictEqual(accessPolicy.scopedRole?.id, role.id);
          break;
          
        case AccessPolicyScopedResourceType.User:
          strictEqual(accessPolicy.scopedUser?.id, user.id);
          break;
          
        case AccessPolicyScopedResourceType.Workspace:
          strictEqual(accessPolicy.scopedWorkspace?.id, workspace.id);
          break;

        default:
          fail(`Unexpected scoped resource type: ${accessPolicy.scopedResourceType}`);

      }

      strictEqual(accessPolicy.action?.id, action.id);

    }

  });

  it("can return up to 1,000 access policies at a time", {timeout: 10000}, async () => {

    // Make sure there isn't any access policies right now.
    const initialAccessPolicyList = await AccessPolicy.list("", slashstepServer.pool);

    const maximumActionCount = Math.max(0, 1001 - initialAccessPolicyList.length);
    const accessPolicies = [];
    const user = await createRandomUser();
    for (let i = 0; maximumActionCount > i; i++) {

      const action = await createRandomAction();
      const accessPolicy = await AccessPolicy.create({
        principalUserID: user.id,
        actionID: action.id,
        principalType: AccessPolicyPrincipalType.User,
        permissionLevel: AccessPolicyPermissionLevel.Admin,
        inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
        scopedResourceType: AccessPolicyScopedResourceType.Action,
        scopedActionID: action.id
      }, slashstepServer.pool);
      accessPolicies.push(accessPolicy);

    }

    const updatedAccessPolicyList = await AccessPolicy.list("", slashstepServer.pool);
    accessPolicies.pop();
    strictEqual(updatedAccessPolicyList.length, 1000);

    for (const accessPolicy of accessPolicies) {

      notStrictEqual(updatedAccessPolicyList.findIndex((possibleAccessPolicy) => possibleAccessPolicy.id === accessPolicy.id), -1);

    }

  });

  it("can return a count of access policies", {timeout: 5000}, async () => {

    // Make sure there isn't any access policies right now.
    const initialAccessPolicyCount = await AccessPolicy.count("", slashstepServer.pool);

    const user = await createRandomUser();
    const action = await createRandomAction();
    await AccessPolicy.create({
      principalUserID: user.id,
      actionID: action.id,
      principalType: AccessPolicyPrincipalType.User,
      permissionLevel: AccessPolicyPermissionLevel.Admin,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Action,
      scopedActionID: action.id
    }, slashstepServer.pool);

    const updatedAccessPolicyCount = await AccessPolicy.count("", slashstepServer.pool);
    strictEqual(updatedAccessPolicyCount, initialAccessPolicyCount + 1);

  });

  it("can get the deepest access policy relative to a specific resource", {timeout: 1000}, async () => {

    // Make sure there isn't any access policies right now.
    const user = await createRandomUser();
    const action = await createRandomAction();
    const workspace = await createRandomWorkspace();
    const project = await createRandomProject(workspace.id);
    const item = await createRandomItem(project.id);

    const itemAccessPolicy = await AccessPolicy.create({
      principalUserID: user.id,
      actionID: action.id,
      principalType: AccessPolicyPrincipalType.User,
      permissionLevel: AccessPolicyPermissionLevel.Admin,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Item,
      scopedItemID: item.id
    }, slashstepServer.pool);

    const projectAccessPolicy = await AccessPolicy.create({
      principalUserID: user.id,
      actionID: action.id,
      principalType: AccessPolicyPrincipalType.User,
      permissionLevel: AccessPolicyPermissionLevel.Admin,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Project,
      scopedProjectID: project.id
    }, slashstepServer.pool);

    const workspaceAccessPolicy = await AccessPolicy.create({
      principalUserID: user.id,
      actionID: action.id,
      principalType: AccessPolicyPrincipalType.User,
      permissionLevel: AccessPolicyPermissionLevel.Admin,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Workspace,
      scopedWorkspaceID: workspace.id
    }, slashstepServer.pool);

    const instanceAccessPolicy = await AccessPolicy.create({
      principalUserID: user.id,
      actionID: action.id,
      principalType: AccessPolicyPrincipalType.User,
      permissionLevel: AccessPolicyPermissionLevel.Admin,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

    for (const accessPolicy of [itemAccessPolicy, projectAccessPolicy, workspaceAccessPolicy, instanceAccessPolicy]) {

      const possibleItemAccessPolicy = await AccessPolicy.getAccessPolicyWithDeepestScope(action.id, slashstepServer.pool, {
        principalType: AccessPolicyPrincipalType.User,
        principalUserID: user.id
      }, await item.getScopeData(Project));
      strictEqual(accessPolicy.id, possibleItemAccessPolicy.id);
      await accessPolicy.delete();

    }

  });

  it("can delete access policies", {timeout: 300}, async () => {

    // Make sure there isn't any access policies right now.
    const user = await createRandomUser();
    const action = await createRandomAction();
    const accessPolicy = await AccessPolicy.create({
      principalUserID: user.id,
      actionID: action.id,
      principalType: AccessPolicyPrincipalType.User,
      permissionLevel: AccessPolicyPermissionLevel.Admin,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      scopedResourceType: AccessPolicyScopedResourceType.Instance
    }, slashstepServer.pool);

    await accessPolicy.delete();
    
    await rejects(async () => await AccessPolicy.getByID(accessPolicy.id, slashstepServer.pool), ResourceNotFoundError);

  });

})