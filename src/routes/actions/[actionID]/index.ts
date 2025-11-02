import { Router } from "express";
import deleteActionRouter from "./DELETE.js";
import getActionRouter from "./GET.js";
import patchActionRouter from "./PATCH.js";

const accessPolicyRouter = Router({mergeParams: true});
accessPolicyRouter.delete("/", deleteActionRouter);
accessPolicyRouter.get("/", getActionRouter);
accessPolicyRouter.patch("/", patchActionRouter);

export default accessPolicyRouter;