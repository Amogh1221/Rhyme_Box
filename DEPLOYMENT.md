# 🚀 Deployment Guide - Rhyme Box

This guide walks you through deploying Rhyme Box to **Vercel (Frontend)** and **Render.com (Backend)**.

---

## 📋 Prerequisites

- GitHub account with your code pushed
- Vercel account
- Render.com account
- All required API keys (OpenRouter, Cloudinary, etc.)

---

## 🔧 Part 1: Deploy Backend to Render.com

### Step 1: Prepare Environment Variables

Before deploying, gather these values:

- **DATABASE_URL** - Your NeonDB/PostgreSQL connection string
- **SECRET_KEY** - Generate with: `openssl rand -hex 32` (or use Render's auto-generate)
- **OPENAI_API_KEY** - Your OpenRouter API key (starts with `sk-or-v1-...`)
- **CLOUDINARY_CLOUD_NAME** - Your Cloudinary cloud name
- **CLOUDINARY_API_KEY** - Your Cloudinary API key
- **CLOUDINARY_API_SECRET** - Your Cloudinary API secret
- **FRONTEND_URL** - Will be set after Vercel deployment (format: `https://your-app.vercel.app`)
- **ALGORITHM** - `HS256`
- **ACCESS_TOKEN_EXPIRE_MINUTES** - `1440`

### Step 2: Deploy to Render

1. **Go to [Render.com](https://render.com)** and sign in
2. Click **"New +"** → **"Web Service"**
3. **Connect your GitHub repository**:
   - Authorize Render to access your GitHub
   - Select the `Rhyme_Box` repository
4. **Configure the service**:
   - **Name**: `rhyme-box-backend` (or your preferred name)
   - **Environment**: `Python 3`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. **Add Environment Variables**:
   - Click **"Advanced"** → **"Add Environment Variable"**
   - Add each variable from Step 1
   - **Important**: Leave `FRONTEND_URL` empty for now (we'll update it after Vercel deployment)
6. Click **"Create Web Service"**
7. **Wait for deployment** (5-10 minutes on first deploy)
8. **Copy your service URL** (e.g., `https://rhyme-box-backend.onrender.com`)
   - This appears in the top-left of your service dashboard

### Step 3: Test Backend

- Visit: `https://your-backend-url.onrender.com/healthz`
- Should return: `{"status": "ok"}`

---

## 🌐 Part 2: Deploy Frontend to Vercel

### Step 1: Update API Configuration

1. Open `frontend/src/js/config.js`
2. Replace the `API_BASE_URL` with your Render backend URL:
   ```javascript
   const API_BASE_URL = 'https://your-backend-service.onrender.com/api';
   ```
   Replace `your-backend-service` with your actual Render service name.

### Step 2: Deploy to Vercel

**Option A: Via Vercel Dashboard (Recommended)**

1. **Go to [Vercel.com](https://vercel.com)** and sign in
2. Click **"Add New..."** → **"Project"**
3. **Import your GitHub repository**:
   - Select `Rhyme_Box` repository
   - Click **"Import"**
4. **Configure the project**:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./` (leave as is - project root)
   - **Build Command**: (leave empty - static site)
   - **Output Directory**: (leave empty)
   - **Install Command**: (leave empty)
5. Click **"Deploy"**
6. **Wait for deployment** (usually 1-2 minutes)
7. **Copy your Vercel URL** (e.g., `https://rhyme-box.vercel.app`)

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Navigate to project root
cd C:\Stuff\Projects\Rhyme_Box

# Deploy (production)
vercel --prod
```

### Step 3: Update Backend CORS

1. **Go back to Render.com** → Your backend service
2. Navigate to **"Environment"** tab
3. **Add/Update** the `FRONTEND_URL` environment variable:
   - **Key**: `FRONTEND_URL`
   - **Value**: Your Vercel URL (e.g., `https://rhyme-box.vercel.app`)
4. **Save** changes (this will trigger an auto-redeploy)
5. Wait for redeployment to complete

---

## ✅ Part 3: Final Configuration

### Update Frontend API URL (if needed)

If you haven't already updated `frontend/src/js/config.js`:
1. Edit the file with your Render backend URL
2. Commit and push to GitHub
3. Vercel will auto-deploy the changes

### Test the Full Stack

1. **Visit your Vercel frontend**: `https://your-app.vercel.app`
2. **Check browser console** for any API errors
3. **Test authentication**:
   - Try signing up
   - Try logging in
4. **Test API endpoints**:
   - Create a poem
   - Generate AI poem
   - View profile

---

## 🔍 Troubleshooting

### Backend Issues

**Problem**: 502 Bad Gateway
- **Solution**: Check Render logs → Ensure all environment variables are set
- Check that database connection string is correct

**Problem**: CORS errors in browser console
- **Solution**: 
  1. Verify `FRONTEND_URL` in Render matches your Vercel URL exactly (no trailing slash)
  2. Ensure backend has been redeployed after adding `FRONTEND_URL`
  3. Check browser console for exact CORS error message

**Problem**: Database connection errors
- **Solution**: 
  1. Verify `DATABASE_URL` format (should include `?sslmode=require` for NeonDB)
  2. Check NeonDB console to ensure database is active

### Frontend Issues

**Problem**: 404 errors for static assets
- **Solution**: Check `vercel.json` routing configuration

**Problem**: API calls failing
- **Solution**: 
  1. Verify `API_BASE_URL` in `frontend/src/js/config.js`
  2. Check browser Network tab to see actual API calls
  3. Verify backend is running and accessible at the URL

---

## 📝 Environment Variables Checklist

### Render.com (Backend)

- [ ] `DATABASE_URL` - Database connection string
- [ ] `SECRET_KEY` - JWT secret (auto-generated or custom)
- [ ] `OPENAI_API_KEY` - OpenRouter API key
- [ ] `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- [ ] `CLOUDINARY_API_KEY` - Cloudinary API key
- [ ] `CLOUDINARY_API_SECRET` - Cloudinary API secret
- [ ] `FRONTEND_URL` - Vercel frontend URL (set after Vercel deployment)
- [ ] `ENVIRONMENT` - `production`
- [ ] `ALGORITHM` - `HS256`
- [ ] `ACCESS_TOKEN_EXPIRE_MINUTES` - `1440`

---

## 🔄 Auto-Deployment

Both platforms support auto-deployment:

- **Render**: Auto-deploys on git push (default)
- **Vercel**: Auto-deploys on git push (default)

To trigger a new deployment:
```bash
git add .
git commit -m "Deploy updates"
git push
```

---

## 🌍 Custom Domains (Optional)

### Vercel Custom Domain

1. Go to Vercel project → **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `FRONTEND_URL` in Render with your custom domain

### Render Custom Domain

1. Go to Render service → **Settings** → **Custom Domain**
2. Add your custom domain
3. Update DNS records as instructed

---

## 📊 Monitoring

- **Render Logs**: Available in service dashboard
- **Vercel Analytics**: Available in project dashboard
- **Health Check**: `https://your-backend.onrender.com/healthz`

---

## 🆘 Support

If you encounter issues:
1. Check Render logs for backend errors
2. Check Vercel deployment logs for frontend errors
3. Check browser console for client-side errors
4. Verify all environment variables are correctly set

---

**🎉 Congratulations! Your Rhyme Box app should now be live!**

