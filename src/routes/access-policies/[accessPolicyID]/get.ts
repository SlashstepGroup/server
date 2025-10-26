import Item, { ItemIncludedResourcesConstructorMap } from "#resources/Item/Item.js";
import { Request, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import allowUnauthenticatedRequests from "#utilities/hooks/allowUnauthenticatedRequests.js";
import authenticateUser from "#utilities/hooks/authenticateUser.js";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";

const getAccessPolicyRouter = Router({mergeParams: true});
getAccessPolicyRouter.use(allowUnauthenticatedRequests);
getAccessPolicyRouter.use(authenticateUser);
getAccessPolicyRouter.get("/", async (request: Request<{ accessPolicyID: string }>, response) => {

  try {

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

    const accessPolicy = await AccessPolicy.getByID(accessPolicyID, response.locals.pool);
    
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