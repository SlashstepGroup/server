# Roles
**Roles** are a collection of [actions](../Action/README.md). They serve as a helpful alternative to directly modifying access policies per principal. Roles can be granted to any type of principal, except for roles.

Due to the broad nature of roles, [they have the lowest priority](../AccessPolicy/README.md#principal-priorities) when compared to directly modifying access of groups or users. 

## Types of roles
### Pre-defined roles
> [!TIP]
> Each resource has its own set of pre-defined roles. Check out the "Pre-defined roles" sections to see them.

Pre-defined roles are roles managed by the instance. They should only be modified by Slashstep Server. These roles bring consistency across instances, and can give users an easy experience when updating Slashstep Server.

Pre-defined roles are created on the instance-level.

### Custom roles
If pre-defined roles aren't enough, custom roles can be created. 

Unlike pre-defined roles, custom roles can be created on [multiple levels](#possible-parent-resources).

## Inheritance
Role inheritance is defined on a per-principal basis. 

## Access
### Permissions
#### `slashstep.roles.create`
The principal can create custom roles. 

This permission should be granted on the level of the [parent resource](#possible-parent-resources), as it has no effect on the role-level.

#### `slashstep.roles.get`
The principal can get a role.

#### `slashstep.roles.delete`
The principal can delete a role.

#### `slashstep.roles.update`
The principal can update a role.

> [!TIP]
> Roles lack a global list of permissions, as permissions can vary across resources. 
> 
> If you want to modify a role's permissions on a resource, you'll need to change the resource's [access policies](../AccessPolicy/README.md). This gives you granular control over permissions and inheritance.   

### Pre-defined roles
#### Role admins
Principals with full control over roles.

| Permission name | Permission level |
| :- | :- |
| [`slashstep.roles.create`](#slashsteprolescreate) | Admin |
| [`slashstep.roles.get`](#slashsteprolescreate) | Admin |
| [`slashstep.roles.update`](#slashsteprolescreate) | Admin |

#### Role editors
Principals with editor access over roles.

| Permission name | Permission level |
| :- | :- |
| [`slashstep.roles.create`](#slashsteprolescreate) | Editor |
| [`slashstep.roles.get`](#slashsteprolescreate) | Editor |
| [`slashstep.roles.update`](#slashsteprolescreate) | Editor |

#### Role users
Principals with user access over roles.

| Permission name | Permission level |
| :- | :- |
| [`slashstep.roles.create`](#slashsteprolescreate) | User |
| [`slashstep.roles.get`](#slashsteprolescreate) | User |
| [`slashstep.roles.update`](#slashsteprolescreate) | User |

#### Read-only role users
Principals with read-only user access over roles.

| Permission name | Permission level |
| :- | :- |
| [`slashstep.roles.get`](#slashsteprolescreate) | User |

### Possible parent resources
The parent of [pre-defined roles](#pre-defined-roles) can only be the instance. [Custom roles](#custom-roles) can have the following parent types: 

* [Group](../Group/README.md)
* [Instance](../Instance/README.md)
* [Project](../Project/README.md)
* [Workspace](../Workspace/README.md)