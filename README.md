# Study Share

A full-stack web application for sharing learning resources between students, built for the CE2001 Full Stack Applications coursework.

Users can register, log in, create and browse study resource posts, search and filter content, and manage their own account and posts.

This project supports **[UN SDG 4 — Quality Education](https://sdgs.un.org/goals/goal4)** by making learning resources more accessible and shareable among students.

---

## Tech Stack

**Frontend** — React 19, React Router, Vite, Tailwind CSS

**Backend** — Node.js, Express 5, MongoDB (Node Driver), JWT (`jsonwebtoken`), `bcryptjs`, `cookie-parser`, `cors`

**Testing** — Node.js built-in test runner (`node --test`)

---

## Project Structure

```
.
├── client/               # React frontend (Vite)
│   ├── src/
│   │   ├── components/   # Shared UI components
│   │   ├── handlers/     # API call logic
│   │   ├── hooks/        # Custom React hooks
│   │   └── pages/        # Page-level components
│   └── test/             # Frontend unit tests
├── server/               # Express backend
│   ├── controllers/      # Route logic
│   ├── database/         # MongoDB access modules
│   ├── routes/           # Route definitions
│   └── test/             # Backend unit tests
├── scripts/              # Root dev/test orchestration scripts
├── package.json          # Root scripts
└── README.md
```

---

## Prerequisites

- Node.js 20+
- npm 10+
- A MongoDB instance (local or cloud, e.g. MongoDB Atlas)

---

## Environment Setup

Create a `.env` file at `server/.env`:

```env
MONGO_URL=<your_mongodb_connection_string>
JWT_SECRET=<your_strong_secret>
PORT=8080
HOST=0.0.0.0

# Optional: comma-separated extra allowed CORS origins
# CORS_ORIGINS=http://localhost:5173,https://your-domain.example
```

Optional frontend environment variables (in `client/.env`):

```env
# Override the API base URL in non-proxied setups
VITE_API_BASE_URL=

# Override the Vite dev proxy target (defaults to http://127.0.0.1:8080)
VITE_API_PROXY_TARGET=
```

---

## Installation

From the project root, install dependencies for both the client and server:

```bash
npm --prefix server install
npm --prefix client install
```

---

## Running the App

### Start both frontend and backend together

```bash
npm run dev
```

This starts:
- **Backend** at `http://localhost:8080`
- **Frontend** at `http://localhost:5173`

Then open `http://localhost:5173` in your browser to use the app.

During development, Vite proxies `/api/*` requests to the backend automatically.

### Start services individually

```bash
# Backend only
npm run dev:server

# Frontend only
npm run dev:client
```

---

## Testing

```bash
# Run all tests (client + server)
npm test

# Frontend tests only
npm run test:client

# Backend tests only
npm run test:server
```

---

## Data Model

MongoDB is used for all persistent storage. There are two collections:

**`users`**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated unique identifier |
| `username` | String | Display name chosen at registration |
| `email` | String | Unique email address used for login |
| `password` | String | `bcryptjs`-hashed password — plaintext is never stored |

**`resources`**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated unique identifier |
| `title` | String | Title of the resource post |
| `description` | String | Brief description of the resource |
| `subject` | String | Category/subject used for filtering |
| `link` | String | URL to the external resource |
| `userId` | ObjectId | Reference to the owning user's `_id` |
| `createdAt` | Date | Timestamp set on creation |

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | Create a new account |
| `POST` | `/login` | Log in and receive a session cookie |
| `POST` | `/logout` | Clear the session cookie |
| `GET` | `/verify` | Check if the current session is valid |
| `PATCH` | `/change-password` | Update the authenticated user's password |
| `DELETE` | `/delete-account` | Permanently delete the authenticated user's account |

### Resources — `/api/resources`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/create` | Create a new resource post |
| `GET` | `/` | Get all resources (supports search/filter) |
| `GET` | `/mine` | Get resources created by the authenticated user |
| `DELETE` | `/:id` | Delete a resource by ID (owner only) |

---

## Security

- Passwords are hashed with `bcryptjs` before storage.
- Authentication uses JWTs stored in `httpOnly` cookies (not accessible to JavaScript).
- All protected routes validate the token before processing the request.
- CORS is restricted to localhost defaults and any origins specified in `CORS_ORIGINS`.

---

## Notes

- The app is designed to run in local environments and Codio-hosted Ubuntu environments.
- The root `dev` and `test` scripts use Node orchestration scripts in `scripts/` to manage both processes.