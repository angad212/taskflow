# TaskFlow — Team Task Manager

A full-stack web application for managing projects, assigning tasks, and tracking team progress with role-based access control.

🔗 **Live Demo:** _[Add your Railway URL here]_  
📹 **Demo Video:** _[Add your Loom/YouTube link here]_  
💻 **GitHub:** _[Add your GitHub repo URL here]_

---

## Features

- **Authentication** — Secure signup/login with JWT tokens (7-day expiry)
- **Role-Based Access** — Global Admin vs Member; project-level Admin vs Member
- **Projects** — Create, edit, delete projects; add/remove team members
- **Tasks (Kanban Board)** — Create, assign, filter tasks across To Do / In Progress / Done columns
- **Dashboard** — Real-time stats: total tasks, overdue count, completion percentage, my pending tasks
- **Validations** — All inputs validated on frontend and backend

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS      |
| Backend    | Node.js, Express.js               |
| Database   | PostgreSQL via Prisma ORM         |
| Auth       | JWT (jsonwebtoken) + bcryptjs     |
| Deployment | Railway (full-stack monorepo)     |

---

## Role System

| Action                        | Admin | Project Admin | Member |
|-------------------------------|-------|---------------|--------|
| Create project                | ✅    | ❌            | ❌     |
| Edit/Delete project           | ✅    | ✅            | ❌     |
| Manage project members        | ✅    | ✅            | ❌     |
| Create tasks                  | ✅    | ✅            | ✅     |
| Edit/Delete any task          | ✅    | ✅            | ❌     |
| Update status of own task     | ✅    | ✅            | ✅     |
| View all projects             | ✅    | ❌            | ❌     |

> **Note:** The first user to register is automatically assigned the **Admin** role.

---

## Local Development Setup

### Prerequisites
- Node.js v18+
- PostgreSQL database (local or [Neon](https://neon.tech) free tier)

### 1. Clone and install

```bash
git clone https://github.com/your-username/taskflow.git
cd taskflow
npm run install:all
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/taskflow"
JWT_SECRET="your-random-secret-here"
PORT=5000
NODE_ENV=development
```

### 3. Set up database

```bash
npm run db:setup
```

### 4. Start development servers

In two terminals:
```bash
# Terminal 1 — Backend
npm run dev:server

# Terminal 2 — Frontend
npm run dev:client
```

Frontend: http://localhost:5173  
Backend API: http://localhost:5000/api

---

## Deployment on Railway

### Step 1: Create a Railway account
Go to [railway.app](https://railway.app) and sign up.

### Step 2: Add a PostgreSQL database
1. New Project → Add Service → Database → PostgreSQL
2. Copy the `DATABASE_URL` from the Variables tab

### Step 3: Deploy the app
1. New Service → Deploy from GitHub Repo
2. Select this repository
3. Railway auto-detects `nixpacks.toml` and builds correctly

### Step 4: Set environment variables
In the service's Variables tab, add:
```
DATABASE_URL=<paste from PostgreSQL service>
JWT_SECRET=<any long random string>
NODE_ENV=production
PORT=5000
```

### Step 5: Run database migrations
In Railway's service shell or via a one-off command:
```bash
cd server && npx prisma db push
```

### Step 6: Done! 🎉
Railway provides a public URL automatically.

---

## API Endpoints

### Auth
| Method | Endpoint             | Description        | Auth |
|--------|---------------------|--------------------|------|
| POST   | /api/auth/register  | Create account     | No   |
| POST   | /api/auth/login     | Login              | No   |
| GET    | /api/auth/me        | Get current user   | Yes  |

### Projects
| Method | Endpoint                          | Description            | Auth         |
|--------|----------------------------------|------------------------|--------------|
| GET    | /api/projects                    | List accessible projects | Yes        |
| POST   | /api/projects                    | Create project         | Admin        |
| GET    | /api/projects/:id                | Get project + tasks    | Member+      |
| PUT    | /api/projects/:id                | Update project         | Proj. Admin  |
| DELETE | /api/projects/:id                | Delete project         | Proj. Admin  |
| POST   | /api/projects/:id/members        | Add member             | Proj. Admin  |
| DELETE | /api/projects/:id/members/:uid   | Remove member          | Proj. Admin  |

### Tasks
| Method | Endpoint                        | Description       | Auth    |
|--------|---------------------------------|-------------------|---------|
| GET    | /api/projects/:id/tasks         | List tasks        | Member+ |
| POST   | /api/projects/:id/tasks         | Create task       | Member+ |
| PUT    | /api/tasks/:id                  | Update task       | Member+ |
| DELETE | /api/tasks/:id                  | Delete task       | Proj. Admin |

### Users & Dashboard
| Method | Endpoint          | Description             | Auth |
|--------|------------------|-------------------------|------|
| GET    | /api/users       | List all users          | Yes  |
| GET    | /api/users/dashboard | Dashboard stats     | Yes  |

---

## Project Structure

```
taskflow/
├── server/
│   ├── src/
│   │   ├── index.js          # Express app entry
│   │   ├── routes/
│   │   │   ├── auth.js       # Auth endpoints
│   │   │   ├── projects.js   # Project CRUD + members
│   │   │   ├── tasks.js      # Task CRUD
│   │   │   └── users.js      # Users list + dashboard
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT + role middleware
│   │   └── lib/
│   │       └── prisma.js     # DB client
│   └── prisma/
│       └── schema.prisma     # Database schema
├── client/
│   └── src/
│       ├── pages/            # React pages
│       ├── components/       # Reusable UI components
│       ├── hooks/            # Auth context
│       └── lib/              # Axios client
├── railway.toml              # Railway config
├── nixpacks.toml             # Build config
└── README.md
```

---

## License
MIT
