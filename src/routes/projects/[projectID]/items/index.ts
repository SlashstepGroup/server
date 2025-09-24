import { Router } from "express";
import createProjectItemRouter from "./post.js";

const projectItemsRouter = Router({mergeParams: true});
projectItemsRouter.use("/", createProjectItemRouter);

export default projectItemsRouter;