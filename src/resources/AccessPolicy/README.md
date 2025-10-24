# Access policy
**Access policies** are definitions of what a principal can access, the type of access that they have, and how it is inherited to child resources. 

## Access
### Actions
#### slashstep.accessPolicies.admin
The principal can view and manage access policies on a particular scope, regardless of their permission level.

> [!CAUTION]
> This is a highly dangerous action that should only be used by trusted principals. This is a "break-glass" action, as it laughs in the face of any access policy on a specific scope.

> [!NOTE]
> Although users of this action can grant most permissions, users will not automatically be able to do everything. This action simply allows principals to grant or revoke any permission. Principals will need to grant themselves permission to do certain actions.

#### slashstep.accessPolicies.get
The principal can view any access policies on a particular scope.

#### slashstep.accessPolicies.list
The principal can list any access policies on a particular scope.

#### slashstep.accessPolicies.manage
The principal can manage access policies on a particular scope. The principal can only manage access policies that they have at least [editor access](#editor-access) to.

### Possible parent resources
* Action
* Action log
* App
* App authorization
* Field
* Group
* Instance
* Item
* Item connection type
* Milestone
* Project
* Session
* User
* Workspace

## Principals
### Principal types
#### Users
An access policy can apply to a specific user. 

#### Groups
An access policy can apply to all members of a specific group.

#### Roles
An access policy can apply to all users and groups that have a specific role.

#### Apps
An access policy can apply to an app, but it may be ignored if [the app impersonates a user and assumes the user's access policies](../App/README.md#impersonating-a-user).

### Principal priorities
1. **Users and apps:** Since a user or an app is specifically targeted, this should be the top priority.
2. **Groups:** Since a group is more specific than a role, but more broad than a user, this should be the middle priority. If there are multiple group access policies, the one with the highest access will take priority.
3. **Roles:** Since a role can be granted to both users and groups, this should be the lowest priority. If there multiple roles, the one with the highest access will take priority.

## Access levels
### No access
The principal cannot perform an action

### User access
The principal can perform an action.

### Editor access
The principal can perform an action, along with managing the permission level of other principals. 

> [!WARNING]
> Be careful when granting editor access.
> 
> An editor can potentially affect any editor, including themself. Admin permissions are protected, but an editor can possibly modify an admin's access levels on child resources, depending on the admin's inheritance level.

### Admin access
The principal can perform an action, along with managing the permission level of other principals, in addition to overriding the inheritance requirements on child resources.

> [!WARNING]
> Be careful when granting admin access.
> 
> An admin can potentially affect any admin, including themself. All admins have the same level of access and are not protected from another admin's actions.
> 
> If you manage the server that hosts the Slashstep Server instance, you may be able recover by creating an admin user account in setup mode.

## Inheritance
### Inheritance levels
#### Disabled
Child resources will not inherit this access policy.

#### Enabled
Child resources will inherit this access policy by default.

#### Required
Child resources will inherit this access policy and are required to have the selected permission level at minimum.

### Inheritance examples
#### Granting a user access to create projects on any workspace
An editor assigns the `slashstep.projects.create` action to User 1 [user access](#user-access) on the instance. The access policy has [required inheritance](#required). 

So, User 1 can create projects on *any* workspace in the instance. 

#### Granting a user access to create projects on any workspace, except a specific one
An admin assigns the `slashstep.projects.create` action to User 2 on the instance. User 2 has [user access](#user-access) with [required inheritance](#required). So, User 2 can create projects on *any* workspace in the instance.

...But, the admin doesn't want User 2 to create projects on Workspace A. Since User 2 has required inheritance, this seems impossible! Fortunately, the admin has [admin access](#admin-access) to the action, so they can modify the inheritance to any level they want. 

After assigning the `slashstep.projects.create` action on the instance level, the admin goes onto Workspace A and assigns the action to User 2; but this time, with [no access](#no-access). 

So, User 2 can create projects on any workspace except for Workspace A.

#### Granting a user access to create projects on a specific workspace
An admin assigns `slashstep.projects.create` to User 3 on Workspace B. User 3 has [user access](#user-access) with [disabled inheritance](#disabled). 

So, User 3 can create projects on Workspace B, but cannot create projects on any other workspace. This is because User 3 doesn't have instance-wide permissions and doesn't have any other workspace-wide access to the `slashstep.projects.create` action.

#### Granting a user access to create projects on any workspace by default
An admin assigns `slashstep.projects.create` to User 4 on the instance. User 3 has [user access](#user-access) with [enabled inheritance](#enabled). 

But, User 5 doesn't want User 4 to see what they're doing in Workspace C. Since User 5 has [editor access](#editor-access) to the `slashstep.projects.create` action on the workspace level, User 5 assigns the action to User 4 with [no access](#no-access).

So, User 4 can create projects on any workspace; but, anyone with workspace-level editor access to the action can disable that permission specifically for their workspace.

#### Granting a group access to view projects on any workspace, but disallowing a specific member of a group
An editor assigns `slashstep.projects.view` to Group 1 on the instance. Group 1 has [user access](#user-access) with [required inheritance](#required). So, any member of Group 1 can view projects on any workspace in the instance.

But, the editor wants to keep all projects on Workspace D a secret from Member 1. As such, the admin assigns the `slashstep.projects.view` action to Member 1 on Workspace D with [no access](#no-access). The editor only needs [editor access](#editor-access) because the [principal priorities](#principal-priorities) call for user access policies to take priority over group access policies.

So, any member of Group 1 can view projects on any workspace in the instance; except for Member 1, who cannot view Workspace D's projects.