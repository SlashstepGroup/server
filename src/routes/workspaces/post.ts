import Item, { ItemIncludedResourcesConstructorMap } from "#resources/Item/Item.js";
import { Response, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import Workspace from "#resources/Workspace/Workspace.js";
import { DatabaseError } from "pg";
import { ResponseLocals } from "#utilities/types.js";
import allowUnauthenticatedRequests from "#utilities/hooks/allowUnauthenticatedRequests.js";
import authenticateUser from "#utilities/hooks/authenticateUser.js";
import verifyUserPermissions from "#utilities/verifyUserPermissions.js";
import Action from "#resources/Action/Action.js";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";

const createWorkspaceRouter = Router({mergeParams: true});
createWorkspaceRouter.use(allowUnauthenticatedRequests);
createWorkspaceRouter.use(authenticateUser);
createWorkspaceRouter.post("/", async (request, response: Response<unknown, ResponseLocals>) => {

  try {

    const { name, displayName, description } = request.body ?? {};
    if (!name || !displayName) {

      throw new HTTPError(400, "Workspace name and display name must be provided.");
    
    }

    const verifyString = (value: any, name: string) => {

      if (value && typeof(value) !== "string") {

        throw new HTTPError(400, `${name} must be a string.`);
      
      }

    }

    verifyString(name, "name");
    verifyString(displayName, "displayName");
    verifyString(description, "description");

    const { server, authenticatedUser } = response.locals;

    let action: Action;

    try {

      action = await Action.getByName("slashstep.workspaces.create", server.pool);

    } catch (error) {

      if (error instanceof ResourceNotFoundError) {

        throw new Error("The slashstep.workspaces.create action does not exist. You may need to set up the default actions again.");

      }

      throw error;

    }

    await verifyUserPermissions({
      actionID: action.id,
      pool: server.pool,
      scope: {},
      userID: authenticatedUser?.id
    });

    try {

      const workspace = await Workspace.create(request.body, server.pool);
      
      response.json(workspace);

    } catch (error) {

      if (error instanceof DatabaseError && error.code === "23505") {

        throw new HTTPError(409, "A workspace with this name already exists.");

      }

      throw error;

    }


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

export default createWorkspaceRouter;