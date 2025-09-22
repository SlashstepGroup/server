import Item from "#resources/Item/Item.js";
import { Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import SlashstepQLInvalidKeyError from "#errors/SlashstepQLInvalidKeyError.js";
import SlashstepQLInvalidQueryError from "#errors/SlashstepQLInvalidQueryError.js";

const getItemsRouter = Router({mergeParams: true})
getItemsRouter.get("/", async (request, response) => {

  try {

    const { query } = request.query;
    if (query && typeof(query) !== "string") {

      throw new HTTPError(400, "Invalid query.");
    
    }

    const items = await Item.list(query ?? "", response.locals.pool);
    
    response.json({
      totalItemCount: await Item.count(query ?? "", response.locals.pool),
      items
    });

  } catch (error) {

    if (error instanceof SlashstepQLInvalidKeyError || error instanceof SlashstepQLInvalidQueryError) {

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