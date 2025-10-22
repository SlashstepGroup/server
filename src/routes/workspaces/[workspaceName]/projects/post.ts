import { Request, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import Project from "#resources/Project/Project.js";
import { DatabaseError } from "pg";
import Workspace from "#resources/Workspace/Workspace.js";
import HTTPInputValidator from "#utilities/HTTPInputValidator/HTTPInputValidator.js";
import Action from "#resources/Action/Action.js";
import AccessPolicy, { AccessPolicyPermissionLevel } from "#resources/AccessPolicy/AccessPolicy.js";
import authenticateUser from "#utilities/hooks/authenticateUser.js";

const createProjectRouter = Router({mergeParams: true});
createProjectRouter.use(authenticateUser);
createProjectRouter.post("/", async (request: Request<{ workspaceName: string }>, response) => {

  try {

    // Verify the user inputs.
    const { name, displayName, description, key } = request.body ?? {};
    HTTPInputValidator.verifyString(name, "name", {isRequired: true, minLength: 1, maxLength: 255});
    HTTPInputValidator.verifyString(displayName, "displayName", {isRequired: true, minLength: 1, maxLength: 255});
    HTTPInputValidator.verifyString(description, "description", {minLength: 0, maxLength: 4000});
    HTTPInputValidator.verifyString(key, "key", {isRequired: true, minLength: 1, maxLength: 20});

    // Get the workspace.
    const { workspaceName } = request.params;
    const { pool } = response.locals;
    const workspace = await Workspace.getFromName(workspaceName, pool);

    // Make sure the user can create projects in the workspace.
    const getWorkspaceAction = await Action.getByName("slashstep.projects.create", response.locals.server.pool, true);
    await AccessPolicy.verifyUserPermissions(getWorkspaceAction.id, response.locals.server.pool, response.locals.authenticatedUser?.id, AccessPolicyPermissionLevel.User, {
      workspaceID: workspace.id
    });

    try {

      const { include } = request.query;

      const project = await Project.create({
        name,
        displayName,
        description,
        workspaceID: workspace.id,
        key,
        workspace: include === "workspace" ? workspace : undefined
      }, pool);
      
      response.json(project);

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

export default createProjectRouter;