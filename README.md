# WatchHive 🐝

**A Social Platform for Movie and TV Show Enthusiasts**

Track, share, and discover movies and TV shows with friends.

---

## Quick Start

### Resources

Project : https://github.com/users/dasamantaraoaditya/projects/3
FE :
BE :
Stage :
PROD : 

### Prerequisites
- Node.js v18+, npm, PostgreSQL (Supabase)

### Setup
```bash
git clone <your-repo-url>
cd WatchHive
npm run install:all
cd server && cp .env.example .env   # Edit with your credentials
npm run prisma:generate && npm run prisma:migrate
cd ..
npm run dev                          # Starts frontend + backend
```

**Frontend:** http://localhost:3000 · **Backend API:** http://localhost:5001 · **Prisma Studio:** `cd server && npx prisma studio`

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, React Router, Context API, Axios, Framer Motion |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM, JWT + bcrypt, express-validator, Helmet |
| **Database** | PostgreSQL (Supabase) — 8 tables: users, entries, follows, likes, comments, lists, list_items, notifications |
| **External** | TMDb API (movie data), Google OAuth (authentication) |

---

## Project Structure

```
WatchHive/
├── client/                  # React frontend
│   └── src/watchhive/
│       ├── components/      # UI components (common, entries, auth, layout)
│       ├── pages/           # Pages (Login, Signup, Feed, Entries, Profile)
│       ├── contexts/        # AuthContext
│       ├── services/        # API client, auth, user services
│       └── types/           # TypeScript types
├── server/                  # Express backend
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic (auth, google-auth, entries)
│   │   ├── routes/          # API route definitions
│   │   ├── middleware/      # Auth, validation, error handling
│   │   └── utils/           # JWT, bcrypt, Prisma client
│   └── prisma/              # Schema + migrations
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md      # System architecture & requirements
│   └── SETUP.md             # Setup guides (Supabase, Google OAuth, Deployment)
└── package.json             # Root scripts
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login with email/password |
| POST | `/api/v1/auth/google` | Login/register with Google OAuth |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout |

### Entries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/entries` | List user entries |
| POST | `/api/v1/entries` | Create entry |
| GET | `/api/v1/entries/:id` | Get entry |
| PUT | `/api/v1/entries/:id` | Update entry |
| DELETE | `/api/v1/entries/:id` | Delete entry |

### Social
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/follows/:id/follow` | Follow user |
| DELETE | `/api/v1/follows/:id/unfollow` | Unfollow user |
| POST | `/api/v1/likes/:entryId/like` | Like entry |
| DELETE | `/api/v1/likes/:entryId/unlike` | Unlike entry |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |

---

## Available Scripts

```bash
# Root — run everything
npm run dev              # Start frontend + backend
npm run install:all      # Install all dependencies
npm run build            # Build for production

# Backend (in /server)
npm run dev              # Dev server with hot reload
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Database GUI

# Frontend (in /client)
npm run dev              # Dev server
npm run build            # Production build
```

---

## Features

### Implemented ✅
- **Auth:** Register, login, JWT tokens, Google OAuth
- **Entries:** Create/edit/delete watch logs with ratings, reviews, tags
- **Social:** Follow/unfollow users, like entries
- **UI:** Responsive design, animated gradients, glassmorphism

### Planned 🚧
- Comment system, activity feed, notifications
- User statistics dashboard, watchlists
- Search & discovery, TMDb enrichment
- Dark/light theme toggle

---

## Deployment

Deploy to **Vercel** (recommended). See [docs/SETUP.md](./docs/SETUP.md) for detailed deployment instructions.

---

## Documentation

- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — System architecture, database schema, design principles
- **[docs/SETUP.md](./docs/SETUP.md)** — Supabase setup, Google OAuth setup, deployment guides

---

**Aditya Dasamantharao** · [adityadasamantharao.com](https://adityadasamantharao.com)

Built with React, TypeScript, Node.js, Express, and PostgreSQL
