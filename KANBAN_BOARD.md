# Kanban Board Flow (Backend)

This document explains the backend kanban implementation so the frontend team can build the UI correctly.

## 1. Core Concepts

- **Board** (`KanbanBoard`): Owned by a user, contains columns, and can be shared with other users.
- **Columns**: Embedded array in the board document. Each column has `_id`, `name`, `order`, and `isActive`.
- **Card** (`KanbanCard`): Represents a lead inside a column. Linked to a lead via `leadId`.

### Default Board Columns

1. New (`order: 0`)
2. Contacted (`order: 1`)
3. Qualified (`order: 2`)
4. Closed (`order: 3`)

### Card Fields

- `boardId`
- `columnId`
- `leadId` (populated with `firstName`, `lastName`, `company`, `email`)
- `title`
- `order` (position inside the column)
- `profileSections` (array of `{ title, content }`)
- `comments` (array of `{ userId, text, createdAt, isActive }`)
- `assignedTo` (array of user IDs, populated with `firstName`, `lastName`, `email`)
- `isActive`

> **Note:** `assignedTo` supports **multiple users**.

---

## 2. How Cards Are Created

Cards can be created in two ways:

### A. Lead Qualification

`POST /api/v1/leads/:id/qualify`

Body:
```json
{
  "profileSections": [
    { "title": "Notes", "content": "Called today" }
  ],
  "boardId": "optional-board-id"
}
```

Backend behavior:
1. Marks the lead as `isQualified: true`.
2. Creates the user’s default board if it does not exist (uses `boardId` if provided).
3. Creates a card in the **first column** of the board (default = `New`).
4. Sets `assignedTo` to `[currentUserId]`.

### B. Direct Card Creation

`POST /api/v1/kanban/cards`

Body:
```json
{
  "boardId": "...",
  "columnId": "...",
  "leadId": "...",
  "title": "Optional title",
  "assignedTo": ["user-id-1", "user-id-2"],
  "profileSections": [{ "title": "Notes", "content": "..." }]
}
```

- `title` is optional; generated from lead name/company if omitted.
- `assignedTo` is optional; defaults to `[currentUserId]` if empty.

---

## 3. Kanban API Endpoints

Base URL: `/api/v1/kanban`

All endpoints require authentication.

### Boards

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/kanban/board` | Get current user’s default board + cards |
| GET | `/kanban/board/:boardId` | Get specific board + cards |
| GET | `/kanban/boards` | List boards the user owns or is shared on |
| POST | `/kanban/boards` | Create a new board |
| DELETE | `/kanban/boards/:boardId` | Soft-delete a board and its cards |
| PATCH | `/kanban/boards/:boardId/share` | Share/unshare board with users |

### Columns

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/kanban/boards/:boardId/columns` | Add a column |
| PATCH | `/kanban/boards/:boardId/columns/:columnId` | Rename a column |
| DELETE | `/kanban/boards/:boardId/columns/:columnId` | Soft-delete a column (cards move to first active column) |
| PATCH | `/kanban/boards/:boardId/columns/reorder` | Reorder columns |

### Cards

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/kanban/cards` | Create a card directly |
| GET | `/kanban/cards/:cardId` | Get single card |
| PATCH | `/kanban/cards/:cardId` | Update card (title, columnId, order, assignedTo, profileSections) |
| PATCH | `/kanban/cards/:cardId/move` | Move card to another column / change order |
| DELETE | `/kanban/cards/:cardId` | Soft-delete a card |
| GET | `/kanban/boards/:boardId/cards` | Search/filter cards on a board |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/kanban/cards/:cardId/comments` | Add a comment |
| PATCH | `/kanban/cards/:cardId/comments/:commentId` | Edit a comment |
| DELETE | `/kanban/cards/:cardId/comments/:commentId` | Soft-delete a comment |

---

## 4. Request / Response Examples

### Get Board

```http
GET /api/v1/kanban/board
```

Response:
```json
{
  "success": true,
  "data": {
    "board": {
      "_id": "...",
      "name": "Lead Pipeline",
      "columns": [
        { "_id": "col1", "name": "New", "order": 0 },
        { "_id": "col2", "name": "Contacted", "order": 1 }
      ],
      "ownerId": "...",
      "sharedWith": []
    },
    "cards": [
      {
        "_id": "...",
        "boardId": "...",
        "columnId": "col1",
        "leadId": {
          "_id": "...",
          "firstName": "...",
          "lastName": "...",
          "company": "...",
          "email": "..."
        },
        "title": "John Doe",
        "order": 0,
        "profileSections": [],
        "comments": [],
        "assignedTo": [
          { "_id": "...", "firstName": "...", "lastName": "...", "email": "..." }
        ]
      }
    ]
  }
}
```

### Create Board

```http
POST /api/v1/kanban/boards
```

Body:
```json
{ "name": "Sales Pipeline Q3" }
```

### Share Board

```http
PATCH /api/v1/kanban/boards/:boardId/share
```

Body:
```json
{ "userIds": ["user-id-1", "user-id-2"] }
```

> Passing an empty array `[]` removes all shared users.

### Add Column

```http
POST /api/v1/kanban/boards/:boardId/columns
```

Body:
```json
{ "name": "Negotiation" }
```

### Reorder Columns

```http
PATCH /api/v1/kanban/boards/:boardId/columns/reorder
```

Body:
```json
{ "columnIds": ["col2", "col1", "col3"] }
```

### Move Card

```http
PATCH /api/v1/kanban/cards/:cardId/move
```

Body:
```json
{
  "columnId": "destination-column-id",
  "order": 2
}
```

- `columnId` is required.
- `order` is optional. If omitted when changing columns, the card is placed at the end.

### Update Card

```http
PATCH /api/v1/kanban/cards/:cardId
```

Body:
```json
{
  "title": "Updated Title",
  "columnId": "...",
  "order": 1,
  "assignedTo": ["user-id-1", "user-id-2"],
  "profileSections": [{ "title": "Notes", "content": "..." }]
}
```

All fields are optional.

### Search Cards

```http
GET /api/v1/kanban/boards/:boardId/cards?columnId=...&assignedTo=...&search=acme
```

Query params:
- `columnId` — filter by column
- `assignedTo` — filter by assignee user ID
- `search` — search in card title and lead name/company/email

### Add Comment

```http
POST /api/v1/kanban/cards/:cardId/comments
```

Body:
```json
{ "text": "Left voicemail" }
```

### Edit Comment

```http
PATCH /api/v1/kanban/cards/:cardId/comments/:commentId
```

Body:
```json
{ "text": "Updated text" }
```

Only the comment author or an admin can edit/delete.

---

## 5. Real-Time Updates (Socket.IO)

Card movements are **handled via REST APIs**, not sockets.

For comments, the backend still emits a socket event when a comment is added:

| Event | Payload | Meaning |
|-------|---------|---------|
| `kanban:comment_added` | `{ cardId, boardId }` | A comment was added. Refresh comments for the card. |

Join/leave board room:

```js
socket.emit('kanban:join_board', boardId);
socket.emit('kanban:leave_board', boardId);
```

If you prefer to skip sockets entirely for comments, poll the card endpoint after adding a comment.

---

## 6. Authorization

### Board Access

A user can access a board if any of the following is true:

- User role is `ADMIN`.
- User is the board `ownerId`.
- User is in the board’s `sharedWith` array.

### Board Management

Only the board owner or an admin can:

- Delete the board
- Share the board
- Add/rename/delete/reorder columns

### Card/Comment Operations

Any user with board access can:

- View cards
- Move cards
- Create cards
- Add comments

Only the comment author or an admin can edit/delete a comment.

---

## 7. Soft Deletes

- **Boards**: `isActive: false` — also marks all cards inactive.
- **Columns**: `isActive: false` — cards in the deleted column are moved to the first active column.
- **Cards**: `isActive: false` — excluded from all board/list/search responses.
- **Comments**: `isActive: false` — excluded from card responses.

---

## 8. Frontend Implementation Checklist

- [ ] **Boards**: list, create, share, delete boards.
- [ ] **Columns**: add, rename, delete, reorder columns.
- [ ] **Cards**: create, view detail, update (title, assignees, profile sections), move between columns, delete.
- [ ] **Drag-and-drop**: on drop, call `PATCH /kanban/cards/:cardId/move` with new `columnId` and `order`, then refresh state from the response.
- [ ] **Search/filter**: use `GET /kanban/boards/:boardId/cards` with query params.
- [ ] **Comments**: add, edit, delete comments.
- [ ] **Lead → Kanban**: keep the “Qualify” button calling `POST /api/v1/leads/:id/qualify`.
- [ ] **Assignees**: use arrays of user IDs for `assignedTo`.
- [ ] **Live comments (optional)**: join board room and listen for `kanban:comment_added`.

---

## 9. Important Gotchas

- `assignedTo` is always an **array** of user IDs, even for a single assignee.
- `order` is a simple numeric value. The backend does **not** automatically renumber sibling cards, so gaps or duplicates are possible. Frontend should send explicit orders if needed.
- Column `_id` on a card must match one of the active board column `_id`s.
- Deleted columns are not returned in `GET /kanban/board` responses.
- Card movement does **not** emit socket events. Use the REST response to update UI.
- Populated fields are limited:
  - `leadId`: `firstName`, `lastName`, `company`, `email`
  - `assignedTo`: `firstName`, `lastName`, `email`
  - `comments.userId`: `firstName`, `lastName`, `email`
