import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { consumeVerificationToken } from '@/lib/email-verification';
import { consumePendingRegistration } from '@/lib/pending-registration';
import { recordAudit } from '@/lib/audit';
import { revokeAllSessions } from '@/lib/session';
import { clientIp, errorResponse, isSameOrigin, jsonError } from '../_shared';

/**
 * Confirmation d'un lien reçu par email.
 *
 * Deux natures de lien arrivent ici, et l'ordre de lecture n'est pas anodin :
 *
 * 1. **Une inscription en attente.** Le compte n'existe pas encore ; le lien
 *    le crée, avec le mot de passe de la demande qu'il porte. C'est ce report
 *    de la création qui ferme l'attaque de pré-inscription.
 * 2. **Un changement d'adresse** sur un compte existant.
 *
 * Volontairement, cette route ne connecte pas. Ouvrir un lien reçu par email
 * prouve l'accès à la boîte, ce qui est exactement ce que l'on veut établir —
 * mais un lien traîne dans un historique de navigation, dans les journaux d'un
 * proxy, dans un aperçu de messagerie. En faire un ticket d'entrée
 * transformerait une preuve d'adresse en contournement du mot de passe.
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return jsonError('Origine non autorisée', 403);
  }

  try {
    const body = (await req.json()) as { token?: string };

    if (typeof body.token !== 'string' || body.token === '') {
      return jsonError('Lien de confirmation incomplet', 400);
    }

    const ip = clientIp(req);

    // ── Inscription en attente ───────────────────────────────────────
    const compte = await consumePendingRegistration(body.token);

    if (compte) {
      void recordAudit({
        action: 'ACCOUNT_CREATED',
        actor: { id: compte.id, email: compte.email },
        targetType: 'user',
        targetId: compte.id,
        targetLabel: compte.email,
        ip,
      });

      void recordAudit({
        action: 'EMAIL_VERIFIED',
        actor: { id: compte.id, email: compte.email },
        targetType: 'user',
        targetId: compte.id,
        targetLabel: compte.email,
        ip,
      });

      return NextResponse.json({ ok: true, created: true, changed: false, email: compte.email });
    }

    // ── Changement d'adresse sur un compte existant ──────────────────
    const result = await consumeVerificationToken(body.token);

    if (!result) {
      // Inconnu, expiré, déjà utilisé, ou adresse entre-temps prise par un
      // autre compte : un seul message pour tous les cas.
      return jsonError(
        'Ce lien n’est plus valable. Demandez-en un nouveau depuis la page de connexion.',
        400,
      );
    }

    if (result.changed) {
      // Les sessions ouvertes le sont sous l'ancienne identité. Quelqu'un qui
      // aurait détourné le compte pour le déplacer vers son adresse ne doit
      // pas conserver son accès une fois le changement acté.
      await revokeAllSessions(result.userId);
    }

    void recordAudit({
      action: result.changed ? 'EMAIL_CHANGED' : 'EMAIL_VERIFIED',
      actor: { id: result.userId, email: result.email },
      targetType: 'user',
      targetId: result.userId,
      targetLabel: result.email,
      ip,
    });

    return NextResponse.json({
      ok: true,
      created: false,
      changed: result.changed,
      email: result.email,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
