import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmClient } from '../../infrastructure/ai';
import { 
  TestDocument, 
  DocumentType, 
  DocumentStatus,
  TestType,
  TestStep,
  TestCategory 
} from '../../domain/entities';

/**
 * Parameters for generating tests from document
 */
export interface GenerateFromDocumentParams {
  projectId: string;
  documentId: string;
  modelId?: string;
}

/**
 * Parameters for uploading a document
 */
export interface UploadDocumentParams {
  projectId: string;
  name: string;
  type: DocumentType;
  description?: string;
  url?: string;
  content?: string;
  createdBy?: string;
}

/**
 * Generated test case from document
 */
export interface DocumentGeneratedTestCase {
  name: string;
  description: string;
  type: TestType;
  category: TestCategory;
  steps: TestStep[];
  sourceEndpoint?: string;
}

/**
 * Document Generator Service
 * Generates test cases from uploaded documents (OpenAPI, Markdown, etc.)
 */
@Injectable()
export class DocumentGeneratorService {
  private readonly logger = new Logger(DocumentGeneratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmClient: LlmClient,
  ) {}

  /**
   * Upload a document for test generation
   */
  async uploadDocument(params: UploadDocumentParams): Promise<TestDocument> {
    this.logger.debug(`Uploading document: ${params.name} (${params.type})`);

    const created = await this.prisma.testDocument.create({
      data: {
        projectId: params.projectId,
        name: params.name,
        type: params.type,
        description: params.description,
        url: params.url,
        content: params.content,
        status: DocumentStatus.PENDING,
        createdBy: params.createdBy,
      },
    });

    // Start async processing
    this.processDocument(created.id).catch((err) => {
      this.logger.error(`Failed to process document ${created.id}: ${err}`);
    });

    return this.mapToEntity(created);
  }

  /**
   * Get document by ID
   */
  async getById(id: string): Promise<TestDocument | null> {
    const doc = await this.prisma.testDocument.findUnique({
      where: { id },
    });
    return doc ? this.mapToEntity(doc) : null;
  }

  /**
   * List documents by project
   */
  async listByProject(projectId: string): Promise<TestDocument[]> {
    const docs = await this.prisma.testDocument.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    return docs.map((d) => this.mapToEntity(d));
  }

  /**
   * Generate test cases from a document
   */
  async generateFromDocument(params: GenerateFromDocumentParams): Promise<DocumentGeneratedTestCase[]> {
    const doc = await this.getById(params.documentId);
    if (!doc) {
      throw new Error(`Document ${params.documentId} not found`);
    }

    if (!doc.isReady()) {
      throw new Error(`Document ${params.documentId} is not ready for generation`);
    }

    this.logger.debug(`Generating tests from document: ${doc.name}`);

    switch (doc.type) {
      case DocumentType.OPENAPI:
        return this.generateFromOpenApi(doc, params);
      case DocumentType.MARKDOWN:
        return this.generateFromMarkdown(doc, params);
      case DocumentType.POSTMAN:
        return this.generateFromPostman(doc, params);
      default:
        return this.generateFromText(doc, params);
    }
  }

  /**
   * Process document and extract metadata
   */
  private async processDocument(documentId: string): Promise<void> {
    await this.prisma.testDocument.update({
      where: { id: documentId },
      data: { status: DocumentStatus.PROCESSING },
    });

    try {
      const doc = await this.prisma.testDocument.findUnique({
        where: { id: documentId },
      });

      if (!doc) return;

      let metadata: Record<string, any> = {};

      // Parse based on document type
      if (doc.type === 'OPENAPI') {
        metadata = await this.parseOpenApiSpec(doc.content || doc.url || '');
      } else if (doc.type === 'MARKDOWN') {
        metadata = await this.parseMarkdown(doc.content || '');
      }

      await this.prisma.testDocument.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.COMPLETED,
          metadata,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      const err = error as Error;
      await this.prisma.testDocument.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.FAILED,
          errorMessage: err.message,
        },
      });
    }
  }

  /**
   * Parse OpenAPI specification
   */
  private async parseOpenApiSpec(specContent: string): Promise<Record<string, any>> {
    // Simplified parsing - in production use swagger-parser
    try {
      const spec = typeof specContent === 'string' ? JSON.parse(specContent) : specContent;
      const endpoints: Array<{ method: string; path: string; summary?: string }> = [];

      if (spec.paths) {
        for (const [path, methods] of Object.entries(spec.paths as Record<string, any>)) {
          for (const [method, details] of Object.entries(methods as Record<string, any>)) {
            if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
              endpoints.push({
                method: method.toUpperCase(),
                path,
                summary: details.summary || details.description,
              });
            }
          }
        }
      }

      return {
        title: spec.info?.title,
        version: spec.info?.version,
        endpoints,
        endpointCount: endpoints.length,
      };
    } catch {
      return { error: 'Failed to parse OpenAPI spec' };
    }
  }

  /**
   * Parse Markdown document
   */
  private async parseMarkdown(content: string): Promise<Record<string, any>> {
    const headings = content.match(/^#{1,6}\s+(.+)$/gm) || [];
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];

    return {
      headings: headings.map((h) => h.replace(/^#+\s+/, '')),
      codeBlockCount: codeBlocks.length,
      wordCount: content.split(/\s+/).length,
    };
  }

  /**
   * Generate tests from OpenAPI spec
   */
  private async generateFromOpenApi(
    doc: TestDocument,
    params: GenerateFromDocumentParams,
  ): Promise<DocumentGeneratedTestCase[]> {
    const endpoints = doc.getEndpoints();
    const testCases: DocumentGeneratedTestCase[] = [];

    for (const endpoint of endpoints.slice(0, 10)) { // Limit to first 10
      const prompt = `Generate an API test case for:
Endpoint: ${endpoint.method} ${endpoint.path}
Summary: ${endpoint.summary || 'No description'}

Return JSON:
{
  "name": "Test name",
  "description": "Test description",
  "steps": [
    { "order": 1, "type": "HTTP_REQUEST", "target": "${endpoint.path}", "value": "${endpoint.method}" },
    { "order": 2, "type": "ASSERT_STATUS", "value": "200" }
  ]
}`;

      try {
        const generated = await this.llmClient.completeJsonWithModel<{
          name: string;
          description: string;
          steps: TestStep[];
        }>(
          { modelId: params.modelId, projectId: params.projectId },
          prompt,
        );

        testCases.push({
          ...generated,
          type: TestType.API,
          category: TestCategory.FUNCTIONAL,
          sourceEndpoint: `${endpoint.method} ${endpoint.path}`,
        });
      } catch (error) {
        this.logger.error(`Failed to generate test for ${endpoint.path}: ${error}`);
      }
    }

    return testCases;
  }

  /**
   * Generate tests from Markdown document
   */
  private async generateFromMarkdown(
    doc: TestDocument,
    params: GenerateFromDocumentParams,
  ): Promise<DocumentGeneratedTestCase[]> {
    const prompt = `Based on this document, generate test cases:

${doc.content?.substring(0, 4000)}

Generate JSON array of test cases:
[
  {
    "name": "Test name",
    "description": "What this test validates",
    "steps": [{ "order": 1, "type": "NAVIGATE", "target": "/", "description": "Step desc" }]
  }
]`;

    try {
      const generated = await this.llmClient.completeJsonWithModel<DocumentGeneratedTestCase[]>(
        { modelId: params.modelId, projectId: params.projectId },
        prompt,
      );

      return generated.map((tc) => ({
        ...tc,
        type: TestType.WEB,
        category: TestCategory.FUNCTIONAL,
      }));
    } catch (error) {
      this.logger.error(`Failed to generate from markdown: ${error}`);
      return [];
    }
  }

  /**
   * Generate tests from Postman collection
   */
  private async generateFromPostman(
    doc: TestDocument,
    params: GenerateFromDocumentParams,
  ): Promise<DocumentGeneratedTestCase[]> {
    // Simplified - parse Postman collection
    return this.generateFromText(doc, params);
  }

  /**
   * Generate tests from plain text
   */
  private async generateFromText(
    doc: TestDocument,
    params: GenerateFromDocumentParams,
  ): Promise<DocumentGeneratedTestCase[]> {
    const prompt = `Based on these requirements, generate test cases:

${doc.content?.substring(0, 4000) || doc.description}

Return JSON array of test cases.`;

    try {
      const generated = await this.llmClient.completeJsonWithModel<DocumentGeneratedTestCase[]>(
        { modelId: params.modelId, projectId: params.projectId },
        prompt,
      );

      return generated.map((tc) => ({
        ...tc,
        type: tc.type || TestType.WEB,
        category: tc.category || TestCategory.FUNCTIONAL,
      }));
    } catch (error) {
      this.logger.error(`Failed to generate from text: ${error}`);
      return [];
    }
  }

  /**
   * Map Prisma model to entity
   */
  private mapToEntity(data: any): TestDocument {
    return new TestDocument(
      data.id,
      data.projectId,
      data.name,
      data.type as DocumentType,
      data.description,
      data.url,
      data.content,
      data.metadata,
      data.status as DocumentStatus,
      data.processedAt,
      data.errorMessage,
      data.createdAt,
      data.updatedAt,
      data.createdBy,
    );
  }
}
