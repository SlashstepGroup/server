import { Router } from "express";
import deleteAccessPolicyRouter from "./DELETE.js";
import getAccessPolicyRouter from "./GET.js";
import updateAccessPolicyRouter from "./PATCH.js";

const accessPolicyRouter = Router({mergeParams: true});
accessPolicyRouter.delete("/", deleteAccessPolicyRouter);
accessPolicyRouter.get("/", getAccessPolicyRouter);
accessPolicyRouter.patch("/", updateAccessPolicyRouter);

export default accessPolicyRouter;