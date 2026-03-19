import { ApolloServer } from '@apollo/server';
import { typeDefs } from '@/graphql/schema/typeDefs';
import { resolvers } from '@/graphql/schema/resolvers';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import type { Context } from '@/types/context';

export const apolloServer = new ApolloServer<Context>({
  typeDefs,
  resolvers,
});

export async function createContext({ req }: { req: Request }): Promise<Context> {
  const authHeader = req.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return { user: null };
  }

  const user = verifyToken(token);
  return { user };
}
