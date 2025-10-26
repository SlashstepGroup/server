import { Response, Router } from "express";
import HTTPError from "#errors/HTTPError.js";
import { DatabaseError, Pool } from "pg";
import User from "#resources/User/User.js";
import ActionLog from "#resources/ActionLog/ActionLog.js";
import Action from "#resources/Action/Action.js";
import AccessPolicy, { AccessPolicyPermissionLevel, AccessPolicyPrincipalType } from "#resources/AccessPolicy/AccessPolicy.js";
import PermissionDeniedError from "#errors/PermissionDeniedError.js";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import { verify as verifyPassword } from "argon2";
import Server from "#utilities/Server/Server.js";
import Session from "#resources/Session/Session.js";
import jsonwebtoken from "jsonwebtoken";
import { readFileSync } from "fs";

const createUserSessionRouter = Router({mergeParams: true})
createUserSessionRouter.post("/", async (request, response: Response<unknown, { server: Server }>) => {

  try {

    if (!request.ip) {

      throw new HTTPError(400, "IP address is required.");

    }

    const { username, password } = request.body ?? {};
    if (!username || !password) {

      throw new HTTPError(400, "Username and password must be provided.");
    
    }

    const verifyString = (value: any, name: string) => {

      if (value && typeof(value) !== "string") {

        throw new HTTPError(400, `${name} must be a string.`);
      
      }

    }

    verifyString(username, "Username");
    verifyString(password, "Password");

    // Make sure the password is strong enough.
    const { server } = response.locals;

    // Make sure the user exists.
    let user: User;
    try {

      user = await User.getFromUsername(username, server.pool);
      if (!(await verifyPassword(user.getHashedPassword(), password))) {

        throw new HTTPError(401, "Incorrect username or password.");

      }

    } catch (error) {

      // If the user doesn't exist, don't give the client a hint that the username is incorrect.
      if (error instanceof ResourceNotFoundError) {

        throw new HTTPError(401, "Incorrect username or password.");

      }

      throw error;

    }

    // Make sure the user has permission to create an item in the project.
    let action: Action;
    
    try {

      action = await Action.getByName("slashstep.sessions.create", server.pool);

    } catch (error) {

      if (error instanceof ResourceNotFoundError) {

        throw new Error("The slashstep.sessions.create action does not exist. You may need to set up the default actions again.");

      }

      throw error;

    }

    try {

      // Get the deepest access policy for the user.
      const deepestAccessPolicy = await AccessPolicy.getByDeepestScope(action.id, server.pool, {
        principalType: AccessPolicyPrincipalType.User,
        principalUserID: user.id
      });

      if (deepestAccessPolicy.permissionLevel !== AccessPolicyPermissionLevel.User && deepestAccessPolicy.permissionLevel !== AccessPolicyPermissionLevel.Admin) {

        throw new PermissionDeniedError("You're not allowed to sign into this account. Contact your administrator for more information.");

      }

    } catch (error) {

      if (error instanceof ResourceNotFoundError) {

        throw new PermissionDeniedError("You're not allowed to sign into this account. Contact your administrator for more information.");

      }

      throw error;

    }

    try {

      // Create the session.
      const { APP_JWT_PRIVATE_KEY_PATH } = process.env;
      if (!APP_JWT_PRIVATE_KEY_PATH) {

        throw new Error("APP_JWT_PRIVATE_KEY_PATH must be defined.");

      }

      const session = await Session.create({
        userID: user.id,
        expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        creationIP: request.ip
      }, server.pool);

      const token = Session.generateJSONWebToken({
        userID: user.id,
        sessionID: session.id
      }, `${readFileSync(APP_JWT_PRIVATE_KEY_PATH)}`);

      response.cookie("sessionToken", token, {
        sameSite: "strict",
        httpOnly: true,
        secure: true,
        maxAge: 3600 * 1000
      });

      // Log the action.
      await ActionLog.create({
        actionID: action.id,
        actorID: user.id,
        actorIPAddress: request.ip,
        targetUserID: user.id
      }, server.pool);
      
      response.json({});

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

export default createUserSessionRouter;