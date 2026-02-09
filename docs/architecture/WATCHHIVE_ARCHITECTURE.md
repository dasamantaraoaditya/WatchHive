# WatchHive - Technical Architecture & Implementation Plan

**Project**: WatchHive - Social Platform for Movie Enthusiasts  
**Version**: 1.0  
**Date**: January 26, 2026  
**Status**: Planning Phase

---

## 📋 Document Purpose

This document outlines the technical architecture, file structure, and implementation strategy for integrating WatchHive into the existing portfolio website while maintaining clean separation and independent development.

---

## 🏗️ Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                         │
│  ┌────────────────┐              ┌────────────────────────┐ │
│  │   Portfolio    │              │     WatchHive App      │ │
│  │   Website      │              │   (React SPA)          │ │
│  └────────────────┘              └────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Express.js REST API (TypeScript)             │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐ │  │
│  │  │   Auth     │  │  Entries   │  │    Social      │ │  │
│  │  │  Service   │  │  Service   │  │   Service      │ │  │
│  │  └────────────┘  └────────────┘  └────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  PostgreSQL  │  │    Redis     │  │   TMDb API       │  │
│  │  (Primary)   │  │  (Cache)     │  │  (External)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Separation of Concerns**: Clear boundaries between portfolio and WatchHive
2. **Modularity**: Independent, reusable components
3. **Scalability**: Architecture supports growth
4. **Maintainability**: Clean code, well-documented
5. **Performance**: Optimized for speed and efficiency
6. **Security**: Built-in security best practices

---

## 📁 Detailed File Structure

### Complete Repository Structure

```
portfolio/
│
├── docs/                                    # 📚 Documentation
│   ├── WATCHHIVE_REQUIREMENTS.md           # Requirements document
│   ├── WATCHHIVE_ARCHITECTURE.md           # This file
│   ├── PORTFOLIO_OVERVIEW.md               # Portfolio documentation
│   ├── API_DOCUMENTATION.md                # API reference (to be created)
│   └── DEPLOYMENT_GUIDE.md                 # Deployment instructions (to be created)
│
├── src/                                     # 🎨 Frontend Source
│   │
│   ├── main.tsx                            # Application entry point
│   ├── App.tsx                             # Portfolio main component
│   ├── index.css                           # Portfolio global styles
│   │
│   ├── components/                         # Portfolio components
│   │   ├── Navbar.tsx
│   │   ├── Hero.tsx
│   │   ├── About.tsx
│   │   ├── Experience.tsx
│   │   ├── Skills.tsx
│   │   ├── Projects.tsx
│   │   ├── Contact.tsx
│   │   └── Footer.tsx
│   │
│   ├── data/                               # Portfolio static data
│   │   └── ...
│   │
│   ├── types/                              # Portfolio TypeScript types
│   │   └── ...
│   │
│   └── watchhive/                          # 🎬 WATCHHIVE APPLICATION
│       │
│       ├── WatchHiveApp.tsx                # WatchHive root component
│       ├── index.css                       # WatchHive global styles
│       ├── config.ts                       # WatchHive configuration
│       │
│       ├── components/                     # WatchHive components
│       │   │
│       │   ├── common/                     # Reusable UI components
│       │   │   ├── Button.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Modal.tsx
│       │   │   ├── Dropdown.tsx
│       │   │   ├── Avatar.tsx
│       │   │   ├── Badge.tsx
│       │   │   ├── Spinner.tsx
│       │   │   ├── Toast.tsx
│       │   │   └── index.ts
│       │   │
│       │   ├── layout/                     # Layout components
│       │   │   ├── Header.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   ├── Footer.tsx
│       │   │   ├── Container.tsx
│       │   │   └── index.ts
│       │   │
│       │   ├── auth/                       # Authentication components
│       │   │   ├── LoginForm.tsx
│       │   │   ├── SignupForm.tsx
│       │   │   ├── ForgotPasswordForm.tsx
│       │   │   ├── ProtectedRoute.tsx
│       │   │   └── index.ts
│       │   │
│       │   ├── feed/                       # Feed-related components
│       │   │   ├── FeedItem.tsx
│       │   │   ├── FeedList.tsx
│       │   │   ├── FeedFilter.tsx
│       │   │   └── index.ts
│       │   │
│       │   ├── profile/                    # Profile components
│       │   │   ├── ProfileHeader.tsx
│       │   │   ├── ProfileStats.tsx
│       │   │   ├── ProfileTabs.tsx
│       │   │   ├── EditProfileModal.tsx
│       │   │   └── index.ts
│       │   │
│       │   ├── entry/                      # Entry (watch log) components
│       │   │   ├── EntryCard.tsx
│       │   │   ├── EntryForm.tsx
│       │   │   ├── EntryDetail.tsx
│       │   │   ├── EntryList.tsx
│       │   │   └── index.ts
│       │   │
│       │   ├── movie/                      # Movie/show components
│       │   │   ├── MovieCard.tsx
│       │   │   ├── MovieSearch.tsx
│       │   │   ├── MovieDetail.tsx
│       │   │   ├── MoviePoster.tsx
│       │   │   └── index.ts
│       │   │
│       │   ├── social/                     # Social interaction components
│       │   │   ├── FollowButton.tsx
│       │   │   ├── UserCard.tsx
│       │   │   ├── UserList.tsx
│       │   │   ├── CommentSection.tsx
│       │   │   ├── LikeButton.tsx
│       │   │   └── index.ts
│       │   │
│       │   ├── list/                       # List management components
│       │   │   ├── ListCard.tsx
│       │   │   ├── ListForm.tsx
│       │   │   ├── ListDetail.tsx
│       │   │   ├── ListItemCard.tsx
│       │   │   └── index.ts
│       │   │
│       │   ├── stats/                      # Statistics components
│       │   │   ├── StatsCard.tsx
│       │   │   ├── GenreChart.tsx
│       │   │   ├── TimelineChart.tsx
│       │   │   ├── CalendarView.tsx
│       │   │   └── index.ts
│       │   │
│       │   └── notifications/              # Notification components
│       │       ├── NotificationBell.tsx
│       │       ├── NotificationList.tsx
│       │       ├── NotificationItem.tsx
│       │       └── index.ts
│       │
│       ├── pages/                          # Page components
│       │   ├── LandingPage.tsx             # Public landing page
│       │   ├── LoginPage.tsx               # Login page
│       │   ├── SignupPage.tsx              # Signup page
│       │   ├── HomePage.tsx                # Main feed (authenticated)
│       │   ├── ProfilePage.tsx             # User profile
│       │   ├── ExplorePage.tsx             # Discover/trending
│       │   ├── MovieDetailPage.tsx         # Movie/show details
│       │   ├── ListsPage.tsx               # User's lists
│       │   ├── FollowersPage.tsx           # Followers/following
│       │   ├── SettingsPage.tsx            # User settings
│       │   ├── NotificationsPage.tsx       # Notifications
│       │   └── index.ts
│       │
│       ├── hooks/                          # Custom React hooks
│       │   ├── useAuth.ts                  # Authentication hook
│       │   ├── useApi.ts                   # API call hook
│       │   ├── useDebounce.ts              # Debounce hook
│       │   ├── useInfiniteScroll.ts        # Infinite scroll hook
│       │   ├── useLocalStorage.ts          # Local storage hook
│       │   ├── useMediaQuery.ts            # Responsive design hook
│       │   ├── useToast.ts                 # Toast notification hook
│       │   └── index.ts
│       │
│       ├── contexts/                       # React contexts
│       │   ├── AuthContext.tsx             # Authentication context
│       │   ├── ThemeContext.tsx            # Theme (light/dark) context
│       │   ├── ToastContext.tsx            # Toast notifications context
│       │   └── index.ts
│       │
│       ├── services/                       # API service layer
│       │   ├── api.ts                      # Base API client (axios)
│       │   ├── authService.ts              # Authentication API calls
│       │   ├── userService.ts              # User API calls
│       │   ├── entryService.ts             # Entry API calls
│       │   ├── socialService.ts            # Social API calls
│       │   ├── listService.ts              # List API calls
│       │   ├── notificationService.ts      # Notification API calls
│       │   ├── tmdbService.ts              # TMDb API integration
│       │   └── index.ts
│       │
│       ├── utils/                          # Utility functions
│       │   ├── formatters.ts               # Date, number formatters
│       │   ├── validators.ts               # Form validation
│       │   ├── helpers.ts                  # General helpers
│       │   ├── constants.ts                # App constants
│       │   └── index.ts
│       │
│       ├── types/                          # TypeScript type definitions
│       │   ├── user.types.ts               # User-related types
│       │   ├── entry.types.ts              # Entry-related types
│       │   ├── movie.types.ts              # Movie/show types
│       │   ├── social.types.ts             # Social feature types
│       │   ├── api.types.ts                # API response types
│       │   └── index.ts
│       │
│       └── assets/                         # WatchHive-specific assets
│           ├── images/
│           ├── icons/
│           └── fonts/
│
├── backend/                                 # 🔧 BACKEND APPLICATION
│   │
│   ├── src/
│   │   │
│   │   ├── index.ts                        # Server entry point
│   │   ├── app.ts                          # Express app setup
│   │   ├── server.ts                       # Server initialization
│   │   ├── config.ts                       # Configuration management
│   │   │
│   │   ├── routes/                         # API routes
│   │   │   ├── index.ts                    # Route aggregator
│   │   │   ├── auth.routes.ts              # Authentication routes
│   │   │   ├── user.routes.ts              # User routes
│   │   │   ├── entry.routes.ts             # Entry routes
│   │   │   ├── social.routes.ts            # Social routes
│   │   │   ├── list.routes.ts              # List routes
│   │   │   ├── notification.routes.ts      # Notification routes
│   │   │   └── discover.routes.ts          # Discovery routes
│   │   │
│   │   ├── controllers/                    # Route controllers
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── entry.controller.ts
│   │   │   ├── social.controller.ts
│   │   │   ├── list.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   └── discover.controller.ts
│   │   │
│   │   ├── services/                       # Business logic layer
│   │   │   ├── auth.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── entry.service.ts
│   │   │   ├── social.service.ts
│   │   │   ├── list.service.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── tmdb.service.ts
│   │   │   └── recommendation.service.ts
│   │   │
│   │   ├── middleware/                     # Express middleware
│   │   │   ├── auth.middleware.ts          # JWT authentication
│   │   │   ├── validation.middleware.ts    # Request validation
│   │   │   ├── error.middleware.ts         # Error handling
│   │   │   ├── rateLimit.middleware.ts     # Rate limiting
│   │   │   ├── cors.middleware.ts          # CORS configuration
│   │   │   └── logger.middleware.ts        # Request logging
│   │   │
│   │   ├── models/                         # Database models (Prisma)
│   │   │   └── index.ts                    # Model exports
│   │   │
│   │   ├── validators/                     # Request validators
│   │   │   ├── auth.validator.ts
│   │   │   ├── user.validator.ts
│   │   │   ├── entry.validator.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/                          # Utility functions
│   │   │   ├── jwt.util.ts                 # JWT helpers
│   │   │   ├── bcrypt.util.ts              # Password hashing
│   │   │   ├── email.util.ts               # Email helpers
│   │   │   ├── logger.util.ts              # Logging utility
│   │   │   └── index.ts
│   │   │
│   │   └── types/                          # TypeScript types
│   │       ├── express.d.ts                # Express type extensions
│   │       ├── api.types.ts
│   │       └── index.ts
│   │
│   ├── prisma/                             # Prisma ORM
│   │   ├── schema.prisma                   # Database schema
│   │   ├── migrations/                     # Database migrations
│   │   └── seed.ts                         # Database seeding
│   │
│   ├── tests/                              # Backend tests
│   │   ├── unit/                           # Unit tests
│   │   ├── integration/                    # Integration tests
│   │   └── e2e/                            # End-to-end tests
│   │
│   ├── .env.example                        # Environment variables template
│   ├── .env                                # Environment variables (not in git)
│   ├── package.json                        # Backend dependencies
│   ├── tsconfig.json                       # TypeScript config
│   └── README.md                           # Backend documentation
│
├── public/                                  # Static assets
│   └── ...
│
├── .github/                                 # GitHub configuration
│   └── workflows/                          # CI/CD workflows
│       ├── frontend.yml                    # Frontend CI/CD
│       └── backend.yml                     # Backend CI/CD
│
├── .env.example                            # Frontend env template
├── .env.local                              # Frontend env (not in git)
├── .gitignore                              # Git ignore rules
├── package.json                            # Frontend dependencies
├── tsconfig.json                           # Frontend TypeScript config
├── vite.config.ts                          # Vite configuration
├── index.html                              # HTML template
└── README.md                               # Main project readme
```

---

## 🔄 Routing Architecture

### Frontend Routing (React Router v6)

```typescript
// src/main.tsx or routing configuration

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App'; // Portfolio
import WatchHiveApp from './watchhive/WatchHiveApp';

// Portfolio routes
<Route path="/" element={<App />} />

// WatchHive routes
<Route path="/watch-hive/*" element={<WatchHiveApp />}>
  <Route index element={<LandingPage />} />
  <Route path="login" element={<LoginPage />} />
  <Route path="signup" element={<SignupPage />} />
  
  {/* Protected routes */}
  <Route element={<ProtectedRoute />}>
    <Route path="home" element={<HomePage />} />
    <Route path="profile/:username" element={<ProfilePage />} />
    <Route path="explore" element={<ExplorePage />} />
    <Route path="movie/:id" element={<MovieDetailPage />} />
    <Route path="lists" element={<ListsPage />} />
    <Route path="followers" element={<FollowersPage />} />
    <Route path="settings" element={<SettingsPage />} />
    <Route path="notifications" element={<NotificationsPage />} />
  </Route>
</Route>
```

### Backend API Routes

```
/api/v1/
├── auth/
│   ├── POST   /register
│   ├── POST   /login
│   ├── POST   /logout
│   ├── POST   /refresh
│   ├── POST   /forgot-password
│   └── POST   /reset-password
│
├── users/
│   ├── GET    /:id
│   ├── PUT    /:id
│   ├── GET    /:id/stats
│   ├── GET    /search
│   └── DELETE /:id
│
├── entries/
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /:id
│   ├── PUT    /:id
│   ├── DELETE /:id
│   ├── GET    /stats
│   └── GET    /calendar
│
├── social/
│   ├── POST   /follows
│   ├── DELETE /follows/:id
│   ├── GET    /users/:id/followers
│   ├── GET    /users/:id/following
│   ├── GET    /feed
│   ├── POST   /entries/:id/like
│   ├── DELETE /entries/:id/like
│   ├── POST   /entries/:id/comments
│   ├── PUT    /comments/:id
│   ├── DELETE /comments/:id
│   └── GET    /entries/:id/comments
│
├── lists/
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /:id
│   ├── PUT    /:id
│   ├── DELETE /:id
│   ├── POST   /:id/items
│   └── DELETE /:id/items/:itemId
│
├── discover/
│   ├── GET    /trending
│   ├── GET    /recommendations
│   ├── GET    /search/movies
│   └── GET    /search/shows
│
└── notifications/
    ├── GET    /
    ├── PUT    /:id/read
    └── PUT    /read-all
```

---

## 🗄️ Database Schema (Prisma)

### Prisma Schema Definition

```prisma
// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String    @id @default(uuid())
  username          String    @unique
  email             String    @unique
  passwordHash      String    @map("password_hash")
  displayName       String?   @map("display_name")
  bio               String?
  profilePictureUrl String?   @map("profile_picture_url")
  location          String?
  isPrivate         Boolean   @default(false) @map("is_private")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  // Relations
  entries           Entry[]
  followers         Follow[]  @relation("UserFollowers")
  following         Follow[]  @relation("UserFollowing")
  likes             Like[]
  comments          Comment[]
  lists             List[]
  notifications     Notification[]

  @@map("users")
}

model Entry {
  id            String    @id @default(uuid())
  userId        String    @map("user_id")
  tmdbId        Int       @map("tmdb_id")
  title         String
  type          EntryType
  watchedAt     DateTime  @map("watched_at")
  rating        Decimal?  @db.Decimal(3, 1)
  review        String?   @db.Text
  tags          String[]
  isRewatch     Boolean   @default(false) @map("is_rewatch")
  watchLocation String?   @map("watch_location")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  likes         Like[]
  comments      Comment[]

  @@index([userId])
  @@index([watchedAt])
  @@index([tmdbId])
  @@map("entries")
}

enum EntryType {
  MOVIE
  TV_SHOW
  EPISODE
}

model Follow {
  id          String   @id @default(uuid())
  followerId  String   @map("follower_id")
  followingId String   @map("following_id")
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  follower    User     @relation("UserFollowers", fields: [followerId], references: [id], onDelete: Cascade)
  following   User     @relation("UserFollowing", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
  @@map("follows")
}

model Like {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  entryId   String   @map("entry_id")
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  entry     Entry    @relation(fields: [entryId], references: [id], onDelete: Cascade)

  @@unique([userId, entryId])
  @@index([userId])
  @@index([entryId])
  @@map("likes")
}

model Comment {
  id              String    @id @default(uuid())
  userId          String    @map("user_id")
  entryId         String    @map("entry_id")
  parentCommentId String?   @map("parent_comment_id")
  content         String    @db.Text
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  entry           Entry     @relation(fields: [entryId], references: [id], onDelete: Cascade)
  parentComment   Comment?  @relation("CommentReplies", fields: [parentCommentId], references: [id], onDelete: Cascade)
  replies         Comment[] @relation("CommentReplies")

  @@index([userId])
  @@index([entryId])
  @@index([parentCommentId])
  @@map("comments")
}

model List {
  id          String     @id @default(uuid())
  userId      String     @map("user_id")
  name        String
  description String?    @db.Text
  isPublic    Boolean    @default(true) @map("is_public")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  // Relations
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items       ListItem[]

  @@index([userId])
  @@map("lists")
}

model ListItem {
  id         String   @id @default(uuid())
  listId     String   @map("list_id")
  tmdbId     Int      @map("tmdb_id")
  orderIndex Int      @map("order_index")
  addedAt    DateTime @default(now()) @map("added_at")

  // Relations
  list       List     @relation(fields: [listId], references: [id], onDelete: Cascade)

  @@index([listId])
  @@map("list_items")
}

model Notification {
  id        String           @id @default(uuid())
  userId    String           @map("user_id")
  type      NotificationType
  content   Json
  isRead    Boolean          @default(false) @map("is_read")
  createdAt DateTime         @default(now()) @map("created_at")

  // Relations
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
  @@map("notifications")
}

enum NotificationType {
  FOLLOW
  LIKE
  COMMENT
  REPLY
  MENTION
}
```

---

## 🔐 Authentication Flow

### JWT-Based Authentication

```
┌─────────┐                                  ┌─────────┐
│ Client  │                                  │ Server  │
└────┬────┘                                  └────┬────┘
     │                                            │
     │  POST /api/v1/auth/register                │
     │  { email, username, password }             │
     ├───────────────────────────────────────────>│
     │                                            │
     │  { accessToken, refreshToken, user }       │
     │<───────────────────────────────────────────┤
     │                                            │
     │  Store tokens in memory/localStorage       │
     │                                            │
     │  GET /api/v1/entries                       │
     │  Authorization: Bearer {accessToken}       │
     ├───────────────────────────────────────────>│
     │                                            │
     │  Verify JWT, extract userId                │
     │                                            │
     │  { entries: [...] }                        │
     │<───────────────────────────────────────────┤
     │                                            │
     │  (Access token expires)                    │
     │                                            │
     │  POST /api/v1/auth/refresh                 │
     │  { refreshToken }                          │
     ├───────────────────────────────────────────>│
     │                                            │
     │  { accessToken, refreshToken }             │
     │<───────────────────────────────────────────┤
     │                                            │
```

### Token Strategy
- **Access Token**: Short-lived (15 minutes), stored in memory
- **Refresh Token**: Long-lived (7 days), stored in httpOnly cookie or localStorage
- **Token Rotation**: New refresh token issued on refresh

---

## 🎨 Design System Integration

### WatchHive Design System

WatchHive will have its own design system that extends the portfolio's base styles:

```css
/* src/watchhive/index.css */

/* Import base portfolio styles (optional) */
@import '../index.css';

/* WatchHive-specific CSS variables */
:root {
  /* Colors */
  --wh-primary: #6366f1;
  --wh-primary-dark: #4f46e5;
  --wh-secondary: #ec4899;
  --wh-accent: #f59e0b;
  
  /* Backgrounds */
  --wh-bg-primary: #ffffff;
  --wh-bg-secondary: #f9fafb;
  --wh-bg-tertiary: #f3f4f6;
  
  /* Text */
  --wh-text-primary: #111827;
  --wh-text-secondary: #6b7280;
  --wh-text-tertiary: #9ca3af;
  
  /* Borders */
  --wh-border-color: #e5e7eb;
  --wh-border-radius: 8px;
  
  /* Shadows */
  --wh-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --wh-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --wh-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  
  /* Spacing */
  --wh-spacing-xs: 4px;
  --wh-spacing-sm: 8px;
  --wh-spacing-md: 16px;
  --wh-spacing-lg: 24px;
  --wh-spacing-xl: 32px;
  
  /* Typography */
  --wh-font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --wh-font-size-xs: 12px;
  --wh-font-size-sm: 14px;
  --wh-font-size-md: 16px;
  --wh-font-size-lg: 18px;
  --wh-font-size-xl: 24px;
}

/* Dark mode */
[data-theme="dark"] {
  --wh-bg-primary: #111827;
  --wh-bg-secondary: #1f2937;
  --wh-bg-tertiary: #374151;
  --wh-text-primary: #f9fafb;
  --wh-text-secondary: #d1d5db;
  --wh-text-tertiary: #9ca3af;
  --wh-border-color: #374151;
}
```

---

## 📦 State Management Strategy

### Context API for Global State

```typescript
// src/watchhive/contexts/AuthContext.tsx

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Implementation...

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, signup, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Custom Hooks for Data Fetching

```typescript
// src/watchhive/hooks/useApi.ts

export function useApi<T>(
  fetcher: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await fetcher();
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, error, isLoading };
}
```

---

## 🔌 API Integration

### Axios Client Setup

```typescript
// src/watchhive/services/api.ts

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add auth token)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (handle token refresh)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/watch-hive/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### Service Layer Example

```typescript
// src/watchhive/services/entryService.ts

import { apiClient } from './api';
import { Entry, CreateEntryData } from '../types';

export const entryService = {
  getEntries: async (filters?: any): Promise<Entry[]> => {
    const { data } = await apiClient.get('/entries', { params: filters });
    return data;
  },

  createEntry: async (entryData: CreateEntryData): Promise<Entry> => {
    const { data } = await apiClient.post('/entries', entryData);
    return data;
  },

  updateEntry: async (id: string, entryData: Partial<Entry>): Promise<Entry> => {
    const { data } = await apiClient.put(`/entries/${id}`, entryData);
    return data;
  },

  deleteEntry: async (id: string): Promise<void> => {
    await apiClient.delete(`/entries/${id}`);
  },

  getStats: async (): Promise<any> => {
    const { data } = await apiClient.get('/entries/stats');
    return data;
  },
};
```

---

## 🚀 Development Workflow

### Local Development Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd portfolio
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Set Up Database**
   ```bash
   cd backend
   # Create PostgreSQL database
   createdb watchhive_dev
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env with database credentials
   
   # Run migrations
   npx prisma migrate dev
   
   # Seed database (optional)
   npx prisma db seed
   cd ..
   ```

5. **Configure Frontend Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with API URL and other configs
   ```

6. **Start Development Servers**
   ```bash
   # Terminal 1: Frontend
   npm run dev
   
   # Terminal 2: Backend
   cd backend
   npm run dev
   ```

### Environment Variables

**Frontend (.env.local)**
```env
# API
VITE_API_BASE_URL=http://localhost:3000/api/v1

# TMDb API
VITE_TMDB_API_KEY=your_tmdb_api_key

# Firebase (existing portfolio)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
# ... other Firebase configs
```

**Backend (.env)**
```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/watchhive_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=7d

# TMDb API
TMDB_API_KEY=your_tmdb_api_key
TMDB_BASE_URL=https://api.themoviedb.org/3

# Email
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@watchhive.com

# File Storage
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=watchhive-uploads
AWS_REGION=us-east-1

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

## 🧪 Testing Strategy

### Frontend Testing

**Tools**:
- **Vitest**: Unit and integration tests
- **React Testing Library**: Component tests
- **Playwright**: E2E tests

**Test Structure**:
```
src/watchhive/
├── components/
│   └── common/
│       ├── Button.tsx
│       └── Button.test.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useAuth.test.ts
└── services/
    ├── authService.ts
    └── authService.test.ts
```

### Backend Testing

**Tools**:
- **Jest**: Unit and integration tests
- **Supertest**: API endpoint tests

**Test Structure**:
```
backend/tests/
├── unit/
│   ├── services/
│   └── utils/
├── integration/
│   ├── auth.test.ts
│   ├── entries.test.ts
│   └── social.test.ts
└── e2e/
    └── user-flow.test.ts
```

---

## 📊 Performance Optimization

### Frontend Optimizations

1. **Code Splitting**
   - Route-based splitting
   - Component lazy loading
   - Dynamic imports

2. **Image Optimization**
   - Lazy loading images
   - Responsive images
   - WebP format with fallbacks

3. **Caching**
   - API response caching
   - Service worker (PWA)
   - Browser caching headers

4. **Bundle Optimization**
   - Tree shaking
   - Minification
   - Compression (gzip/brotli)

### Backend Optimizations

1. **Database**
   - Proper indexing
   - Query optimization
   - Connection pooling

2. **Caching**
   - Redis for frequently accessed data
   - Cache invalidation strategies

3. **API**
   - Pagination
   - Rate limiting
   - Response compression

---

## 🔒 Security Considerations

### Frontend Security

- XSS prevention (sanitize user input)
- CSRF protection
- Secure token storage
- HTTPS only
- Content Security Policy

### Backend Security

- Input validation
- SQL injection prevention (Prisma ORM)
- Password hashing (bcrypt)
- JWT best practices
- Rate limiting
- CORS configuration
- Helmet.js for security headers

---

## 🚢 Deployment Strategy

### Backend Deployment

**Options**:
- Vercel (Serverless Functions)
- Railway
- DigitalOcean
- Heroku
- Docker/Self-hosted
- AWS EC2

**Deployment Steps**:
1. Set up production database
2. Configure environment variables
3. Run database migrations
4. Deploy application
5. Set up monitoring

---

## 📈 Monitoring & Analytics

### Error Tracking
- **Sentry**: Frontend and backend error tracking

### Analytics
- **Google Analytics**: User behavior
- **Plausible**: Privacy-friendly analytics

### Performance Monitoring
- **Lighthouse CI**: Performance metrics
- **Web Vitals**: Core Web Vitals tracking

### Logging
- **Winston**: Backend logging
- **LogRocket**: Frontend session replay

---

## 🎯 Success Metrics

### Technical Metrics
- **Performance**: Lighthouse score > 90
- **Uptime**: 99.9% availability
- **Response Time**: API < 200ms (p95)
- **Error Rate**: < 1%

### User Metrics
- **Page Load Time**: < 2 seconds
- **Time to Interactive**: < 3 seconds
- **Bounce Rate**: < 40%

---

## 📝 Next Steps

### Immediate Actions
1. ✅ Review and approve requirements document
2. ⬜ Set up WatchHive folder structure
3. ⬜ Initialize backend project
4. ⬜ Set up database
5. ⬜ Create design system
6. ⬜ Implement authentication

### Phase 1 Checklist
- [ ] Project structure created
- [ ] Backend initialized
- [ ] Database schema implemented
- [ ] Authentication system working
- [ ] Basic UI components created
- [ ] Routing configured

---

**End of Architecture Document**
