import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { User } from 'prisma/@generated';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * UsersDataLoaderService
 * 
 * Provides DataLoader instances for batching User queries.
 */
@Injectable()
export class UsersDataLoaderService {
  constructor(private prisma: PrismaService) {}

  /**
   * Batch load users by IDs
   */
  private async batchLoadUsersByIds(ids: readonly string[]): Promise<(User | null)[]> {
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: [...ids] },
      },
      include: {
        roles: true,
      },
    });

    const userMap = new Map(users.map(user => [user.id, user]));
    return ids.map(id => userMap.get(id) || null);
  }

  /**
   * Batch load users by emails
   */
  private async batchLoadUsersByEmails(emails: readonly string[]): Promise<(User | null)[]> {
    const users = await this.prisma.user.findMany({
      where: {
        email: { in: [...emails] },
      },
      include: {
        roles: true,
      },
    });

    const userMap = new Map(users.map(user => [user.email, user]));
    return emails.map(email => userMap.get(email) || null);
  }

  /**
   * Batch load users by usernames
   */
  private async batchLoadUsersByUsernames(usernames: readonly string[]): Promise<(User | null)[]> {
    const users = await this.prisma.user.findMany({
      where: {
        username: { in: [...usernames] },
      },
      include: {
        roles: true,
      },
    });

    const userMap = new Map(users.map(user => [user.username, user]));
    return usernames.map(username => userMap.get(username) || null);
  }

  /**
   * Create a DataLoader for loading users by ID
   */
  createUserByIdLoader(): DataLoader<string, User | null> {
    return new DataLoader<string, User | null>(
      (ids) => this.batchLoadUsersByIds(ids),
      { cache: true }
    );
  }

  /**
   * Create a DataLoader for loading users by email
   */
  createUserByEmailLoader(): DataLoader<string, User | null> {
    return new DataLoader<string, User | null>(
      (emails) => this.batchLoadUsersByEmails(emails),
      { cache: true }
    );
  }

  /**
   * Create a DataLoader for loading users by username
   */
  createUserByUsernameLoader(): DataLoader<string, User | null> {
    return new DataLoader<string, User | null>(
      (usernames) => this.batchLoadUsersByUsernames(usernames),
      { cache: true }
    );
  }
}
