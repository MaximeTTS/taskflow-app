import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { assertValidPassword } from '@/lib/validation';
import { consumeResetToken, resolveResetToken } from '@/lib/password-reset';
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

    // Lecture d'abord, sans consommer : le contrôle de robustesse a besoin de
    // l'email et du nom du compte, et un mot de passe refusé ne doit pas
    // brûler le lien — il faudrait en redemander un à chaque essai.
    const cible = await resolveResetToken(body.token);

    if (!cible) {
      // Inconnu, expiré ou déjà utilisé : un seul message pour les trois.
      return jsonError('Ce lien n’est plus valable. Demandez-en un nouveau.', 400);
    }

    assertValidPassword(body.password, { email: cible.email, name: cible.name ?? undefined });

    const result = await consumeResetToken(body.token);

    if (!result) {
      // Le jeton était valable à la lecture et ne l'est plus : une autre
      // requête l'a consommé entre-temps. C'est exactement ce que la garde
      // atomique doit empêcher, et le message reste le même.
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
