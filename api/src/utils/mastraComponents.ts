/**
 * Mastra Components
 * 
 * This module centralizes Mastra component imports
 */

// Re-export with type definitions
export { MDocument } from '@mastra/rag';
export { PgVector } from '@mastra/pg';

// Add type declarations to fix TypeScript issues
declare module '@mastra/rag' {
  export interface MDocument {
    embed(): Promise<{ data: number[] }>;
    chunk(options: { strategy: string; size: number }): Promise<any[]>;
  }
}

declare module '@mastra/pg' {
  export interface PgVector {
    search(query: string | number[], options?: { limit?: number }): Promise<any[]>;
    insert(data: { content: string; embedding: number[]; metadata?: any }): Promise<any>;
    delete(id: string): Promise<any>;
  }
} 