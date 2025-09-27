import { Response, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import { DatabaseError, Pool } from "pg";
import User from "#resources/User/User.js";
import ActionLog from "#resources/ActionLog/ActionLog.js";
import Action from "#resources/Action/Action.js";
import AccessPolicy, { AccessPolicyPermissionLevel } from "#resources/AccessPolicy/AccessPolicy.js";
import PermissionDeniedError from "#errors/PermissionDeniedError.js";

const createUserRouter = Router({mergeParams: true})
createUserRouter.post("/", async (request, response: Response<unknown, { pool: Pool, authenticatedUser?: User }>) => {

  try {

    const { username, displayName } = request.body ?? {};
    if (!username || !displayName) {

      throw new HTTPError(400, "Username and display name must be provided.");
    
    }

    const verifyString = (value: any, name: string) => {

      if (value && typeof(value) !== "string") {

        throw new HTTPError(400, `${name} must be a string.`);
      
      }

    }

    verifyString(username, "Username");
    verifyString(displayName, "Display name");

    const { pool, authenticatedUser } = response.locals;

    // Make sure the user has permission to create an item in the project.
    const action = await Action.getByName("slashstep.users.register", pool);
    const deepestAccessPolicy = await AccessPolicy.getByDeepestScope(action.id, pool, {}, authenticatedUser?.id);

    if (deepestAccessPolicy.permissionLevel < AccessPolicyPermissionLevel.User) {

      throw new PermissionDeniedError();

    }

    try {

      // Create the user.
      const user = await User.create({
        username,
        displayName
      }, pool);

      // Log the action.
      await ActionLog.create({
        actionID: action.id,
        actorID: (authenticatedUser ?? user).id,
        actorIPAddress: request.ip,
        targetUserID: user.id
      }, pool);
      
      response.json(user);

    } catch (error) {

      if (error instanceof DatabaseError && error.code === "23505") {

        throw new HTTPError(409, "A user with this name already exists.");

      }

      throw error;

    }

  } catch (error) {

    if (error instanceof HTTPError) {

      response.status(error.getStatusCode()).json(error);

    } else {

      console.error(error);

      response.status(500).json({
        message: "Internal server error. Please try again later."
      });

    }

  }

});

export default createUserRouter;