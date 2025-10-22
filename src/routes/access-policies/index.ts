import { Router } from "express";
import listAccessPoliciesRouter from "./get.js";

const accessPoliciesRouter = Router({mergeParams: true});
accessPoliciesRouter.get("/", listAccessPoliciesRouter);

export default accessPoliciesRouter;