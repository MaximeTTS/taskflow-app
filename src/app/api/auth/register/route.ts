import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { registerLimiter } from '@/lib/rate-limit';
import { issuePendingRegistration } from '@/lib/pending-registration';
import { sendExistingAccountNotice, sendVerificationMail } from '@/lib/account-mail';
import {
  assertLength,
  assertValidEmail,
  assertValidPassword,
  normalizeEmail,
  LIMITS,
} from '@/lib/validation';
import { clientIp, errorResponse, isSameOrigin, jsonError } from '../_shared';

/**
 * Inscription.
 *
 * Trois changements par rapport à la version précédente, liés entre eux.
 *
 * **La réponse ne dit plus si l'adresse est prise.** Elle répondait « Un compte
 * existe déjà avec cet email », ce qui suffisait à tester une liste d'adresses
 * et à savoir lesquelles sont inscrites. Le message est maintenant identique
 * dans tous les cas ; ce qui diffère est l'email envoyé, que seul le titulaire
 * de l'adresse peut lire.
 *
 * **L'inscription ne connecte plus.** Sans confirmation d'adresse, n'importe
 * qui pouvait créer un compte au nom de quelqu'un d'autre et s'en servir.
 *
 * **Le compte n'est pas créé ici.** C'est le point le plus important, et le
 * moins évident : créer un compte non vérifié aurait laissé l'attaque de
 * pré-inscription ouverte — l'attaquant s'inscrit avec l'adresse d'un tiers,
 * le tiers ouvre le lien, et active un compte dont l'attaquant connaît le mot
 * de passe. La demande dort donc jusqu'à l'ouverture du lien, qui crée le
 * compte avec le mot de passe qu'elle porte. Voir lib/pending-registration.ts.
 */

/** Réponse unique, quel que soit l'état de l'adresse. */
const REPONSE = {
  message:
    'Si cette adresse peut être utilisée, un email de confirmation vient d’être envoyé. Ouvrez le lien qu’il contient pour activer votre compte.',
};

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return jsonError('Origine non autorisée', 403);
  }

  try {
    const body = (await req.json()) as { email?: string; password?: string; name?: string };

    if (typeof body.email !== 'string' || typeof body.password !== 'string') {
      return jsonError('Email et mot de passe requis', 400);
    }

    const ip = clientIp(req);

    const { allowed, retryAfterMs } = await registerLimiter.check(ip);
    if (!allowed) {
      const minutes = Math.max(1, Math.ceil(retryAfterMs / 60_000));
      return jsonError(`Trop de tentatives. Réessayez dans ${minutes} minute(s).`, 429);
    }

    // Les erreurs de forme restent explicites : elles portent sur ce que
    // l'utilisateur vient de taper, pas sur l'existence d'un compte. Les
    // masquer rendrait le formulaire inutilisable sans rien protéger.
    assertValidEmail(body.email);
    assertLength(body.name, 'nom', LIMITS.userName);
    assertValidPassword(body.password, { email: body.email, name: body.name });

    const email = normalizeEmail(body.email);
    const name = body.name?.trim() || null;
    const origin = req.nextUrl.origin;

    // Le hachage a lieu avant de savoir si l'adresse est libre, et c'est
    // intentionnel. bcrypt coûte une centaine de millisecondes ; ne l'exécuter
    // que sur les adresses libres rendrait les deux cas distinguables au
    // chronomètre, et rétablirait l'énumération que le reste de cette route
    // s'emploie à fermer. Un hachage inutile de temps en temps est le prix
    // d'une réponse de durée constante.
    const passwordHash = await hashPassword(body.password);

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    });

    if (existing) {
      // Le compte existe : on prévient son titulaire, et rien d'autre. Aucune
      // demande n'est enregistrée — sans quoi un lien permettrait de recréer
      // un compte sur une adresse déjà attribuée.
      await sendExistingAccountNotice({ to: email, name: existing.name, origin });
      return NextResponse.json(REPONSE);
    }

    const token = await issuePendingRegistration({ email, name, passwordHash });
    await sendVerificationMail({ to: email, name, origin, token });

    return NextResponse.json(REPONSE);
  } catch (error) {
    return errorResponse(error);
  }
}
