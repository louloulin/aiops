# AI OPS Backend

This is the backend service for the AI OPS platform, providing APIs for system metrics collection, log management, deployment tracking, knowledge base management, and auto-healing capabilities.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/aiops
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=development
```

3. Start the development server:
```bash
pnpm dev
```

## API Endpoints

### Health Check
- `GET /health` - Check server status

### Metrics
- `GET /api/metrics` - Get all system metrics
- `GET /api/metrics/:metric` - Get specific metric
- `GET /api/metrics/analysis` - Get metrics analysis

### Logs
- `GET /api/logs` - Get logs with optional filters (level, service, limit)
- `POST /api/logs` - Create new log entry
- `GET /api/logs/analysis` - Get log analysis

### Deployments
- `GET /api/deploy` - Get all deployments with optional filters
- `POST /api/deploy` - Create new deployment
- `GET /api/deploy/:id` - Get deployment status
- `PATCH /api/deploy/:id/status` - Update deployment status
- `POST /api/deploy/:id/rollback` - Rollback deployment

### Knowledge Base
- `GET /api/knowledge/search` - Search knowledge base
- `POST /api/knowledge` - Add new knowledge entry
- `POST /api/knowledge/ask` - Ask questions using knowledge base
- `DELETE /api/knowledge/:id` - Delete knowledge entry

### Auto-Healing
- `GET /api/autoheal/rules` - Get all healing rules
- `POST /api/autoheal/rules` - Create new healing rule
- `GET /api/autoheal/incidents` - Get all incidents
- `POST /api/autoheal/incidents` - Create new incident
- `PATCH /api/autoheal/incidents/:id/status` - Update incident status
- `GET /api/autoheal/incidents/:id/healing` - Get healing history for incident

## Database Schema

The application uses PostgreSQL with the following tables:

- `knowledge_embeddings`: Stores document embeddings for the knowledge base
- `metrics`: Stores system metrics data
- `logs`: Stores application logs
- `deployments`: Tracks deployment information
- `incidents`: Tracks system incidents
- `healing_rules`: Stores auto-healing rules
- `healing_history`: Records healing actions taken

## Development

The backend is built with:
- Hono - Web framework
- PostgreSQL - Database
- pgvector - Vector storage for embeddings
- OpenAI - For embeddings and completions
- TypeScript - For type safety

To run tests:
```bash
pnpm test
```

To build for production:
```bash
pnpm build
``` 