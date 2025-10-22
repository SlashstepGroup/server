import { Response, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import Workspace from "#resources/Workspace/Workspace.js";
import { DatabaseError } from "pg";
import { ResponseLocals } from "#utilities/types.js";
import allowUnauthenticatedRequests from "#utilities/hooks/allowUnauthenticatedRequests.js";
import authenticateUser from "#utilities/hooks/authenticateUser.js";
import Action from "#resources/Action/Action.js";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import HTTPInputValidator from "#utilities/HTTPInputValidator/HTTPInputValidator.js";

const createWorkspaceRouter = Router({mergeParams: true});
createWorkspaceRouter.use(allowUnauthenticatedRequests);
createWorkspaceRouter.use(authenticateUser);
createWorkspaceRouter.post("/", async (request, response: Response<unknown, ResponseLocals>) => {

  try {

    // Make sure the inputs are valid.
    const { name, displayName, description } = request.body ?? {};
    HTTPInputValidator.verifyString(name, "name", {isRequired: true, minLength: 1, maxLength: 255});
    HTTPInputValidator.verifyString(displayName, "displayName", {isRequired: true, minLength: 1, maxLength: 255});
    HTTPInputValidator.verifyString(description, "description", {minLength: 0, maxLength: 255});

    // Make sure the user has permission to create a workspace.
    const { server, authenticatedUser } = response.locals;
    const action = await Action.getByName("slashstep.workspaces.create", server.pool, true);
    await AccessPolicy.verifyUserPermissions(action.id, server.pool, authenticatedUser?.id);

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