import { Request, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import Workspace from "#resources/Workspace/Workspace.js";

const getWorkspaceRouter = Router({mergeParams: true})
getWorkspaceRouter.get("/", async (request: Request<{ workspaceName: string }>, response) => {

  try {

    const { workspaceName } = request.params;
    const { pool } = response.locals;
    const workspace = await Workspace.getFromName(workspaceName, pool);
    
    response.json(workspace);

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

export default getWorkspaceRouter;