/**
 * Tests for the AccessPolicy class.
 * 
 * Programmers: 
 * - Christian Toney (https://christiantoney.com)
 * 
 * © 2025 Beastslash LLC
 */

import { after, afterEach, before, describe, it } from "node:test"
import { strictEqual } from "node:assert";
import { Pool } from "pg";
import AccessPolicy, { AccessPolicyInheritanceLevel, AccessPolicyPermissionLevel, AccessPolicyPrincipalType } from "./AccessPolicy.js";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Wait } from "testcontainers";
import Server from "#utilities/Server/Server.js";
import User from "#resources/User/User.js";
import Action from "#resources/Action/Action.js";

describe("The AccessPolicy class", async () => {

  let postgreSQLPool: Pool;
  let container: StartedPostgreSqlContainer;

  before(async () => {

    container = await new PostgreSqlContainer("postgres:18").withWaitStrategy(Wait.forHealthCheck()).withUsername("postgres").start();
    postgreSQLPool = new Pool({
      connectionString: container.getConnectionUri()
    });

  })

  afterEach(async () => {

    const client = await postgreSQLPool.connect();
    await client.query("drop schema if exists app cascade;");
    client.release();

  });

  after(async () => {

    await postgreSQLPool.end();
    await container.stop();
    
  });

  it("can create an access policy", async () => {

    // Create test resources.
    await Server.initializeResourceTables(postgreSQLPool);

    const action = await Action.create({
      name: "slashstep.test.test",
      displayName: "test",
      description: "This is a test action only used to comply with the foreign key constraint."
    }, postgreSQLPool);

    const user = await User.create({
      username: "testuser",
      displayName: "Test User",
      hashedPassword: "12345678"
    }, postgreSQLPool);

    const accessPolicyProperties: Parameters<(typeof AccessPolicy)["create"]>[0] = {
      principalType: AccessPolicyPrincipalType.User,
      scopeType: "Instance" as const,
      actionID: action.id,
      permissionLevel: AccessPolicyPermissionLevel.Admin,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled,
      principalUserID: user.id
    };
    const accessPolicy = await AccessPolicy.create(accessPolicyProperties, postgreSQLPool);

    // Verify the properties are the same.
    // It may seem obvious at first, but this test mitigates human error 
    // (i.e. accidentally assigning the wrong property, forgetting an optional property, etc.).
    strictEqual(accessPolicy instanceof AccessPolicy, true);
    strictEqual(typeof(accessPolicy.id), "string");
    strictEqual(accessPolicy.principalType, accessPolicyProperties.principalType);
    strictEqual(accessPolicy.scopeType, accessPolicyProperties.scopeType);
    strictEqual(accessPolicy.actionID, accessPolicyProperties.actionID);
    strictEqual(accessPolicy.permissionLevel, accessPolicyProperties.permissionLevel);
    strictEqual(accessPolicy.inheritanceLevel, accessPolicyProperties.inheritanceLevel);

  });

  it("can grant default, instance-wide admin permissions to a specific user", () => {



  });

  it("can return a list of access policies", () => {

  });

  it("can return a list of access policies with related resources", () => {

  });

  it("can return a count of access policies", () => {

  });

  it("can initialize an access_policies table in a database", () => {

  });

  it("can get the deepest access policy relative to a specific resource", () => {

  });

  it("can verify a principal's permissions", () => {

  });

  it("can delete access policies", () => {

  });

})