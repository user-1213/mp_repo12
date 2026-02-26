import { Router } from 'express';
import { Db, ObjectId } from 'mongodb';
import { aiClassificationService } from '../services/ai-classification';
import { Server } from 'socket.io';

export default function ticketRoutes(db: Db, io: Server) {
  const router = Router();

  // Create a new ticket
  router.post('/', async (req, res) => {
    try {
      const { userId, title, description, email, attachments } = req.body;

      if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
      }

      // Classify the ticket using AI
      const classification = await aiClassificationService.classifyTicket(description);

      const newTicket = {
        conversationId: `CONV-${Date.now()}`,
        userId,
        email,
        title,
        description,
        status: 'Pending',
        priority: classification.priority,
        category: classification.category,
        confidence: classification.confidence,
        relatedArticles: classification.relatedArticles,
        suggestedResolution: classification.suggestedResolution,
        attachments: attachments || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedAgent: null,
        resolutionTime: null,
        notes: [],
      };

      const result = await db.collection('tickets').insertOne(newTicket);

      io.emit('ticket-created', newTicket);

      res.status(201).json({ ...newTicket, _id: result.insertedId });
    } catch (error) {
      console.error('Error creating ticket:', error);
      res.status(500).json({ error: 'Failed to create ticket' });
    }
  });

  // Get all tickets with filtering and sorting
  router.get('/', async (req, res) => {
    try {
      const { status, priority, category, userId, assignedAgent, page = 1, limit = 20 } = req.query;

      const filter: any = {};
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (category) filter.category = category;
      if (userId) filter.userId = userId;
      if (assignedAgent) filter.assignedAgent = assignedAgent;

      const tickets = await db
        .collection('tickets')
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .toArray();

      const total = await db.collection('tickets').countDocuments(filter);

      res.json({
        tickets,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching tickets:', error);
      res.status(500).json({ error: 'Failed to fetch tickets' });
    }
  });

  // Get ticket by ID
  router.get('/:id', async (req, res) => {
    try {
      const ticket = await db.collection('tickets').findOne({
        _id: new ObjectId(req.params.id),
      });

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      res.json(ticket);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      res.status(500).json({ error: 'Failed to fetch ticket' });
    }
  });

  // Update ticket status
  router.patch('/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ['Pending', 'In Progress', 'Resolved', 'Closed'];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const result = await db.collection('tickets').findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        {
          $set: {
            status,
            updatedAt: new Date(),
            resolutionTime: status === 'Resolved' ? new Date() : null,
          },
        },
        { returnDocument: 'after' }
      );

      io.emit('ticket-updated', result.value);

      res.json(result.value);
    } catch (error) {
      console.error('Error updating ticket:', error);
      res.status(500).json({ error: 'Failed to update ticket' });
    }
  });

  // Assign ticket to agent
  router.patch('/:id/assign', async (req, res) => {
    try {
      const { agentId } = req.body;

      const result = await db.collection('tickets').findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        {
          $set: {
            assignedAgent: agentId,
            updatedAt: new Date(),
          },
        },
        { returnDocument: 'after' }
      );

      io.emit('ticket-assigned', result.value);

      res.json(result.value);
    } catch (error) {
      console.error('Error assigning ticket:', error);
      res.status(500).json({ error: 'Failed to assign ticket' });
    }
  });

  // Add note to ticket
  router.post('/:id/notes', async (req, res) => {
    try {
      const { agentId, content } = req.body;

      const note = {
        _id: new ObjectId(),
        agentId,
        content,
        createdAt: new Date(),
      };

      const result = await db.collection('tickets').findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        {
          $push: { notes: note },
          $set: { updatedAt: new Date() },
        },
        { returnDocument: 'after' }
      );

      io.emit('ticket-note-added', result.value);

      res.json(result.value);
    } catch (error) {
      console.error('Error adding note:', error);
      res.status(500).json({ error: 'Failed to add note' });
    }
  });

  return router;
}
