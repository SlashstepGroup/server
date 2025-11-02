import { Router } from "express";
import listActionsRouter from "./GET.js";
import actionRouter from "./[actionID]/index.js";

const actionsRouter = Router({mergeParams: true});
actionsRouter.get("/", listActionsRouter);
actionsRouter.use("/:actionID", actionRouter);

export default actionsRouter;