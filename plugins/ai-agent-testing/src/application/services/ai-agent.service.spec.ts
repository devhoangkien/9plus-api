import { Test, TestingModule } from '@nestjs/testing';
import { AiAgentService } from './ai-agent.service';
import { LlmClient } from '../../infrastructure/ai';
import { TestType, TestStepType } from '../../domain/entities';

describe('AiAgentService', () => {
  let service: AiAgentService;
  let mockLlmClient: jest.Mocked<LlmClient>;

  beforeEach(async () => {
    mockLlmClient = {
      completeJsonWithModel: jest.fn(),
      completeTextWithModel: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAgentService,
        {
          provide: LlmClient,
          useValue: mockLlmClient,
        },
      ],
    }).compile();

    service = module.get<AiAgentService>(AiAgentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateTestCase', () => {
    it('should generate a test case from description', async () => {
      const mockGeneratedTestCase = {
        name: 'Login Test',
        description: 'Test user login functionality',
        steps: [
          {
            order: 1,
            type: TestStepType.NAVIGATE,
            description: 'Navigate to login page',
            target: '/login',
          },
          {
            order: 2,
            type: TestStepType.TYPE,
            description: 'Enter username',
            target: '#username',
            value: 'testuser',
          },
          {
            order: 3,
            type: TestStepType.CLICK,
            description: 'Click login button',
            target: '#login-btn',
          },
        ],
      };

      mockLlmClient.completeJsonWithModel.mockResolvedValue(mockGeneratedTestCase);

      const result = await service.generateTestCase({
        projectId: 'project-1',
        description: 'Test user login with valid credentials',
        testType: TestType.WEB,
        language: 'en',
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('Login Test');
      expect(result.steps).toHaveLength(3);
      expect(mockLlmClient.completeJsonWithModel).toHaveBeenCalled();
    });

    it('should normalize step types', async () => {
      const mockGeneratedTestCase = {
        name: 'Test Case',
        description: 'Description',
        steps: [
          {
            order: 1,
            type: 'invalid_type', // Invalid type should be normalized to CUSTOM
            description: 'Some step',
          },
        ],
      };

      mockLlmClient.completeJsonWithModel.mockResolvedValue(mockGeneratedTestCase);

      const result = await service.generateTestCase({
        projectId: 'project-1',
        description: 'Test description',
        testType: TestType.WEB,
      });

      expect(result.steps[0].type).toBe(TestStepType.CUSTOM);
    });
  });
});
