import { Router } from "express";
import getItemsRouter from "./get.js";

const itemsRouter = Router({mergeParams: true});
itemsRouter.use("/", getItemsRouter);

export default itemsRouter;