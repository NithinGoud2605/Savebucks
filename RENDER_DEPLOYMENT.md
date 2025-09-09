# Render Deployment Guide for Savebucks

## 🚀 Complete FREE Deployment on Render

Great choice! Render can handle your entire Savebucks project for **FREE**, including the persistent Telegram worker that Vercel couldn't support.

## ✅ What's FREE on Render

- **Web Services**: 750 hours/month (enough for 24/7 operation)
- **Worker Services**: 750 hours/month (perfect for Telegram bot)
- **Static Sites**: Unlimited bandwidth
- **Custom Domains**: Free SSL certificates
- **Database**: PostgreSQL add-on available
- **Redis**: Redis add-on available

## 📋 Deployment Options

### Option 1: Blueprint Deployment (Recommended)
Use the `render.yaml` file for automatic multi-service deployment.

### Option 2: Manual Service Creation
Create each service individually through the Render dashboard.

## 🛠️ Option 1: Blueprint Deployment

### Step 1: Prepare Your Repository
1. Push your code to GitHub (including the `render.yaml` file)
2. Make sure all environment variables are documented

### Step 2: Connect to Render
1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Select your Savebucks repository
5. Render will automatically detect the `render.yaml` file

### Step 3: Configure Environment Variables
Before deploying, you'll need to set these environment variables in the Render dashboard:

#### Required Variables:
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE=your_supabase_service_role_key

# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_ALLOWED_CHANNELS=channel1,channel2
TELEGRAM_MIN_TITLE_LEN=12

# Site Configuration
SITE_URL=https://your-app-name.onrender.com
```

### Step 4: Deploy
1. Click "Apply" in the Blueprint configuration
2. Render will create all three services automatically:
   - `savebucks-web` (Static Site)
   - `savebucks-api` (Web Service)
   - `savebucks-telegram-worker` (Worker Service)

## 🛠️ Option 2: Manual Service Creation

If you prefer manual setup, create these services individually:

### 1. Web Frontend Service
- **Type**: Static Site
- **Build Command**: `cd apps/web && npm install && npm run build`
- **Publish Directory**: `apps/web/dist`
- **Environment Variables**:
  - `NODE_ENV=production`
  - `VITE_SITE_URL=https://your-api-service.onrender.com`
  - `VITE_API_BASE=https://your-api-service.onrender.com`

### 2. API Backend Service
- **Type**: Web Service
- **Environment**: Node
- **Plan**: Free
- **Build Command**: `cd apps/api && npm install`
- **Start Command**: `cd apps/api && npm start`
- **Health Check Path**: `/health`
- **Environment Variables**:
  - `NODE_ENV=production`
  - `PORT=10000`
  - All Supabase and Redis variables
  - `SITE_URL=https://your-web-service.onrender.com`

### 3. Telegram Worker Service
- **Type**: Background Worker
- **Environment**: Node
- **Plan**: Free
- **Build Command**: `cd apps/worker && npm install`
- **Start Command**: `cd apps/worker && npm start`
- **Environment Variables**:
  - `NODE_ENV=production`
  - All Telegram bot variables
  - Supabase variables
  - `API_BASE=https://your-api-service.onrender.com`

## 🔧 Environment Variables Setup

### Supabase Setup
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the following values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE`

### Upstash Redis Setup
1. Go to [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy the REST URL and token for rate limiting

### Telegram Bot Setup
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Create a new bot with `/newbot`
3. Get your bot token
4. Add the bot to your channels as admin with "Read messages" permission
5. Set allowed channels (comma-separated usernames)

## 🚨 Important Notes

### Free Tier Limitations:
- **750 hours/month** per service (31 days × 24 hours = 744 hours)
- **Sleep after 15 minutes** of inactivity (web services only)
- **512MB RAM** per service
- **No persistent storage** (use external services)

### Workarounds:
1. **Keep-alive service**: Use a service like UptimeRobot to ping your API every 14 minutes
2. **Worker services don't sleep**: Your Telegram bot will run 24/7
3. **External storage**: Use Supabase for database, Upstash for Redis

## 🔄 Service Communication

The services will communicate as follows:
```
User → Web Service (Static) → API Service → Supabase/Redis
Telegram → Worker Service → Supabase
```

## 📊 Monitoring & Logs

### View Logs:
1. Go to your service dashboard
2. Click "Logs" tab
3. Monitor for errors and performance

### Health Checks:
- API service has a `/health` endpoint
- Monitor service uptime in the dashboard

## 🚀 Post-Deployment Steps

### 1. Test Your Deployment
```bash
# Test web service
curl https://your-web-service.onrender.com

# Test API service
curl https://your-api-service.onrender.com/health

# Check if worker is running (check logs)
```

### 2. Set Up Custom Domain (Optional)
1. Go to service settings
2. Add your custom domain
3. Update DNS records as instructed
4. SSL certificate will be automatically provisioned

### 3. Configure Telegram Webhook (Production)
For production, consider switching from long polling to webhooks:

1. Set `TELEGRAM_WEBHOOK_SECRET` in your worker environment
2. Update your API to handle webhook endpoints
3. Configure webhook URL in Telegram

## 💰 Cost Breakdown

### FREE Services:
- **Render**: All three services (750 hours/month each)
- **Supabase**: 500MB database, 50,000 monthly active users
- **Upstash Redis**: 10,000 requests/day

### Total Monthly Cost: **$0** (within free limits)

## 🔧 Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check build logs for missing dependencies
   - Ensure all environment variables are set

2. **Service Not Starting**:
   - Verify start commands are correct
   - Check environment variables
   - Review service logs

3. **Telegram Bot Not Working**:
   - Verify bot token is correct
   - Check if bot is added to channels
   - Ensure worker service is running

4. **API Connection Issues**:
   - Verify API service URL is correct
   - Check CORS settings
   - Ensure Supabase credentials are valid

### Getting Help:
- Check Render documentation
- Review service logs
- Test endpoints individually
- Verify environment variables

## 🎉 Success!

Once deployed, your Savebucks platform will be:
- ✅ Fully functional on free tier
- ✅ Running 24/7 (with keep-alive)
- ✅ Scalable and production-ready
- ✅ Cost-effective ($0/month)

Your Telegram bot will continuously monitor channels and your web app will serve users with real-time deal updates!
