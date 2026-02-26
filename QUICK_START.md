# Quick Start Guide

## 60-Second Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local

# Edit .env.local - at minimum add:
OPENAI_API_KEY=sk-your-api-key-here
```

### 3. Start Services
```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: Chroma Vector DB
chroma run --path ./chroma-data

# Terminal 3: Application
pnpm dev
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001

## Demo Accounts

| Role | Email | Password | Button |
|------|-------|----------|--------|
| Employee | employee@company.com | demo123 | Demo: Employee |
| Agent | agent@company.com | demo123 | Demo: Support Agent |
| Admin | admin@company.com | demo123 | Demo: Administrator |

Click the "Demo" buttons on login page for instant access.

## File Locations

| What | Where |
|------|-------|
| Frontend Pages | `app/` |
| API Routes | `app/api/` |
| Authentication | `app/login/` |
| Employee Dashboard | `app/dashboard/employee/` |
| Agent Dashboard | `app/dashboard/agent/` |
| Admin Dashboard | `app/dashboard/admin/` |
| Backend Server | `server/` |
| Database Scripts | `scripts/` |
| Configuration | `.env.local` |

## Common Commands

```bash
# Development
pnpm dev                 # Start dev server

# Building
pnpm build              # Build for production
pnpm start              # Run production build

# Database
pnpm seed               # Seed with CSV data
pnpm type-check         # TypeScript validation

# Scripts
pnpm lint               # Run linter
```

## Environment Variables

**Required:**
```
OPENAI_API_KEY=sk-...
MONGODB_URI=mongodb://...
JWT_SECRET=your-secret
```

**Optional (with defaults):**
```
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_LLM_MODEL=gpt-4-turbo
CHROMA_SERVER_HOST=localhost
CHROMA_SERVER_PORT=8000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

See `.env.example` for all options.

## What Each Dashboard Does

### Employee Dashboard
- Create new support tickets
- View your open and resolved tickets
- Track ticket progress
- See AI-suggested resolutions
- Access related knowledge base articles

### Agent Dashboard  
- View prioritized ticket queue
- See AI confidence scores (0-100%)
- Get suggested resolutions
- Assign tickets to yourself
- Update ticket status
- Add internal notes
- Collaborate with team

### Admin Dashboard
- Real-time KPI metrics
- Ticket distribution by category
- Priority breakdown
- Agent performance stats
- 30-day trends
- Export reports as CSV

## API Quick Reference

### Create Ticket
```bash
POST /api/tickets
{
  "title": "Cannot connect to Wi-Fi",
  "description": "Network is not available",
  "email": "user@company.com"
}
```

### Get Tickets
```bash
GET /api/tickets?status=Pending&priority=high
```

### Update Ticket Status
```bash
PATCH /api/tickets/{id}/status
{ "status": "Resolved" }
```

### Get Analytics
```bash
GET /api/analytics/dashboard
GET /api/analytics/agents
GET /api/analytics/trends?days=30
```

## Troubleshooting

### Port Already in Use
```bash
# Find process on port 3000
lsof -i :3000

# Kill process (macOS/Linux)
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database Connection Error
```bash
# Ensure MongoDB is running
mongod

# Check connection string in .env.local
MONGODB_URI=mongodb://localhost:27017/itsupport
```

### Chroma Connection Error
```bash
# Start Chroma
chroma run --path ./chroma-data

# Or use Docker
docker run -p 8000:8000 chromadb/chroma
```

### OpenAI API Error
- Verify API key is correct
- Check rate limits at platform.openai.com
- Ensure you have credits
- Try different model names

## File Upload & CSV Import

```bash
# Place your CSV file at:
user_read_only_context/text_attachments/tech_support_dataset-z04mg.csv

# Run seeding
pnpm seed

# Script will:
# 1. Read CSV
# 2. Create tickets
# 3. Generate KB articles
# 4. Create embeddings with OpenAI
# 5. Store in MongoDB & Chroma
```

## Performance Tips

1. **Pagination**: Tickets list is paginated automatically
2. **Caching**: Frontend caches data with SWR (5s default)
3. **Vector Search**: Limited to 5 related articles per ticket
4. **Database**: Indexed on status, priority, category for fast queries

## Monitoring

### Check Server Health
```bash
curl http://localhost:3001/health
```

### Monitor Database
```bash
# MongoDB command line
mongo
db.tickets.count()
db.kb_articles.count()
```

### Check Vector DB
```bash
curl http://localhost:8000/api/v1/heartbeat
```

## Deployment Quick Links

- **Vercel**: See DEPLOYMENT.md → "Vercel Deployment"
- **Docker**: See DEPLOYMENT.md → "Docker Deployment"  
- **Self-hosted**: See DEPLOYMENT.md → "Local Development"

## Security Checklist

Before production:
- [ ] Change JWT_SECRET to strong random value
- [ ] Use HTTPS (Vercel does automatically)
- [ ] Rotate OpenAI API key
- [ ] Set strong MongoDB password
- [ ] Enable MongoDB IP whitelist
- [ ] Configure firewall rules
- [ ] Review .env.local (never commit!)

## Support Resources

- **Documentation**: README.md
- **Deployment**: DEPLOYMENT.md
- **Project Summary**: PROJECT_SUMMARY.md
- **This Guide**: QUICK_START.md

## Next Steps

1. ✅ Install and run locally (you are here)
2. Test with demo accounts
3. Review README.md for full features
4. Customize with your data (CSV import)
5. Deploy to production (see DEPLOYMENT.md)
6. Configure integrations (optional)

---

**Stuck?** Check DEPLOYMENT.md troubleshooting section or review README.md FAQs.
