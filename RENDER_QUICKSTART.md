# 🚀 Render Deployment - Quick Reference

## Prerequisites
- ✅ GitHub account
- ✅ Render account (sign up at https://render.com)

## 3-Step Deployment Process

### 1️⃣ Push to GitHub

**Option A: Use the script (Windows)**
```bash
deploy_to_github.bat
```

**Option B: Manual commands**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/chat-app.git
git push -u origin main
```

### 2️⃣ Create PostgreSQL Database (Optional)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Settings:
   - Name: `chat-app-db`
   - Database: `chatapp`
   - Plan: **Free**
4. Click **"Create Database"**
5. **Copy the "Internal Database URL"** (you'll need this)

### 3️⃣ Deploy Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:

```
Name:           chat-app
Region:         US East (or closest)
Branch:         main
Runtime:        Python 3
Build Command:  pip install -r requirements.txt
Start Command:  gunicorn --worker-class eventlet -w 1 app:app
Plan:           Free
```

4. **Add Environment Variables:**

| Variable | Value |
|----------|-------|
| SECRET_KEY | Click "Generate Value" |
| DATABASE_URL | Paste your database URL (if using PostgreSQL) |

5. Click **"Create Web Service"**
6. Wait 5-10 minutes for deployment ⏱️

### 4️⃣ Access Your App

Your app will be available at:
```
https://chat-app-xxxx.onrender.com
```

## Important Configuration Details

### Build Command
```bash
pip install -r requirements.txt
```

### Start Command
```bash
gunicorn --worker-class eventlet -w 1 app:app
```

### Environment Variables Required

**SECRET_KEY** (Required)
- Use Render's "Generate Value" button
- Or create your own: `python -c "import secrets; print(secrets.token_hex(32))"`

**DATABASE_URL** (Optional but recommended)
- Auto-filled if you connect PostgreSQL database
- Without it, data will reset on each deployment

## Free Tier Notes

⚠️ **Important Limitations:**
- App sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- PostgreSQL free tier expires after 90 days

💡 **Upgrade to $7/month for:**
- Always-on service (no sleep)
- Persistent database (no expiration)
- Better performance

## Troubleshooting

**App won't start?**
```
✓ Check logs in Render dashboard
✓ Verify SECRET_KEY is set
✓ Check build completed successfully
```

**Database errors?**
```
✓ Ensure DATABASE_URL is correct
✓ Verify PostgreSQL database is running
✓ Check database URL uses postgresql:// not postgres://
```

**WebSocket issues?**
```
✓ Free tier has WebSocket limitations
✓ Consider upgrading to paid plan
✓ Check browser console for errors
```

## Updating Your App

After making changes:

```bash
git add .
git commit -m "Update message"
git push
```

Render automatically redeploys! 🎉

## Quick Links

- 📊 Render Dashboard: https://dashboard.render.com
- 📖 Deployment Guide: See `DEPLOYMENT.md` for detailed instructions
- 🐛 View Logs: Render Dashboard → Your Service → Logs

## Need Help?

1. Read the full `DEPLOYMENT.md` guide
2. Check Render documentation: https://render.com/docs
3. View your service logs for errors

---

**Ready to deploy? Run `deploy_to_github.bat` to get started!** 🚀

