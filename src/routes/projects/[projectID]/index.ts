import { Router } from "express";
import projectItemsRouter from "./items/index.js";

const projectRouter = Router({mergeParams: true});
projectRouter.use("/items", projectItemsRouter);

export default projectRouter;