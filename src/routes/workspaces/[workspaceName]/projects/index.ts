import { Router } from "express";
import createProjectRouter from "./post.js";

const workspaceProjectsRouter = Router({mergeParams: true});
workspaceProjectsRouter.post("/", createProjectRouter);

export default workspaceProjectsRouter;