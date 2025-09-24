import { Router } from "express";
import createWorkspaceRouter from "./post.js";
import workspaceRouter from "./[workspaceName]/index.js";

const workspacesRouter = Router({mergeParams: true});
workspacesRouter.use("/", createWorkspaceRouter);
workspacesRouter.use("/:workspaceName", workspaceRouter);

export default workspacesRouter;