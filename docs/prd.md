# **Product Requirements Document (PRD): SnapPad**

## **1. Project Overview & Objective**

An intuitive, web-based note-taking application designed for organized, rich-text documentation. The app's core differentiator is its infinite hierarchical folder system, allowing users to deeply categorize their thoughts.

## **2. User Stories**

### **Core Notes (CRUD)**

- **US-1.1 (Create):** As a user, I want to create a new note with an optional title, so I can quickly write down thoughts without being forced to name them.
- **US-1.2 (Read):** As a user, I want to view a list of all my notes and click one to read its full content.
- **US-1.3 (Update):** As a user, I want to edit existing notes, with changes auto-saving seamlessly in the background.
- **US-1.4 (Delete):** As a user, I want to delete a note, moving it temporarily to a trash state or permanently deleting it.

### **Organization (Hierarchical Folders)**

- **US-2.1 (Create Folders):** As a user, I want to create folders to organize my notes.
- **US-2.2 (Nested Folders):** As a user, I want to nest folders inside other folders infinitely, so I can build a highly structured hierarchy.
- **US-2.3 (File Placement):** As a user, I want to assign notes to specific folders or leave them "unorganized" in a root directory.

### **Formatting & Rich Text**

- **US-3.1 (Paragraph Formatting):** As a user, I want to press `Enter` to create paragraph-style line breaks that render correctly.
- **US-3.2 (Rich Links):** As a user, I want to add hyperlinks to my notes that become clickable to easily navigate to external resources.

## **3. Scope Boundaries (Crucial for Solo Sprints)**

To make sure you actually finish this project and don't get bogged down in infinite development, we need to draw strict lines.

### **In-Scope (MVP Features)**

- **Local User Authentication:** Basic email/password signup and login.
- **Markdown Support:** Using Markdown is the most elegant way to solve the "line break and clickable link" requirements. The frontend will parse Markdown syntax (e.g., `[Link](url)`) into HTML.
- **Soft Deletion:** Notes have an `isDeleted` flag (acting as a simple "Trash" bin) so users don't accidentally lose data.

### **Out-of-Scope (Save for Version 2.0)**

- _Collaborative editing_ (No operational transformation or CRDTs for real-time multiplayer).
- _File & Image uploads_ (Notes will be strictly text/markdown; no S3 integration for attachments).
- _Tagging/Label system_ (Categorization is strictly folder-based for now).
- _Offline sync_ (App requires an active internet connection to read/write).

## **4. Non-Functional Requirements (NFRs)**

- **UI Snappiness (Optimistic Updates):** \* _Requirement:_ Creating a note, renaming a folder, or toggling a note's state must reflect in the UI immediately (&lt;50ms), without waiting for the database write confirmation over the network.
  - _Constraint:_ If the network request fails, the application must gracefully rollback the UI state to its previous valid state and display a non-intrusive toast notification (e.g., _"Failed to save note. Reverting changes..."_).
- **Security & Multi-Tenancy:**
  - _Constraint:_ Strict data isolation. Every database query containing a `note_id` or `folder_id` must verify that the requesting `user_id` is the actual owner.
- **Data Integrity (Deletion Strategy):**
  - _Requirement:_ To keep the scope tight and prevent data loss accidents, we will use **Soft Deletion** (`is_deleted: true`).
  - _Behavior:_ Deleting a parent folder soft-deletes the folder itself and recursively hides its nested subfolders and notes from the main UI. However, they remain in the database for easy recovery.
