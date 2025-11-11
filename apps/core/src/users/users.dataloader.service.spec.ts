import { Test, TestingModule } from '@nestjs/testing';
import { UsersDataLoaderService } from './users.dataloader.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersDataLoaderService', () => {
  let service: UsersDataLoaderService;
  let prismaService: PrismaService;

  const mockUsers = [
    {
      id: '1',
      email: 'user1@example.com',
      username: 'user1',
      roles: [],
    },
    {
      id: '2',
      email: 'user2@example.com',
      username: 'user2',
      roles: [],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersDataLoaderService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersDataLoaderService>(UsersDataLoaderService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUserByIdLoader', () => {
    it('should batch multiple load calls into a single query', async () => {
      const findManySpy = jest
        .spyOn(prismaService.user, 'findMany')
        .mockResolvedValue(mockUsers);

      const loader = service.createUserByIdLoader();

      // Load multiple users - these should be batched
      const promises = [loader.load('1'), loader.load('2')];

      const results = await Promise.all(promises);

      // Should only call findMany once with both IDs
      expect(findManySpy).toHaveBeenCalledTimes(1);
      expect(findManySpy).toHaveBeenCalledWith({
        where: { id: { in: ['1', '2'] } },
        include: { roles: true },
      });

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(mockUsers[0]);
      expect(results[1]).toEqual(mockUsers[1]);
    });

    it('should cache results within the same loader instance', async () => {
      const findManySpy = jest
        .spyOn(prismaService.user, 'findMany')
        .mockResolvedValue([mockUsers[0]]);

      const loader = service.createUserByIdLoader();

      // Load the same user twice
      await loader.load('1');
      await loader.load('1');

      // Should only call findMany once due to caching
      expect(findManySpy).toHaveBeenCalledTimes(1);
    });

    it('should return null for non-existent users', async () => {
      jest.spyOn(prismaService.user, 'findMany').mockResolvedValue([]);

      const loader = service.createUserByIdLoader();
      const result = await loader.load('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createUserByEmailLoader', () => {
    it('should batch load users by email', async () => {
      const findManySpy = jest
        .spyOn(prismaService.user, 'findMany')
        .mockResolvedValue(mockUsers);

      const loader = service.createUserByEmailLoader();

      const promises = [
        loader.load('user1@example.com'),
        loader.load('user2@example.com'),
      ];

      await Promise.all(promises);

      expect(findManySpy).toHaveBeenCalledTimes(1);
      expect(findManySpy).toHaveBeenCalledWith({
        where: { email: { in: ['user1@example.com', 'user2@example.com'] } },
        include: { roles: true },
      });
    });
  });

  describe('createUserByUsernameLoader', () => {
    it('should batch load users by username', async () => {
      const findManySpy = jest
        .spyOn(prismaService.user, 'findMany')
        .mockResolvedValue(mockUsers);

      const loader = service.createUserByUsernameLoader();

      const promises = [loader.load('user1'), loader.load('user2')];

      await Promise.all(promises);

      expect(findManySpy).toHaveBeenCalledTimes(1);
      expect(findManySpy).toHaveBeenCalledWith({
        where: { username: { in: ['user1', 'user2'] } },
        include: { roles: true },
      });
    });
  });
});
