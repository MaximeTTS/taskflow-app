import { prisma } from '@/lib/prisma';
import type { AuditAction, Prisma } from '@/generated/prisma/client';

/**
 * Journal d'audit.
 *
 * Rien ne tracait qui avait change un role ou supprime un projet. Apres coup,
 * la seule reponse possible etait « on ne sait pas » — y compris pour
 * distinguer une erreur de manipulation d'un acces non autorise.
 *
 * Deux regles gouvernent ce module :
 *
 * 1. **Une ecriture d'audit ne fait jamais echouer l'action.** Si le journal
 *    tombe, la suppression de projet doit aboutir quand meme. L'inverse —
 *    annuler une action metier parce que sa trace n'a pas pu s'ecrire —
 *    transformerait le journal en point de panne unique.
 *
 * 2. **On enregistre apres coup, pas avant.** Une trace ecrite avant l'action
 *    decrirait une intention, pas un fait : si la mutation echoue ensuite, le
 *    journal ment.
 */

export type AuditActor = {
  id: string;
  email: string;
};

export type AuditEntry = {
  action: AuditAction;
  actor: AuditActor | null;
  /** Nature de la cible : 'project', 'user', 'member'. */
  targetType: string;
  targetId: string;
  /** Nom lisible au moment des faits — le projet peut disparaitre ensuite. */
  targetLabel?: string | null;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
};

/**
 * Enregistre un evenement.
 *
 * Ne leve jamais et ne se laisse pas attendre : l'appelant peut l'oublier
 * derriere un `void`. Un echec est journalise sur la sortie d'erreur, ou il
 * sera vu par la supervision sans casser la requete en cours.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        actorId: entry.actor?.id ?? null,
        actorEmail: entry.actor?.email ?? null,
        targetType: entry.targetType,
        targetId: entry.targetId,
        targetLabel: entry.targetLabel ?? null,
        metadata: entry.metadata,
        ip: entry.ip ?? null,
      },
    });
  } catch (error) {
    console.error('[audit] enregistrement impossible', {
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      error,
    });
  }
}

/** Nombre maximal d'evenements rendus en une fois. */
export const AUDIT_PAGE_MAX = 100;

export type AuditPage = {
  items: Awaited<ReturnType<typeof prisma.auditLog.findMany>>;
  totalCount: number;
  hasMore: boolean;
};

/**
 * Historique d'une cible donnee, du plus recent au plus ancien.
 *
 * Le controle d'acces n'est pas fait ici : il depend de la nature de la cible
 * (etre ADMIN du projet, ou etre le titulaire du compte) et appartient donc
 * aux resolveurs, qui savent de quoi ils parlent.
 */
export async function readAudit(
  targetType: string,
  targetId: string,
  limit: number,
  offset: number,
): Promise<AuditPage> {
  const [items, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where: { targetType, targetId } }),
  ]);

  return { items, totalCount, hasMore: offset + items.length < totalCount };
}
