import { Router } from "express";
import createUserSessionRouter from "./post.js";

const userSessionsRouter = Router({mergeParams: true});
userSessionsRouter.use("/", createUserSessionRouter);

export default userSessionsRouter;