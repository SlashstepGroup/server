import { NextFunction, Request, Response } from "express";
import User from "#resources/User/User.js";
import jsonwebtoken from "jsonwebtoken";
import ResourceNotFoundError from "#errors/ResourceNotFoundError.js";
import { ResponseLocals } from "#utilities/types.js";
import Role from "#resources/Role/Role.js";
import RoleMembership from "#resources/RoleMembership/RoleMembership.js";

async function storeAnonymousUser(request: Request, response: Response<unknown, ResponseLocals>, next: NextFunction) {

  try {

    if (!request.ip || response.locals.user || response.locals.app || response.locals.appAuthorization) {
      
      next();
      return;

    };

    let ipUser: User;

    try {

      ipUser = await User.getByIPAddress(request.ip, response.locals.server.pool);

    } catch (error) {

      if (error instanceof ResourceNotFoundError) {

        ipUser = await User.create({
          ipAddress: request.ip,
          displayName: request.ip,
          isAnonymous: true
        }, response.locals.server.pool);

      } else {

        throw error;

      }

    }

    // Make sure the user has the unauthenticated-users role.
    const unauthenticatedUsersRole = await Role.getByName("unauthenticated-users", response.locals.server.pool);
    const roleMemberships = await RoleMembership.list(`role_id = "${unauthenticatedUsersRole.id} and principal_user_id = "${ipUser.id}"`, response.locals.server.pool);
    if (!roleMemberships.find((roleMembership) => roleMembership.roleID === unauthenticatedUsersRole.id)) {

      await RoleMembership.create({
        roleID: unauthenticatedUsersRole.id,
        principalType: "User",
        principalUserID: ipUser.id
      }, response.locals.server.pool);

    }

    response.locals.user = ipUser;
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

export default storeAnonymousUser;