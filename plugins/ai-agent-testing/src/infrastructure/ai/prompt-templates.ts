import { TestType, TestStepType } from '../../domain/entities';

/**
 * Parameters for generating test case prompts
 */
export interface GenerateTestCasePromptParams {
  description: string;
  testType: TestType;
  language?: string;
  style?: 'GWT' | 'STEP_BY_STEP';
}

/**
 * Prompt templates for AI test generation
 */
export class PromptTemplates {
  /**
   * Build a prompt for generating test cases from natural language
   */
  static buildGenerateTestCasePrompt(params: GenerateTestCasePromptParams): string {
    const { description, testType, language = 'en', style = 'STEP_BY_STEP' } = params;

    const styleGuidance = style === 'GWT' 
      ? 'Use Given/When/Then format for test steps.'
      : 'Use step-by-step numbered format for test steps.';

    const testTypeGuidance = testType === TestType.WEB
      ? `This is a WEB UI test. Include steps for:
- Navigation (NAVIGATE)
- Clicking elements (CLICK)
- Typing text (TYPE)
- Selecting options (SELECT)
- Waiting for elements (WAIT)
- Assertions (ASSERT_TEXT, ASSERT_ELEMENT, ASSERT_URL)

Use CSS selectors or meaningful element descriptions for targets.`
      : `This is an API test. Include steps for:
- HTTP requests (HTTP_REQUEST)
- Response status assertions (ASSERT_STATUS)
- Response body assertions (ASSERT_RESPONSE)

Specify method, URL, headers, body, and expected responses.`;

    const stepTypes = Object.values(TestStepType).join(', ');

    return `You are a test automation expert. Generate a comprehensive test case from the following description.

## Description
${description}

## Test Type
${testType}

## Instructions
${styleGuidance}
${testTypeGuidance}

## Output Format
Return a JSON object with the following structure:
{
  "name": "Test case name",
  "description": "Brief description of what this test verifies",
  "steps": [
    {
      "order": 1,
      "type": "<STEP_TYPE>",
      "description": "Human-readable step description",
      "target": "CSS selector, XPath, or URL (if applicable)",
      "value": "Input value or expected value (if applicable)",
      "timeout": 5000,
      "options": {}
    }
  ],
  "script": "// Optional: TypeScript/JavaScript test script\\n..."
}

Available step types: ${stepTypes}

Language: ${language === 'vi' ? 'Vietnamese' : 'English'}

Important:
- Be specific with selectors and targets
- Include appropriate wait times
- Add assertions to verify each important action
- Generate realistic test data where needed
- Return ONLY valid JSON, no additional text`;
  }

  /**
   * Build a prompt for analyzing test failures and suggesting fixes
   */
  static buildAnalyzeFailurePrompt(
    testCase: { name: string; steps: any[] },
    errorMessage: string,
    logs?: string,
  ): string {
    return `You are a test automation expert. Analyze the following test failure and suggest fixes.

## Test Case
Name: ${testCase.name}
Steps: ${JSON.stringify(testCase.steps, null, 2)}

## Error
${errorMessage}

${logs ? `## Logs\n${logs}` : ''}

## Instructions
Analyze the failure and provide:
1. Root cause analysis
2. Suggested fixes (specific changes to steps or selectors)
3. General recommendations for test stability

Return a JSON object:
{
  "rootCause": "Description of why the test failed",
  "suggestedFixes": [
    {
      "stepIndex": 0,
      "change": "What to change",
      "reason": "Why this change helps"
    }
  ],
  "recommendations": [
    "General recommendation 1",
    "General recommendation 2"
  ]
}

Return ONLY valid JSON.`;
  }

  /**
   * Build a prompt for suggesting better locators
   */
  static buildLocatorSuggestionPrompt(
    currentSelector: string,
    domSnippet: string,
  ): string {
    return `You are a test automation expert specializing in stable element locators.

## Current Selector
${currentSelector}

## DOM Context
${domSnippet}

## Instructions
Suggest more stable CSS selectors or XPath expressions for this element.
Prefer:
1. Data attributes (data-testid, data-qa)
2. ARIA attributes (aria-label, role)
3. Semantic HTML structure
4. Unique IDs

Avoid:
1. Positional selectors (nth-child, first-child)
2. Generated class names
3. Deep nested selectors

Return a JSON object:
{
  "suggestions": [
    {
      "selector": "The suggested selector",
      "type": "css" or "xpath",
      "confidence": 0.95,
      "reason": "Why this selector is better"
    }
  ]
}

Return ONLY valid JSON.`;
  }
}
