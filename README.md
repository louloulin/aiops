# AI OPS Platform

A modern platform for AI-powered DevOps operations, built with Hono, Mastra, Vue and Shadcn UI.

## Features

- **Real-time Monitoring**: Monitor system resources (CPU, memory, disk, network) in real-time ✅
- **Log Analysis**: Collect and analyze logs with AI assistance ✅
- **Deployment Management**: Track and manage deployments across environments ✅
- **Knowledge Base**: AI-powered knowledge retrieval and management ⬜
- **Auto-healing**: Automated issue detection and resolution ⬜
- **Predictive Analytics**: Forecast potential issues before they happen ⬜

## Architecture

### API

- **Hono**: Lightweight and fast web framework
- **Mastra**: AI agent framework for intelligent operations
- **PostgreSQL**: For persistent storage
- **pgvector**: Vector database for embeddings

### UI

- **Vue 3**: Progressive JavaScript framework
- **TypeScript**: For type safety
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn UI**: High-quality UI components

## Setup

### Prerequisites

- Node.js 18+
- PNPM
- PostgreSQL

### Installing

1. Clone the repository
   ```bash
   git clone https://github.com/yourname/aiops.git
   cd aiops
   ```

2. Install dependencies with PNPM workspaces
   ```bash
   pnpm install
   ```

3. Set up environment variables
   ```bash
   # API
   cd api
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start development server
   ```bash
   # Run both API and UI in parallel
   pnpm dev
   
   # Or run them separately:
   # API
   cd api
   pnpm dev
   
   # UI
   cd ui
   pnpm dev
   ```

## Progress Report

### Completed

- ✅ **System Architecture**: Set up api with Hono and ui with Vue
- ✅ **Metrics Service**: Implemented real-time system metrics collection
- ✅ **Logs Service**: Implemented log collection and analysis
- ✅ **Deployment Service**: Implemented deployment tracking and management
- ✅ **Dashboard UI**: Implemented main dashboard with metrics, logs, and deployments

### In Progress

- ⬜ **Knowledge Base**: Implementing knowledge retrieval and management
- ⬜ **Auto-healing Service**: Implementing automated repair workflows
- ⬜ **Alerting**: Implementing alert generation and notification

### Future Work

- ⬜ **Predictive Analytics**: ML models for predictive maintenance
- ⬜ **Integration with CI/CD tools**: Connect with popular CI/CD platforms
- ⬜ **Multi-environment Support**: Extend support for multiple environments and clusters

## Project Structure

```
.
├── ui/                # UI application
│   ├── src/
│   │   ├── components/     # Vue components
│   │   ├── router/        # Vue Router configuration
│   │   └── App.vue        # Root component
│   └── package.json
│
└── api/                # API application
    ├── src/
    │   ├── routes/        # API routes
    │   ├── services/      # Business logic
    │   ├── mastra/        # AI components
    │   └── index.ts       # Entry point
    └── package.json
```

## Workspace Commands

```bash
# Run both API and UI
pnpm dev

# Build both API and UI
pnpm build

# Run linting
pnpm lint

# Run tests
pnpm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License. 