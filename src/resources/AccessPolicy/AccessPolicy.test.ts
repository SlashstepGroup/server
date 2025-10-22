import { describe, it, before, beforeEach, afterEach } from "node:test"
import { strictEqual } from "node:assert";
import { Pool } from "pg";
import { v7 as generateUUIDv7 } from "uuid";
import AccessPolicy, { AccessPolicyInheritanceLevel, AccessPolicyPermissionLevel, AccessPolicyPrincipalType } from "./AccessPolicy.js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("The AccessPolicy class", () => {

  it("can create an access policy", async () => {

    const accessPolicyProperties = {
      principalType: AccessPolicyPrincipalType.User,
      scopeType: "Instance",
      actionID: generateUUIDv7(),
      permissionLevel: AccessPolicyPermissionLevel.Admin,
      inheritanceLevel: AccessPolicyInheritanceLevel.Enabled
    };

    const pool: Pool = {
      async connect() {
        return {
          async query(query: string, values: unknown[]) {
            
            // TODO: Use pg-mem. This can validate the query.
            // For now, we'll assume that the query is correct.

            strictEqual(values[0], accessPolicyProperties.principalType);
            strictEqual(values[4], accessPolicyProperties.scopeType);
            strictEqual(values[14], accessPolicyProperties.actionID);
            strictEqual(values[12], accessPolicyProperties.permissionLevel);
            strictEqual(values[13], accessPolicyProperties.inheritanceLevel);
            strictEqual(query, readFileSync(resolve(import.meta.dirname, "queries", "insert-access-policy-row.sql"), "utf8"), "The query must be equal to the contents of insert-access-policy-row.sql.");

            return {
              rows: [
                {
                  id: generateUUIDv7(),
                  principal_type: accessPolicyProperties.principalType,
                  scope_type: accessPolicyProperties.scopeType,
                  action_id: accessPolicyProperties.actionID,
                  permission_level: accessPolicyProperties.permissionLevel,
                  inheritance_level: accessPolicyProperties.inheritanceLevel
                }
              ]
            }
          },
          release() {}
        }
      }
    } as unknown as Pool;

    const accessPolicy = await AccessPolicy.create(accessPolicyProperties, pool);

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