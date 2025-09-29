import { Request, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import Workspace from "#resources/Workspace/Workspace.js";

const deleteWorkspaceRouter = Router({mergeParams: true})
deleteWorkspaceRouter.delete("/", async (request: Request<{ workspaceName: string }>, response) => {

  try {

    const { workspaceName } = request.params;
    const { pool } = response.locals;
    const workspace = await Workspace.getFromName(workspaceName, pool);
    await workspace.delete();

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

export default deleteWorkspaceRouter;