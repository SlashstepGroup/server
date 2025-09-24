import Item, { ItemIncludedResourcesConstructorMap } from "#resources/Item/Item.js";
import { Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import SlashstepQLInvalidKeyError from "#errors/SlashstepQLInvalidKeyError.js";
import SlashstepQLInvalidQueryError from "#errors/SlashstepQLInvalidQueryError.js";
import Project from "#resources/Project/Project.js";
import Workspace from "#resources/Workspace/Workspace.js";

const getItemsRouter = Router({mergeParams: true})
getItemsRouter.get("/", async (request, response) => {

  try {

    const { query, include } = request.query;
    if (query && typeof(query) !== "string") {

      throw new HTTPError(400, "Invalid query.");
    
    }

    const includedResources: ItemIncludedResourcesConstructorMap = {};

    if (include) {

      const addResourceClass = (resourceType: string) => {

        switch (resourceType) {

          case "project":
            includedResources.Project = Project;
            break;

          case "project.workspace":
            includedResources.Workspace = Workspace;
            break;

          default:
            throw new HTTPError(400, "include query must be \"project\", \"project.workspace\", or excluded.");

        }

      }

      if (typeof(include) === "string") {

        addResourceClass(include);

      } else if (include instanceof Array) {

        for (const resourceType of include) {

          if (typeof(resourceType) !== "string") {

            throw new HTTPError(400, "include query must be an array of strings.");

          }

          addResourceClass(resourceType);

        }

      }

    }

    const items = await Item.list(query ?? "", response.locals.pool, includedResources);
    
    response.json({
      totalItemCount: await Item.count(query ?? "", response.locals.pool),
      items
    });

  } catch (error) {

    if (error instanceof SlashstepQLInvalidKeyError || error instanceof SlashstepQLInvalidQueryError || error instanceof HTTPError) {

      response.status(400).json(error);

    } else {

      console.error(error);

      response.status(500).json({
        message: "Internal server error. Please try again later."
      });

    }

  }

});

export default getItemsRouter;