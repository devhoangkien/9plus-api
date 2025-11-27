/**
 * Test Enums - All enums used in the AI Agent Testing domain
 */

export enum TestType {
  WEB = 'WEB',
  API = 'API',
}

export enum TestRunStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
  ERROR = 'ERROR',
  CANCELLED = 'CANCELLED',
}

export enum TestResultStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
  ERROR = 'ERROR',
}

export enum TestRunTriggerSource {
  MANUAL = 'MANUAL',
  CI_CD = 'CI_CD',
  SCHEDULE = 'SCHEDULE',
  API = 'API',
}

export enum ModelProvider {
  ANTHROPIC = 'ANTHROPIC',
  GOOGLE = 'GOOGLE',
  OPENAI = 'OPENAI',
  AZURE_OPENAI = 'AZURE_OPENAI',
  CUSTOM = 'CUSTOM',
}

export enum TestStepType {
  // Web actions
  NAVIGATE = 'NAVIGATE',
  CLICK = 'CLICK',
  TYPE = 'TYPE',
  SELECT = 'SELECT',
  WAIT = 'WAIT',
  SCREENSHOT = 'SCREENSHOT',
  
  // API actions
  HTTP_REQUEST = 'HTTP_REQUEST',
  
  // Assertions
  ASSERT_TEXT = 'ASSERT_TEXT',
  ASSERT_ELEMENT = 'ASSERT_ELEMENT',
  ASSERT_URL = 'ASSERT_URL',
  ASSERT_STATUS = 'ASSERT_STATUS',
  ASSERT_RESPONSE = 'ASSERT_RESPONSE',
  
  // Control flow
  CUSTOM = 'CUSTOM',
}
