import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { pgVector } from '../config/database';
import { MDocument } from '../utils/mastraComponents';

const app = new Hono();

// Get all articles
app.get('/', async (c) => {
  try {
    // TODO: Implement knowledge articles fetching
    return c.json([
      {
        id: '1',
        title: 'Common Database Issues',
        summary: 'A guide to resolving common database connectivity issues',
        content: 'Full article content here...',
        tags: ['database', 'troubleshooting'],
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Deployment Best Practices',
        summary: 'Best practices for deploying applications in production',
        content: 'Full article content here...',
        tags: ['deployment', 'production'],
        updatedAt: new Date().toISOString()
      }
    ]);
  } catch (error) {
    return c.json({ error: 'Failed to fetch articles' }, 500);
  }
});

// Search articles
app.get('/search', async (c: Context) => {
  try {
    const query = c.req.query('q');
    if (!query) {
      return c.json({ error: 'Search query is required' }, 400);
    }

    const limit = Number(c.req.query('limit')) || 10;
    const results = await pgVector.search(query, { limit });

    return c.json(results);
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return c.json({ error: 'Failed to search knowledge base' }, 500);
  }
});

// Get article by ID
app.get('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    // TODO: Implement article fetching
    return c.json({
      id,
      title: 'Common Database Issues',
      content: 'Full article content here...',
      tags: ['database', 'troubleshooting'],
      updatedAt: new Date().toISOString(),
      related: [
        { id: '2', title: 'Database Performance Tuning' },
        { id: '3', title: 'Database Backup Strategies' }
      ]
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch article' }, 500);
  }
});

// Create new article
app.post('/', async (c: Context) => {
  try {
    const body = await c.req.json();
    const entrySchema = z.object({
      content: z.string(),
      metadata: z.record(z.any()).optional(),
    });

    const validatedData = entrySchema.parse(body);
    const { content, metadata } = validatedData;

    // Create document and generate embedding
    const doc = MDocument.fromText(content);
    const chunks = await doc.chunk({
      strategy: 'recursive',
      size: 512,
    });

    // Store document chunks with embeddings
    const results = await Promise.all(
      chunks.map(async (chunk) => {
        const embedding = await chunk.embed();
        return pgVector.insert({
          content: chunk.text,
          embedding: embedding.data,
          metadata: {
            ...metadata,
            chunkIndex: chunk.index,
            totalChunks: chunks.length,
          },
        });
      })
    );

    return c.json({ message: 'Knowledge entry added successfully', chunks: results.length }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid knowledge entry data', details: error.errors }, 400);
    }
    console.error('Error adding knowledge entry:', error);
    return c.json({ error: 'Failed to add knowledge entry' }, 500);
  }
});

// Update article
app.put('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const body = await c.req.json();
    // TODO: Implement article update
    return c.json({
      id,
      ...body,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    return c.json({ error: 'Failed to update article' }, 500);
  }
});

// Ask a question
app.post('/ask', async (c: Context) => {
  try {
    const body = await c.req.json();
    const questionSchema = z.object({
      question: z.string(),
    });

    const { question } = questionSchema.parse(body);

    // Create document from question and generate embedding
    const doc = MDocument.fromText(question);
    const embedding = await doc.embed();

    // Search for relevant knowledge
    const results = await pgVector.search(embedding.data, { limit: 5 });

    // TODO: Use Mastra to generate answer based on context
    // This would typically involve creating an agent with the retrieved context

    return c.json({
      question,
      context: results,
      answer: 'TODO: Generate answer using Mastra agent',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid question', details: error.errors }, 400);
    }
    console.error('Error processing question:', error);
    return c.json({ error: 'Failed to process question' }, 500);
  }
});

// Delete knowledge entry
app.delete('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    await pgVector.delete(id);
    return c.json({ message: 'Knowledge entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting knowledge entry:', error);
    return c.json({ error: 'Failed to delete knowledge entry' }, 500);
  }
});

export const knowledgeRoutes = app; 