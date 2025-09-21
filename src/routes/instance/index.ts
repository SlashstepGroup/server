import { Router } from "express";
import getInstanceRouter from "./get.js";

const instanceRouter = Router({mergeParams: true});
instanceRouter.use("/", getInstanceRouter);

export default instanceRouter;