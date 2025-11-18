# 🚀 Deployment Guide

This guide walks you through deploying the BPS Telegram Bot to production.

## 📋 Prerequisites Checklist

Before deploying, ensure you have:

- [ ] Telegram Bot Token from @BotFather
- [ ] Supabase project with database tables created
- [ ] Railway account for bot hosting
- [ ] Vercel account for Mini App hosting
- [ ] Your Telegram User ID for admin access
- [ ] Company information updated in config files

## 🗄️ Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your project URL and keys

### 2. Create Database Tables

Execute the SQL from `README.md` in the Supabase SQL editor.

### 3. Configure RLS (Row Level Security)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow service role to bypass RLS
-- (Your bot will use the service key)
```

### 4. Get Your Supabase Credentials

From your Supabase dashboard:
- **URL**: Settings → API → Project URL
- **Anon Key**: Settings → API → Project API keys (anon/public)
- **Service Key**: Settings → API → Project API keys (service_role)

## 🚂 Bot Deployment (Railway)

### 1. Prepare Repository

```bash
# Make sure your code is committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Create new project
3. Connect GitHub repository
4. Select your `bps-telegram-bot` repo

### 3. Add Environment Variables

In Railway dashboard, add these variables:

```env
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
WEBHOOK_URL=https://your-app.up.railway.app
MINI_APP_URL=https://your-mini-app.vercel.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
FIRST_ADMIN_ID=123456789
NODE_ENV=production
PORT=3000
```

### 4. Configure Build Settings

Railway should auto-detect Node.js. If needed:
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 5. Deploy and Get URL

1. Deploy the project
2. Copy your Railway app URL
3. Update `WEBHOOK_URL` environment variable

## 🌐 Mini App Deployment (Vercel)

### 1. Prepare Mini App

Update API URL in `mini-app/app.js`:

```javascript
const API_BASE = 'https://your-railway-app.up.railway.app/api';
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Create new project
3. Import from GitHub
4. Select your repository

### 3. Configure Build Settings

- **Framework**: Other
- **Build Command**: `# No build needed`
- **Output Directory**: `mini-app`
- **Install Command**: `# No install needed`

### 4. Deploy and Get URL

1. Deploy the project
2. Copy your Vercel app URL
3. Update `MINI_APP_URL` in Railway

## 🔧 Post-Deployment Configuration

### 1. Set Telegram Webhook

Execute this HTTP request (use Postman or browser):

```
POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_RAILWAY_URL>/webhook
```

Example:
```
https://api.telegram.org/bot1234567890:ABC/setWebhook?url=https://mybot.up.railway.app/webhook
```

### 2. Test Webhook

Check webhook status:
```
GET https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

### 3. Seed Production Database

**⚠️ Warning: This will clear existing data**

Option 1 - Via Railway CLI:
```bash
railway login
railway link
railway run npm run seed
```

Option 2 - Temporarily enable in script:
Remove the production check in `scripts/seed-database.js` and run manually.

### 4. Setup Admin User

```bash
railway run npm run setup-admin 123456789
```

Or update `config/constants.js` with your admin IDs:

```javascript
ADMIN_IDS: [
  123456789  // Your actual Telegram ID
]
```

## ✅ Testing Deployment

### 1. Test Bot

1. Find your bot on Telegram using the username
2. Send `/start`
3. Verify you see the main menu
4. Test product catalog
5. Test order placement

### 2. Test Admin Features

1. Verify you see "👨‍💼 Admin Panel" button
2. Test viewing orders
3. Test adding products
4. Test statistics

### 3. Test Mini App

1. Click "📦 Mahsulotlar" → "🌐 Chiroyli ko'rish"
2. Verify Mini App opens
3. Test product browsing
4. Test order placement from Mini App

## 🔍 Monitoring & Logging

### Railway Logs

View logs in Railway dashboard:
```bash
railway logs
```

### Supabase Monitoring

- Check database usage in Supabase dashboard
- Monitor API requests
- Review error logs

### Bot Statistics

Use Telegram Bot API to get statistics:
```
GET https://api.telegram.org/bot<TOKEN>/getUpdates
```

## 🚨 Troubleshooting

### Bot Not Responding

1. **Check Railway Logs**
   ```bash
   railway logs --tail
   ```

2. **Verify Environment Variables**
   - All variables set correctly
   - No typos in URLs or tokens

3. **Test Webhook**
   ```bash
   curl -X POST https://api.telegram.org/bot<TOKEN>/getWebhookInfo
   ```

### Database Issues

1. **Connection Errors**
   - Verify Supabase URL and keys
   - Check network connectivity

2. **Permission Errors**
   - Use service key for bot operations
   - Check RLS policies

### Mini App Issues

1. **App Won't Load**
   - Check Vercel deployment status
   - Verify API URL in app.js
   - Check browser console for errors

2. **API Errors**
   - Verify Railway app is running
   - Check CORS settings
   - Test API endpoints directly

## 🔒 Security Checklist

- [ ] Environment variables are set (not in code)
- [ ] Database uses service key (not anon key)
- [ ] Webhook URL uses HTTPS
- [ ] Admin IDs are correct
- [ ] No sensitive data in logs
- [ ] Bot token is from official @BotFather

## 📈 Performance Optimization

1. **Database Indexes**
   - Verify indexes are created
   - Monitor query performance

2. **Railway Resources**
   - Monitor memory usage
   - Check response times

3. **Vercel Caching**
   - Configure appropriate cache headers
   - Optimize Mini App assets

## 🔄 Updates & Maintenance

### Deploying Updates

1. **Code Changes**
   ```bash
   git add .
   git commit -m "Update: description"
   git push origin main
   ```

2. **Railway Auto-Deploy**
   - Railway automatically deploys on git push
   - Monitor deployment in dashboard

3. **Vercel Auto-Deploy**
   - Vercel automatically deploys on git push
   - Check deployment status

### Database Migrations

For database schema changes:
1. Update SQL in Supabase dashboard
2. Test with sample data
3. Document changes in version control

### Backup Strategy

1. **Database Backups**
   - Supabase provides automatic backups
   - Export critical data regularly

2. **Code Backups**
   - Use Git for version control
   - Keep multiple deployment branches

## 📞 Getting Help

If you encounter issues:

1. **Check Documentation**
   - Review README.md
   - Check error messages in logs

2. **Common Issues**
   - Webhook setup
   - Environment variables
   - Database permissions

3. **Community Support**
   - Telegram Bot API docs
   - Railway/Vercel documentation
   - Supabase community

---

**Success! 🎉**

Your BPS Telegram Bot is now live and ready to serve customers!

Remember to:
- Monitor logs regularly
- Keep dependencies updated
- Backup important data
- Test new features before deployment