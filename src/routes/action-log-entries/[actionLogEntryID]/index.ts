import { Router } from "express";
import getActionLogEntryRouter from "./GET.js";

const actionLogEntryRouter = Router({mergeParams: true});
actionLogEntryRouter.get("/", getActionLogEntryRouter);

export default actionLogEntryRouter;