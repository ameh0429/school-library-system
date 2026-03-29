# School Library System API

A RESTful API for managing a school library — authors, books, students, library attendants, and book borrowing/returns. Built with **Node.js (ESM)**, **Express.js**, and **MongoDB/Mongoose**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup -- installation)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [Authors](#authors)
  - [Books](#books)
  - [Students](#students)
  - [Attendants](#attendants)
- [Postman Collection](#postman-collection)
- [Business Rules](#business-rules)

---

## Features

-  Full CRUD for Authors, Books, Students, and Library Attendants
-  Book borrowing and returning with full relationship tracking
-  Auto-population of authors, student, and attendant when a book is OUT
-  Overdue detection (`isOverdue` flag on responses)
-  Pagination on all list endpoints
-  Search by title or author name
-  Duplicate ISBN prevention (unique index + 409 error)
-  Request validation with `express-validator`
-  JWT authentication (attendants log in and receive a token)
-  Global error handler with meaningful messages
-  ESM imports throughout (no CommonJS)

---

## Tech Stack

| Layer       | Technology                  |
|-------------|-----------------------------|
| Runtime     | Node.js (ESM)          |
| Framework   | Express.js                 |
| Database    | MongoDB via Mongoose       |
| Auth        | JSON Web Tokens (jsonwebtoken) |
| Passwords   | bcryptjs                    |
| Validation  | express-validator           |
| Config      | dotenv                      |

---

## Project Structure

```
library-system/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── authorController.js
│   ├── bookController.js
│   ├── studentController.js
│   └── attendantController.js
├── middleware/
│   ├── auth.js                # JWT protect middleware
│   ├── errorHandler.js        # Global error handler
│   └── validators.js          # express-validator rules
├── models/
│   ├── Author.js
│   ├── Book.js
│   ├── Student.js
│   └── LibraryAttendant.js
├── routes/
│   ├── authorRoutes.js
│   ├── bookRoutes.js
│   ├── studentRoutes.js
│   └── attendantRoutes.js
├── .env.example
├── package.json
├── app.js
└── README.md
```

---

## Setup & Installation

### Prerequisites

- Node.js
- MongoDB running locally or a MongoDB Atlas URI

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd school-library-system

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Start the server
npm start          # production
npm run dev        # development (auto-restarts on file changes)
```

The API will be available at: `http://localhost:5000`

Health check: `GET http://localhost:5000/health`

---

## Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/library-system
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
```

| Variable       | Description                        | Default                                      |
|----------------|------------------------------------|----------------------------------------------|
| `PORT`         | Port the server listens on         | `5000`                                       |
| `MONGO_URI`    | MongoDB connection string          | `mongodb://localhost:27017/library-system`   |
| `JWT_SECRET`   | Secret for signing JWT tokens      | *(required)*                                 |
| `JWT_EXPIRES_IN` | Token expiry duration            | `7d`                                         |

---

## API Documentation

**Base URL:** `http://localhost:5000/api/v1`

### Response Format

All responses follow a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

Errors:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

### Pagination & Filtering (all GET list endpoints)

| Query Param | Type   | Description                         |
|-------------|--------|-------------------------------------|
| `page`      | Number | Page number (default: 1)            |
| `limit`     | Number | Results per page (default: 10)      |
| `search`    | String | Search term (varies by resource)    |

---

### Authentication

JWT is required for all write operations and sensitive reads. Login as an attendant to get a token.

**Protected routes** require the header:
```
Authorization: Bearer <token>
```

#### POST `/attendants/login`

Login and receive a JWT token.

**Request Body:**
```json
{
  "email": "ameh@library.edu",
  "password": "secret123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "664abc...",
    "name": "Ameh Mathias",
    "staffId": "STF001",
    "email": "ameh@library.edu"
  }
}
```

---

### Authors

| Method | Endpoint        | Auth | Description        |
|--------|-----------------|------|--------------------|
| GET    | `/authors`      | No   | List all authors   |
| GET    | `/authors/:id`  | No   | Get single author  |
| POST   | `/authors`      | Yes  | Create author      |
| PUT    | `/authors/:id`  | Yes  | Update author      |
| DELETE | `/authors/:id`  | Yes  | Delete author      |

#### GET `/authors`

Query params: `page`, `limit`, `search` (matches name).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "664abc123...",
      "name": "Chinua Achebe",
      "bio": "Nigerian novelist and poet.",
      "createdAt": "2024-06-01T10:00:00.000Z"
    }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 10, "pages": 1 }
}
```

#### POST `/authors` 🔒

```json
{
  "name": "Chinua Achebe",
  "bio": "Nigerian novelist and poet."
}
```

#### PUT `/authors/:id` 🔒

```json
{
  "bio": "Updated biography text."
}
```

---

### Books

| Method | Endpoint              | Auth | Description                  |
|--------|-----------------------|------|------------------------------|
| GET    | `/books`              | No   | List books (paginated)       |
| GET    | `/books/:id`          | No   | Get single book              |
| POST   | `/books`              | Yes  | Create book                  |
| PUT    | `/books/:id`          | Yes  | Update book                  |
| DELETE | `/books/:id`          | Yes  | Delete book (must be IN)     |
| POST   | `/books/:id/borrow`   | Yes  | Borrow a book                |
| POST   | `/books/:id/return`   | Yes  | Return a book                |

#### GET `/books`

Query params: `page`, `limit`, `search` (title), `author` (author name), `status` (`IN` or `OUT`).

**Response when status = OUT:**
```json
{
  "success": true,
  "data": [{
    "_id": "664abc...",
    "title": "Things Fall Apart",
    "isbn": "978-0-385-47454-2",
    "status": "OUT",
    "isOverdue": false,
    "returnDate": "2024-07-01T00:00:00.000Z",
    "authors": [{ "_id": "...", "name": "Chinua Achebe", "bio": "..." }],
    "borrowedBy": { "_id": "...", "name": "Emeka Obi", "studentId": "STU001" },
    "issuedBy": { "_id": "...", "name": "Jane Doe", "staffId": "STF001" }
  }]
}
```

#### POST `/books` 🔒

```json
{
  "title": "Things Fall Apart",
  "isbn": "978-0-385-47454-2",
  "authors": ["664abc123..."]
}
```

#### POST `/books/:id/borrow` 🔒

Book must have `status: "IN"`.

```json
{
  "studentId": "664def456...",
  "attendantId": "664ghi789...",
  "returnDate": "2024-07-15T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Book borrowed successfully.",
  "data": {
    "_id": "...",
    "title": "Things Fall Apart",
    "status": "OUT",
    "returnDate": "2024-07-15T00:00:00.000Z",
    "borrowedBy": { "name": "Emeka Obi", "studentId": "STU001" },
    "issuedBy": { "name": "Jane Doe", "staffId": "STF001" }
  }
}
```

#### POST `/books/:id/return` 🔒

Book must have `status: "OUT"`. No request body needed.

**Response:**
```json
{
  "success": true,
  "message": "Book returned successfully.",
  "data": {
    "_id": "...",
    "title": "Things Fall Apart",
    "status": "IN",
    "borrowedBy": null,
    "issuedBy": null,
    "returnDate": null
  }
}
```

---

### Students

| Method | Endpoint          | Auth | Description        |
|--------|-------------------|------|--------------------|
| GET    | `/students`       | Yes  | List all students  |
| GET    | `/students/:id`   | Yes  | Get single student (includes borrowed books) |
| POST   | `/students`       | Yes  | Create student     |
| PUT    | `/students/:id`   | Yes  | Update student     |
| DELETE | `/students/:id`   | Yes  | Delete student (cannot have active loans) |

#### POST `/students` 🔒

```json
{
  "name": "Emeka Obi",
  "email": "emeka@school.edu",
  "studentId": "STU001"
}
```

#### GET `/students/:id` 🔒

Includes currently borrowed books with overdue status:

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Emeka Obi",
    "email": "emeka@school.edu",
    "studentId": "STU001",
    "borrowedBooks": [
      {
        "_id": "...",
        "title": "Things Fall Apart",
        "isbn": "978-0-385-47454-2",
        "returnDate": "2024-06-30T00:00:00.000Z",
        "isOverdue": true
      }
    ]
  }
}
```

---

### Attendants

| Method | Endpoint              | Auth | Description           |
|--------|-----------------------|------|-----------------------|
| POST   | `/attendants/login`   | No   | Login and get token   |
| GET    | `/attendants`         | Yes  | List all attendants   |
| GET    | `/attendants/:id`     | Yes  | Get single attendant  |
| POST   | `/attendants`         | Yes  | Create attendant      |
| PUT    | `/attendants/:id`     | Yes  | Update attendant      |
| DELETE | `/attendants/:id`     | Yes  | Delete attendant      |

#### POST `/attendants` 🔒

```json
{
  "name": "James Godwin",
  "staffId": "STF001",
  "email": "jame@library.edu",
  "password": "secret123"
}
```

## Business Rules

| Rule | Detail |
|------|--------|
| **Borrow** | Book `status` must be `"IN"`. Sets `status → "OUT"`, `borrowedBy`, `issuedBy`, `returnDate`. |
| **Return** | Book `status` must be `"OUT"`. Clears `status → "IN"`, nullifies `borrowedBy`, `issuedBy`, `returnDate`. |
| **Delete Book** | Blocked if book is currently `"OUT"` (borrowed). |
| **Delete Student** | Blocked if student has active borrowed books. |
| **Duplicate ISBN** | Returns `409 Conflict` if a book with the same ISBN already exists. |
| **Overdue** | Any book where `status = "OUT"` and `returnDate < now` will have `isOverdue: true` in the response. |
| **Populate on OUT** | When a book is `"OUT"`, `authors`, `borrowedBy`, and `issuedBy` are always populated in responses. |
| **Auth** | All write operations and student/attendant reads require a valid JWT (`Authorization: Bearer <token>`). |

---

## Error Reference

| Status | Meaning                              |
|--------|--------------------------------------|
| 400    | Bad request / business rule violated |
| 401    | Missing or invalid JWT               |
| 404    | Resource not found                   |
| 409    | Duplicate key (e.g., ISBN, email)    |
| 422    | Validation error                     |
| 500    | Internal server error                |