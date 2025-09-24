import { Router } from "express";
import createWorkspaceRouter from "./post.js";

const workspacesRouter = Router({mergeParams: true});
workspacesRouter.use("/", createWorkspaceRouter);

export default workspacesRouter;