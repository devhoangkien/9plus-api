import { buildClientSchema, getIntrospectionQuery, IntrospectionQuery } from 'graphql';
import { GraphQLClient } from 'graphql-request';
import introspectionResult from './introspection.json';

export const federatedSchema = buildClientSchema(introspectionResult as IntrospectionQuery);
