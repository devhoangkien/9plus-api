# AI Agent Testing Platform

A GraphQL-based AI Agent Testing Platform for 9Plus CMS that supports automated test case generation, web and API test execution, and CI/CD integration.

## Features

- **Project & Test Case Management**: Create and manage testing projects with Web and API test cases
- **AI Model Management**: Configure multiple AI models (Claude, Gemini, OpenAI, etc.) for test generation
- **AI Agent Test Generation**: Generate test cases from natural language descriptions in Vietnamese or English
- **Web & API Test Execution**: Execute browser-based UI tests and HTTP API tests
- **CI/CD Integration**: Trigger tests from GitHub Actions and retrieve results
- **CQRS & Event-Driven Architecture**: Clean separation of commands and queries with saga orchestration

## Architecture

```
plugins/ai-agent-testing/
├── src/
│   ├── domain/           # Domain entities, events, and repository interfaces
│   │   ├── entities/     # Project, TestCase, TestRun, ModelConfig
│   │   ├── events/       # Domain events
│   │   └── repositories/ # Repository interfaces
│   ├── application/      # Application services, commands, queries, sagas
│   │   ├── services/     # Business logic services
│   │   ├── sagas/        # Saga orchestration (ExecuteTestRunSaga)
│   │   └── bus/          # Event bus interface
│   ├── infrastructure/   # External integrations
│   │   ├── ai/           # LLM client and providers
│   │   ├── runner/       # Web and API test runners
│   │   └── events/       # Event bus implementation
│   ├── graphql/          # GraphQL layer
│   │   ├── resolvers/    # Query and Mutation resolvers
│   │   ├── inputs/       # Input types
│   │   ├── models/       # Object types
│   │   └── dto/          # Args and DTOs
│   └── prisma/           # Database access
├── prisma/
│   └── schema.prisma     # Database schema
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Bun (optional, for development)

### Installation

```bash
cd plugins/ai-agent-testing
npm install
```

### Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run db:migrate-up
```

### Development

```bash
# Start development server
npm run dev
# or
bun dev
```

The GraphQL playground will be available at `http://localhost:50053/graphql`.

## GraphQL API

### Projects

```graphql
# Create a project
mutation {
  createProject(input: {
    name: "My Test Project"
    description: "E2E tests for my application"
  }) {
    id
    name
  }
}

# List projects
query {
  projects {
    id
    name
    description
  }
}
```

### Model Configuration

```graphql
# Configure an AI model
mutation {
  createModelConfig(input: {
    name: "Claude 3.5 Sonnet"
    provider: ANTHROPIC
    modelName: "claude-3-5-sonnet-20241022"
    apiBaseUrl: "https://api.anthropic.com"
    apiKeyRef: "ANTHROPIC_API_KEY"
    isDefault: true
  }) {
    id
    name
  }
}
```

### AI Test Generation

```graphql
# Generate test case from description
mutation {
  generateTestCase(input: {
    projectId: "project-id"
    description: "Test user login with valid credentials"
    type: WEB
    language: "en"
  }) {
    name
    description
    steps {
      order
      type
      description
      target
      value
    }
  }
}

# Generate and save test case
mutation {
  generateAndSaveTestCase(input: {
    projectId: "project-id"
    description: "Verify API returns 200 for GET /users"
    type: API
  }) {
    id
    name
    steps {
      type
      description
    }
  }
}
```

### Test Execution

```graphql
# Create and execute a test run
mutation {
  createTestRun(input: {
    projectId: "project-id"
    name: "Nightly Test Run"
    testCaseIds: ["tc1", "tc2", "tc3"]
  }) {
    id
    status
  }
}

mutation {
  executeTestRun(
    id: "test-run-id"
    testCaseIds: ["tc1", "tc2", "tc3"]
  ) {
    id
    status
    passedTests
    failedTests
  }
}

# Get test run summary
query {
  testRunSummary(id: "test-run-id") {
    status
    totalTests
    passedTests
    failedTests
    passRate
    duration
  }
}
```

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Create Test Run
        id: create-run
        run: |
          RESPONSE=$(curl -X POST http://api.example.com/graphql \
            -H "Content-Type: application/json" \
            -d '{"query":"mutation { createTestRun(input: { projectId: \"${{ env.PROJECT_ID }}\", testCaseIds: [\"tc1\", \"tc2\"], triggerSource: CI_CD, buildId: \"${{ github.run_id }}\", commitSha: \"${{ github.sha }}\", branch: \"${{ github.ref_name }}\" }) { id } }"}')
          echo "run_id=$(echo $RESPONSE | jq -r '.data.createTestRun.id')" >> $GITHUB_OUTPUT
      
      - name: Execute Tests
        run: |
          curl -X POST http://api.example.com/graphql \
            -H "Content-Type: application/json" \
            -d '{"query":"mutation { executeTestRun(id: \"${{ steps.create-run.outputs.run_id }}\", testCaseIds: [\"tc1\", \"tc2\"]) { status } }"}'
      
      - name: Check Results
        run: |
          RESPONSE=$(curl -X POST http://api.example.com/graphql \
            -H "Content-Type: application/json" \
            -d '{"query":"query { testRunSummary(id: \"${{ steps.create-run.outputs.run_id }}\") { status passRate } }"}')
          STATUS=$(echo $RESPONSE | jq -r '.data.testRunSummary.status')
          if [ "$STATUS" != "PASSED" ]; then
            echo "Tests failed!"
            exit 1
          fi
```

## AI Model Providers

### Supported Providers

| Provider | Model Examples |
|----------|---------------|
| Anthropic | claude-3-5-sonnet-20241022, claude-3-opus-20240229 |
| OpenAI | gpt-4-turbo, gpt-4o |
| Google | gemini-1.5-pro, gemini-1.5-flash |
| Azure OpenAI | Deployed models |

### Configuration

Set API keys as environment variables and reference them in model configurations:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export GOOGLE_API_KEY=AIza...
```

## Test Types

### Web Tests (WEB)

Browser-based UI tests with step types:
- `NAVIGATE` - Navigate to URL
- `CLICK` - Click element
- `TYPE` - Type text into input
- `SELECT` - Select dropdown option
- `WAIT` - Wait for time or element
- `SCREENSHOT` - Capture screenshot
- `ASSERT_TEXT` - Assert text content
- `ASSERT_ELEMENT` - Assert element exists
- `ASSERT_URL` - Assert current URL

### API Tests (API)

HTTP request/response tests with step types:
- `HTTP_REQUEST` - Make HTTP request
- `ASSERT_STATUS` - Assert response status code
- `ASSERT_RESPONSE` - Assert response body content

## Development

### Project Structure

- `/src/domain` - Domain models and business logic
- `/src/application` - Application services and use cases
- `/src/infrastructure` - External integrations (AI, runners)
- `/src/graphql` - GraphQL schema and resolvers

### Adding New AI Provider

1. Create provider in `/src/infrastructure/ai/providers/`
2. Implement `LlmProvider` interface
3. Register in `LlmClient`
4. Add provider enum value

### Adding New Test Step Type

1. Add enum value to `TestStepType`
2. Implement execution in `WebRunner` or `ApiRunner`
3. Update prompt templates if needed

## License

MIT
