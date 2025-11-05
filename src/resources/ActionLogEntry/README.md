# Action logs
**Action logs** are records that Slashstep Server creates when a principal performs an [action](../Action/README.md). 

Action logs cannot be modified through Slashstep Server. The only way logs can be modified are through the database itself.

## Access
### Actions
#### slashstep.actionLogs.create
The principal can create action logs.

> [!NOTE]
Only Slashstep Server and apps should use this action. Users should not use this action, as they are the performers of actions.

> [!NOTE]
> This permission should be granted at a higher level than the action log-level. You shouldn't be able to create logs *in* logs. That'd be weird.

#### slashstep.actionLogs.delete
The principal can delete action logs.

#### slashstep.actionLogs.get
The principal can get action logs.

#### slashstep.actionLogs.list
The principal can list action logs.

### Possible parent resources
* App
* Instance
* Project
* User
* Workspace