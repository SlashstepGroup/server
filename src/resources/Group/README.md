# Group
**Groups** are a collection of [users](../User/README.md), apps, and other groups. Groups can be used to easily grant [roles](../Role/README.md) or specific [access policies](../AccessPolicy/README.md) to a set of users. If a group is given an access policy on a resource, all members of that group will inherit the group's access policies.

## Access
### Actions
#### slashstep.groups.create
The principal can create groups on a particular scope. This permission only has an effect on the [instance](../Instance/README.md)-level.

#### slashstep.groups.delete
The principal can delete groups on a particular scope.

#### slashstep.groups.get
The principal can view groups on a particular scope.

#### slashstep.groups.manage
The principal can manage the group metadata on a particular scope.

#### slashstep.groupMemberships.add
> [!NOTE]
> Not to be confused with [slashstep.groupMemberships.join](#slashstepgroupmembershipsjoin).

The principal can add members to groups on a particular scope. 

#### slashstep.groupMemberships.remove
> [!NOTE]
> Not to be confused with [slashstep.groupMemberships.leave](#slashstepgroupmembershipsleave).

The principal can remove members from groups on a particular scope.

#### slashstep.groupMemberships.join
The principal can join groups on a particular scope. This action should have no effect if the principal is already in the group in question.

#### slashstep.groupMemberships.leave
The principal can leave groups on a particular scope. This action should have no effect if the principal is not in the group in question.

### Possible parent resources
* [Instance](../Instance/README.md)