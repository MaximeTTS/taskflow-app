import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { apolloServer, createContext } from '@/lib/apollo-server';
import type { NextRequest } from 'next/server';

const handler = startServerAndCreateNextHandler(apolloServer, {
  context: async (req: NextRequest) => createContext({ req }),
});

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
