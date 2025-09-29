import { Request, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import Project from "#resources/Project/Project.js";

const deleteProjectRouter = Router({mergeParams: true})
deleteProjectRouter.delete("/", async (request: Request<{ projectID: string }>, response) => {

  try {

    const { projectID } = request.params;
    const { pool } = response.locals;
    const project = await Project.getByID(projectID, pool);
    await project.delete();

    response.sendStatus(204);

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

export default deleteProjectRouter;