import { Router } from "express";
import createUserRouter from "./post.js";

const usersRouter = Router({mergeParams: true});
usersRouter.use("/", createUserRouter);

export default usersRouter;