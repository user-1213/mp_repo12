# IT Support Platform - Professional Ticketing System

A comprehensive IT support management platform with AI-powered intelligence, real-time collaboration, and advanced analytics.

## Features

### Core Functionality
- **AI-Powered Ticket Classification**: Automatic categorization and priority assignment using OpenAI embeddings
- **Intelligent Routing**: Smart agent assignment based on expertise and workload
- **Knowledge Base**: Semantic search with OpenAI embeddings for self-service support
- **Real-time Updates**: WebSocket integration for live ticket updates
- **Role-Based Access**: Employee, Agent, and Admin dashboards with tailored interfaces

### Advanced Capabilities
- **Confidence Scoring**: ML-powered confidence metrics (40% similarity + 30% LLM + 30% success rate)
- **AI-Suggested Resolutions**: OpenAI-generated solutions based on KB articles
- **SLA Management**: Automated tracking and escalation
- **Performance Analytics**: Comprehensive dashboards with trends and agent metrics
- **Data Export**: CSV export of analytics and reports

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB
- **Vector Database**: Chroma with OpenAI Embeddings
- **AI**: OpenAI API (GPT-4, text-embedding-3-small)
- **Real-time**: Socket.io for live updates
- **Visualization**: Recharts for analytics

## Project Structure

```
it-support-platform/
├── app/
│   ├── api/                    # Next.js API routes
│   ├── dashboard/
│   │   ├── employee/          # Employee ticket management
│   │   ├── agent/             # Agent ticket queue & management
│   │   └── admin/             # Analytics & administration
│   ├── login/                  # Authentication
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   └── globals.css             # Global styles with dark theme
├── server/
│   ├── index.ts               # Express server
│   ├── routes/
│   │   ├── auth.ts            # Authentication routes
│   │   ├── tickets.ts         # Ticket management
│   │   ├── knowledge-base.ts  # KB operations
│   │   └── analytics.ts       # Analytics endpoints
│   └── services/
│       ├── vector-db.ts       # Chroma vector DB service
│       └── ai-classification.ts # OpenAI integration
├── scripts/
│   └── seed-data.ts           # Database seeding with CSV data
├── components/ui/             # Shadcn UI components
└── public/                     # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm)
- MongoDB instance
- Chroma vector database
- OpenAI API key

### Installation

1. **Clone and navigate to project**
   ```bash
   cd it-support-platform
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your configuration:
   ```
   OPENAI_API_KEY=sk-your-api-key
   OPENAI_EMBEDDING_MODEL=text-embedding-3-small
   OPENAI_LLM_MODEL=gpt-4-turbo
   MONGODB_URI=mongodb://localhost:27017/itsupport
   JWT_SECRET=your-secret-key
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

4. **Start MongoDB**
   ```bash
   mongod
   ```

5. **Start Chroma vector database**
   ```bash
   # Installation: pip install chromadb
   chroma run --path ./chroma-data
   ```

6. **Seed the database** (Optional - with your 1800 record CSV)
   ```bash
   pnpm ts-node scripts/seed-data.ts
   ```

7. **Start the development server**
   ```bash
   pnpm dev
   ```

   Access the application at `http://localhost:3000`

## Demo Accounts

### Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@company.com | demo123 |
| Support Agent | agent@company.com | demo123 |
| Administrator | admin@company.com | demo123 |

Or use the **Demo** buttons on the login page.

## Key Features by Role

### Employee Dashboard
- Create new support tickets
- View ticket status and history
- Track resolution time
- Access AI-suggested resolutions
- View related KB articles

### Agent Dashboard
- Priority-ordered ticket queue
- AI confidence indicators
- Suggested resolutions
- Related KB articles
- Ticket assignment and status updates
- Internal notes and collaboration
- Real-time updates

### Admin Dashboard
- Real-time KPI metrics
- Ticket distribution charts
- Agent performance analytics
- 30-day trend analysis
- Resolution rate tracking
- Priority distribution
- Data export functionality

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Token verification

### Tickets
- `GET /api/tickets` - List tickets with filters
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/:id` - Get ticket details
- `PATCH /api/tickets/:id/status` - Update ticket status
- `PATCH /api/tickets/:id/assign` - Assign to agent
- `POST /api/tickets/:id/notes` - Add ticket notes

### Knowledge Base
- `GET /api/knowledge-base` - List KB articles
- `POST /api/knowledge-base` - Create article
- `GET /api/knowledge-base/search` - Semantic search
- `POST /api/knowledge-base/:id/feedback` - Article feedback

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/agents` - Agent performance
- `GET /api/analytics/trends` - 30-day trends

## AI & ML Integration

### OpenAI Embeddings
- **Model**: text-embedding-3-small
- **Use Cases**: 
  - KB article embeddings for semantic search
  - Ticket similarity matching
  - Query understanding

### Classification System
- **Confidence Score**: 
  - 40% Vector similarity (Chroma search)
  - 30% LLM confidence (GPT-4)
  - 30% Historical success rate

### Smart Routing
Tickets are routed based on:
- Priority level
- Agent expertise (category)
- Current workload
- Historical performance

## Database Schema

### Collections

**Tickets**
```javascript
{
  _id: ObjectId,
  conversationId: String,
  title: String,
  description: String,
  category: String,
  priority: String,
  status: String,
  confidence: Number,
  suggestedResolution: String,
  relatedArticles: Array,
  userId: String,
  assignedAgent: String,
  notes: Array,
  createdAt: Date,
  resolutionTime: Number
}
```

**KB Articles**
```javascript
{
  _id: ObjectId,
  title: String,
  content: String,
  category: String,
  tags: Array,
  views: Number,
  helpful: Number,
  notHelpful: Number,
  createdAt: Date
}
```

**Users**
```javascript
{
  _id: ObjectId,
  email: String,
  name: String,
  role: String, // admin, agent, employee
  createdAt: Date
}
```

## Vector Database

### Chroma Setup
The system uses Chroma for vector storage and semantic search:

- **Collection**: `kb_vectors`
- **Embeddings**: OpenAI (text-embedding-3-small)
- **Purpose**: KB article storage and semantic similarity search

### Indexing
KB articles are automatically indexed when created/updated. Vector embeddings enable:
- Semantic search with natural language
- Similarity-based ticket matching
- Contextual resolution suggestions

## Development

### Build
```bash
pnpm build
```

### Run Production
```bash
pnpm start
```

### Format Code
```bash
pnpm format
```

### Lint
```bash
pnpm lint
```

## Data Import

### CSV Import Script
The `scripts/seed-data.ts` script processes your 1800-record dataset:

1. Reads CSV file
2. Transforms records to ticket format
3. Creates KB articles from resolutions
4. Generates OpenAI embeddings
5. Stores in Chroma vector DB
6. Seeds MongoDB

Run with:
```bash
pnpm ts-node scripts/seed-data.ts
```

## Real-time Features

### Socket.io Events
- `ticket-created` - New ticket notification
- `ticket-updated` - Status changes
- `ticket-assigned` - Assignment notifications
- `ticket-note-added` - Collaboration updates

Implement real-time UI updates by listening to these events.

## Security Considerations

### Current Implementation
- JWT-based authentication
- Role-based access control (RBAC)
- Environment variable security

### Production Recommendations
- Implement bcrypt password hashing
- Add rate limiting
- Enable HTTPS
- Implement CORS properly
- Add audit logging
- Use environment-specific secrets

## Performance Optimization

- **Caching**: Implement Redis for frequently accessed data
- **Pagination**: Tickets endpoint supports pagination
- **Indexing**: MongoDB indexes on status, priority, category
- **Vector Search**: Optimized with Chroma
- **CDN**: Static assets via CDN

## Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Ensure MongoDB is running
mongod
```

**Chroma Connection Error**
```bash
# Start Chroma server
chroma run --path ./chroma-data
```

**OpenAI API Error**
- Verify `OPENAI_API_KEY` in `.env.local`
- Check API key has sufficient quota
- Verify model names are correct

**Port Already in Use**
```bash
# Change PORT in .env.local or kill existing process
lsof -ti:3001 | xargs kill -9
```

## Future Enhancements

- [ ] Multi-language support
- [ ] Advanced ML model integration
- [ ] Chatbot interface
- [ ] Mobile app
- [ ] Integration with third-party tools (Slack, Teams, Jira)
- [ ] Advanced reporting and forecasting
- [ ] Quality assurance metrics
- [ ] Sentiment analysis

## Support

For issues or questions, please refer to the documentation or create an issue in the repository.

## License

MIT License - See LICENSE file for details

## Credits

Built with:
- Next.js by Vercel
- OpenAI API
- MongoDB
- Chroma
- Recharts

---

**Version**: 1.0.0  
**Last Updated**: February 2026
