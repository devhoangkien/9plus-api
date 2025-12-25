import { Injectable, Logger } from '@nestjs/common';
import { LlmClient, PromptTemplates } from '../../infrastructure/ai';
import { TestCategory, SecurityTestType, TestType, TestStep, TestStepType, RiskLevel } from '../../domain/entities';

/**
 * Parameters for generating security test cases
 */
export interface GenerateSecurityTestParams {
  projectId: string;
  targetUrl: string;
  testTypes: SecurityTestType[];
  modelId?: string;
}

/**
 * Generated security test case
 */
export interface GeneratedSecurityTestCase {
  name: string;
  description: string;
  securityType: SecurityTestType;
  steps: TestStep[];
  targetUrl: string;
  riskLevel: RiskLevel;
}

/**
 * Security scan result
 */
export interface SecurityScanResult {
  vulnerabilityType: SecurityTestType;
  severity: RiskLevel;
  description: string;
  affectedUrl: string;
  payload?: string;
  remediation: string;
}

/**
 * Security Test Service
 * Generates and executes security-focused test cases
 */
@Injectable()
export class SecurityTestService {
  private readonly logger = new Logger(SecurityTestService.name);

  constructor(private readonly llmClient: LlmClient) {}

  /**
   * Generate security test cases for a target URL
   */
  async generateSecurityTests(params: GenerateSecurityTestParams): Promise<GeneratedSecurityTestCase[]> {
    this.logger.debug(`Generating security tests for ${params.targetUrl}`);
    this.logger.debug(`Test types: ${params.testTypes.join(', ')}`);

    const testCases: GeneratedSecurityTestCase[] = [];

    for (const securityType of params.testTypes) {
      const prompt = this.buildSecurityTestPrompt(params.targetUrl, securityType);

      try {
        const generated = await this.llmClient.completeJsonWithModel<{
          name: string;
          description: string;
          steps: TestStep[];
          riskLevel: RiskLevel;
        }>(
          { modelId: params.modelId, projectId: params.projectId },
          prompt,
        );

        testCases.push({
          ...generated,
          securityType,
          targetUrl: params.targetUrl,
        });
      } catch (error) {
        this.logger.error(`Failed to generate ${securityType} test: ${error}`);
      }
    }

    return testCases;
  }

  /**
   * Get common XSS payloads for testing
   */
  getXssPayloads(): string[] {
    return [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      "'-alert('XSS')-'",
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      'javascript:alert("XSS")',
      '<body onload=alert("XSS")>',
      '{{constructor.constructor("alert(1)")()}}',
    ];
  }

  /**
   * Get common SQL injection payloads for testing
   */
  getSqlInjectionPayloads(): string[] {
    return [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT NULL, NULL, NULL --",
      "1' AND '1'='1",
      "admin'--",
      "1; SELECT * FROM users",
      "' OR 1=1 --",
      "1' ORDER BY 1--",
    ];
  }

  /**
   * Get auth bypass payloads
   */
  getAuthBypassPayloads(): string[] {
    return [
      'admin',
      'administrator',
      "admin'--",
      "' OR '1'='1",
      'test@test.com',
      '../../../etc/passwd',
    ];
  }

  /**
   * Build prompt for generating security test
   */
  private buildSecurityTestPrompt(targetUrl: string, securityType: SecurityTestType): string {
    const typeDescriptions: Record<SecurityTestType, string> = {
      [SecurityTestType.XSS_INJECTION]: 'Cross-Site Scripting (XSS) vulnerability testing',
      [SecurityTestType.SQL_INJECTION]: 'SQL Injection vulnerability testing',
      [SecurityTestType.AUTH_BYPASS]: 'Authentication bypass testing',
      [SecurityTestType.CSRF]: 'Cross-Site Request Forgery testing',
      [SecurityTestType.INSECURE_DIRECT_OBJECT]: 'Insecure Direct Object Reference (IDOR) testing',
      [SecurityTestType.SENSITIVE_DATA_EXPOSURE]: 'Sensitive data exposure testing',
      [SecurityTestType.BROKEN_ACCESS_CONTROL]: 'Broken access control testing',
      [SecurityTestType.COMMAND_INJECTION]: 'OS command injection testing',
      [SecurityTestType.PATH_TRAVERSAL]: 'Path traversal vulnerability testing',
    };

    return `You are a security testing expert. Generate a comprehensive security test case for ${typeDescriptions[securityType]}.

Target URL: ${targetUrl}
Security Test Type: ${securityType}

Generate a test case with the following JSON structure:
{
  "name": "Test case name describing the security check",
  "description": "Detailed description of what this test validates",
  "steps": [
    {
      "order": 1,
      "type": "NAVIGATE|TYPE|CLICK|INJECT_XSS|INJECT_SQL|ASSERT_TEXT|etc",
      "description": "Step description",
      "target": "CSS selector or URL",
      "value": "Value to input or expected value"
    }
  ],
  "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL"
}

Include realistic test steps that:
1. Navigate to the target
2. Identify input fields or vulnerable endpoints
3. Inject appropriate payloads
4. Verify if the vulnerability exists
5. Document expected vs actual behavior

Return only valid JSON.`;
  }
}
