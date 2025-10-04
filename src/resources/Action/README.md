# Actions
**Actions** are a type of act that either Slashstep Server or an app does. 

## Access policy priorities
1. **Action:** This is the action itself, so access policies set at this level are highest priority.
2. **App:** The app can own the action. This should be skipped if the action is an instance action.
3. **Project:** The project can own the app. This should be skipped if a project doesn't own the app or if the action is an instance action.
4. **Workspace:** The workspace can own the app or the project that owns the app. This should be skipped if the action is an instance action.
5. **Instance:** The instance owns the workspace or the project that owns the app.