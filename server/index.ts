import express from 'express';
import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import ticketRoutes from './routes/tickets';
import kbRoutes from './routes/knowledge-base';
import analyticsRoutes from './routes/analytics';
import { initializeVectorDB } from './services/vector-db';
import { aiClassificationService } from './services/ai-classification';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

let db: Db;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database connection
async function initializeDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/itsupport';
    const client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db('itsupport');
    console.log('✓ Connected to MongoDB');

    // Initialize vector DB
    await initializeVectorDB();
    console.log('✓ Vector DB initialized');

    return db;
  } catch (error) {
    console.error('Failed to connect to databases:', error);
    process.exit(1);
  }
}

// Routes
app.use('/api/auth', authRoutes(db));
app.use('/api/tickets', ticketRoutes(db, io));
app.use('/api/knowledge-base', kbRoutes(db));
app.use('/api/analytics', analyticsRoutes(db));

// Socket.io events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-ticket', (ticketId: string) => {
    socket.join(`ticket-${ticketId}`);
  });

  socket.on('leave-ticket', (ticketId: string) => {
    socket.leave(`ticket-${ticketId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

// Start server
async function start() {
  await initializeDB();
  
  httpServer.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);

export { db, io };
