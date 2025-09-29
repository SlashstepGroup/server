import { Router } from "express";
import userSessionsRouter from "./sessions/index.js";
import getAuthenticatedUserRouter from "./get.js";

const userRouter = Router({mergeParams: true});
userRouter.use("/", getAuthenticatedUserRouter);
userRouter.use("/sessions", userSessionsRouter);  

export default userRouter;