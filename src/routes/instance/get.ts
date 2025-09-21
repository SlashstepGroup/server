import Instance from "#resources/Instance/Instance.js";
import { Router } from "express";

const getInstanceRouter = Router({mergeParams: true});

getInstanceRouter.get("/", (request, response) => {

  const instance = new Instance({
    displayName: "Beastslash",
    creationTime: new Date(),
    updateTime: new Date()
  });

  response.json(instance);

});

export default getInstanceRouter;