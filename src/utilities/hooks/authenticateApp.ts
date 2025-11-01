import { NextFunction, Request, Response } from "express";
import jsonwebtoken from "jsonwebtoken";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import { ResponseLocals } from "#utilities/types.js";
import App from "#resources/App/App.js";
import AppCredential from "#resources/AppCredential/AppCredential.js";

async function authenticateApp(request: Request, response: Response<unknown, ResponseLocals>, next: NextFunction) {

  try {
  
    const { server } = response.locals;
    const { authorization } = request.headers;
    const token = authorization?.match(/^App (\S+)$/)?.[1];

    if (token) {

      const payload = jsonwebtoken.decode(token);
      if (payload && typeof(payload) === "object" && payload.sub && payload.jti) {

        // Make sure the app token ID is still valid.
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
        response.locals.authenticatedApp = app;
        
      }

    }

    if (!response.locals.areUnauthenticatedRequestsAllowed && !response.locals.authenticatedApp) {

      response.status(401).json({
        message: "Provide a valid authentication token."
      });

      return;

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

export default authenticateApp;