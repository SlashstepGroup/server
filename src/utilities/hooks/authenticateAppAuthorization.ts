import { NextFunction, Request, Response } from "express";
import jsonwebtoken from "jsonwebtoken";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import { ResponseLocals } from "#utilities/types.js";
import App from "#resources/App/App.js";
import AppAuthorizationCredential from "#resources/AppAuthorizationCredential/AppAuthorizationCredential.js";
import AppAuthorization from "#resources/AppAuthorization/AppAuthorization.js";
import Action from "#resources/Action/Action.js";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import User from "#resources/User/User.js";
import Role from "#resources/Role/Role.js";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";
import BadRequestError from "#errors/BadRequestError.js";
import HTTPError from "#errors/HTTPError.js";

async function authenticateAppAuthorization(request: Request, response: Response<unknown, ResponseLocals>, next: NextFunction) {

  try {
  
    const { server } = response.locals;
    const { authorization, ["impersonated-user-id"]: impersonatedUserID } = request.headers;
    const token = authorization?.match(/^App (\S+)$/)?.[1];

    if (token) {

      const payload = jsonwebtoken.decode(token);
      if (payload && typeof(payload) === "object" && payload.sub && payload.jti) {

        // Make sure the app token ID is still valid.
        const credentialID = payload.jti;
        await AppAuthorizationCredential.getByID(credentialID, server.pool);

        // Verify the app token.
        const jwtPublicKey = await server.getJWTPublicKey();

        jsonwebtoken.verify(token, jwtPublicKey, {
          algorithms: ["RS256"]
        });

        // 
        const appAuthorizationID = payload.sub;
        const appAuthorization = await AppAuthorization.getByID(appAuthorizationID, server.pool);
        const app = await App.getByID(appAuthorization.appID, server.pool);
        appAuthorization.app = app;
        response.locals.appAuthorization = appAuthorization;
        
        if (impersonatedUserID) {

          if (typeof(impersonatedUserID) !== "string") {

            throw new BadRequestError("Impersonated user ID must be a string.");

          }

          // Verify the app can impersonate the user.
          const user = await User.getByID(impersonatedUserID, server.pool);
          const impersonationAction = await Action.getByName("slashstep.users.impersonate", server.pool);
          const userScopeData = user.getScopeData();
          await app.verifyPermissions({Role, RoleMembership, Action, AccessPolicy}, impersonationAction.id, userScopeData);
          response.locals.user = user;


        }
        
      }

    }

    next();
    return;

  } catch (error: unknown) {

    if (error instanceof jsonwebtoken.JsonWebTokenError || error instanceof ResourceNotFoundError) {

      response.status(401).json({
        message: "Provide a valid authentication token."
      });

    } else if (error instanceof HTTPError) {
      
      response.status(error.getStatusCode()).json(error);

    } else {

      console.error(error);

      response.status(500).json({
        message: "Something bad happened on our side. Try again later."
      });

    }

  }

}

export default authenticateAppAuthorization;