import { Request, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import Project from "#resources/Project/Project.js";
import { DatabaseError } from "pg";
import Item from "#resources/Item/Item.js";
import Workspace from "#resources/Workspace/Workspace.js";

const createProjectItemRouter = Router({mergeParams: true})
createProjectItemRouter.post("/", async (request: Request<{ projectID: string }>, response) => {

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

    // Get the project.
    const { projectID } = request.params;
    const { pool } = response.locals;
    const { include } = request.query;
    const project = await Project.getByID(projectID, pool, {
      Workspace: include === "project.workspace" || (include instanceof Array && include?.includes("project.workspace")) ? Workspace : undefined
    });

    try {

      const item = await Item.create({
        summary,
        description,
        projectID: project.id,
        project: include === "project" || (include instanceof Array && include?.includes("project")) ? project : undefined
      }, pool);
      
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
        message: "Internal server error. Please try again later."
      });

    }

  }

});

export default createProjectItemRouter;