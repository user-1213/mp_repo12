# Deployment Guide

## Local Development

### Quick Start
```bash
# 1. Install dependencies
pnpm install

# 2. Setup environment
cp .env.example .env.local

# 3. Start MongoDB
mongod

# 4. Start Chroma
chroma run --path ./chroma-data

# 5. Seed database (optional)
pnpm ts-node scripts/seed-data.ts

# 6. Run development server
pnpm dev
```

Visit http://localhost:3000

## Docker Deployment

### Build Docker Image
```bash
docker build -t itsupport-platform .
```

### Run with Docker Compose
```bash
docker-compose up -d
```

See `docker-compose.yml` for full stack setup including MongoDB and Chroma.

## Vercel Deployment

### Step 1: Setup Vercel Project
```bash
vercel link
```

### Step 2: Configure Environment Variables
```bash
vercel env add OPENAI_API_KEY
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add NEXT_PUBLIC_API_URL
```

### Step 3: Deploy
```bash
pnpm build
vercel deploy
```

### Step 4: Post-Deployment
- Set up MongoDB Atlas (managed database)
- Configure Chroma Cloud or self-hosted Chroma
- Update `NEXT_PUBLIC_API_URL` to production URL

## MongoDB Setup

### MongoDB Atlas (Cloud)
1. Create account at mongodb.com
2. Create cluster
3. Get connection string
4. Update `MONGODB_URI` in environment variables

```bash
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/itsupport
```

### Local MongoDB
```bash
# Install MongoDB Community Edition
# macOS with Homebrew
brew install mongodb-community

# Start service
mongod
```

## Chroma Vector Database

### Option 1: Local Chroma
```bash
pip install chromadb
chroma run --path ./chroma-data
```

### Option 2: Chroma Cloud
1. Sign up at chroma.com
2. Create project
3. Get API key and host
4. Update environment variables

```bash
CHROMA_SERVER_HOST=api.chroma.com
CHROMA_SERVER_PORT=443
```

### Option 3: Docker Chroma
```bash
docker run -p 8000:8000 chromadb/chroma
```

## Production Environment Variables

Create `.env.production` with:

```bash
# OpenAI
OPENAI_API_KEY=sk-prod-key-here
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_LLM_MODEL=gpt-4-turbo

# MongoDB
MONGODB_URI=mongodb+srv://prod-user:prod-pass@prod-cluster.mongodb.net/itsupport

# Application
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_API_URL=https://yourdomain.com

# JWT
JWT_SECRET=your-production-secret-key-change-this

# Chroma
CHROMA_SERVER_HOST=api.chroma.com
CHROMA_SERVER_PORT=443
CHROMA_API_KEY=your-chroma-api-key
CHROMA_COLLECTION_NAME=kb_vectors_prod
```

## Database Seeding

### Seed with Production Data
```bash
# Set production environment
NODE_ENV=production
MONGODB_URI=your-prod-mongodb-uri
OPENAI_API_KEY=your-openai-key

# Run seed script
pnpm ts-node scripts/seed-data.ts
```

### Backup and Restore MongoDB
```bash
# Backup
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net" --out=backup/

# Restore
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net" backup/
```

## Performance Optimization

### Database Indexing
```javascript
// Create indexes in MongoDB
db.tickets.createIndex({ status: 1, priority: -1 })
db.tickets.createIndex({ userId: 1, createdAt: -1 })
db.kb_articles.createIndex({ category: 1, tags: 1 })
```

### Caching Strategy
```bash
# Add Redis for caching (optional)
REDIS_URL=redis://prod-redis:6379
```

### CDN Configuration
- Static assets: Use Vercel CDN
- Images: Use Next.js Image Optimization
- API responses: Implement HTTP caching headers

## Monitoring & Logging

### Application Monitoring
```bash
# Install monitoring tools
npm install winston dotenv

# Configure logging in production
NODE_ENV=production pnpm start
```

### Error Tracking
```bash
# Add Sentry for error tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

### Uptime Monitoring
- Monitor `/health` endpoint
- Set up alerts for downtime
- Regular backup verification

## SSL/TLS Certificate

### For Custom Domain
```bash
# Using Let's Encrypt
certbot certonly --standalone -d yourdomain.com

# Configure Nginx/Apache with certificate
```

### Vercel Automatic SSL
- Vercel automatically provisions and renews SSL certificates
- No action needed - handled by Vercel

## Scaling Considerations

### Horizontal Scaling
- Containerize with Docker
- Use Kubernetes for orchestration
- Load balance API endpoints
- Separate database and application servers

### Database Scaling
- Use MongoDB sharding for large datasets
- Implement read replicas
- Archive old tickets to separate collection

### Vector DB Scaling
- Use Chroma Cloud for managed service
- Implement caching layer
- Batch embedding operations

## Database Backup Strategy

### Automated Backups
```bash
# MongoDB Atlas: Automated daily backups included
# Self-hosted: Setup scheduled mongodump

# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --out="$BACKUP_DIR/backup_$DATE"
```

### Disaster Recovery
1. Maintain offsite backups
2. Test restore procedures monthly
3. Document RTO/RPO targets
4. Plan failover procedures

## Security Checklist

- [ ] Change default JWT secret
- [ ] Use HTTPS in production
- [ ] Implement password hashing (bcrypt)
- [ ] Set up CORS properly
- [ ] Enable CSRF protection
- [ ] Implement rate limiting
- [ ] Add request validation
- [ ] Setup firewall rules
- [ ] Rotate API keys regularly
- [ ] Enable audit logging
- [ ] Setup intrusion detection
- [ ] Regular security audits

## Maintenance Tasks

### Weekly
- Monitor error logs
- Check database size
- Review API performance

### Monthly
- Database optimization
- Index analysis
- Vector DB cleanup
- Security patches

### Quarterly
- Full security audit
- Backup restoration test
- Performance profiling
- Capacity planning

## Rollback Procedure

### If Deployment Fails
```bash
# Vercel automatic rollback
vercel rollback

# Manual rollback
vercel deploy --prod --no-automatic-git-integration
```

### Database Rollback
```bash
# Restore from backup
mongorestore --drop --uri="..." backup/
```

## Support & Troubleshooting

### Common Issues

**High API Latency**
- Check MongoDB query performance
- Verify OpenAI API response times
- Review database indexes
- Monitor vector search performance

**Memory Usage**
- Analyze application heap dumps
- Optimize vector cache
- Reduce batch sizes

**SSL Certificate Issues**
- Verify domain DNS
- Check certificate expiration
- Renew early if needed

## Monitoring Commands

```bash
# Monitor MongoDB
mongo --eval "db.serverStatus()"

# Check Chroma health
curl http://localhost:8000/api/v1/heartbeat

# Monitor Node process
ps aux | grep node

# Check port availability
lsof -i :3001
```

## Additional Resources

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Chroma Documentation](https://docs.trychroma.com/)
- [Vercel Docs](https://vercel.com/docs)

---

For detailed support, refer to the project README.md or open an issue in the repository.
