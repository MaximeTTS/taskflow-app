import { ApolloServer } from '@apollo/server';
import { typeDefs } from '@/graphql/schema/typeDefs';
import { resolvers } from '@/graphql/schema/resolvers';
import { depthLimit } from '@/graphql/depth-limit';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { isProduction } from '@/lib/env';
import { ValidationError } from '@/lib/validation';
import type { Context } from '@/types/context';

export const apolloServer = new ApolloServer<Context>({
  typeDefs,
  resolvers,
  // Le schéma est cyclique : sans borne, une requête imbriquée suffit à saturer
  // la base. Voir src/graphql/depth-limit.ts.
  validationRules: [depthLimit()],
  // L'introspection reste ouverte en développement pour l'outillage.
  introspection: !isProduction,
  formatError: (formattedError, error) => {
    const original = error instanceof Error ? error : null;

    // Les erreurs de validation sont destinées à l'utilisateur : on les laisse
    // passer telles quelles, elles ne révèlent rien d'interne.
    if (original instanceof ValidationError) {
      return { ...formattedError, extensions: { code: 'VALIDATION_ERROR' } };
    }

    // En production, tout le reste est masqué : un message Prisma expose les
    // noms de tables, de colonnes et de contraintes.
    if (isProduction) {
      const message = formattedError.message;
      const isDeliberate =
        message === 'Non autorisé' ||
        message === 'Action non autorisée' ||
        message.startsWith('Trop de tentatives') ||
        message.startsWith('Email ou mot de passe') ||
        message.endsWith('introuvable');

      if (!isDeliberate) {
        console.error('[graphql]', original ?? formattedError);
        return {
          message: 'Une erreur est survenue',
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        };
      }
    }

    return formattedError;
  },
});

/**
 * Adresse du client. Derrière un proxy (Vercel, nginx), l'adresse de socket
 * est celle du proxy : on lit les en-têtes qu'il pose, en prenant la première
 * valeur de `x-forwarded-for` qui correspond au client d'origine.
 */
function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

export async function createContext({ req }: { req: Request }): Promise<Context> {
  const ip = clientIp(req);
  const authHeader = req.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return { user: null, ip };
  }

  const user = verifyToken(token);
  return { user, ip };
}
