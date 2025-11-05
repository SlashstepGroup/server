import { NextFunction, Request, Response } from "express";
import jsonwebtoken from "jsonwebtoken";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import { ResponseLocals } from "#utilities/types.js";
import App from "#resources/App/App.js";
import AppCredential from "#resources/AppCredential/AppCredential.js";
import AppAuthorizationCredential from "#resources/AppAuthorizationCredential/AppAuthorizationCredential.js";
import AppAuthorization from "#resources/AppAuthorization/AppAuthorization.js";
import BadRequestError from "#errors/BadRequestError.js";
import User from "#resources/User/User.js";
import Action from "#resources/Action/Action.js";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Role from "#resources/Role/Role.js";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";
import HTTPError from "#errors/HTTPError.js";
import Session from "#resources/Session/Session.js";
import ServerLogEntry, { ServerLogEntryLevel } from "#resources/ServerLogEntry/ServerLogEntry.js";
import UnauthenticatedError from "#errors/UnauthenticatedError.js";

export default class AuthenticationMiddleware {

  static async authenticateApp(request: Request, response: Response<unknown, ResponseLocals>, next: NextFunction) {

    try {
    
      const { server, httpRequest } = response.locals;
      const { authorization } = request.headers;
      
      const token = authorization?.match(/^App (\S+)$/)?.[1];

      if (token) {

        const payload = jsonwebtoken.decode(token);
        if (payload && typeof(payload) === "object" && payload.sub && payload.jti) {

          // Make sure the app token ID is still valid.
          await ServerLogEntry.create({
            message: "Authenticating as an app...",
            httpRequestID: httpRequest.id,
            level: ServerLogEntryLevel.Trace
          }, server.pool, true);

          const credentialID = payload.jti;
          await AppCredential.getByID(credentialID, server.pool);

          // Verify the app token.
          const jwtPublicKey = await server.getJWTPublicKey();

          jsonwebtoken.verify(token, jwtPublicKey, {
            algorithms: ["RS256"]
          });

          // 
          const appID = payload.sub;
          const app = await App.getByID(appID, server.pool);

          await ServerLogEntry.create({
            message: `Successfully authenticated as app ${app.id}.`,
            httpRequestID: httpRequest.id,
            level: ServerLogEntryLevel.Info
          }, server.pool, true);
          response.locals.app = app;
          
        }

      } else {

        await ServerLogEntry.create({
          message: "No app token found in request. Continuing...",
          httpRequestID: httpRequest.id,
          level: ServerLogEntryLevel.Info
        }, server.pool, true);

      }

      next();
      return;

    } catch (error: unknown) {

      if (error instanceof jsonwebtoken.JsonWebTokenError || error instanceof ResourceNotFoundError) {

        throw new UnauthenticatedError("Provide a valid authentication token.");

      }

      throw error;

    }

  }

  static async authenticateAppAuthorization(request: Request, response: Response<unknown, ResponseLocals>, next: NextFunction) {
  
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

  static async authenticateUser(request: Request, response: Response<unknown, ResponseLocals>, next: NextFunction) {

    try {
    
      const { server, httpRequest } = response.locals;
      const { sessionToken: cookieToken } = request.cookies ?? {};
      const token = cookieToken;

      if (cookieToken) {

        const payload = jsonwebtoken.decode(token);
        if (payload && typeof(payload) === "object" && payload.sub && payload.jti) {

          await ServerLogEntry.create({
            message: "Authenticating as a user...",
            httpRequestID: httpRequest.id,
            level: ServerLogEntryLevel.Trace
          }, server.pool, true);
          
          const sessionID = payload.jti;
          const session = await Session.get(sessionID, server.pool);

          const jwtPublicKey = await server.getJWTPublicKey();

          jsonwebtoken.verify(token, jwtPublicKey, {
            algorithms: ["RS256"]
          });

          if (session) {

            const userID = payload.sub;
            const user = await User.getByID(userID, server.pool);
            response.locals.user = user;
            response.locals.session = session;

            await ServerLogEntry.create({
              message: `Successfully authenticated as user ${user.id}.`,
              httpRequestID: httpRequest.id,
              level: ServerLogEntryLevel.Info
            }, server.pool, true);

          }
          
        }

      } else {

        await ServerLogEntry.create({
          message: "No user token found in request. Continuing...",
          httpRequestID: httpRequest.id,
          level: ServerLogEntryLevel.Info
        }, server.pool, true);

      }

      next();
      return;

    } catch (error: unknown) {

      if (error instanceof jsonwebtoken.JsonWebTokenError || error instanceof ResourceNotFoundError) {

        response.status(401).json({
          message: "Provide a valid session token."
        });

      }
      
      throw error;

    }

  }

  static async storeAnonymousUser(request: Request, response: Response<unknown, ResponseLocals>, next: NextFunction) {

    const { server, httpRequest } = response.locals;

    try {

      if (!request.ip || response.locals.user || response.locals.app || response.locals.appAuthorization) {
        
        await ServerLogEntry.create({
          message: `Requestor is already authenticated. Continuing...`,
          httpRequestID: httpRequest.id,
          level: ServerLogEntryLevel.Info
        }, server.pool, true);

        next();
        return;

      };

      let ipUser: User;

      try {

        await ServerLogEntry.create({
          message: "Checking for existing anonymous user...",
          httpRequestID: httpRequest.id,
          level: ServerLogEntryLevel.Trace
        }, server.pool, true);

        ipUser = await User.getByIPAddress(request.ip, response.locals.server.pool);

      } catch (error) {

        if (error instanceof ResourceNotFoundError) {

          await ServerLogEntry.create({
            message: "Creating anonymous user...",
            httpRequestID: httpRequest.id,
            level: ServerLogEntryLevel.Trace
          }, server.pool, true);

          ipUser = await User.create({
            ipAddress: request.ip,
            isAnonymous: true
          }, response.locals.server.pool);

        } else {

          throw error;

        }

      }

      // Make sure the user has the anonymous-users role.
      const anonymousUsersRole = await Role.getByName("anonymous-users", response.locals.server.pool);
      const roleMemberships = await RoleMembership.list(`roleID = "${anonymousUsersRole.id}" and principalUserID = "${ipUser.id}"`, response.locals.server.pool);
      if (!roleMemberships.find((roleMembership) => roleMembership.roleID === anonymousUsersRole.id)) {

        await ServerLogEntry.create({
          message: "Adding anonymous user to anonymous-users role...",
          httpRequestID: httpRequest.id,
          level: ServerLogEntryLevel.Trace
        }, server.pool, true);

        await RoleMembership.create({
          roleID: anonymousUsersRole.id,
          principalType: "User",
          principalUserID: ipUser.id
        }, response.locals.server.pool);

      }

      response.locals.user = ipUser;
      await ServerLogEntry.create({
        message: `Authenticated as anonymous user ${ipUser.id}.`,
        httpRequestID: httpRequest.id,
        level: ServerLogEntryLevel.Info
      }, server.pool, true);

      next();
      return;

    } catch (error: unknown) {

      if (error instanceof jsonwebtoken.JsonWebTokenError || error instanceof ResourceNotFoundError) {

        response.status(401).json({
          message: "Provide a valid session token."
        });

      } else {

        console.error(error);

        response.status(500).json({
          message: "Something bad happened on our side. Try again later."
        });

      }

    }

  }

}
