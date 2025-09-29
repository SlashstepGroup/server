import { Request, Response, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import Project from "#resources/Project/Project.js";
import { DatabaseError } from "pg";
import Item from "#resources/Item/Item.js";
import Workspace from "#resources/Workspace/Workspace.js";
import authenticateUser from "#utilities/hooks/authenticateUser.js";
import User from "#resources/User/User.js";
import Action from "#resources/Action/Action.js";
import AccessPolicy, { AccessPolicyPermissionLevel } from "#resources/AccessPolicy/AccessPolicy.js";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import PermissionDeniedError from "#errors/PermissionDeniedError.js";
import ActionLog from "#resources/ActionLog/ActionLog.js";
import allowUnauthenticatedRequests from "#utilities/hooks/allowUnauthenticatedRequests.js";
import Server from "#utilities/Server/Server.js";
import verifyUserPermissions from "#utilities/verifyUserPermissions.js";

const createProjectItemRouter = Router({mergeParams: true});

createProjectItemRouter.use(allowUnauthenticatedRequests);
createProjectItemRouter.use(authenticateUser);
createProjectItemRouter.post("/", async (request: Request<{ projectID: string }>, response: Response<unknown, { server: Server, authenticatedUser?: User }>) => {

  try {

    // Verify the user inputs.
    const { summary, description } = request.body ?? {};
    const ensureValue = (name: string, value: unknown) => {

      if (!value) {

        throw new HTTPError(400, `${name} must be provided.`);
    
      }

    }

    ensureValue("summary", summary);

    const verifyString = (value: unknown, name: string) => {

      if (value && typeof(value) !== "string") {

        throw new HTTPError(400, `${name} must be a string.`);
      
      }

    }

    verifyString(summary, "summary");
    verifyString(description, "description");

    // Make sure the user has permission to create an item in the project.
    const { projectID } = request.params;
    const { server, authenticatedUser } = response.locals;
    const { include } = request.query;
    const project = await Project.getByID(projectID, server.pool, {
      Workspace: include === "project.workspace" || (include instanceof Array && include?.includes("project.workspace")) ? Workspace : undefined
    });

    const action = await Action.getByName("slashstep.items.create", server.pool);

    await verifyUserPermissions({
      actionID: action.id,
      pool: server.pool,
      scope: {projectID: project.id, workspaceID: project.workspaceID},
      userID: authenticatedUser?.id
    });

    try {

      // Create the item.
      const item = await Item.create({
        summary,
        description,
        projectID: project.id,
        project: include === "project" || (include instanceof Array && include?.includes("project")) ? project : undefined
      }, server.pool);

      // Log the action.
      await ActionLog.create({
        actionID: action.id,
        actorID: authenticatedUser?.id,
        actorIPAddress: request.ip,
        targetItemID: item.id
      }, server.pool);
      
      response.json(item);

    } catch (error) {

      if (error instanceof DatabaseError && error.code === "23505") {

        const isProjectKeyUnique = error.message.includes("projects_name_unique");
        throw new HTTPError(409, `A project with this ${isProjectKeyUnique ? "name" : "key"} already exists.`);

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

export default createProjectItemRouter;