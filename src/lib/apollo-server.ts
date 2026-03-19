import { ApolloServer } from '@apollo/server';
import { typeDefs } from '@/graphql/schema/typeDefs';
import { resolvers } from '@/graphql/schema/resolvers';

export const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
});
