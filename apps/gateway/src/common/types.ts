export type Permission = {
    __typename: string;
    action: string;
    id: string;
    key: string;
    name: string;
    resource: string;
    status: string;
  };
  
 export type Role = {
    __typename: string;
    id: string;
    key: string;
    name: string;
    permissions: Permission[];
  };
  
export  type RolesData = {
    getRolesByKeys: Role[];
  };

/**
 * GraphQL Context type for Gateway
 */
export interface GraphQLContext {
  req: any;
  userId?: string;
  permissions?: string;
  authorization?: string;
}

/**
 * Service configuration type
 */
export interface ServiceConfig {
  name: string;
  url: string;
}

/**
 * Federation service health status
 */
export interface ServiceHealth {
  name: string;
  url: string;
  isHealthy: boolean;
}
  