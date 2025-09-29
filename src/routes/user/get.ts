import { Response, Router } from "express";
import authenticateUser from "#utilities/hooks/authenticateUser.js";
import User from "#resources/User/User.js";

const getAuthenticatedUserRouter = Router({mergeParams: true});
getAuthenticatedUserRouter.get("/", authenticateUser);
getAuthenticatedUserRouter.get("/", (_, response: Response<unknown, { authenticatedUser: User }>) => {

  response.json(response.locals.authenticatedUser);

});

export default getAuthenticatedUserRouter;