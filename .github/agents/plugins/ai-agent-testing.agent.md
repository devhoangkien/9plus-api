# AI Agent Testing Platform – Design Doc

Plugin: `plugins/ai-agent-testing`  
Service: GraphQL-based, similar to `payment` / `core`, **no REST API**.  
Stack: **GraphQL + Prisma + PostgreSQL**, with **CQRS**, **Saga**, and **event‑driven design** for complex flows.

Goal: Build an **AI Agent Testing Platform** for 9Plus CMS that supports:

- Managing projects & test cases (Web/API).
- **Managing AI models** (Claude, Gemini, OpenAI, etc.) and their configurations.
- AI Agent that generates test cases & test scripts from Vietnamese/English descriptions.
- Executing web & API tests, storing logs and screenshots.
- CI/CD integration (GitHub Actions).
- Basic dashboard and UI for QA/Dev.
- Extensibility via **CQRS**, **Saga**, and **event‑driven design** (Domain/Application Events).

---

## 1. Scope & Use Cases

### 1.1. Must-have

1. **Project & Test Case Management**
   - Create projects.
   - CRUD test cases:
     - Belong to a project.
     - Core fields: `name`, `description`, `type` (WEB/API), `steps`, `script`.
   - Test classification:
     - `WEB`: UI tests (click, input, UI assertions).
     - `API`: HTTP request/response tests.

2. **AI Model Management**
   - Register available AI models:
     - Example: `claude-3-5-sonnet`, `gemini-1.5-pro`, `gpt-4.1`, etc.
   - Each **ModelConfig** includes:
     - `provider`: `ANTHROPIC`, `GOOGLE`, `OPENAI`, `AZURE_OPENAI`, `CUSTOM`.
     - `modelName`: underlying model name (e.g. `claude-3-5-sonnet-20241022`).
     - `apiBaseUrl`: endpoint.
     - `apiKeyRef`: key or reference to a secret (avoid plain text if possible).
     - `parameters`: JSON config (temperature, maxTokens, topP, etc.).
     - `isDefault`: default model flag.
     - `projectId?`: if you want per-project scoping.
   - CRUD model configs.
   - Choose model when generating test cases:
     - Input `modelId`, or use project/global default.

3. **AI Agent – Generate Test Cases & Scripts from Natural Language**
   - Input:
     - Test flow description (VN/EN).
     - Or requirement/user story.
     - Optional: `modelId` (pick Claude/Gemini/OpenAI…).
   - Output:
     - List of test steps (Given/When/Then or step-by-step).
     - Executable script:
       - Web: DSL (Playwright/Selenium-like) or TypeScript snippet.
       - API: HTTP requests (method, URL, headers, body, assertions).

4. **Web & API Test Execution**
   - Web:
     - Launch browser (headless/headed) via runner (Playwright/Selenium).
     - Execute steps (click, type, navigate, assert).
     - Persist:
       - PASS/FAIL.
       - Logs.
       - Screenshot on FAIL.
   - API:
     - Send HTTP requests (GET/POST/PUT/DELETE…).
     - Validate response (status code, body, headers).
     - Persist PASS/FAIL + logs.
   - Create `TestRun` + `TestRunResult`.

5. **CI/CD Integration (GitHub Actions)**
   - Allow pipelines to:
     - Trigger a test suite/run.
     - Poll results and fail the job if tests FAILED.
   - Output reports as JSON (XML later if needed).

6. **Web UI for QA/Dev**
   - Project & test case list.
   - TestRun detail screen:
     - Suite, pass/fail, logs, screenshots.
   - Test description form:
     - Choose AI model (or default).
     - Call AI agent → preview test case/script → user confirms → save.

### 1.2. Nice-to-have

1. **Auto-create Bug on Test Failures**
   - Integrations:
     - Jira or GitLab Issues.
   - On FAIL:
     - Automatically create ticket.
     - Attach logs, screenshots, test case/run info.

2. **Smart Locator Suggestions**
   - When elements are not found (invalid selector):
     - Agent analyzes DOM snapshot → suggests more stable CSS/XPath selectors.

3. **Simple Dashboard**
   - Pass/fail charts by day/build.
   - Count auto (AI-generated) vs manual test cases.

4. **CQRS, Saga & Event‑Driven**
   - CQRS:
     - Clear separation of **Command** (Mutation → write) and **Query** (read).
   - Saga:
     - Orchestrate multi-step flows like `TestRun` execution.
   - Event‑driven:
     - Domain Events: `TestRunCreated`, `TestRunStarted`, `TestRunCompleted`, `ModelConfigChanged`,…
     - Application Events: `TestRunExecutionRequested` to trigger Saga, `TestRunCompleted` to notify CI/CD, bug systems, etc.

---

## 2. Architecture & Plugin Structure

The plugin lives in `plugins/ai-agent-testing`, with clear separation of domain, application, infrastructure and GraphQL. Uses **Prisma** with **PostgreSQL**, and applies **DDD + Clean Architecture + CQRS + Event‑Driven**.

```text
plugins/
  ai-agent-testing/
    src/
      graphql/
        typeDefs/
          project.graphql
          testCase.graphql
          testRun.graphql
          aiAgent.graphql
          model.graphql
        resolvers/
          project.resolver.ts
          testCase.resolver.ts
          testRun.resolver.ts
          aiAgent.resolver.ts
          model.resolver.ts
      domain/
        entities/
          Project.ts
          TestCase.ts
          TestStep.ts
          TestSuite.ts        # optional, if you need grouping for test cases
          TestRun.ts
          TestRunResult.ts
          TestEnums.ts
          ModelConfig.ts
        repositories/
          ProjectRepository.ts
          TestCaseRepository.ts
          TestRunRepository.ts
          ModelConfigRepository.ts
        events/
          DomainEvent.ts
          TestRunCreatedEvent.ts
          TestRunStartedEvent.ts
          TestRunCompletedEvent.ts
          ModelConfigChangedEvent.ts
        services/
          DomainEventPublisher.ts   # interface for publishing domain events
      application/
        commands/
          CreateProjectCommand.ts
          CreateTestCaseCommand.ts
          CreateTestRunCommand.ts
          GenerateTestCaseCommand.ts
          ConfigureModelCommand.ts
        queries/
          ProjectQueries.ts
          TestCaseQueries.ts
          TestRunQueries.ts
          ModelQueries.ts
        services/
          ProjectService.ts
          TestCaseService.ts
          TestRunService.ts
          AiAgentService.ts
          ModelConfigService.ts
          CiCdReportService.ts
        sagas/
          ExecuteTestRunSaga.ts
        events/
          ApplicationEvent.ts
          TestRunExecutionRequestedEvent.ts
          TestRunCompletedEvent.ts
        bus/
          EventBus.ts             # in-process event bus (publish/subscribe)
      infrastructure/
        prisma/
          client.ts               # PrismaClient instance
          mappers/                # map prisma <-> domain entities
        persistence/
          ProjectPrismaRepository.ts
          TestCasePrismaRepository.ts
          TestRunPrismaRepository.ts
          ModelConfigPrismaRepository.ts
        http/
          HttpClient.ts
        ai/
          LlmClient.ts
          providers/
            OpenAiProvider.ts
            AnthropicProvider.ts
            GeminiProvider.ts
          PromptTemplates.ts
        runner/
          WebRunner.ts
          ApiRunner.ts
        ci/
          GithubActionsReporter.ts
        events/
          InMemoryEventBus.ts     # EventBus implementation
          # Later: KafkaEventBus.ts, RedisEventBus.ts, ...
      config/
        index.ts
    prisma/
      schema.ai-agent-testing.prisma   # Prisma schema fragment for this plugin
    package.json
    README.md
```

**Quick explanation:**

- `domain/entities` + `domain/repositories` + `domain/events`  
  → **DDD domain layer** + **Domain Events**, with no Prisma/GraphQL dependencies.
- `application/commands`, `application/queries`, `application/sagas`  
  → **CQRS layer + Saga orchestration**, using an **EventBus** for event‑driven flows.
- `infrastructure/`  
  → Concrete implementations: Prisma, HTTP, LLM providers (Claude/Gemini/OpenAI), test runners, event bus, etc.

---

## 3. Domain & Prisma

### 3.1. Main Entities (recap)

- `Project`
- `TestCase`
- `TestStep`
- `TestRun`
- `TestRunResult`
- `ModelConfig`

### 3.2. ModelConfig (domain)

**Domain Entity:**

```ts
export enum ModelProvider {
  ANTHROPIC = 'ANTHROPIC',
  GOOGLE = 'GOOGLE',
  OPENAI = 'OPENAI',
  AZURE_OPENAI = 'AZURE_OPENAI',
  CUSTOM = 'CUSTOM',
}

export class ModelConfig {
  constructor(
    public id: string,
    public name: string,
    public provider: ModelProvider,
    public modelName: string,
    public apiBaseUrl: string,
    public apiKeyRef: string,
    public parameters: Record<string, any> | null,
    public isDefault: boolean,
    public projectId: string | null,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}

  setAsDefault() {
    this.isDefault = true;
  }
}
```

**Prisma schema (simplified):**

```prisma
model ModelConfig {
  id         String   @id @default(cuid())
  name       String
  provider   String
  modelName  String
  apiBaseUrl String
  apiKeyRef  String
  parameters Json?
  isDefault  Boolean  @default(false)
  projectId  String?
  project    Project? @relation(fields: [projectId], references: [id])
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

---

## 4. GraphQL Schema

### 4.1. Project & Test Case

Same as earlier design (omitted here for brevity). Includes:

- `Project`, `CreateProjectInput`, `UpdateProjectInput`.
- `TestCase`, `TestStep`, `TestType`, `TestStepType`, `CreateTestCaseInput`, `UpdateTestCaseInput`.

### 4.2. TestRun & Results

Same as before:

- `TestRun`, `TestRunStatus`, `TestRunTriggerSource`.
- `TestRunResult`, `CreateTestRunInput`, `TestRunSummary`.

### 4.3. ModelConfig GraphQL

```graphql
enum ModelProvider {
  ANTHROPIC
  GOOGLE
  OPENAI
  AZURE_OPENAI
  CUSTOM
}

type ModelConfig {
  id: ID!
  name: String!
  provider: ModelProvider!
  modelName: String!
  apiBaseUrl: String!
  apiKeyRef: String!
  parameters: JSON
  isDefault: Boolean!
  projectId: ID
  createdAt: String!
  updatedAt: String!
}

input CreateModelConfigInput {
  name: String!
  provider: ModelProvider!
  modelName: String!
  apiBaseUrl: String!
  apiKeyRef: String!
  parameters: JSON
  isDefault: Boolean
  projectId: ID
}

input UpdateModelConfigInput {
  id: ID!
  name: String
  modelName: String
  apiBaseUrl: String
  apiKeyRef: String
  parameters: JSON
  isDefault: Boolean
}

extend type Query {
  modelConfigs(projectId: ID): [ModelConfig!]!
  modelConfig(id: ID!): ModelConfig
  defaultModelConfig(projectId: ID): ModelConfig
}

extend type Mutation {
  createModelConfig(input: CreateModelConfigInput!): ModelConfig!
  updateModelConfig(input: UpdateModelConfigInput!): ModelConfig!
  deleteModelConfig(id: ID!): Boolean!
  setDefaultModelConfig(id: ID!): ModelConfig!
}
```

### 4.4. Add `modelId` to `generateTestCase`

```graphql
input GenerateTestCaseInput {
  projectId: ID!
  description: String!
  testType: TestType!
  language: String
  style: String
  modelId: ID
}
```

---

## 5. AI Agent, Model Management & LLM Providers

### 5.1. ModelConfigRepository (domain interface)

```ts
export interface ResolveModelOptions {
  modelId?: string;
  projectId?: string;
}

export interface ModelConfigRepository {
  findById(id: string): Promise<ModelConfig | null>;
  listByProject(projectId?: string): Promise<ModelConfig[]>;
  findDefault(projectId?: string): Promise<ModelConfig | null>;
  resolveModel(options: ResolveModelOptions): Promise<ModelConfig | null>;
  save(model: ModelConfig): Promise<ModelConfig>;
  delete(id: string): Promise<void>;
}
```

`resolveModel` logic:

1. If `modelId` is present → `findById`.
2. Otherwise:
   - Find default for this `projectId`.
   - If none → find global default (`projectId` null).

### 5.2. LlmClient + providers

```ts
export class LlmClient {
  constructor(
    private readonly modelRepo: ModelConfigRepository,
    private readonly providers: {
      anthropic: AnthropicProvider;
      google: GeminiProvider;
      openai: OpenAiProvider;
      custom?: any;
    },
  ) {}

  async completeJsonWithModel<T>(
    options: { modelId?: string; projectId?: string },
    prompt: string,
  ): Promise<T> {
    const modelConfig = await this.modelRepo.resolveModel(options);
    if (!modelConfig) throw new Error('ModelConfig not found');

    switch (modelConfig.provider) {
      case 'ANTHROPIC':
        return this.providers.anthropic.completeJson<T>(modelConfig, prompt);
      case 'GOOGLE':
        return this.providers.google.completeJson<T>(modelConfig, prompt);
      case 'OPENAI':
      case 'AZURE_OPENAI':
        return this.providers.openai.completeJson<T>(modelConfig, prompt);
      default:
        if (!this.providers.custom) {
          throw new Error('Custom provider not configured');
        }
        return this.providers.custom.completeJson<T>(modelConfig, prompt);
    }
  }
}
```

### 5.3. AiAgentService (with model selection)

```ts
export interface GenerateTestCaseParams {
  projectId: string;
  description: string;
  testType: 'WEB' | 'API';
  language?: string;
  style?: 'GWT' | 'STEP_BY_STEP';
  modelId?: string;
}

export class AiAgentService {
  constructor(private readonly llmClient: LlmClient) {}

  async generateTestCase(params: GenerateTestCaseParams) {
    const prompt = PromptTemplates.buildGenerateTestCasePrompt(params);

    const raw = await this.llmClient.completeJsonWithModel<GeneratedTestCase>(
      { modelId: params.modelId, projectId: params.projectId },
      prompt,
    );

    return raw;
  }
}
```

---

## 6. CQRS & Event‑Driven Design

### 6.1. CQRS

- **Commands** (`application/commands`):
  - Perform **writes**: create/update/delete Project, TestCase, TestRun, ModelConfig, GenerateTestCase (if persisted).
  - Use Prisma via repositories.

- **Queries** (`application/queries`):
  - Perform **reads**:
    - `ProjectQueries`: getProjects, getProjectById.
    - `TestCaseQueries`: getTestCasesByProject, getTestCaseById.
    - `TestRunQueries`: getTestRunsByProject, getTestRunById, getTestRunSummary.
    - `ModelQueries`: getModelConfigs, getDefaultModelConfig.
  - Optimize queries for UI/Dashboard (joins, aggregations).

GraphQL resolvers:

- Mutations → call **Command**.
- Queries → call **Query**.

### 6.2. Event‑Driven & Saga

#### 6.2.1. DomainEvent & ApplicationEvent

**DomainEvent (`domain/events/DomainEvent.ts`)**

```ts
export interface DomainEvent {
  readonly name: string;
  readonly occurredAt: Date;
}
```

Examples:

- `TestRunCreatedEvent`
- `TestRunStartedEvent`
- `TestRunCompletedEvent`
- `ModelConfigChangedEvent`

**ApplicationEvent (`application/events/ApplicationEvent.ts`)**

```ts
export interface ApplicationEvent {
  readonly name: string;
  readonly payload: any;
  readonly happenedAt: Date;
}
```

Examples:

- `TestRunExecutionRequestedEvent`
- `TestRunCompletedEvent` (for CI/CD, bug creator, etc).

#### 6.2.2. EventBus (`application/bus/EventBus.ts`)

```ts
export interface EventBus {
  publish(event: DomainEvent | ApplicationEvent): Promise<void>;
  subscribe(eventName: string, handler: (event: any) => Promise<void> | void): void;
}
```

`InMemoryEventBus` (infrastructure) implements this interface for in-process pub/sub. Later you can add `KafkaEventBus`, etc.

#### 6.2.3. Saga – ExecuteTestRunSaga

**Flow:**

1. GraphQL mutation `executeTestRun(id)`:
   - Calls `ExecuteTestRunCommand`.
   - Command publishes `TestRunExecutionRequestedEvent`.
2. `ExecuteTestRunSaga` subscribes to this event:
   - Loads `TestRun` + `TestCase` from repositories.
   - Updates status → `RUNNING`, sets `startedAt`.
   - For each `TestCase`:
     - Selects runner (WebRunner/ApiRunner).
     - Executes script/steps, creates `TestRunResult`.
   - After all cases:
     - Aggregates results.
     - Updates status → `PASSED`/`FAILED`/`PARTIAL`/`ERROR`, sets `finishedAt`.
     - Publishes `TestRunCompletedEvent`.
3. `CiCdReportService` / integrations subscribe to `TestRunCompletedEvent`:
   - Send notifications.
   - Update dashboards.
   - Auto-create bugs if configured.

---

## 7. CI/CD Integration (GitHub Actions)

Same as previous design:

1. Pipeline:
   - Call `createTestRun` → get `runId`.
   - Call `executeTestRun` → Saga will run it.
2. Poll `testRunSummary(id)`:
   - If `status != PASSED` → exit 1.

---

## 8. Web UI & Dashboard

- **Project List** → `projects`.
- **Test Case List** → `testCases(projectId)`.
- **AI Generate**:
  - Form inputs: `projectId`, `description`, `testType`, `language`, `style`, `modelId?`.
  - Mutation: `generateTestCase`.
  - Preview steps & script → save via `createTestCase`.
- **Model Management**:
  - List: `modelConfigs(projectId)`.
  - CRUD model configs and set default.
- **Test Run**:
  - List: `testRuns(projectId)`.
  - Detail: `testRun(id)` + `testRunSummary(id)`.
- **Dashboard**:
  - Client-side aggregation from `testRuns(projectId)`.

---

## 9. Implementation Plan

### 9.1. Phase 1 – Foundation + Prisma + CQRS skeleton

- Define Prisma schema (Project, TestCase, TestRun, TestRunResult, ModelConfig).
- Generate Prisma Client.
- Implement Prisma repositories + domain mapping.
- Create GraphQL typeDefs + resolvers using Commands/Queries.

### 9.2. Phase 2 – Model Management & AI Agent

- Implement `ModelConfigService` + resolvers.
- Implement `LlmClient` + providers (Claude/Gemini/OpenAI).
- Implement `AiAgentService.generateTestCase` with `modelId` or default model.

### 9.3. Phase 3 – Runner, Saga & Event‑Driven

- Implement `EventBus` (InMemory).
- Implement basic Domain/Application events.
- Implement `TestRunService` + `ExecuteTestRunSaga`.
- Implement basic `ApiRunner` & `WebRunner` (mock or real).

### 9.4. Phase 4 – CI/CD, UI & Enhancements

- Documentation & example GitHub Actions workflow.
- Admin UI:
  - Project/TestCase/TestRun.
  - Model management.
  - AI Generate.
  - Dashboard.

---

## 10. Technical Notes

- **Protocol**: Everything via GraphQL, **no new REST endpoints**.
- **Stack**: GraphQL + Prisma + PostgreSQL.
- **Architecture**:
  - DDD / Clean Architecture.
  - CQRS (commands vs queries).
  - Event‑driven (Domain/Application events + EventBus).
  - Saga for `TestRun` execution flows.
- **Model security**:
  - `apiKeyRef` should be a reference to a secret (env/secret manager), avoid storing raw keys when possible.
- **Script & log storage**:
  - Script: text stored in DB.
  - Logs/screenshots:
    - Logs: text/JSON.
    - Screenshots: store as files in storage (S3/minio/local) and persist URL in `screenshotUrl`.

This document is the design basis for implementing the `ai-agent-testing` plugin in `9plus-api`, including **AI model management (Claude, Gemini, OpenAI, etc.)**, **CQRS**, **Saga**, and **event‑driven design**.
