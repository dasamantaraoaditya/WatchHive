# WatchHive 🐝

**A Social Media Platform for Movie and TV Show Enthusiasts**

WatchHive is a full-stack social platform where users can track, share, and discover movies and TV shows. Built with modern technologies and designed to showcase full-stack development capabilities.

---

## 🤖 **FOR AI AGENTS & DEVELOPERS**

**⚠️ CRITICAL: Before making ANY changes to this codebase, READ:**

1. **[AI_DEVELOPMENT_GUIDE.md](./AI_DEVELOPMENT_GUIDE.md)** - Complete development context, test credentials, architecture, and workflows
2. **[.ai-context](./.ai-context)** - Quick reference for common tasks and credentials

These files contain essential information including:
- Test user credentials
- Current implementation status
- Core concepts and architecture
- Common issues and solutions
- Development workflows
- API endpoints reference

**Failure to review these files may result in breaking existing functionality or losing development context.**

---

## 🎯 Project Overview

WatchHive allows users to:
- 📝 Log movies and TV shows they've watched with ratings and reviews
- 👥 Follow other users and see their viewing activity
- 💬 Like and comment on entries
- 📊 View detailed statistics about their viewing habits
- 🔍 Discover trending content and get personalized recommendations
- 📋 Create and manage watchlists

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL database
- npm

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd WatchHive
   ```

2. **Install all dependencies**:
   ```bash
   npm run install:all
   ```

3. **Set up backend**:
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your database URL and secrets
   npm run prisma:generate
   npm run prisma:migrate
   cd ..
   ```

4. **Start development servers**:
   ```bash
   npm run dev
   ```

This will start:
- Backend API on `http://localhost:5001`
- Frontend on `http://localhost:3000`

---

## 📁 Project Structure

```
WatchHive/
├── client/                 # React frontend
│   ├── src/
│   │   ├── watchhive/     # WatchHive application
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── contexts/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   └── ...
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   ├── prisma/
│   └── package.json
├── docs/                   # Documentation
│   ├── WATCHHIVE_REQUIREMENTS.md
│   ├── WATCHHIVE_ARCHITECTURE.md
│   ├── WATCHHIVE_CHECKLIST.md
│   └── WATCHHIVE_SUMMARY.md
├── IMPLEMENTATION_PROGRESS.md
└── package.json
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Context API
- **Styling**: CSS Modules
- **HTTP Client**: Axios
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Validation**: express-validator
- **Security**: Helmet, CORS

### External APIs
- **TMDb API**: Movie and TV show data

---

## 📚 Documentation

**All documentation is now organized in the [`docs/`](./docs/) folder!**

### **🚀 Quick Links**

**For AI Agents:**
- [AI Development Guide](./AI_DEVELOPMENT_GUIDE.md) - **START HERE** - Complete context for AI agents
- [AI Context Quick Reference](./.ai-context) - Fast lookup for credentials and common tasks
- [Development Session Log](./docs/implementation/DEVELOPMENT_SESSION_LOG.md) - Recent changes

**For Developers:**
- [Quick Start Guide](./docs/setup/QUICKSTART.md) - Get started in 3 steps
- [Architecture Overview](./docs/architecture/WATCHHIVE_ARCHITECTURE.md) - System design
- [Implementation Progress](./docs/implementation/IMPLEMENTATION_PROGRESS.md) - Current status

### **📁 Documentation Categories**

- **[Setup & Deployment](./docs/setup/)** - Quick start, deployment, database setup
- **[Architecture & Design](./docs/architecture/)** - Requirements, architecture, checklist
- **[Implementation](./docs/implementation/)** - Progress, session logs, feature docs
- **[Testing](./docs/testing/)** - API testing, test guides

**→ [Browse All Documentation](./docs/README.md)**

---

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

### Coming Soon
- User management
- Entry (watch log) management
- Social features (follow, like, comment)
- Lists management
- Discovery and recommendations
- Notifications

---

## 📝 Available Scripts

### Root Level
- `npm run dev` - Run both frontend and backend
- `npm run dev:server` - Run backend only
- `npm run dev:client` - Run frontend only
- `npm run install:all` - Install all dependencies
- `npm run build` - Build frontend for production

### Backend (in `/server`)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

### Frontend (in `/client`)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

---

## 🎨 Features

### Current (Phase 1)
- ✅ User authentication (register, login, logout)
- ✅ JWT-based security
- ✅ Database schema with all models
- ✅ Backend API structure
- ⏳ Frontend structure (in progress)

### Planned
- 📝 Movie and TV show logging
- 👤 User profiles with statistics
- 👥 Social following system
- 💬 Likes and comments
- 📊 Viewing analytics
- 🔍 Discovery and recommendations
- 📋 Watchlists and custom lists
- 🔔 Notifications

---

### Full-Stack (Frontend & Backend)
Deploy both to **Vercel** (Recommended):
```bash
# From root
vercel
```

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed instructions.
For other platforms, see [DEPLOYMENT.md](./docs/setup/DEPLOYMENT.md).

---

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests (coming soon)
cd client
npm test
```

---

## 📊 Development Status

**Current Phase**: Phase 1 - Foundation  
**Progress**: 85% of Phase 1 complete

See [IMPLEMENTATION_PROGRESS.md](./IMPLEMENTATION_PROGRESS.md) for detailed status.

---

## 🤝 Contributing

This is a personal portfolio project, but feedback and suggestions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - feel free to use this project for learning or as a starter template.

---

## 🎯 Project Goals

1. **Showcase Full-Stack Skills**: Demonstrate proficiency in modern web development
2. **Build a Useful Product**: Create a platform that movie enthusiasts will enjoy
3. **Learn and Grow**: Experiment with new technologies and best practices
4. **Portfolio Piece**: Highlight this project in professional portfolio

---

## 📞 Contact

**Aditya Dasamantharao**  
Portfolio: [adityadasamantharao.com](https://adityadasamantharao.com)

---

## 🙏 Acknowledgments

- [The Movie Database (TMDb)](https://www.themoviedb.org/) for movie data API
- Inspired by Letterboxd and similar platforms
- Built with modern open-source technologies

---

**Built with ❤️ using React, TypeScript, Node.js, Express, and PostgreSQL**

