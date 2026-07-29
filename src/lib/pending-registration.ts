import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';

/**
 * Inscriptions en attente de confirmation.
 *
 * Le compte n'existe pas tant que l'adresse n'est pas prouvée. Ce n'est pas
 * une précaution de plus : c'est ce qui ferme l'attaque de pré-inscription.
 *
 * Créer le compte dès l'inscription, fût-il marqué non vérifié, permettait à
 * un attaquant de s'inscrire avec l'adresse de quelqu'un d'autre. La victime
 * recevait le lien, l'ouvrait, et activait un compte à son nom dont
 * l'attaquant connaissait le mot de passe. Le lien confirmait une adresse ;
 * il fait désormais naître le compte, avec le mot de passe de la demande
 * qu'il porte — et seule la personne qui relève la boîte choisit laquelle.
 */

const TOKEN_BYTES = 32;
export const PENDING_TTL_HOURS = 24;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Enregistre une demande d'inscription et rend le jeton à envoyer.
 *
 * Une demande antérieure pour la même adresse est remplacée : le lien
 * précédent cesse aussitôt de fonctionner. C'est le comportement voulu — si
 * deux personnes ont demandé la même adresse, seule la dernière demande
 * compte, et il faut de toute façon relever la boîte pour l'activer.
 */
export async function issuePendingRegistration(input: {
  email: string;
  name: string | null;
  passwordHash: string;
}): Promise<string> {
  const token = randomBytes(TOKEN_BYTES).toString('base64url');
  const expiresAt = new Date(Date.now() + PENDING_TTL_HOURS * 60 * 60 * 1000);

  await prisma.pendingRegistration.upsert({
    where: { email: input.email },
    create: {
      tokenHash: hashToken(token),
      email: input.email,
      name: input.name,
      password: input.passwordHash,
      expiresAt,
    },
    update: {
      tokenHash: hashToken(token),
      name: input.name,
      password: input.passwordHash,
      expiresAt,
    },
  });

  return token;
}

/** Une demande est-elle en cours pour cette adresse ? */
export async function hasPendingRegistration(email: string): Promise<boolean> {
  const demande = await prisma.pendingRegistration.findUnique({
    where: { email },
    select: { expiresAt: true },
  });
  return Boolean(demande && demande.expiresAt.getTime() > Date.now());
}

export type CreatedAccount = {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
};

/**
 * Consomme une demande et crée le compte.
 *
 * Rend `null` si le jeton est inconnu ou expiré. La demande est supprimée dans
 * la même transaction que la création : un lien ne peut donc pas créer deux
 * comptes, même ouvert deux fois simultanément.
 */
export async function consumePendingRegistration(token: string): Promise<CreatedAccount | null> {
  if (!token) return null;

  const demande = await prisma.pendingRegistration.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!demande || demande.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // La suppression conditionnée à l'identifiant sert de verrou : si une
      // autre requête l'a déjà consommée, le compte n'est pas créé deux fois.
      const { count } = await tx.pendingRegistration.deleteMany({ where: { id: demande.id } });
      if (count === 0) throw new DemandeDejaConsommee();

      return tx.user.create({
        data: {
          email: demande.email,
          name: demande.name,
          password: demande.password,
          emailVerifiedAt: new Date(),
        },
        select: { id: true, email: true, name: true, avatar: true },
      });
    });
  } catch (error) {
    if (error instanceof DemandeDejaConsommee) return null;

    // Cas réel : l'adresse a été prise entre-temps par un autre chemin. La
    // transaction est annulée, donc la demande subsiste — sans effet, elle
    // expirera d'elle-même.
    console.error('[inscription] création impossible', error);
    return null;
  }
}

/** Signale une course perdue, sans polluer le journal d'erreurs. */
class DemandeDejaConsommee extends Error {}

/** Purge des demandes expirées, appelable périodiquement. */
export async function purgePendingRegistrations(): Promise<number> {
  const { count } = await prisma.pendingRegistration.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
  return count;
}
