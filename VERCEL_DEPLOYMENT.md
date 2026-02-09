# Vercel Deployment Guide for WatchHive

This guide explains how to deploy the WatchHive full-stack application to Vercel.

## 📁 Repository Structure

WatchHive uses a monorepo structure:
- `/client`: React + Vite frontend
- `/server`: Node.js + Express + Prisma backend

## 🚀 Deployment Steps

### 1. Database Setup
Ensure you have a PostgreSQL database running (e.g., on Neon, Railway, or AWS). Vercel does not provide a managed PostgreSQL database, but you can use their Storage (Neon integration).

### 2. Frontend Deployment
1. Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **New Project**.
3. Import your GitHub repository.
4. For the **Frontend**:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     - `VITE_API_URL`: Your backend URL (e.g., `https://watchhive-api.vercel.app/api/v1`)

### 3. Backend Deployment
1. Click **New Project** again.
2. Import the same repository.
3. For the **Backend**:
   - **Framework Preset**: Other
   - **Root Directory**: `server`
   - **Build Command**: `npm run build` (This generates Prisma client)
   - **Install Command**: `npm install`
   - **Environment Variables**:
     - `DATABASE_URL`: Your database connection string
     - `JWT_SECRET`: A secure random string
     - `JWT_REFRESH_SECRET`: Another secure random string
     - `TMDB_API_KEY`: Your TMDB API key
     - `FRONTEND_URL`: Your frontend URL
     - `NODE_ENV`: production

## 🔧 Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_REFRESH_SECRET` | Secret key for JWT refresh tokens |
| `TMDB_API_KEY` | API key from themoviedb.org |
| `FRONTEND_URL` | URL of your deployed frontend |
| `VITE_API_URL` | URL of your deployed backend API |

## 🛠 Troubleshooting

### Prisma on Vercel
If you encounter issues with Prisma, ensure `npx prisma generate` is part of your build command if not already. The backend `package.json` should handle this.

### CORS Errors
Make sure `FRONTEND_URL` in your backend environment variables exactly matches the domain Vercel assigned to your frontend.
