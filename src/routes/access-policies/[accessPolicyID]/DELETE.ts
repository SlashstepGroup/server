import { Request, Response, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import allowUnauthenticatedRequests from "#utilities/hooks/allowUnauthenticatedRequests.js";
import authenticateUser from "#utilities/hooks/authenticateUser.js";
import AccessPolicy, { AccessPolicyPermissionLevel } from "#resources/AccessPolicy/AccessPolicy.js";
import Role from "#resources/Role/Role.js";
import Action from "#resources/Action/Action.js";
import type { default as Server } from "#utilities/Server/Server.js";
import User from "#resources/User/User.js";

const deleteAccessPolicyRouter = Router({mergeParams: true});
deleteAccessPolicyRouter.use(allowUnauthenticatedRequests);
deleteAccessPolicyRouter.use(authenticateUser);
deleteAccessPolicyRouter.use(async (request: Request<{ accessPolicyID: string }>, response: Response<unknown, { server: Server, authenticatedUser?: User }>) => {

  try {
    
    const { authenticatedUser, server } = response.locals;
    const deleteAccessPolicyAction = await Action.getPreDefinedActionByName("slashstep.accessPolicies.delete", server.pool);

    const { accessPolicyID } = request.params;
    const accessPolicy = await AccessPolicy.getByID(accessPolicyID, server.pool);
    const accessPolicyAction = await Action.getByID(accessPolicy.actionID, response.locals.server.pool);
    const accessPolicyScopeData = await accessPolicy.getAccessPolicyScopeData();

    if (authenticatedUser) {

      await authenticatedUser.verifyPermissions({Action, AccessPolicy}, deleteAccessPolicyAction.id, accessPolicyScopeData);
      await authenticatedUser.verifyPermissions({Action, AccessPolicy}, accessPolicyAction.id, accessPolicyScopeData, AccessPolicyPermissionLevel.Editor);

    } else {

      await Role.verifyPermissionsForUnauthenticatedUsers({Action, AccessPolicy}, deleteAccessPolicyAction.id, server.pool, accessPolicyScopeData);
      await Role.verifyPermissionsForUnauthenticatedUsers({Action, AccessPolicy}, accessPolicyAction.id, response.locals.server.pool, accessPolicyScopeData, AccessPolicyPermissionLevel.Editor);

    }

    response.sendStatus(204);

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

export default deleteAccessPolicyRouter;