import { Router } from "express";
import listAccessPoliciesRouter from "./GET.js";
import accessPolicyRouter from "./[accessPolicyID]/index.js";

const accessPoliciesRouter = Router({mergeParams: true});
accessPoliciesRouter.get("/", listAccessPoliciesRouter);
accessPoliciesRouter.use("/:accessPolicyID", accessPolicyRouter);

export default accessPoliciesRouter;