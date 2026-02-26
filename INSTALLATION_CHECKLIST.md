# Installation & Setup Checklist

## Pre-Installation Requirements

- [ ] Node.js 18+ installed (`node --version`)
- [ ] pnpm installed (`pnpm --version`)
- [ ] MongoDB installed or MongoDB Atlas account
- [ ] OpenAI API key obtained
- [ ] Git installed (optional)

## Step 1: Download & Extract

- [ ] Download IT Support Platform ZIP from v0.app
- [ ] Extract ZIP to desired location
- [ ] Navigate to project directory: `cd it-support-platform`
- [ ] Verify project structure exists

## Step 2: Install Dependencies

```bash
pnpm install
```

- [ ] No errors during installation
- [ ] node_modules folder created
- [ ] All dependencies listed in package.json installed

## Step 3: Environment Configuration

```bash
cp .env.example .env.local
```

- [ ] `.env.local` file created
- [ ] Opened in text editor

### Required Environment Variables

- [ ] `OPENAI_API_KEY` - Set to your OpenAI API key
- [ ] `MONGODB_URI` - Set MongoDB connection string
  - Local: `mongodb://localhost:27017/itsupport`
  - Atlas: `mongodb+srv://user:pass@cluster.mongodb.net/itsupport`
- [ ] `JWT_SECRET` - Set to a strong random string

### Optional Environment Variables (defaults provided)

- [ ] `OPENAI_EMBEDDING_MODEL` - Default: `text-embedding-3-small`
- [ ] `OPENAI_LLM_MODEL` - Default: `gpt-4-turbo`
- [ ] `CHROMA_SERVER_HOST` - Default: `localhost`
- [ ] `CHROMA_SERVER_PORT` - Default: `8000`
- [ ] `NEXT_PUBLIC_API_URL` - Default: `http://localhost:3001`

## Step 4: Start MongoDB

### Option A: Local MongoDB
```bash
mongod
```
- [ ] MongoDB started successfully
- [ ] No connection errors in console
- [ ] Listening on port 27017

### Option B: MongoDB Atlas (Cloud)
- [ ] Account created at mongodb.com
- [ ] Cluster created
- [ ] Connection string copied
- [ ] IP address whitelisted (allow 0.0.0.0 for development)
- [ ] `.env.local` updated with connection string

## Step 5: Start Chroma Vector Database

### Option A: Local Chroma
```bash
# Install if needed
pip install chromadb

# Run
chroma run --path ./chroma-data
```
- [ ] Chroma started successfully
- [ ] Server listening on port 8000
- [ ] No connection errors

### Option B: Docker Chroma
```bash
docker run -p 8000:8000 chromadb/chroma
```
- [ ] Docker installed
- [ ] Container started
- [ ] Port 8000 accessible

## Step 6: Verify Configuration

```bash
# Check if files exist
ls -la app/page.tsx
ls -la .env.local

# Verify environment
cat .env.local | grep OPENAI_API_KEY
```

- [ ] All files present
- [ ] Environment variables set correctly
- [ ] No syntax errors in .env.local

## Step 7: Database Seeding (Optional)

```bash
pnpm seed
```

- [ ] Script started without errors
- [ ] CSV data imported
- [ ] MongoDB populated with 1800+ records
- [ ] Embeddings generated (may take 2-5 minutes)
- [ ] Chroma vector DB indexed

*Skip this step to use demo data instead*

## Step 8: Start Development Server

```bash
pnpm dev
```

- [ ] Build successful
- [ ] Server running on port 3000
- [ ] Console shows "✓ compiled successfully"
- [ ] No errors or warnings

## Step 9: Access Application

- [ ] Open browser to `http://localhost:3000`
- [ ] Landing page loads successfully
- [ ] Page is responsive and styled correctly
- [ ] Navigation links work

## Step 10: Test Authentication

### Employee Login
- [ ] Click "Demo: Employee" on login page
- [ ] Successfully redirected to Employee Dashboard
- [ ] Dashboard shows ticket creation button

### Agent Login
- [ ] Click "Demo: Support Agent" on login page
- [ ] Successfully redirected to Agent Dashboard
- [ ] Agent queue displays tickets

### Admin Login
- [ ] Click "Demo: Administrator" on login page
- [ ] Successfully redirected to Admin Dashboard
- [ ] Analytics dashboard shows KPI metrics and charts

## Step 11: Test Core Features

### Employee Features
- [ ] Create new ticket
- [ ] View ticket status
- [ ] See AI-suggested resolutions
- [ ] Access related KB articles

### Agent Features
- [ ] View ticket queue
- [ ] See AI confidence scores
- [ ] Assign ticket to self
- [ ] Update ticket status
- [ ] Add internal notes

### Admin Features
- [ ] View KPI metrics
- [ ] See category distribution chart
- [ ] Check agent performance stats
- [ ] View 30-day trends
- [ ] Export data to CSV

## Step 12: API Testing (Optional)

```bash
# Test health endpoint
curl http://localhost:3001/health

# Create a ticket
curl -X POST http://localhost:3001/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test ticket"}'

# Get analytics
curl http://localhost:3001/api/analytics/dashboard
```

- [ ] Health endpoint returns status: ok
- [ ] Create ticket returns success
- [ ] Analytics endpoint returns data

## Step 13: Production Build (Optional)

```bash
pnpm build
pnpm start
```

- [ ] Build completes successfully
- [ ] No build errors
- [ ] Production server starts
- [ ] Application accessible at `http://localhost:3000`

## Troubleshooting

### If MongoDB Won't Connect
- [ ] Verify MongoDB is running: `mongosh` or `mongo`
- [ ] Check connection string in `.env.local`
- [ ] Verify port 27017 is open
- [ ] For Atlas: Check IP whitelist, username/password

### If Chroma Won't Connect
- [ ] Verify Chroma is running: `curl http://localhost:8000/api/v1/heartbeat`
- [ ] Check port 8000 is available
- [ ] Try restarting Chroma service

### If OpenAI API Errors
- [ ] Verify API key is correct
- [ ] Check API key has sufficient credits
- [ ] Verify key has permissions
- [ ] Check rate limits at platform.openai.com

### If Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 pnpm dev
```

### If npm/pnpm Command Not Found
- [ ] Verify Node.js installed: `node --version`
- [ ] Install pnpm: `npm install -g pnpm`
- [ ] Verify installation: `pnpm --version`

## Final Verification Checklist

- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] MongoDB running and connected
- [ ] Chroma running and connected
- [ ] Development server starts without errors
- [ ] Landing page accessible
- [ ] Login page accessible
- [ ] Demo accounts work
- [ ] Employee dashboard functional
- [ ] Agent dashboard functional
- [ ] Admin dashboard functional
- [ ] Charts and analytics display correctly
- [ ] CSV export works
- [ ] No console errors in browser

## You're Ready!

If all checkboxes are completed, you're ready to:
1. ✅ Use the application locally
2. ✅ Customize with your own data
3. ✅ Deploy to production
4. ✅ Extend with additional features

## Next Steps

- **Customize**: Modify styles in `app/globals.css`
- **Add Data**: Import your CSV with `pnpm seed`
- **Deploy**: Follow DEPLOYMENT.md
- **Extend**: Add new features and API routes

## Support

- Issues? Check QUICK_START.md
- Deployment? See DEPLOYMENT.md
- Features? Read README.md
- Technical details? See PROJECT_SUMMARY.md

---

**Installation Complete!** 🎉

Your IT Support Platform is ready to use. Happy developing!
