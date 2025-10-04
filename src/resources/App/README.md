# Apps
## Identity and access
### Impersonating a user
When apps are authorized on a user, the app assumes the identity of the user. For example, if a user wants to use a third-party client to create a project, the app associated with the client will likely impersonate the user. As long as the user has the permission to create projects, the app's request will succeed.

### Acting independently
When apps are authorized on other resources like a workspace or a project, apps assume their own identity. For example, if a project owner authorizes an app to automatically create a project item when someone raises an issue on their repository, the app will asusme its own identity and it will appear that the app created the issue by itself. As long as the app has the permission to create projects, the app's request will succeed.