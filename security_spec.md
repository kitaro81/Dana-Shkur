# Firebase Security Specification

## 1. Data Invariants
- **User Authentication**: All database writes (create, update, delete) must be performed by authenticated users.
- **Project Boundary**: A user must be a member of the workspace or project to view or modify associated tasks, stages, labels, comments, and messages.
- **Immutability of Key Fields**: Once created, certain attributes (e.g., `id`, `createdAt`, `projectId`) must remain immutable.
- **Data Validation & Type Safety**: Each field must strictly match its primitive type, length restrictions, and defined enums.

## 2. The "Dirty Dozen" Malicious Payloads
Here are 12 specific payloads designed to breach integrity, bypassed by the upcoming Zero-Trust Firestore rules:

1. **Self-Elevated Privilege**: Unauthenticated user trying to write or modify user records.
2. **Ghost Admin Promotion**: Standard user setting their own `role` to `admin` in the user document.
3. **Ghost Project Intrusion**: Standard user assigning themselves to a project they shouldn't access.
4. **Task Orphanage**: Creating a task with a non-existent or invalid `projectId`.
5. **Timestamp Hijacking**: Injecting a historic or future client-side timestamp into `createdAt` instead of using the server's `request.time`.
6. **Task ID Poisoning**: Attempting to use a 1MB junk string as the Task ID to exhaust Firestore resources.
7. **Cross-Project Sneak**: Updating a task to change its `projectId` to a different project.
8. **Malicious Comment Spoofing**: Attempting to post a comment under another user's UID or name.
9. **Spam Payload Flooding**: Inserting extremely long strings into simple fields like task `title` (e.g., 2MB title string).
10. **Bypassing Terminal Lock**: Modifying details of a task after it has been marked as `completed` or terminal.
11. **Malicious Channel Creation**: standard user creating custom channels bypassing system boundaries.
12. **Blind Query Scrape**: Standard user performing a blanket get or list query across all private user profiles.

## 3. Security Rules Draft & Validation
These rules will be written and deployed to `firestore.rules`.
All reads and writes will be protected by rules checking authorization, structure size, data types, and reference integrity.
