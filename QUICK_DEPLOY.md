# ⚡ Quick Deployment Steps

## 🎯 Step-by-Step Deployment

### 🔧 Part 1: Backend on Render.com

1. **Go to [Render.com](https://render.com)** → Sign in → **"New +"** → **"Web Service"**

2. **Connect GitHub repository** → Select `Rhyme_Box`

3. **Configure Service**:
   ```
   Name: rhyme-box-backend
   Environment: Python 3
   Root Directory: backend
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

4. **Add Environment Variables** (in Render dashboard):
   - `DATABASE_URL` - Your NeonDB connection string
   - `SECRET_KEY` - Use Render's "Generate Value" or custom
   - `OPENAI_API_KEY` - Your OpenRouter key
   - `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY` - Your Cloudinary API key
   - `CLOUDINARY_API_SECRET` - Your Cloudinary API secret
   - `ENVIRONMENT` - Set to `production`
   - `ALGORITHM` - Set to `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES` - Set to `1440`
   - `FRONTEND_URL` - **Leave empty for now** (will set after Vercel)

5. **Click "Create Web Service"** → Wait for deployment

6. **Copy your backend URL** (e.g., `https://rhyme-box-backend.onrender.com`)

7. **Test**: Visit `https://your-backend-url.onrender.com/healthz`

---

### 🌐 Part 2: Frontend on Vercel

1. **Update API URL**:
   - Edit `frontend/src/js/config.js`
   - Replace `your-backend-service.onrender.com` with your actual Render backend URL
   ```javascript
   const API_BASE_URL = 'https://rhyme-box-backend.onrender.com/api';
   ```

2. **Go to [Vercel.com](https://vercel.com)** → Sign in → **"Add New Project"**

3. **Import GitHub repository** → Select `Rhyme_Box`

4. **Configure Project**:
   ```
   Framework Preset: Other
   Root Directory: ./ (leave as is)
   Build Command: (leave empty)
   Output Directory: (leave empty)
   ```

5. **Click "Deploy"** → Wait for deployment

6. **Copy your Vercel URL** (e.g., `https://rhyme-box.vercel.app`)

---

### 🔗 Part 3: Connect Frontend & Backend

1. **Go back to Render.com** → Your backend service → **"Environment"** tab

2. **Add/Update** `FRONTEND_URL`:
   - Value: Your Vercel URL (e.g., `https://rhyme-box.vercel.app`)
   - This triggers auto-redeploy

3. **Wait for redeployment** to complete

4. **Test your app**: Visit your Vercel URL

---

## ✅ Quick Checklist

- [ ] Backend deployed on Render.com
- [ ] Backend URL copied (e.g., `https://xxx.onrender.com`)
- [ ] All environment variables set in Render
- [ ] Frontend `config.js` updated with Render URL
- [ ] Frontend deployed on Vercel
- [ ] Vercel URL copied (e.g., `https://xxx.vercel.app`)
- [ ] `FRONTEND_URL` set in Render environment variables
- [ ] Backend redeployed after adding `FRONTEND_URL`
- [ ] Tested health endpoint (`/healthz`)
- [ ] Tested frontend → backend connection

---

## 🔍 Testing

1. **Backend Health**: `https://your-backend.onrender.com/healthz`
2. **Frontend**: `https://your-app.vercel.app`
3. **Check browser console** for any errors
4. **Test login/signup** functionality

---

**See `DEPLOYMENT.md` for detailed documentation and troubleshooting.**

