import Item, { ItemIncludedResourcesConstructorMap } from "#resources/Item/Item.js";
import { Request, Response, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import allowUnauthenticatedRequests from "#utilities/hooks/allowUnauthenticatedRequests.js";
import authenticateUser from "#utilities/hooks/authenticateUser.js";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Role from "#resources/Role/Role.js";
import Action from "#resources/Action/Action.js";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import PermissionDeniedError from "#errors/PermissionDeniedError.js";
import UnauthenticatedError from "#errors/UnauthenticatedError.js";
import Server from "#utilities/Server/Server.js";
import User from "#resources/User/User.js";

const getAccessPolicyRouter = Router({mergeParams: true});
getAccessPolicyRouter.use(allowUnauthenticatedRequests);
getAccessPolicyRouter.use(authenticateUser);
getAccessPolicyRouter.get("/", async (request: Request<{ accessPolicyID: string }>, response: Response<unknown, { server: Server, authenticatedUser?: User }>) => {

  try {

    let getAccessPolicyAction: Action;

    try {

      getAccessPolicyAction = await Action.getByName("slashstep.accessPolicies.get", response.locals.server.pool);

    } catch (error) {

      if (error instanceof ResourceNotFoundError) {

        throw new Error("The slashstep.accessPolicies.get action does not exist. You may need to set up the default actions.");

      }

      throw error;

    }

    const { authenticatedUser } = response.locals;
    if (authenticatedUser) {

      await authenticatedUser.verifyPermissions({Action, AccessPolicy}, getAccessPolicyAction.id);

    } else {

      try {

        const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", response.locals.server.pool);
        await unauthenticatedUsersRole.verifyPermissions({Action, AccessPolicy}, getAccessPolicyAction.id);

      } catch (error) {

        if (error instanceof ResourceNotFoundError) {

          throw new Error(`The pre-defined "unauthenticated-users" role does not exist. You may need to set up the default roles.`);

        } else if (error instanceof PermissionDeniedError) {

          throw new UnauthenticatedError();

        }

        throw error;

      }

    }

    const { include } = request.query;
    const { accessPolicyID } = request.params;

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

    const accessPolicy = await AccessPolicy.getByID(accessPolicyID, response.locals.server.pool);
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