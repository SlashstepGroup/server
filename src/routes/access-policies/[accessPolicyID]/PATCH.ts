import { Request, Response, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import allowUnauthenticatedRequests from "#utilities/hooks/allowUnauthenticatedRequests.js";
import authenticateUser from "#utilities/hooks/authenticateUser.js";
import AccessPolicy, { AccessPolicyPermissionLevel } from "#resources/AccessPolicy/AccessPolicy.js";
import Role from "#resources/Role/Role.js";
import Action from "#resources/Action/Action.js";
import type { default as Server } from "#utilities/Server/Server.js";
import User from "#resources/User/User.js";

const updateAccessPolicyRouter = Router({mergeParams: true});
updateAccessPolicyRouter.use(allowUnauthenticatedRequests);
updateAccessPolicyRouter.use(authenticateUser);
updateAccessPolicyRouter.use(async (request: Request<{ accessPolicyID: string }, unknown, {inheritanceLevel: unknown, permissionLevel: unknown} | undefined>, response: Response<unknown, { server: Server, authenticatedUser?: User }>) => {

  try {

    // Make sure the access policy exists.
    const { accessPolicyID } = request.params;
    const accessPolicy = await AccessPolicy.getByID(accessPolicyID, response.locals.server.pool);
    const accessPolicyAction = await Action.getByID(accessPolicy.actionID, response.locals.server.pool);

    // Make sure the user has permission to view the access policy.
    const accessPolicyScopeData = await accessPolicy.getScopeData();
    const { authenticatedUser } = response.locals;
    const updateAccessPolicyAction = await Action.getPreDefinedActionByName("slashstep.accessPolicies.update", response.locals.server.pool);
    if (authenticatedUser) {

      await authenticatedUser.verifyPermissions({Action, AccessPolicy}, updateAccessPolicyAction.id, accessPolicyScopeData);
      await authenticatedUser.verifyPermissions({Action, AccessPolicy}, accessPolicyAction.id, accessPolicyScopeData, AccessPolicyPermissionLevel.Editor);

    } else {

      await Role.verifyPermissionsForUnauthenticatedUsers({Action, AccessPolicy}, updateAccessPolicyAction.id, response.locals.server.pool, accessPolicyScopeData);
      await Role.verifyPermissionsForUnauthenticatedUsers({Action, AccessPolicy}, accessPolicyAction.id, response.locals.server.pool, accessPolicyScopeData, AccessPolicyPermissionLevel.Editor);

    }

    // Update the access policy.
    if (!request.body) {

      throw new HTTPError(400, "The request body must be a JSON object.");

    }

    const updatedAccessPolicy = await accessPolicy.update({
      inheritanceLevel: AccessPolicy.validatePropertyValue("inheritanceLevel", request.body.inheritanceLevel),
      permissionLevel: AccessPolicy.validatePropertyValue("permissionLevel", request.body.permissionLevel)
    });

    response.json(updatedAccessPolicy);

  } catch (error) {

    if (error instanceof HTTPError) {

      response.status(error.getStatusCode()).json(error);

    } else {

      console.error(error);

      response.status(500).json({
        message: "Something bad happened on our side. Please try again later."
      });

    }

  }

});

export default updateAccessPolicyRouter;