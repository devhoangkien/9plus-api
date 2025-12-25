# AI Agent Testing Architecture

## Overview

AI Agent Testing is a plugin for 9Plus CMS that provides automated test case generation using AI models, with support for Web UI testing and API testing.

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        GraphQL Gateway                            │
│                     (Port 3000 - Federation)                      │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│               AI Agent Testing Plugin (Port 50053)                │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     GraphQL Layer                            │ │
│  │  ProjectResolver │ TestCaseResolver │ TestRunResolver       │ │
│  │  ModelConfigResolver │ AiAgentResolver                       │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│                             │                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   Application Layer                          │ │
│  │  ProjectService │ TestCaseService │ TestRunService          │ │
│  │  ModelConfigService │ AiAgentService                         │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│                             │                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  Infrastructure Layer                        │ │
│  │  ┌─────────────────┐  ┌──────────────────────────────────┐  │ │
│  │  │   LLM Client    │  │       Test Runners               │  │ │
│  │  │  ┌───────────┐  │  │  ┌───────────┐ ┌─────────────┐  │  │ │
│  │  │  │ Anthropic │  │  │  │ WebRunner │ │  ApiRunner  │  │  │ │
│  │  │  │  OpenAI   │  │  │  │(Playwright)│ │(HTTP Client)│  │  │ │
│  │  │  │  Gemini   │  │  │  └───────────┘ └─────────────┘  │  │ │
│  │  │  └───────────┘  │  └──────────────────────────────────┘  │ │
│  │  └─────────────────┘                                         │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                        PostgreSQL                                 │
│        (projects, test_cases, test_runs, model_configs)          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Domain Model

```
┌──────────────────┐       ┌──────────────────┐
│     Project      │       │   ModelConfig    │
├──────────────────┤       ├──────────────────┤
│ id               │◄──────│ projectId?       │
│ name             │       │ name             │
│ description      │       │ provider         │
│ defaultModelId   │       │ modelName        │
│ settings         │       │ apiBaseUrl       │
└────────┬─────────┘       │ apiKeyRef        │
         │                 │ isDefault        │
         │                 └──────────────────┘
         │
         ▼
┌──────────────────┐
│    TestCase      │
├──────────────────┤
│ id               │
│ projectId        │
│ name             │
│ type (WEB/API)   │
│ steps (JSON)     │
│ script           │
│ generatedBy      │
│ originalPrompt   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐       ┌──────────────────┐
│    TestRun       │       │  TestRunResult   │
├──────────────────┤       ├──────────────────┤
│ id               │◄──────│ testRunId        │
│ projectId        │       │ testCaseId       │
│ name             │       │ status           │
│ status           │       │ duration         │
│ triggerSource    │       │ logs             │
│ totalTests       │       │ errorMessage     │
│ passedTests      │       │ stepResults      │
│ failedTests      │       └──────────────────┘
│ buildId          │
│ commitSha        │
│ branch           │
└──────────────────┘
```

---

## Test Types

### Web Tests (WEB)

Browser-based UI tests with step types:

| Step Type        | Description           | Example                                       |
| ---------------- | --------------------- | --------------------------------------------- |
| `NAVIGATE`       | Navigate to URL       | `target: "https://example.com"`               |
| `CLICK`          | Click element         | `target: "#submit-btn"`                       |
| `TYPE`           | Type text             | `target: "#email", value: "test@example.com"` |
| `SELECT`         | Select option         | `target: "#country", value: "VN"`             |
| `WAIT`           | Wait for time/element | `value: "2000"` (ms)                          |
| `SCREENSHOT`     | Capture screenshot    | -                                             |
| `ASSERT_TEXT`    | Assert text content   | `target: ".message", value: "Success"`        |
| `ASSERT_ELEMENT` | Assert element exists | `target: "#dashboard"`                        |
| `ASSERT_URL`     | Assert current URL    | `value: "/dashboard"`                         |

### API Tests (API)

HTTP request/response tests:

| Step Type         | Description          | Example                     |
| ----------------- | -------------------- | --------------------------- |
| `HTTP_REQUEST`    | Make HTTP request    | `target: "GET /api/users"`  |
| `ASSERT_STATUS`   | Assert status code   | `value: "200"`              |
| `ASSERT_RESPONSE` | Assert response body | `value: '{"success":true}'` |

---

## AI Providers

| Provider     | Models                           | Environment Variable   |
| ------------ | -------------------------------- | ---------------------- |
| Anthropic    | claude-3-5-sonnet, claude-3-opus | `ANTHROPIC_API_KEY`    |
| OpenAI       | gpt-4-turbo, gpt-4o              | `OPENAI_API_KEY`       |
| Google       | gemini-1.5-pro, gemini-1.5-flash | `GOOGLE_API_KEY`       |
| Azure OpenAI | Deployed models                  | `AZURE_OPENAI_API_KEY` |

---

## Data Flow

### Test Generation Flow

```
User Description (NL)
        │
        ▼
┌───────────────────┐
│  AiAgentService   │
│  generateTestCase │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│    LlmClient      │
│ resolveModelConfig│
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  LLM Provider     │
│ (Anthropic/etc)   │
└────────┬──────────┘
         │
         ▼
   Generated Test Steps
```

### Test Execution Flow

```
TestRun Created
        │
        ▼
┌───────────────────┐
│  TestRunService   │
│  createResults    │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  ExecuteTestSaga  │
│  orchestrate      │
└────────┬──────────┘
         │
    ┌────┴────┐
    ▼         ▼
WebRunner  ApiRunner
    │         │
    └────┬────┘
         │
         ▼
   TestRunResults
```

---

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ai_agent_testing

# Server
PORT=50053

# AI Model API Keys
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
GOOGLE_API_KEY=AIza-xxx
AZURE_OPENAI_API_KEY=xxx
AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com
```

### Project Settings

```json
{
  "defaultTimeout": 30000,
  "screenshotOnFailure": true,
  "retryCount": 2,
  "parallelExecution": false
}
```

---

## Integration Points

### GraphQL Federation

Plugin exposes GraphQL schema that can be composed with Gateway:

- Port: 50053
- Path: /graphql
- Federation: Apollo Federation 2

### Event Bus (Optional)

Uses in-memory event bus for saga orchestration:

- `test.run.started`
- `test.case.executed`
- `test.run.completed`

### CI/CD

Supports integration via:

- `triggerSource: CI_CD`
- `buildId`: Pipeline/workflow ID
- `commitSha`: Git commit hash
- `branch`: Git branch name

---

## Related Documentation

- [Plugin System Tasks](../tasks/07-plugin-system.md)
- [AI Agent Testing Tasks](../tasks/08-ai-agent-testing.md)
- [Plugin README](../../plugins/ai-agent-testing/README.md)
