import { Router } from "express";
import projectItemsRouter from "./items/index.js";
import deleteProjectRouter from "./delete.js";

const projectRouter = Router({mergeParams: true});
projectRouter.use("/", deleteProjectRouter);
projectRouter.use("/items", projectItemsRouter);

export default projectRouter;