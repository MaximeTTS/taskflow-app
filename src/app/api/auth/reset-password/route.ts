import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { assertValidPassword } from '@/lib/validation';
import { consumeResetToken } from '@/lib/password-reset';
import { revokeAllSessions } from '@/lib/session';
import { errorResponse, isSameOrigin, jsonError } from '../_shared';

/**
 * Confirmation de la réinitialisation.
 *
 * Le jeton est consommé avant tout, puis toutes les sessions du compte sont
 * révoquées : quelqu'un qui réinitialise son mot de passe le fait souvent
 * parce qu'il soupçonne un accès non désiré, et laisser les sessions
 * existantes ouvertes viderait le geste de son sens.
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return jsonError('Origine non autorisée', 403);
  }

  try {
    const body = (await req.json()) as { token?: string; password?: string };

    if (typeof body.token !== 'string' || typeof body.password !== 'string') {
      return jsonError('Lien et mot de passe requis', 400);
    }

    // La validation vient avant la consommation : sinon un mot de passe trop
    // court brûlerait le lien et obligerait à en redemander un.
    assertValidPassword(body.password);

    const result = await consumeResetToken(body.token);

    if (!result) {
      // Inconnu, expiré ou déjà utilisé : un seul message pour les trois.
      return jsonError('Ce lien n’est plus valable. Demandez-en un nouveau.', 400);
    }

    await prisma.user.update({
      where: { id: result.userId },
      data: { password: await hashPassword(body.password) },
    });

    await revokeAllSessions(result.userId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
