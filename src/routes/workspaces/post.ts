import Item, { ItemIncludedResourcesConstructorMap } from "#resources/Item/Item.js";
import { Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import Workspace from "#resources/Workspace/Workspace.js";
import { DatabaseError } from "pg";

const createWorkspaceRouter = Router({mergeParams: true})
createWorkspaceRouter.post("/", async (request, response) => {

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

    const { pool } = response.locals;

    try {

      const workspace = await Workspace.create(request.body, pool);
      
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
        message: "Internal server error. Please try again later."
      });

    }

  }

});

export default createWorkspaceRouter;