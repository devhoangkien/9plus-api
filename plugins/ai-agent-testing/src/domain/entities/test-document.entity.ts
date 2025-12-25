/**
 * TestDocument Entity - Represents a document used for test generation
 */
import { DocumentType, DocumentStatus } from './test-enums';

export class TestDocument {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly name: string,
    public readonly type: DocumentType,
    public readonly description: string | null,
    public readonly url: string | null,
    public readonly content: string | null,
    public readonly metadata: Record<string, any> | null,
    public readonly status: DocumentStatus,
    public readonly processedAt: Date | null,
    public readonly errorMessage: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: string | null,
  ) {}

  /**
   * Check if document is ready for test generation
   */
  isReady(): boolean {
    return this.status === DocumentStatus.COMPLETED;
  }

  /**
   * Check if document processing failed
   */
  hasFailed(): boolean {
    return this.status === DocumentStatus.FAILED;
  }

  /**
   * Get endpoints from metadata (for OpenAPI docs)
   */
  getEndpoints(): Array<{ method: string; path: string; summary?: string }> {
    if (this.type !== DocumentType.OPENAPI || !this.metadata) {
      return [];
    }
    return (this.metadata.endpoints as Array<{ method: string; path: string; summary?: string }>) || [];
  }
}
