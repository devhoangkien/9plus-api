import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { 
  PaginatedResponseType, 
  SingleResponseType,
  createPaginatedResponse,
  createSingleResponse,
  QueryInput,
} from '@anineplus/common';
import { ObjectType, Field, ID } from '@nestjs/graphql';

/**
 * Example User Entity
 */
@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  avatar?: string;
}

/**
 * Paginated User Response
 */
@ObjectType()
export class PaginatedUserResponse extends PaginatedResponseType(User) {}

/**
 * Single User Response
 */
@ObjectType()
export class SingleUserResponse extends SingleResponseType(User) {}

/**
 * Example Resolver with Response Format
 */
@Resolver(() => User)
export class UserExampleResolver {
  /**
   * Get paginated users
   * GraphQL: query { users(page: 1, limit: 10) { ... } }
   * REST: GET /api/users?page=1&limit=10
   */
  @Query(() => PaginatedUserResponse, {
    description: 'Get paginated list of users',
  })
  async users(@Args() query: QueryInput): Promise<PaginatedUserResponse> {
    // Simulate fetching from database
    const users = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://example.com/avatar1.jpg',
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        avatar: 'https://example.com/avatar2.jpg',
      },
    ];

    const totalItems = 100; // From database count
    const { page = 1, limit = 10 } = query;

    return createPaginatedResponse(
      users,
      page,
      limit,
      totalItems,
      'Users fetched successfully',
    );
  }

  /**
   * Get single user by ID
   * GraphQL: query { user(id: "1") { ... } }
   * REST: GET /api/user/1
   */
  @Query(() => SingleUserResponse, {
    description: 'Get single user by ID',
  })
  async user(@Args('id') id: string): Promise<SingleUserResponse> {
    // Simulate fetching from database
    const user = {
      id,
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://example.com/avatar1.jpg',
    };

    return createSingleResponse(user, 'User fetched successfully');
  }

  /**
   * Create user
   * GraphQL: mutation { createUser(name: "...", email: "...") { ... } }
   * REST: POST /api/user
   */
  @Mutation(() => SingleUserResponse, {
    description: 'Create a new user',
  })
  async createUser(
    @Args('name') name: string,
    @Args('email') email: string,
  ): Promise<SingleUserResponse> {
    // Simulate creating in database
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      avatar: null,
    };

    return createSingleResponse(newUser, 'User created successfully');
  }
}

/**
 * Expected Responses:
 * 
 * 1. GraphQL Query (users):
 * {
 *   "data": {
 *     "users": {
 *       "success": true,
 *       "data": [
 *         { "id": "1", "name": "John Doe", "email": "john@example.com" }
 *       ],
 *       "pagination": {
 *         "currentPage": 1,
 *         "perPage": 10,
 *         "totalItems": 100,
 *         "totalPages": 10,
 *         "hasNextPage": true,
 *         "hasPreviousPage": false
 *       },
 *       "message": "Users fetched successfully"
 *     }
 *   }
 * }
 * 
 * 2. REST API (via Gateway - GET /api/users?page=1&limit=10):
 * {
 *   "success": true,
 *   "data": {
 *     "success": true,
 *     "data": [
 *       { "id": "1", "name": "John Doe", "email": "john@example.com" }
 *     ],
 *     "pagination": {
 *       "currentPage": 1,
 *       "perPage": 10,
 *       "totalItems": 100,
 *       "totalPages": 10,
 *       "hasNextPage": true,
 *       "hasPreviousPage": false
 *     },
 *     "message": "Users fetched successfully"
 *   },
 *   "timestamp": "2025-10-11T10:30:00.000Z",
 *   "requestId": "req-gateway-123"
 * }
 * 
 * 3. GraphQL Query (single user):
 * {
 *   "data": {
 *     "user": {
 *       "success": true,
 *       "data": { "id": "1", "name": "John Doe", "email": "john@example.com" },
 *       "message": "User fetched successfully"
 *     }
 *   }
 * }
 * 
 * 4. REST API (GET /api/user/1):
 * {
 *   "success": true,
 *   "data": {
 *     "success": true,
 *     "data": { "id": "1", "name": "John Doe", "email": "john@example.com" },
 *     "message": "User fetched successfully"
 *   },
 *   "timestamp": "2025-10-11T10:30:00.000Z",
 *   "requestId": "req-gateway-123"
 * }
 */
