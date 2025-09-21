import { Router } from "express";

const getItemsRouter = Router({mergeParams: true})
getItemsRouter.get("/", (request, response) => {

  response.json({
    totalItemCount: 0,
    items: []
  });

});

export default getItemsRouter;