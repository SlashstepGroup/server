import { Router } from "express";
import createProjectRouter from "./post.js";

const workspaceProjectsRouter = Router({mergeParams: true});
workspaceProjectsRouter.use("/", createProjectRouter);

export default workspaceProjectsRouter;