# API Specification

This API uses JSON for all request and response bodies. Successful write operations return `201 Created` or `200 OK`. Error responses follow a standard format:

```json
{ "error": "Error message describing what went wrong" }
```

## 1. Authentication Endpoints

### POST /api/auth/register

Creates a new user account. On success, sets an `HttpOnly` JWT cookie.

- Request body:

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

- Responses:
  - `201 Created`: User registered successfully. Returns basic user info.

    ```json
    {
      "id": "d3b07384-d113-4956-a5bc-aa816c7f4eb5",
      "email": "user@example.com"
    }
    ```

  - `400 Bad Request`: Missing fields or weak password.
  - `409 Conflict`: Email already registered.

### POST /api/auth/login

Authenticates user credentials and sets the session JWT cookie.

- Request body: Same as register.
- Responses:
  - `200 OK`: Login successful. Returns user info.
  - `401 Unauthorized`: Invalid email or password.

## 2. Folder Endpoints

Because folders are hierarchical, we need routes to fetch the tree structure and modify directory placement.

### GET /api/folders

Fetches the user's entire folder hierarchy tree. The backend will assemble this flat database tree structure using our recursive query.

- Responses:
  - `200 OK`: Returns a nested JSON tree structure.

    ```json
    [
      {
        "id": "f1b07384-...",
        "name": "Work",
        "parentId": null,
        "children": [
          {
            "id": "f2b07384-...",
            "name": "React Project",
            "parentId": "f1b07384-...",
            "children": []
          }
        ]
      }
    ]
    ```

### POST /api/folders

Creates a new folder. Supports nesting by optionally accepting a `parentId`.

- Request body:

```json
{
  "name": "New Subfolder",
  "parentId": "f1b07384-..."
}
```

- Responses:
  - `201 Created`: Folder created. Returns the created folder object.
  - `400 Bad Request`: Missing folder name or parent directory does not exist.

### PATCH /api/folders/:id

Updates a folder (e.g., renaming it or moving it to another folder).

- Request body:

```json
{
  "name": "Updated Folder Name",
  "parentId": "different-parent-uuid"
}
```

- Responses:
  - `200 OK`: Update successful.
  - `404 Not Found`: Folder doesn't exist or doesn't belong to the user.

## 3. Note Endpoints

### GET /api/notes

Gets all active (non-deleted) notes for the authenticated user. Can optionally filter by `folderId`.

- Query parameters: `?folderId=uuid` (if omitted, returns root-level notes where `folder_id` is null).
- Responses:
  - `200 OK`: Returns a list of notes.

    ```json
    [
      {
        "id": "n1b07384-...",
        "title": "Weekly Standup",
        "content": "### Highlights\n- Finished the API specs.",
        "folderId": "f1b07384-...",
        "updatedAt": "2026-07-14T12:00:00Z"
      }
    ]
    ```

### POST /api/notes

Creates a new note. To support optimistic updates, the client can optionally generate and send its own UUID.

- Request body:

```json
{
  "id": "n1b07384-...",
  "title": "Untitled Note",
  "folderId": "f1b07384-..."
}
```

- Responses:
  - `201 Created`: Note successfully created.

### PUT /api/notes/:id

Replaces or updates a note's title, content, or folder placement (moving a note). We use `PUT` because note-taking apps save entire updated note bodies.

- Request body:

```json
{
  "title": "My New Title",
  "content": "This is paragraph text with [a link](https://google.com)",
  "folderId": "new-folder-uuid"
}
```

- Responses:
  - `200 OK`: Note updated successfully.
  - `403 Forbidden`: Trying to write to a note owned by another user.

### DELETE /api/notes/:id

Flags a note as deleted (`is_deleted = true`).

- Responses:
  - `200 OK`: Note soft-deleted.
