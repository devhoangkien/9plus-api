import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  SagaOrchestrator,
  SagaConfig,
  SagaStep,
  SagaResult,
} from '@anineplus/common';
import { PrismaService } from '../prisma/prisma.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { hashPassword } from '../common/functions';

/**
 * User registration data interface
 */
export interface UserRegistrationData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  roleKey?: string;
}

/**
 * User Registration Saga
 * 
 * Orchestrates the user registration process as a distributed transaction:
 * 1. Validate user doesn't exist
 * 2. Hash password
 * 3. Create user in database
 * 4. Assign default role
 * 5. Publish user created event
 * 
 * If any step fails, compensation is performed to roll back completed steps.
 */
@Injectable()
export class UserRegistrationSaga {
  private readonly logger = new Logger(UserRegistrationSaga.name);

  constructor(
    private readonly sagaOrchestrator: SagaOrchestrator,
    private readonly prisma: PrismaService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  /**
   * Execute user registration saga
   */
  async execute(data: UserRegistrationData): Promise<SagaResult<UserRegistrationData>> {
    const sagaId = `user-registration-${randomUUID()}`;
    
    const config: SagaConfig = {
      sagaId,
      name: 'UserRegistrationSaga',
      timeout: 30000, // 30 seconds
      retryAttempts: 0,
    };

    const steps: SagaStep<UserRegistrationData>[] = [
      this.createValidationStep(),
      this.createPasswordHashingStep(),
      this.createUserCreationStep(),
      this.createRoleAssignmentStep(),
      this.createEventPublishingStep(),
    ];

    return this.sagaOrchestrator.execute(config, steps, data);
  }

  /**
   * Step 1: Validate user doesn't already exist
   */
  private createValidationStep(): SagaStep<UserRegistrationData> {
    return {
      name: 'ValidateUser',
      order: 1,
      execute: async (context) => {
        this.logger.debug(`[${context.sagaId}] Validating user: ${context.data.email}`);
        
        const existingUser = await this.prisma.user.findUnique({
          where: { email: context.data.email },
        });

        if (existingUser) {
          throw new Error(`User with email ${context.data.email} already exists`);
        }

        return { validated: true };
      },
      compensate: async () => {
        // No compensation needed for validation
        this.logger.debug('No compensation needed for validation step');
      },
    };
  }

  /**
   * Step 2: Hash the password
   */
  private createPasswordHashingStep(): SagaStep<UserRegistrationData> {
    return {
      name: 'HashPassword',
      order: 2,
      execute: async (context) => {
        this.logger.debug(`[${context.sagaId}] Hashing password`);
        
        const hashedPassword = await hashPassword(context.data.password);
        
        // Return hashed password without mutating input
        return { hashedPassword };
      },
      compensate: async () => {
        // No compensation needed for hashing
        this.logger.debug('No compensation needed for password hashing step');
      },
    };
  }

  /**
   * Step 3: Create user in database
   */
  private createUserCreationStep(): SagaStep<UserRegistrationData> {
    return {
      name: 'CreateUser',
      order: 3,
      execute: async (context) => {
        this.logger.debug(`[${context.sagaId}] Creating user in database`);
        
        // Get hashed password from previous step
        const hashResult = context.stepResults.get('HashPassword');
        const hashedPassword = hashResult?.hashedPassword;
        
        if (!hashedPassword) {
          throw new Error('Hashed password not found from previous step');
        }
        
        // Generate and validate username
        const username = context.data.username || this.generateUsername(context.data.email);
        
        const user = await this.prisma.user.create({
          data: {
            email: context.data.email,
            username,
            password: hashedPassword,
            firstName: context.data.firstName,
            lastName: context.data.lastName,
            fullName: context.data.firstName && context.data.lastName
              ? `${context.data.firstName} ${context.data.lastName}`
              : context.data.firstName || context.data.lastName,
            name: context.data.firstName || context.data.lastName || context.data.email,
          },
        });

        return { userId: user.id, user };
      },
      compensate: async (context, result) => {
        // Delete the created user
        if (result?.userId) {
          this.logger.warn(`[${context.sagaId}] Compensating: Deleting user ${result.userId}`);
          
          try {
            await this.prisma.user.delete({
              where: { id: result.userId },
            });
            this.logger.debug(`[${context.sagaId}] User ${result.userId} deleted successfully`);
          } catch (error) {
            this.logger.error(
              `[${context.sagaId}] Failed to delete user ${result.userId}: ${error.message}`,
            );
          }
        }
      },
    };
  }

  /**
   * Step 4: Assign default role to user
   */
  private createRoleAssignmentStep(): SagaStep<UserRegistrationData> {
    return {
      name: 'AssignRole',
      order: 4,
      execute: async (context) => {
        this.logger.debug(`[${context.sagaId}] Assigning role to user`);
        
        const createUserResult = context.stepResults.get('CreateUser');
        const userId = createUserResult?.userId;
        
        if (!userId) {
          throw new Error('User ID not found from previous step');
        }

        // Find the role to assign (default to 'user' role)
        const roleKey = context.data.roleKey || 'user';
        const role = await this.prisma.role.findUnique({
          where: { key: roleKey },
        });

        if (!role) {
          throw new Error(`Role ${roleKey} not found`);
        }

        // Assign role to user
        const updatedUser = await this.prisma.user.update({
          where: { id: userId },
          data: {
            roles: {
              connect: { id: role.id },
            },
          },
          include: {
            roles: true,
          },
        });

        return { userId, roleId: role.id, user: updatedUser };
      },
      compensate: async (context, result) => {
        // Remove role from user
        if (result?.userId && result?.roleId) {
          this.logger.warn(
            `[${context.sagaId}] Compensating: Removing role ${result.roleId} from user ${result.userId}`,
          );
          
          try {
            await this.prisma.user.update({
              where: { id: result.userId },
              data: {
                roles: {
                  disconnect: { id: result.roleId },
                },
              },
            });
            this.logger.debug(`[${context.sagaId}] Role removed successfully`);
          } catch (error) {
            this.logger.error(
              `[${context.sagaId}] Failed to remove role: ${error.message}`,
            );
          }
        }
      },
    };
  }

  /**
   * Step 5: Publish user created event to Kafka
   */
  private createEventPublishingStep(): SagaStep<UserRegistrationData> {
    return {
      name: 'PublishEvent',
      order: 5,
      execute: async (context) => {
        this.logger.debug(`[${context.sagaId}] Publishing user created event`);
        
        const roleAssignmentResult = context.stepResults.get('AssignRole');
        const user = roleAssignmentResult?.user;
        
        if (!user) {
          throw new Error('User data not found from previous step');
        }

        await this.kafkaProducer.publishUserEvent('created', {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          roles: user.roles,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }, {
          source: 'user-registration-saga',
          correlationId: context.sagaId,
        });

        return { eventPublished: true };
      },
      compensate: async (context) => {
        // Publish a compensating event (user creation cancelled)
        this.logger.warn(`[${context.sagaId}] Compensating: Publishing user creation cancelled event`);
        
        const roleAssignmentResult = context.stepResults.get('AssignRole');
        const userId = roleAssignmentResult?.userId;
        
        if (userId) {
          try {
            await this.kafkaProducer.publishUserEvent('deleted', {
              id: userId,
              deletedAt: new Date().toISOString(),
            }, {
              source: 'user-registration-saga-compensation',
              correlationId: context.sagaId,
            });
          } catch (error) {
            this.logger.error(
              `[${context.sagaId}] Failed to publish compensation event: ${error.message}`,
            );
          }
        }
      },
    };
  }

  /**
   * Generate a valid username from email
   * Ensures username meets system requirements
   */
  private generateUsername(email: string): string {
    const baseUsername = email.split('@')[0];
    
    // Remove special characters and ensure it meets requirements
    const cleanUsername = baseUsername
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .toLowerCase()
      .substring(0, 30); // Limit length
    
    // Ensure username is not empty after sanitization
    if (!cleanUsername) {
      throw new Error('Unable to generate valid username from email');
    }
    
    return cleanUsername;
  }
}
