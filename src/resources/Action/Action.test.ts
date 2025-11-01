/**
 * Tests for the Action class.
 * 
 * Programmers: 
 * - Christian Toney (https://christiantoney.com)
 * 
 * © 2025 Beastslash LLC
 */

import { after, afterEach, before, beforeEach, describe, it } from "node:test"
import Action, { BaseActionProperties, InitialWritableActionProperties } from "#resources/Action/Action.js";
import TestEnvironment from "#utilities/TestEnvironment/TestEnvironment.js";
import { default as SlashstepServer } from "#utilities/Server/Server.js";
import { v7 as generateUUIDv7, validate as validateUUIDv7 } from "uuid";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import assert, { strictEqual, rejects } from "node:assert/strict";

await describe("Class: Action", async () => {

  const testEnvironment = new TestEnvironment();
  let slashstepServer: SlashstepServer;

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

  it("can create an action", {timeout: 500}, async () => {

    const actionProperties: InitialWritableActionProperties = {
      name: `slashstep.${generateUUIDv7()}.${generateUUIDv7()}`,
      displayName: TestEnvironment.generateRandomString(16),
      description: TestEnvironment.generateRandomString(128)
    };

    const action = await Action.create(actionProperties, slashstepServer.pool);
    assert(action instanceof Action);
    assert(validateUUIDv7(action.id));
    strictEqual(action.name, actionProperties.name);
    strictEqual(action.displayName, actionProperties.displayName);
    strictEqual(action.description, actionProperties.description);
    strictEqual(action.appID, null);

  });

  it("can return a list of actions without a query", {timeout: 1000}, async () => {

    const actions = await Action.list("", slashstepServer.pool);
    assert(actions instanceof Array);
    assert(actions.length > 0);

    for (const action of actions) {

      assert(action instanceof Action);

    }

  });

  it("can return a list of actions with a query", {timeout: 1000}, async () => {

    const randomAction = await Action.create({
      name: `slashstep.${generateUUIDv7()}.${generateUUIDv7()}`,
      displayName: TestEnvironment.generateRandomString(16),
      description: TestEnvironment.generateRandomString(128)
    }, slashstepServer.pool);

    const actions = await Action.list(`id = "${randomAction.id}"`, slashstepServer.pool);
    assert(actions instanceof Array);
    strictEqual(actions.length, 1);
    strictEqual(actions[0].id, randomAction.id);
    strictEqual(actions[0].name, randomAction.name);
    strictEqual(actions[0].displayName, randomAction.displayName);
    strictEqual(actions[0].description, randomAction.description);
    strictEqual(actions[0].appID, randomAction.appID);

  });

  it("can return a count of actions without a query", {timeout: 3000}, async () => {

    const javascriptActionCount = await Action.count("", slashstepServer.pool);
    const poolClient = await slashstepServer.pool.connect();

    try {

      const postgreSQLResult = await poolClient.query("select count(*) from hydrated_actions");
      const postgreSQLActionCount = parseInt(postgreSQLResult.rows[0].count, 10);
      strictEqual(postgreSQLActionCount, javascriptActionCount);

    } finally {

      poolClient.release();

    }

  });

  it("can return a count of actions with a query", {timeout: 3000}, async () => {

    const randomAction = await Action.create({
      name: `slashstep.${generateUUIDv7()}.${generateUUIDv7()}`,
      displayName: TestEnvironment.generateRandomString(16),
      description: TestEnvironment.generateRandomString(128)
    }, slashstepServer.pool);
    const javascriptActionCount = await Action.count(`id = "${randomAction.id}"`, slashstepServer.pool);
    const poolClient = await slashstepServer.pool.connect();

    try {

      const postgreSQLResult = await poolClient.query("select count(*) from hydrated_actions where id = $1", [randomAction.id]);
      const postgreSQLActionCount = parseInt(postgreSQLResult.rows[0].count, 10);
      strictEqual(postgreSQLActionCount, javascriptActionCount);

    } finally {

      poolClient.release();

    }

  });

  it("can return up to 1,000 actions at a time", {timeout: 5000}, async () => {

    const currentActionCount = await Action.count("", slashstepServer.pool);
    const goalActionCount = 1001;
    const missingActionCount = goalActionCount - currentActionCount;
    for (let i = 0; i < missingActionCount; i++) {

      await Action.create({
        name: `slashstep.${generateUUIDv7()}.${generateUUIDv7()}`,
        displayName: TestEnvironment.generateRandomString(16),
        description: TestEnvironment.generateRandomString(128)
      }, slashstepServer.pool);

    }

    const actionCount = await Action.count("", slashstepServer.pool);
    strictEqual(actionCount, goalActionCount);

    const actions = await Action.list("", slashstepServer.pool);
    strictEqual(actions.length, 1000);

  });

  it("can return an action by ID", {timeout: 500}, async () => {

    const getActionAction = await Action.getByName("slashstep.actions.get", slashstepServer.pool);
    const getActionActionByID = await Action.getByID(getActionAction.id, slashstepServer.pool);
    strictEqual(getActionActionByID.id, getActionAction.id);

  });

  it("can delete an action", {timeout: 300}, async () => {

    const getActionAction = await Action.getByName("slashstep.actions.get", slashstepServer.pool);
    await getActionAction.delete();
    await rejects(async () => await Action.getByID(getActionAction.id, slashstepServer.pool), ResourceNotFoundError);

  });

  it("can delete access policies if the action is deleted", {timeout: 500}, async () => {

    const getActionAction = await Action.getByName("slashstep.actions.get", slashstepServer.pool);
    const accessPolicyCount = await AccessPolicy.count(`actionID = "${getActionAction.id}"`, slashstepServer.pool);
    assert(accessPolicyCount > 0);

    await getActionAction.delete();
    const accessPolicyCountAfterDelete = await AccessPolicy.count(`actionID = "${getActionAction.id}"`, slashstepServer.pool);
    strictEqual(accessPolicyCountAfterDelete, 0);

  });

})