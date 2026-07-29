import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verificationLimiter } from '@/lib/rate-limit';
import { issueVerificationToken } from '@/lib/email-verification';
import { issuePendingRegistration } from '@/lib/pending-registration';
import { sendVerificationMail } from '@/lib/account-mail';
import { normalizeEmail } from '@/lib/validation';
import { clientIp, isSameOrigin, jsonError } from '../_shared';

/**
 * Renvoi du lien de confirmation.
 *
 * Même discipline que `forgot-password` : réponse rigoureusement identique que
 * le compte existe, soit déjà confirmé, ou n'existe pas. Sans cela, cette
 * route rouvrirait l'énumération que l'inscription vient de fermer — et ce
 * serait d'autant plus dommage qu'elle n'existe que pour la soutenir.
 *
 * Deux quotas : par adresse IP, et par compte visé. Le second empêche
 * d'inonder une boîte précise depuis plusieurs adresses.
 */

const REPONSE = {
  message:
    'Si cette adresse correspond à un compte en attente de confirmation, un nouveau lien vient d’être envoyé.',
};

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return jsonError('Origine non autorisée', 403);
  }

  try {
    const body = (await req.json()) as { email?: string };

    if (typeof body.email !== 'string') {
      return jsonError('Adresse email requise', 400);
    }

    const ip = clientIp(req);
    const email = normalizeEmail(body.email);

    for (const key of [ip, `compte:${email}`]) {
      if (!(await verificationLimiter.check(key)).allowed) {
        // Même en cas de dépassement, la réponse ne change pas : un 429 ici
        // révélerait qu'une adresse a déjà été sollicitée.
        return NextResponse.json(REPONSE);
      }
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, emailVerifiedAt: true },
    });

    if (user) {
      // Un compte confirmé ne reçoit rien : lui renvoyer un lien n'aurait
      // aucun effet. Le silence est ici sans conséquence, puisque la réponse
      // au client est la même dans tous les cas.
      if (!user.emailVerifiedAt) {
        const token = await issueVerificationToken(user.id, email);
        await sendVerificationMail({
          to: email,
          name: user.name,
          origin: req.nextUrl.origin,
          token,
        });
      }

      return NextResponse.json(REPONSE);
    }

    // Aucun compte : peut-être une inscription en attente. On réémet le jeton
    // à partir de la demande existante — sans jamais recréer une demande à
    // partir de rien, ce qui permettrait d'inscrire n'importe qui.
    const demande = await prisma.pendingRegistration.findUnique({
      where: { email },
      select: { name: true, password: true, expiresAt: true },
    });

    if (demande && demande.expiresAt.getTime() > Date.now()) {
      const token = await issuePendingRegistration({
        email,
        name: demande.name,
        // L'empreinte est reprise telle quelle : renvoyer un lien ne doit pas
        // changer le mot de passe que la demande porte.
        passwordHash: demande.password,
      });

      await sendVerificationMail({
        to: email,
        name: demande.name,
        origin: req.nextUrl.origin,
        token,
      });
    }

    return NextResponse.json(REPONSE);
  } catch (error) {
    // Même une erreur interne ne doit pas se distinguer d'un succès.
    console.error('[auth] resend-verification', error);
    return NextResponse.json(REPONSE);
  }
}
