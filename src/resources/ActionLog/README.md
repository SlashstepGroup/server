## Access
### Inheritance
1. **Action log:** This is the log itself, so access policies set at this level are highest priority.
2. **App:** The app can owns the action. This should be skipped if the action is an instance action.
3. **Project:** The project can own the app. This should be skipped if a project doesn't own the app or if the action is an instance action.
4. **Workspace:** The workspace either owns the app or the project. This should be skipped if the action is an instance action.
5. **Instance:** The instance owns the workspace or the project that owns the app.