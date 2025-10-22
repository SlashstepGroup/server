import HTTPError from "#errors/HTTPError.js";
import SlashstepQLInvalidKeyError from "#errors/SlashstepQLInvalidKeyError.js";
import SlashstepQLInvalidQueryError from "#errors/SlashstepQLInvalidQueryError.js";
import AccessPolicy from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js";
import App from "#resources/App/App.js";
import Group from "#resources/Group/Group.js";
import Item from "#resources/Item/Item.js";
import Milestone from "#resources/Milestone/Milestone.js";
import Project from "#resources/Project/Project.js";
import Role from "#resources/Role/Role.js";
import User from "#resources/User/User.js";
import Workspace from "#resources/Workspace/Workspace.js";
import HTTPInputValidator from "#utilities/HTTPInputValidator/HTTPInputValidator.js";
import { ResourceClassMap, ResponseLocals } from "#utilities/types.js";
import { Response, Router } from "express";

const listAccessPoliciesRouter = Router({mergeParams: true})
listAccessPoliciesRouter.get("/", async (request, response: Response<unknown, ResponseLocals>) => {

  try {
  
    const { query, include } = request.query;
    HTTPInputValidator.verifyString("query", query);

    const includedResources: ResourceClassMap = {};

    if (include) {

      const addResourceClass = (resourceType: string) => {

        const resourceClassMap: ResourceClassMap = {
          action: Action,
          "action.app": App,
          "action.app.workspace": Workspace,
          app: App,
          "app.workspace": Workspace,
          group: Group,
          "group.workspace": Workspace,
          item: Item,
          "item.project": Project,
          "item.project.workspace": Workspace,
          milestone: Milestone,
          "milestone.project": Project,
          "milestone.project.workspace": Workspace,
          "milestone.workspace": Workspace,
          project: Project,
          "project.workspace": Workspace,
          role: Role,
          "role.workspace": Workspace,
          "role.project": Project,
          "role.project.workspace": Workspace,
          user: User,
          workspace: Workspace,
        };

        const resourceClass = resourceClassMap[resourceType];
        if (!resourceClass) {

          throw new HTTPError(400, "include query must be \"project\", \"project.workspace\", or excluded.");

        }

        includedResources[resourceType] = resourceClass;

      }

      if (typeof(include) === "string") {

        addResourceClass(include);

      } else if (include instanceof Array) {

        for (const resourceType of include) {

          if (typeof(resourceType) !== "string") {

            throw new HTTPError(400, "include query must be an array of strings.");

          }

          addResourceClass(resourceType);

        }

      }

    }

    const { server } = response.locals;
    const items = await AccessPolicy.list(query ?? "", server.pool, includedResources);
    
    response.json({
      totalItemCount: await AccessPolicy.count(query ?? "", server.pool),
      items
    });

  } catch (error) {

    if (error instanceof SlashstepQLInvalidKeyError || error instanceof SlashstepQLInvalidQueryError) {

      response.status(400).json(error);

    } else if (error instanceof HTTPError) {

      response.status(error.getStatusCode()).json(error);

    } else {

      console.error(error);

      response.status(500).json({
        message: "Something bad happened on our side. Please try again later."
      });

    }

  }

});

export default listAccessPoliciesRouter;