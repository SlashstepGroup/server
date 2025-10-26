import AccessPolicy, { AccessPolicyPermissionLevel } from "#resources/AccessPolicy/AccessPolicy.js";
import Action from "#resources/Action/Action.js"

export type PrincipalResourceClassMap = {
  Action: typeof Action;
  AccessPolicy: typeof AccessPolicy;
}

export default interface Principal {

  /** 
   * Determines whether the principal can perform the specified action.
   * @param resourceClasses The resource classes that the action can be performed on.
   * @param actionID The action ID.
   * @param minimumPermissionLevel The minimum permission level required to perform the action.
   * @returns A boolean indicating whether the principal can perform the action.
   */
  checkPermissions(resourceClasses: PrincipalResourceClassMap, actionID: string, minimumPermissionLevel: AccessPolicyPermissionLevel): Promise<boolean>;

  /**
   * Verifies that the principal can perform the specified action.
   * @param resourceClasses The resource classes that the action can be performed on.
   * @param actionID The action ID.
   * @param minimumPermissionLevel The minimum permission level required to perform the action.
   */
  verifyPermissions(resourceClasses: PrincipalResourceClassMap, actionID: string, minimumPermissionLevel: AccessPolicyPermissionLevel): Promise<void>;

}