import { Test, TestingModule } from '@nestjs/testing';
import { RolesDataLoaderService } from './roles.dataloader.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RolesDataLoaderService', () => {
  let service: RolesDataLoaderService;
  let prismaService: PrismaService;

  const mockRoles = [
    {
      id: '1',
      key: 'admin',
      name: 'Administrator',
      permissions: [],
    },
    {
      id: '2',
      key: 'user',
      name: 'User',
      permissions: [],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesDataLoaderService,
        {
          provide: PrismaService,
          useValue: {
            role: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RolesDataLoaderService>(RolesDataLoaderService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRoleByIdLoader', () => {
    it('should batch multiple load calls into a single query', async () => {
      const findManySpy = jest
        .spyOn(prismaService.role, 'findMany')
        .mockResolvedValue(mockRoles);

      const loader = service.createRoleByIdLoader();

      // Load multiple roles - these should be batched
      const promises = [loader.load('1'), loader.load('2')];

      const results = await Promise.all(promises);

      // Should only call findMany once with both IDs
      expect(findManySpy).toHaveBeenCalledTimes(1);
      expect(findManySpy).toHaveBeenCalledWith({
        where: { id: { in: ['1', '2'] } },
        include: { permissions: true },
      });

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(mockRoles[0]);
      expect(results[1]).toEqual(mockRoles[1]);
    });

    it('should cache results within the same loader instance', async () => {
      const findManySpy = jest
        .spyOn(prismaService.role, 'findMany')
        .mockResolvedValue([mockRoles[0]]);

      const loader = service.createRoleByIdLoader();

      // Load the same role twice
      await loader.load('1');
      await loader.load('1');

      // Should only call findMany once due to caching
      expect(findManySpy).toHaveBeenCalledTimes(1);
    });

    it('should return null for non-existent roles', async () => {
      jest.spyOn(prismaService.role, 'findMany').mockResolvedValue([]);

      const loader = service.createRoleByIdLoader();
      const result = await loader.load('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createRoleByKeyLoader', () => {
    it('should batch load roles by key', async () => {
      const findManySpy = jest
        .spyOn(prismaService.role, 'findMany')
        .mockResolvedValue(mockRoles);

      const loader = service.createRoleByKeyLoader();

      const promises = [loader.load('admin'), loader.load('user')];

      await Promise.all(promises);

      expect(findManySpy).toHaveBeenCalledTimes(1);
      expect(findManySpy).toHaveBeenCalledWith({
        where: { key: { in: ['admin', 'user'] } },
        include: { permissions: true },
      });
    });

    it('should return results in the correct order', async () => {
      jest
        .spyOn(prismaService.role, 'findMany')
        .mockResolvedValue([mockRoles[1], mockRoles[0]]); // Return in reverse order

      const loader = service.createRoleByKeyLoader();

      const promises = [loader.load('admin'), loader.load('user')];
      const results = await Promise.all(promises);

      // Results should be ordered according to input keys, not database order
      expect(results[0]?.key).toBe('admin');
      expect(results[1]?.key).toBe('user');
    });
  });
});
