# AI Agent Testing Tasks

## Overview

This checklist covers implementing the AI Agent Testing plugin - a GraphQL-based platform for automated test case generation using AI, supporting Web UI and API testing with CI/CD integration.

---

## ✅ Task Checklist

### 1. Plugin Setup

**Goal**: AI Agent Testing plugin fully operational

- [ ] Navigate to plugin directory
- [ ] Install dependencies
- [ ] Configure environment variables
- [ ] Generate Prisma client
- [ ] Run database migrations
- [ ] Start development server

**Reference Documentation**:

- [`plugins/ai-agent-testing/README.md`](../../plugins/ai-agent-testing/README.md)

**Actions**:

```bash
# Setup plugin
cd plugins/ai-agent-testing
npm install
cp .env.example .env

# Configure .env with your settings
# DATABASE_URL=postgresql://...
# ANTHROPIC_API_KEY=sk-ant-...

# Generate Prisma and migrate
npm run prisma:generate
npm run db:migrate-up

# Start development server
npm run dev
# GraphQL Playground: http://localhost:50053/graphql
```

**Success Criteria**:

- ✅ Dependencies installed
- ✅ Database tables created
- ✅ GraphQL playground accessible

---

### 2. Project & Test Case Management

**Goal**: CRUD operations for projects and test cases

- [ ] Create a new project
- [ ] List/view projects
- [ ] Update project settings
- [ ] Delete project
- [ ] Create test case manually
- [ ] Update test case
- [ ] Delete test case

**Actions**:

```graphql
# Create project
mutation {
  createProject(
    input: {
      name: "My E2E Tests"
      description: "End-to-end testing for my app"
    }
  ) {
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

# Create test case manually
mutation {
  createTestCase(
    input: {
      projectId: "<project-id>"
      name: "Login Test"
      type: WEB
      steps: [
        {
          order: 1
          type: NAVIGATE
          description: "Go to login"
          target: "https://example.com/login"
        }
        {
          order: 2
          type: TYPE
          description: "Enter email"
          target: "#email"
          value: "test@example.com"
        }
        { order: 3, type: CLICK, description: "Submit", target: "#submit" }
      ]
    }
  ) {
    id
    name
    steps {
      order
      type
      target
      value
    }
  }
}
```

**Success Criteria**:

- ✅ Projects created and listed
- ✅ Test cases with steps created
- ✅ Update and delete working

---

### 3. AI Model Configuration

**Goal**: Configure AI models for test generation

- [ ] Configure Anthropic (Claude)
- [ ] Configure OpenAI (GPT-4)
- [ ] Configure Google (Gemini)
- [ ] Set default model
- [ ] Test model connection

**Actions**:

```graphql
# Configure Claude model
mutation {
  createModelConfig(
    input: {
      name: "Claude 3.5 Sonnet"
      provider: ANTHROPIC
      modelName: "claude-3-5-sonnet-20241022"
      apiBaseUrl: "https://api.anthropic.com"
      apiKeyRef: "ANTHROPIC_API_KEY"
      isDefault: true
    }
  ) {
    id
    name
    provider
  }
}

# List model configs
query {
  modelConfigs {
    id
    name
    provider
    isDefault
    isActive
  }
}
```

**Environment Variables**:

```env
# In plugins/ai-agent-testing/.env
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
GOOGLE_API_KEY=AIza-xxx
```

**Success Criteria**:

- ✅ At least one AI model configured
- ✅ Default model set
- ✅ API key accessible via environment

---

### 4. AI Test Generation

**Goal**: Generate test cases from natural language

- [ ] Generate Web test from description (English)
- [ ] Generate Web test from description (Vietnamese)
- [ ] Generate API test from description
- [ ] Generate and save test case
- [ ] Analyze test failure
- [ ] Suggest better locators

**Actions**:

```graphql
# Generate test case from Vietnamese description
mutation {
  generateTestCase(
    input: {
      projectId: "<project-id>"
      description: "Test đăng nhập với email và mật khẩu hợp lệ, xác nhận redirect về trang dashboard"
      type: WEB
      language: "vi"
    }
  ) {
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

# Generate API test
mutation {
  generateTestCase(
    input: {
      projectId: "<project-id>"
      description: "Verify GET /api/users returns 200 with paginated list"
      type: API
      language: "en"
    }
  ) {
    name
    steps {
      type
      target
      value
    }
  }
}

# Generate and save in one step
mutation {
  generateAndSaveTestCase(
    input: {
      projectId: "<project-id>"
      description: "Test user registration flow"
      type: WEB
    }
  ) {
    id
    name
    generatedBy
    originalPrompt
  }
}
```

**Supported Languages**:

- English (`en`)
- Vietnamese (`vi`)

**Test Types**:

- `WEB` - Browser UI tests
- `API` - HTTP API tests

**Success Criteria**:

- ✅ Test cases generated from descriptions
- ✅ Steps include correct selectors
- ✅ Multi-language support working

---

### 5. Test Execution

**Goal**: Execute tests and collect results

- [ ] Create a test run
- [ ] Execute test run
- [ ] View test results
- [ ] Get test run summary
- [ ] Handle failed tests

**Actions**:

```graphql
# Create test run
mutation {
  createTestRun(
    input: {
      projectId: "<project-id>"
      name: "Nightly Test Run"
      testCaseIds: ["<tc1>", "<tc2>", "<tc3>"]
      environment: "staging"
    }
  ) {
    id
    status
  }
}

# Execute test run
mutation {
  executeTestRun(id: "<test-run-id>", testCaseIds: ["<tc1>", "<tc2>"]) {
    id
    status
    passedTests
    failedTests
  }
}

# Get test run summary
query {
  testRunSummary(id: "<test-run-id>") {
    status
    totalTests
    passedTests
    failedTests
    skippedTests
    passRate
    duration
  }
}

# Get detailed results
query {
  testRun(id: "<test-run-id>") {
    id
    status
    results {
      testCase {
        name
      }
      status
      duration
      errorMessage
      stepResults
    }
  }
}
```

**Success Criteria**:

- ✅ Test runs created and executed
- ✅ Results captured with logs
- ✅ Pass/fail statistics calculated

---

### 6. CI/CD Integration

**Goal**: Integrate with CI/CD pipelines

- [ ] Create test run from CI/CD
- [ ] Pass build information
- [ ] Retrieve results for pipeline

**Actions**:

**GitHub Actions Example**:

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
          RESPONSE=$(curl -X POST ${{ secrets.API_URL }}/graphql \
            -H "Content-Type: application/json" \
            -d '{"query":"mutation { createTestRun(input: { projectId: \"${{ secrets.PROJECT_ID }}\", testCaseIds: ${{ secrets.TEST_CASE_IDS }}, triggerSource: CI_CD, buildId: \"${{ github.run_id }}\", commitSha: \"${{ github.sha }}\", branch: \"${{ github.ref_name }}\" }) { id } }"}')
          echo "run_id=$(echo $RESPONSE | jq -r '.data.createTestRun.id')" >> $GITHUB_OUTPUT

      - name: Execute Tests
        run: |
          curl -X POST ${{ secrets.API_URL }}/graphql \
            -H "Content-Type: application/json" \
            -d '{"query":"mutation { executeTestRun(id: \"${{ steps.create-run.outputs.run_id }}\") { status } }"}'

      - name: Check Results
        run: |
          RESPONSE=$(curl -X POST ${{ secrets.API_URL }}/graphql \
            -H "Content-Type: application/json" \
            -d '{"query":"query { testRunSummary(id: \"${{ steps.create-run.outputs.run_id }}\") { status passRate } }"}')
          STATUS=$(echo $RESPONSE | jq -r '.data.testRunSummary.status')
          if [ "$STATUS" != "PASSED" ]; then
            exit 1
          fi
```

**Trigger Sources**:

- `MANUAL` - Triggered from UI/API manually
- `CI_CD` - Triggered from CI/CD pipeline
- `SCHEDULE` - Triggered by scheduler
- `API` - Triggered via API

**Success Criteria**:

- ✅ Tests triggered from CI/CD
- ✅ Build info captured (buildId, commitSha, branch)
- ✅ Results queryable for pipeline decisions

---

## 🔍 Validation Commands

After completing all tasks:

```bash
# Check plugin is running
curl http://localhost:50053/graphql

# Test GraphQL introspection
curl -X POST http://localhost:50053/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name } } }"}'

# Access Prisma Studio for database
cd plugins/ai-agent-testing
npx prisma studio
# Opens at http://localhost:5555
```

---

## 🆘 Common Issues

### AI generation fails

- **Solution**: Verify API key is set correctly
- **Check**: Environment variable matches `apiKeyRef` in ModelConfig

### No default model

- **Solution**: Create a ModelConfig with `isDefault: true`
- **Check**: `query { modelConfigs { isDefault } }`

### Database connection error

- **Solution**: Verify DATABASE_URL in .env
- **Command**: `npx prisma db push --force-reset` (dev only!)

### Test execution hangs

- **Solution**: Check test case steps are valid
- **Note**: Web runner uses mock implementation, not actual browser

---

## 📚 Next Steps

Once AI Agent Testing is operational:

- Integrate with main Gateway for unified API
- Add Playwright integration for real browser tests
- Configure monitoring and alerting
- Set up scheduled test runs

**Related Documentation**:

- [Plugin System Tasks](07-plugin-system.md)
- [Architecture & Services Tasks](03-architecture-services.md)
