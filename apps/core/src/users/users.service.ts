import { Injectable, NotFoundException, BadRequestException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hashPassword, verifyPassword } from '../common/functions';
import { ERROR_MESSAGES, ROLE_USER } from '../common/constants';
import { createGraphQLError } from '@bune/common';
import { RedisService } from '../redis/redis.service';
import { LoginUserInput, RegisterUserInput } from './inputs';
import { CheckUserExistDto, LoginResponse } from './dtos';
import { PrismaService } from 'src/prisma/prisma.service';

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
  status?: string;
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
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

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
    return this.prisma.user.create({
      data: {
        email: input.email,
        username: username,
        password: hashedPassword,
        roles: {
          connect: {
            id: role.id,
          },
        },
      },
    });
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
        },
        include: {
          roles: true,
        },
      });

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
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: true,


        notificationSettings: true,
      },
    });
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
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: true,


      },
    });
  }

  async findByUsername(username: string): Promise<any | null> {
    return this.prisma.user.findUnique({
      where: { username },
      include: {
        roles: true,


      },
    });
  }

  async update(id: string, input: UpdateUserInput): Promise<any> {
    const existingUser = await this.findById(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    try {
      // const user = await this.prisma.user.update({
      //   where: { id },
      //   data: {
      //     ...input,
      //     fullName: input.firstName && input.lastName 
      //       ? `${input.firstName} ${input.lastName}` 
      //       : input.fullName,
      //     updatedAt: new Date(),
      //   },
      //   include: {
      //     roles: true,
      //     teacherProfile: true,
      //     studentProfile: true,
      //   },
      // });

      // return user;
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
