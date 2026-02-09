# Deployment Guide for WatchHive

This guide covers various deployment options for your full-stack WatchHive application.

## 🚀 Quick Deployment Options

### Option 1: Vercel (Recommended - Full-Stack)

Vercel is excellent for both the Vite frontend and the Node.js/Express backend (as serverless functions).

**Frontend & Backend Deployment:**
1. Install Vercel CLI: `npm i -g vercel`
2. Connect your GitHub repository to Vercel.
3. Vercel will auto-detect the monorepo structure.
4. Set the following environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: A secure random string
   - `JWT_REFRESH_SECRET`: Another secure random string
   - `TMDB_API_KEY`: Your TMDB API key
   - `NODE_ENV`: production
5. Deploy!

### Option 2: Railway (Alternative Full-Stack)

### Option 3: Heroku

**Backend:**
```bash
cd server
heroku create watchhive-api
git subtree push --prefix server heroku main
```

**Frontend:**
```bash
cd client
npm run build
# Deploy dist folder to Netlify or similar
```

### Option 4: DigitalOcean App Platform

1. **Create a new App**
2. **Connect your repository**
3. **Configure Components:**
   
   **Backend Component:**
   - Type: Web Service
   - Source Directory: `/server`
   - Build Command: `npm install`
   - Run Command: `npm start`
   - HTTP Port: 5001
   
   **Frontend Component:**
   - Type: Static Site
   - Source Directory: `/client`
   - Build Command: `npm install && npm run build`
   - Output Directory: `dist`

4. **Set Environment Variables**
5. **Deploy**

## 🔧 Pre-Deployment Checklist

- [ ] Update API URLs in frontend to point to production backend
- [ ] Set all environment variables on hosting platform
- [ ] Test the build locally: `npm run build`
- [ ] Ensure `.gitignore` excludes `node_modules` and `.env`
- [ ] Update CORS settings in backend for production domain
- [ ] Enable HTTPS on your hosting platform
- [ ] Set up custom domain (optional)

## 🌐 Environment Variables for Production

**Backend (.env):**
```env
PORT=5001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

**Frontend:**
Update the API calls to use production URL or use environment variables:
```javascript
const API_URL = import.meta.env.VITE_API_URL || '/api'
```

## 📝 Post-Deployment

1. **Test all endpoints:**
   - Visit your frontend URL
   - Check if API calls work
   - Test all buttons and features

2. **Monitor logs:**
   - Check server logs for errors
   - Monitor performance

3. **Set up monitoring:**
   - Use services like Sentry for error tracking
   - Set up uptime monitoring

## 🔒 Security Considerations

1. **Never commit `.env` files**
2. **Use environment variables for all secrets**
3. **Enable HTTPS**
4. **Set proper CORS origins**
5. **Add rate limiting to API endpoints**
6. **Keep dependencies updated**

## 💡 Tips

- **Free Tiers:** Vercel and Railway offer free tiers perfect for this app
- **Custom Domains:** Most platforms support custom domains
- **Auto-Deploy:** Set up automatic deployments from your main branch
- **Staging Environment:** Create a separate deployment for testing

## 🆘 Troubleshooting

**Issue: API calls failing**
- Check if backend is running
- Verify CORS settings
- Check API URL in frontend

**Issue: Build fails**
- Ensure all dependencies are in `package.json`
- Check Node.js version compatibility
- Review build logs for specific errors

**Issue: Port conflicts**
- Use environment variables for ports
- Let hosting platform assign ports automatically

---

Choose the deployment option that best fits your needs. Vercel and Railway are great for beginners!
