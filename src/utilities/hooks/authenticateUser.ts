import { NextFunction, Request, Response } from "express";
import User from "#resources/User/User.js";
import jsonwebtoken from "jsonwebtoken";
import { readFileSync } from "fs";
import { Pool } from "pg";
import Session from "#resources/Session/Session.js";

async function authenticateUser(request: Request, response: Response<unknown, { pool: Pool, authenticatedUser?: User }>, next: NextFunction) {

  try {

    const { pool } = response.locals;
    const { token: cookieToken } = request.cookies;
    const { authorization } = request.headers;
    const token = cookieToken ?? authorization?.match(/^Bearer (\S+)$/)?.[1];

    if (token) {

      const payload = jsonwebtoken.decode(token);
      if (payload && typeof(payload) === "object" && payload.sub && payload.jti) {

        const sessionID = payload.jti;
        const session = await Session.get(sessionID, pool);

        const { APP_JWT_PUBLIC_KEY_PATH } = process.env;
        if (!APP_JWT_PUBLIC_KEY_PATH) {

          throw new Error("Authentication requires a public key path to be set.");
        
        }

        jsonwebtoken.verify(token, readFileSync(APP_JWT_PUBLIC_KEY_PATH));

        if (session) {

          // Save account data.
          const userID = payload.sub;
          const user = await User.getFromID(userID, pool);
          const userWithSession = new User(user, pool, session);
          response.locals.authenticatedUser = userWithSession;

          next();
          return;

        }
        
      }

    }

    response.status(401).json({
      message: "Provide a valid authentication token."
    });

  } catch (error: unknown) {

    if (error instanceof jsonwebtoken.JsonWebTokenError) {

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