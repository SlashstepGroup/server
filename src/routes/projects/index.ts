import { Router } from "express";
import projectRouter from "./[projectID]/index.js";

const projectsRouter = Router({mergeParams: true});
projectsRouter.use("/:projectID", projectRouter);

export default projectsRouter;