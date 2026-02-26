import { Router } from 'express';
import { Db, ObjectId } from 'mongodb';
import { addDocumentsToVectorStore, searchSimilarDocuments } from '../services/vector-db';

export default function kbRoutes(db: Db) {
  const router = Router();

  // Create KB article
  router.post('/', async (req, res) => {
    try {
      const { title, content, category, tags } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const article = {
        title,
        content,
        category,
        tags: tags || [],
        views: 0,
        helpful: 0,
        notHelpful: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection('kb_articles').insertOne(article);

      // Add to vector store for semantic search
      await addDocumentsToVectorStore([
        {
          content: `${title}\n${content}`,
          metadata: {
            articleId: result.insertedId.toString(),
            category,
            tags,
          },
        },
      ]);

      res.status(201).json({ ...article, _id: result.insertedId });
    } catch (error) {
      console.error('Error creating KB article:', error);
      res.status(500).json({ error: 'Failed to create article' });
    }
  });

  // Get all KB articles
  router.get('/', async (req, res) => {
    try {
      const { category, tags, page = 1, limit = 20 } = req.query;

      const filter: any = {};
      if (category) filter.category = category;
      if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };

      const articles = await db
        .collection('kb_articles')
        .find(filter)
        .sort({ views: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .toArray();

      const total = await db.collection('kb_articles').countDocuments(filter);

      res.json({
        articles,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching KB articles:', error);
      res.status(500).json({ error: 'Failed to fetch articles' });
    }
  });

  // Search KB articles
  router.get('/search', async (req, res) => {
    try {
      const { q, limit = 5 } = req.query;

      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const results = await searchSimilarDocuments(String(q), Number(limit));

      res.json({ results });
    } catch (error) {
      console.error('Error searching KB:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  // Get article by ID
  router.get('/:id', async (req, res) => {
    try {
      const article = await db.collection('kb_articles').findOne({
        _id: new ObjectId(req.params.id),
      });

      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }

      // Increment views
      await db
        .collection('kb_articles')
        .updateOne({ _id: new ObjectId(req.params.id) }, { $inc: { views: 1 } });

      res.json(article);
    } catch (error) {
      console.error('Error fetching article:', error);
      res.status(500).json({ error: 'Failed to fetch article' });
    }
  });

  // Update article
  router.patch('/:id', async (req, res) => {
    try {
      const { title, content, category, tags } = req.body;

      const result = await db.collection('kb_articles').findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        {
          $set: {
            title: title || undefined,
            content: content || undefined,
            category: category || undefined,
            tags: tags || undefined,
            updatedAt: new Date(),
          },
        },
        { returnDocument: 'after' }
      );

      if (result.value && content) {
        // Update vector store
        await addDocumentsToVectorStore([
          {
            content: `${title || result.value.title}\n${content || result.value.content}`,
            metadata: {
              articleId: req.params.id,
              category: category || result.value.category,
              tags: tags || result.value.tags,
            },
          },
        ]);
      }

      res.json(result.value);
    } catch (error) {
      console.error('Error updating article:', error);
      res.status(500).json({ error: 'Failed to update article' });
    }
  });

  // Mark article as helpful/not helpful
  router.post('/:id/feedback', async (req, res) => {
    try {
      const { helpful } = req.body;

      const updateField = helpful ? 'helpful' : 'notHelpful';

      const result = await db.collection('kb_articles').findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $inc: { [updateField]: 1 } },
        { returnDocument: 'after' }
      );

      res.json(result.value);
    } catch (error) {
      console.error('Error updating feedback:', error);
      res.status(500).json({ error: 'Failed to update feedback' });
    }
  });

  return router;
}
