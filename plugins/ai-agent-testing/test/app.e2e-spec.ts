import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AI Agent Testing Platform (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GraphQL API', () => {
    it('should return empty projects list', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              projects {
                id
                name
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.projects).toBeDefined();
          expect(Array.isArray(res.body.data.projects)).toBe(true);
        });
    });

    it('should create a project', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation CreateProject($input: CreateProjectInput!) {
              createProject(input: $input) {
                id
                name
                description
              }
            }
          `,
          variables: {
            input: {
              name: 'Test Project',
              description: 'A test project for e2e testing',
            },
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createProject).toBeDefined();
          expect(res.body.data.createProject.name).toBe('Test Project');
        });
    });
  });
});
