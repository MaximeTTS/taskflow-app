import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { apolloServer } from '@/lib/apollo-server';
import type { NextRequest } from 'next/server';

const handler = startServerAndCreateNextHandler<NextRequest>(apolloServer);

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
