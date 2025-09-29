import PermissionDeniedError from "#errors/PermissionDeniedError.js";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import AccessPolicy, { AccessPolicyPermissionLevel, Scope } from "#resources/AccessPolicy/AccessPolicy.js";
import { Pool } from "pg";

export type UserPermissionVerificationOptions = {
  actionID: string;
  pool: Pool;
  scope: Scope;
  userID?: string;
}

async function verifyUserPermissions(properties: UserPermissionVerificationOptions) {

  try {
  
    const deepestAccessPolicy = await AccessPolicy.getByDeepestScope(properties.actionID, properties.pool, properties.scope, properties.userID);

    if (deepestAccessPolicy.permissionLevel < AccessPolicyPermissionLevel.User) {

      throw new PermissionDeniedError();

    }

  } catch (error) {

    if (error instanceof ResourceNotFoundError) {

      throw new PermissionDeniedError();

    }

    throw error;

  }

}

export default verifyUserPermissions;