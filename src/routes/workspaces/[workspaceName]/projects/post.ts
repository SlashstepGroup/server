import { Request, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import Project from "#resources/Project/Project.js";
import { DatabaseError } from "pg";
import Workspace from "#resources/Workspace/Workspace.js";

const createProjectRouter = Router({mergeParams: true})
createProjectRouter.post("/", async (request: Request<{ workspaceName: string }>, response) => {

  try {

    // Verify the user inputs.
    const { name, displayName, description, key } = request.body ?? {};
    const ensureValue = (name: string, value: unknown) => {

      if (!value) {

        throw new HTTPError(400, `${name} must be provided.`);
    
      }

    }

    ensureValue("name", name);
    ensureValue("displayName", displayName);
    ensureValue("key", key);

    const verifyString = (value: unknown, name: string) => {

      if (value && typeof(value) !== "string") {

        throw new HTTPError(400, `${name} must be a string.`);
      
      }

    }

    verifyString(name, "name");
    verifyString(displayName, "displayName");
    verifyString(description, "description");
    verifyString(key, "key");

    // Get the workspace.
    const { workspaceName } = request.params;
    const { pool } = response.locals;
    const workspace = await Workspace.getFromName(workspaceName, pool);

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
        message: "Internal server error. Please try again later."
      });

    }

  }

});

export default createProjectRouter;