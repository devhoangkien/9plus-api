import { Injectable, NotFoundException, BadRequestException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hashPassword, verifyPassword } from '../common/functions';
import { ERROR_MESSAGES, ROLE_USER } from '../common/constants';
import { createGraphQLError, ErrorCodes } from '@anineplus/common';
import { RedisService } from '../redis/redis.service';
import { LoginUserInput, RegisterUserInput } from './inputs';
import { CheckUserExistDto, LoginResponse } from './dtos';
import { PrismaService } from 'src/prisma/prisma.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { UsersDataLoaderService } from './users.dataloader.service';
import DataLoader from 'dataloader';
import { User } from 'prisma/@generated';
import { UserStatusEnum } from 'prisma/@generated';
import { LoginMethod } from 'prisma/@generated';
import { GenderEnum } from 'prisma/@generated';

export interface CreateUserInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  status?: string;
  loginMethod?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  phone?: string;
  status?: UserStatusEnum;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  lastLogin?: Date;
  lastLoginIP?: string;
  failedLoginAttempts?: number;
  lockoutExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

@Injectable()
export class UsersService {
  private userByIdLoader: DataLoader<string, User | null>;
  private userByEmailLoader: DataLoader<string, User | null>;
  private userByUsernameLoader: DataLoader<string, User | null>;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly usersDataLoaderService: UsersDataLoaderService,
  ) {
    // Initialize DataLoaders
    this.userByIdLoader = this.usersDataLoaderService.createUserByIdLoader();
    this.userByEmailLoader = this.usersDataLoaderService.createUserByEmailLoader();
    this.userByUsernameLoader = this.usersDataLoaderService.createUserByUsernameLoader();
  }

  async register(input: RegisterUserInput): Promise<any> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingUser) {
      throw createGraphQLError(
        HttpStatus.BAD_REQUEST,
        ERROR_MESSAGES.USER.EMAIL_EXISTS.MESSAGE,
        ERROR_MESSAGES.USER.EMAIL_EXISTS.CODE,
      );
    }

    const hashedPassword = await hashPassword(input.password);
    const role = await this.prisma.role.findUnique({
      where: {
        key: ROLE_USER,
      },
    });
    if (!role) {
      throw createGraphQLError(
        HttpStatus.BAD_REQUEST,
        ERROR_MESSAGES.ROLE.NOT_FOUND.CODE,
        ERROR_MESSAGES.ROLE.NOT_FOUND.MESSAGE,
      );
    }
    const username = input.email.split('@')[0];
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        username: username,
        password: hashedPassword,
        name: input.firstName || input.lastName || username || input.email, 
        roles: {
          connect: {
            id: role.id,
          },
        },
      },
      include: {
        roles: true,
      },
    });

    // Publish user created event to Kafka
    try {
      await this.kafkaProducerService.publishUserEvent('created', {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }, {
        source: 'user-registration',
        correlationId: `user-${user.id}`,
      });
    } catch (error) {
      console.error('Failed to publish user created event:', error);
      // Continue execution - don't fail user creation if event publishing fails
    }

    return user;
  }

  async login(input: LoginUserInput): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { roles: { select: { key: true } } },
    });

    if (!user || !(await verifyPassword(input.password, user.password))) {
      throw createGraphQLError(
        HttpStatus.BAD_REQUEST,
        ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS.MESSAGE,
        ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS.CODE,
      );
    }

    const token = this.jwtService.sign(
      { userId: user.id, roles: user.roles.map((role) => role.key).join(',') },
      { expiresIn: process.env.JWT_EXPIRATION, secret: process.env.JWT_SECRET },
    );

    const refreshToken = this.jwtService.sign(
      { userId: user.id },
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRATION,
        secret: process.env.JWT_REFRESH_SECRET,
      },
    );

    return { accessToken: token, refreshToken, userId: user.id };
  }

  async create(input: CreateUserInput): Promise<any> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: input.email,
          password: input.password,
          firstName: input.firstName,
          lastName: input.lastName,
          username: input.username || input.email.split('@')[0],
          phone: input.phone,
          fullName: input.firstName && input.lastName 
            ? `${input.firstName} ${input.lastName}` 
            : input.firstName || input.lastName,
            name: input.firstName || input.lastName || input.email,
          status: input.status ? UserStatusEnum[input.status as keyof typeof UserStatusEnum] : UserStatusEnum.PENDING_VERIFICATION,
          loginMethod: input.loginMethod ? (LoginMethod[input.loginMethod as keyof typeof LoginMethod]) : LoginMethod.LOCAL,
        },
        include: {
          roles: true,
        },
      });

      // Publish user created event to Kafka
      try {
        await this.kafkaProducerService.publishUserEvent('created', {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          phone: user.phone,
          roles: user.roles,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }, {
          source: 'user-management',
          correlationId: `user-${user.id}`,
        });
      } catch (error) {
        console.error('Failed to publish user created event:', error);
        // Continue execution - don't fail user creation if event publishing fails
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async findAll(skip = 0, take = 10, where?: any): Promise<any[]> {
    return this.prisma.user.findMany({
      skip,
      take,
      where,
      include: {
        roles: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.userByIdLoader.load(id);
  }

  async findUserById(userId: string): Promise<any> {
    const user = await this.findById(userId);

    if (!user) {
      throw createGraphQLError(
        HttpStatus.NOT_FOUND,
        ERROR_MESSAGES.USER.NOT_FOUND.MESSAGE,
        ERROR_MESSAGES.USER.NOT_FOUND.CODE,
      );
    }

    return user;
  }

  async findByEmail(email: string): Promise<any | null> {
    return this.userByEmailLoader.load(email);
  }

  async findByUsername(username: string): Promise<any | null> {
    return this.userByUsernameLoader.load(username);
  }

  async update(id: string, input: UpdateUserInput): Promise<any> {
    const existingUser = await this.findById(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...input,
          gender: input.gender ? (GenderEnum[input.gender as keyof typeof GenderEnum]) : undefined,
          status: input.status ? UserStatusEnum[input.status as keyof typeof UserStatusEnum] : undefined,
          fullName: input.firstName && input.lastName 
            ? `${input.firstName} ${input.lastName}` 
            : input.fullName,
          updatedAt: new Date(),
        },
        include: {
          roles: true,
        },
      });

      // Publish user updated event to Kafka
      try {
        await this.kafkaProducerService.publishUserEvent('updated', {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          phone: user.phone,
          avatar: user.avatar,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          address: user.address,
          status: user.status,
          roles: user.roles,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }, {
          source: 'user-management',
          correlationId: `user-${user.id}`,
          previousData: {
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            fullName: existingUser.fullName,
            phone: existingUser.phone,
          }
        });
      } catch (error) {
        console.error('Failed to publish user updated event:', error);
        // Continue execution - don't fail user update if event publishing fails
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const existingUser = await this.findById(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Soft delete
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        email: `${existingUser.email}_deleted_${Date.now()}`, // Prevent email conflicts
        username: `${existingUser.username}_deleted_${Date.now()}`,
      },
    });

    // Publish user deleted event to Kafka
    try {
      await this.kafkaProducerService.publishUserEvent('deleted', {
        id: existingUser.id,
        email: existingUser.email,
        username: existingUser.username,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        fullName: existingUser.fullName,
        deletedAt: new Date().toISOString(),
      }, {
        source: 'user-management',
        correlationId: `user-${existingUser.id}`,
      });
    } catch (error) {
      console.error('Failed to publish user deleted event:', error);
      // Continue execution - don't fail user deletion if event publishing fails
    }

    return true;
  }

  async assignRole(userId: string, roleId: string): Promise<any> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          connect: { id: roleId },
        },
      },
      include: {
        roles: true,


      },
    });

    return updatedUser;
  }

  async removeRole(userId: string, roleId: string): Promise<any> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          disconnect: { id: roleId },
        },
      },
      include: {
        roles: true,


      },
    });

    return updatedUser;
  }

  async checkUserExists(data: CheckUserExistDto): Promise<boolean> {
    if (!data.email && !data.phone && !data.username) {
      return false;
    }
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phone: data.phone },
          { username: data.username },
        ].filter((condition) => Object.values(condition)[0] !== undefined),
      },
    });

    return !!user;
  }

  async logout(token: string): Promise<boolean> {
    try {
      const decodedToken = this.jwtService.decode(token) as {
        exp: number;
        jit: string;
      };
      if (!decodedToken || !decodedToken.exp) {
        throw createGraphQLError(
          HttpStatus.BAD_REQUEST,
          ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS.MESSAGE,
          ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS.CODE,
        );
      }

      // Add token to blacklist with expiration time
      const expiration = decodedToken.exp - Math.floor(Date.now() / 1000);
      const jit = decodedToken.jit;
      if (expiration > 0) {
        await this.redisService.set(`blacklist:${jit}`, true, expiration);
      }

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const decodedToken = this.jwtService.decode(token) as {
      exp: number;
      jit: string;
    };
    if (!decodedToken || !decodedToken.exp) {
      throw createGraphQLError(
        HttpStatus.BAD_REQUEST,
        ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS.MESSAGE,
        ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS.CODE,
      );
    }
    return !!(await this.redisService.get(`blacklist:${decodedToken.jit}`));
  }

  async count(where?: any): Promise<number> {
    return this.prisma.user.count({ where });
  }

  async search(query: string, skip = 0, take = 10): Promise<any[]> {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { fullName: { contains: query, mode: 'insensitive' } },
        ],
      },
      skip,
      take,
      include: {
        roles: true,


      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async verifyEmail(userId: string): Promise<any> {
    return this.update(userId, { emailVerified: true });
  }

  async verifyPhone(userId: string): Promise<any> {
    return this.update(userId, { phoneVerified: true });
  }

  async enableTwoFactor(userId: string): Promise<any> {
    return this.update(userId, { twoFactorEnabled: true });
  }

  async disableTwoFactor(userId: string): Promise<any> {
    return this.update(userId, { twoFactorEnabled: false });
  }
}
