import { Router } from "express";
import deleteAccessPolicyRouter from "./DELETE/index.js";
import getAccessPolicyRouter from "./GET/index.js";
import updateAccessPolicyRouter from "./PATCH/index.js";

const accessPolicyRouter = Router({mergeParams: true});
accessPolicyRouter.delete("/", deleteAccessPolicyRouter);
accessPolicyRouter.get("/", getAccessPolicyRouter);
accessPolicyRouter.patch("/", updateAccessPolicyRouter);

export default accessPolicyRouter;