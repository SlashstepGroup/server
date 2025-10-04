# Actions
**Actions** are a type of act that either Slashstep Server or an app does. 

## Priority
1. **Action:** This is the action itself, so access policies set at this level are highest priority.
2. **App:** The app owns the action.
3. **Project:** The project can own the app. This should be skipped if a project doesn't own the app.
4. **Workspace:** The workspace either owns the app or the project.
5. **Instance:** The instance owns the workspace or the project that owns the app.