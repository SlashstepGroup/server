import type { default as AccessPolicy, AccessPolicyPermissionLevel, AccessPolicyScopeData } from "#resources/AccessPolicy/AccessPolicy.js";
import type { default as Action } from "#resources/Action/Action.js";
import type { default as Role } from "#resources/Role/Role.js";
import type { default as RoleMembership } from "#resources/RoleMembership/RoleMembership.js";

export type PrincipalResourceClassMap = {
  Action: typeof Action;
  AccessPolicy: typeof AccessPolicy;
  Role: typeof Role;
  RoleMembership: typeof RoleMembership;
}

export default interface Principal {

  /** 
   * Determines whether the principal can perform the specified action.
   * @param resourceClasses The resource classes that the action can be performed on.
   * @param actionID The action ID.
   * @param minimumPermissionLevel The minimum permission level required to perform the action.
   * @returns A boolean indicating whether the principal can perform the action.
   */
  checkPermissions(resourceClasses: PrincipalResourceClassMap, actionID: string, scope: AccessPolicyScopeData, minimumPermissionLevel: AccessPolicyPermissionLevel): Promise<boolean>;

  /**
   * Verifies that the principal can perform the specified action.
   * @param resourceClasses The resource classes that the action can be performed on.
   * @param actionID The action ID.
   * @param minimumPermissionLevel The minimum permission level required to perform the action.
   */
  verifyPermissions(resourceClasses: PrincipalResourceClassMap, actionID: string, scope: AccessPolicyScopeData, minimumPermissionLevel: AccessPolicyPermissionLevel): Promise<void>;

}