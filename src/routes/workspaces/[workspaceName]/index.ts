import { Router } from "express";
import workspaceProjectsRouter from "./projects/index.js";
import getWorkspaceRouter from "./get.js";
import deleteWorkspaceRouter from "./delete.js";

const workspaceRouter = Router({mergeParams: true});
workspaceRouter.use("/", getWorkspaceRouter);
workspaceRouter.use("/", deleteWorkspaceRouter);
workspaceRouter.use("/projects", workspaceProjectsRouter);

export default workspaceRouter;