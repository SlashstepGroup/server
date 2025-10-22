import { Response, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import { DatabaseError, Pool } from "pg";
import User from "#resources/User/User.js";
import ActionLog from "#resources/ActionLog/ActionLog.js";
import Action from "#resources/Action/Action.js";
import AccessPolicy, { AccessPolicyPermissionLevel } from "#resources/AccessPolicy/AccessPolicy.js";
import PermissionDeniedError from "#errors/PermissionDeniedError.js";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import { hash as hashPassword } from "argon2";
import Server from "#utilities/Server/Server.js";

const createUserRouter = Router({mergeParams: true})
createUserRouter.post("/", async (request, response: Response<unknown, { server: Server, authenticatedUser?: User }>) => {

  try {

    const { username, displayName, password } = request.body ?? {};
    if (!username || !displayName || !password) {

      throw new HTTPError(400, "Username, display name, and password must be provided.");
    
    }

    const verifyString = (value: any, name: string) => {

      if (value && typeof(value) !== "string") {

        throw new HTTPError(400, `${name} must be a string.`);
      
      }

    }

    verifyString(username, "Username");
    verifyString(displayName, "Display name");
    verifyString(password, "Password");

    // Make sure the password is strong enough.
    if (password.length < 8) {

      throw new HTTPError(400, "Password must be at least 8 characters long.");

    }

    if (password.length > 128) {

      throw new HTTPError(400, "Password must be at most 128 characters long.");

    }

    const { server, authenticatedUser } = response.locals;

    // Make sure the user has permission to create an item in the project.
    let action: Action;
    
    try {

      action = await Action.getByName("slashstep.users.register", server.pool);

    } catch (error) {

      if (error instanceof ResourceNotFoundError) {

        throw new Error("The slashstep.users.register action does not exist. You may need to set up the default actions again.");

      }

      throw error;

    }

    try {

      // Get the deepest access policy for the user.
      const deepestAccessPolicy = await AccessPolicy.getByDeepestScope(action.id, server.pool, authenticatedUser?.id);

      if (deepestAccessPolicy.permissionLevel < AccessPolicyPermissionLevel.User) {

        throw new PermissionDeniedError();

      }

    } catch (error) {

      if (error instanceof ResourceNotFoundError) {

        throw new PermissionDeniedError();

      }

      throw error;

    }

    try {

      // Create the user.
      const hashedPassword = await hashPassword(password);

      const user = await User.create({
        username,
        displayName,
        hashedPassword
      }, server.pool);

      // Log the action.
      await ActionLog.create({
        actionID: action.id,
        actorID: (authenticatedUser ?? user).id,
        actorIPAddress: request.ip,
        targetUserID: user.id
      }, server.pool);
      
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
        message: "Something bad happened on our side. Please try again later."
      });

    }

  }

});

export default createUserRouter;