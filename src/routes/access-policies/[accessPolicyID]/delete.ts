import Item, { ItemIncludedResourcesConstructorMap } from "#resources/Item/Item.js";
import { Request, Response, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import allowUnauthenticatedRequests from "#utilities/hooks/allowUnauthenticatedRequests.js";
import authenticateUser from "#utilities/hooks/authenticateUser.js";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Role from "#resources/Role/Role.js";
import Action from "#resources/Action/Action.js";
import Server from "#utilities/Server/Server.js";
import User from "#resources/User/User.js";

const deleteAccessPolicyRouter = Router({mergeParams: true});
deleteAccessPolicyRouter.use(allowUnauthenticatedRequests);
deleteAccessPolicyRouter.use(authenticateUser);
deleteAccessPolicyRouter.delete("/", async (request: Request<{ accessPolicyID: string }>, response: Response<unknown, { server: Server, authenticatedUser?: User }>) => {

  try {
    
    const { authenticatedUser, server } = response.locals;
    const deleteAccessPolicyAction = await Action.getPreDefinedActionByName("slashstep.accessPolicies.delete", server.pool);

    const { accessPolicyID } = request.params;
    const accessPolicy = await AccessPolicy.getByID(accessPolicyID, server.pool);
    const accessPolicyScopeData = await accessPolicy.getAccessPolicyScopeData();

    if (authenticatedUser) {

      await authenticatedUser.verifyPermissions({Action, AccessPolicy}, deleteAccessPolicyAction.id, accessPolicyScopeData);

    } else {

      await Role.verifyPermissionsForUnauthenticatedUsers({Action, AccessPolicy}, deleteAccessPolicyAction.id, server.pool, accessPolicyScopeData);

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