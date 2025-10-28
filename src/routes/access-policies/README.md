# REST API endpoints for access policies
## List access policies from all scopes
```
GET /access-policies
```

Returns a list of access policies.

### Headers
| Header name | Description | Required? |
| :- | :- | :- |
| `Content-Type` | Must be `application/json`. | Yes |
| `Authorization` | Must be a valid JWT token or blank. This may be required if unauthenticated users lack required permissions. | No |

### Query parameters
| Query | Description | Required? |
| :- | :- | :- |
| `query` | A SlashstepQL query to filter and limit results. | Yes |
| `limit` | The maximum number of results to return. | No |

### Required permissions
* [`slashstep.accessPolicies.list`](/src/resources/AccessPolicy/README.md#slashstepaccesspolicieslist) on the instance level.

## Get an access policy by ID
| Method | Endpoint |
| :- | :- |
| GET | `/access-policies/:accessPolicyID` |

### Headers
None.

### Query parameters
TBA.

### Required permissions
* [`slashstep.accessPolicies.get`](/src/resources/AccessPolicy/README.md#slashstepaccesspoliciesget) on the access policy level or inherited from a higher level.

## Update an access policy
| Method | Endpoint |
| :- | :- |
| PATCH | `/access-policies/:accessPolicyID` |

### Required permissions
* [`slashstep.accessPolicies.update`](/src/resources/AccessPolicy/README.md#slashstepaccesspoliciesupdate) on the access policy level or inherited from a higher level.

## Delete an access policy
| Method | Endpoint |
| :- | :- |
| DELETE | `/access-policies/:accessPolicyID` |

### Required permissions
* [`slashstep.accessPolicies.delete`](/src/resources/AccessPolicy/README.md#slashstepaccesspoliciesdelete) on the access policy level or inherited from a higher level.