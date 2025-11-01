import { ItemIncludedResourcesConstructorMap } from "#resources/Item/Item.js";
import { Request, Response, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import allowUnauthenticatedRequests from "#utilities/hooks/allowUnauthenticatedRequests.js";
import authenticateUser from "#utilities/hooks/authenticateUser.js";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Role from "#resources/Role/Role.js";
import Action from "#resources/Action/Action.js";
import type { default as Server } from "#utilities/Server/Server.js";
import User from "#resources/User/User.js";

const getAccessPolicyRouter = Router({mergeParams: true});
getAccessPolicyRouter.use(allowUnauthenticatedRequests);
getAccessPolicyRouter.use(authenticateUser);
getAccessPolicyRouter.use(async (request: Request<{ accessPolicyID: string }>, response: Response<unknown, { server: Server, authenticatedUser?: User }>) => {

  try {

    const getAccessPolicyAction = await Action.getPreDefinedActionByName("slashstep.accessPolicies.get", response.locals.server.pool);

    const { accessPolicyID } = request.params;
    const accessPolicy = await AccessPolicy.getByID(accessPolicyID, response.locals.server.pool);
    const accessPolicyScopeData = await accessPolicy.getScopeData();

    const { authenticatedUser } = response.locals;
    if (authenticatedUser) {

      await authenticatedUser.verifyPermissions({Action, AccessPolicy}, getAccessPolicyAction.id, accessPolicyScopeData);

    } else {

      await Role.verifyPermissionsForUnauthenticatedUsers({Action, AccessPolicy}, getAccessPolicyAction.id, response.locals.server.pool, accessPolicyScopeData);

    }

    const { include } = request.query;

    const includedResources: ItemIncludedResourcesConstructorMap = {};

    // if (include) {

    //   const addResourceClass = (resourceType: string) => {

    //     switch (resourceType) {

    //       case "project":
    //         includedResources.Project = Project;
    //         break;

    //       case "project.workspace":
    //         includedResources.Workspace = Workspace;
    //         break;

    //       default:
    //         throw new HTTPError(400, "include query must be \"project\", \"project.workspace\", or excluded.");

    //     }

    //   }

    //   if (typeof(include) === "string") {

    //     addResourceClass(include);

    //   } else if (include instanceof Array) {

    //     for (const resourceType of include) {

    //       if (typeof(resourceType) !== "string") {

    //         throw new HTTPError(400, "include query must be an array of strings.");

    //       }

    //       addResourceClass(resourceType);

    //     }

    //   }

    // }

    response.json(accessPolicy);

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

export default getAccessPolicyRouter;