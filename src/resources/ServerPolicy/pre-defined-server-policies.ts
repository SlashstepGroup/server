import type { InitialServerPolicyProperties } from "./ServerPolicy.js";

const preDefinedServerPolicies: InitialServerPolicyProperties[] = [
  {
    name: "app-authorization-credential-access-token-expiration-milliseconds",
    displayName: "App Authorization Credential Access Token Expiration Milliseconds",
    valueType: "Number",
    defaultNumberValue: 3600000 // 1 hour. Access tokens should be short-lived.
  },
  {
    name: "app-authorization-credential-refresh-token-expiration-milliseconds",
    displayName: "App Authorization Credential Refresh Token Expiration Milliseconds",
    valueType: "Number",
    defaultNumberValue: 86400000 // 30 days. Refresh tokens should last longer than access tokens.
  }
]

export default preDefinedServerPolicies;