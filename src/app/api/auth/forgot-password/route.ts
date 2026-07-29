import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRateLimiter } from '@/lib/rate-limit';
import { normalizeEmail } from '@/lib/validation';
import { issueResetToken, RESET_TTL_MINUTES } from '@/lib/password-reset';
import { sendMail } from '@/lib/mailer';
import { clientIp, isSameOrigin, jsonError } from '../_shared';

/**
 * Demande de réinitialisation.
 *
 * La réponse est rigoureusement identique que le compte existe ou non :
 * même message, même code, et l'émission du jeton n'ajoute pas de délai
 * mesurable puisqu'elle a lieu après la réponse... ce qui n'est pas
 * possible ici. On accepte donc un écart de quelques millisecondes, très
 * en deçà de la variance du réseau, plutôt que d'annoncer « aucun compte
 * avec cet email » — ce qui transformerait ce point d'entrée en outil
 * d'énumération de comptes.
 */

const forgotLimiter = createRateLimiter({ max: 5, windowMs: 60 * 60 * 1000 });

/** Message unique, quel que soit le cas de figure. */
const REPONSE = {
  message:
    'Si un compte existe avec cette adresse, un lien de réinitialisation vient d’être envoyé.',
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

    // Deux quotas : par adresse et par compte visé. Le second empêche
    // d'inonder la boîte d'une personne précise depuis plusieurs adresses.
    for (const key of [ip, `compte:${email}`]) {
      if (!forgotLimiter.check(key).allowed) {
        // Même en cas de dépassement, on ne dit rien de plus : répondre 429
        // ici révélerait qu'une adresse a déjà été sollicitée.
        return NextResponse.json(REPONSE);
      }
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = await issueResetToken(user.id);
      const origin = req.nextUrl.origin;
      const lien = `${origin}/reinitialiser?jeton=${encodeURIComponent(token)}`;

      await sendMail({
        to: user.email,
        subject: 'Réinitialiser votre mot de passe TaskFlow',
        body: [
          `Bonjour${user.name ? ` ${user.name}` : ''},`,
          '',
          'Vous avez demandé à réinitialiser votre mot de passe. Ouvrez ce lien :',
          '',
          lien,
          '',
          `Ce lien expire dans ${RESET_TTL_MINUTES} minutes et ne fonctionne qu’une fois.`,
          '',
          'Si vous n’êtes pas à l’origine de cette demande, ignorez ce message :',
          'votre mot de passe reste inchangé.',
        ].join('\n'),
      });
    }

    return NextResponse.json(REPONSE);
  } catch (error) {
    // Même une erreur interne ne doit pas se distinguer d'un succès côté
    // client : on journalise et on répond comme d'habitude.
    console.error('[auth] forgot-password', error);
    return NextResponse.json(REPONSE);
  }
}
