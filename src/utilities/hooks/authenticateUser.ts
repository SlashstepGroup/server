import { NextFunction, Request, Response } from "express";
import User from "#resources/User/User.js";
import jsonwebtoken from "jsonwebtoken";
import { readFileSync } from "fs";
import Session from "#resources/Session/Session.js";
import Server from "#utilities/Server/Server.js";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";

async function authenticateUser(request: Request, response: Response<unknown, { server: Server, authenticatedUser?: User, areUnauthenticatedRequestsAllowed?: boolean }>, next: NextFunction) {

  try {
  
    const { server } = response.locals;
    const { sessionToken: cookieToken } = request.cookies ?? {};
    const { authorization } = request.headers;
    const token = cookieToken ?? authorization?.match(/^Bearer (\S+)$/)?.[1];

    if (token) {

      const payload = jsonwebtoken.decode(token);
      if (payload && typeof(payload) === "object" && payload.sub && payload.jti) {

        const sessionID = payload.jti;
        const session = await Session.get(sessionID, server.pool);

        const jwtPublicKey = await server.getJWTPublicKey();

        jsonwebtoken.verify(token, jwtPublicKey, {
          algorithms: ["RS256"]
        });

        if (session) {

          // Save account data.
          const userID = payload.sub;
          const user = await User.getFromID(userID, server.pool);
          const userWithSession = new User({
            ...user,
            hashedPassword: user.getHashedPassword()
          }, server.pool, session);
          response.locals.authenticatedUser = userWithSession;

        }
        
      }

    }

    if (!response.locals.areUnauthenticatedRequestsAllowed && !response.locals.authenticatedUser) {

      response.status(401).json({
        message: "Provide a valid authentication token."
      });

    }

    next();
    return;

  } catch (error: unknown) {

    if (error instanceof jsonwebtoken.JsonWebTokenError || error instanceof ResourceNotFoundError) {

      response.status(401).json({
        message: "Provide a valid authentication token."
      });

    } else {

      console.error(error);

      response.status(500).json({
        message: "Something bad happened on our side. Try again later."
      });

    }

  }

}

export default authenticateUser;