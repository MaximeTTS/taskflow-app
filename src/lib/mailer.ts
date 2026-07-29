import { isProduction } from '@/lib/env';

/**
 * Envoi d'emails.
 *
 * Volontairement réduit à une interface. Ce projet n'a pas de fournisseur
 * configuré : plutôt que d'imposer une dépendance et des identifiants pour
 * une seule fonctionnalité, on définit le contrat et on journalise.
 *
 * En développement, le message part dans la console — le lien de
 * réinitialisation y est donc lisible et le parcours testable de bout en
 * bout, sans boîte mail.
 *
 * En production sans fournisseur, l'envoi est signalé comme un échec dans
 * les journaux. C'est délibéré : un email silencieusement perdu est pire
 * qu'une erreur visible.
 */

export type Mail = {
  to: string;
  subject: string;
  /** Version texte. On n'envoie pas de HTML : rien ici n'en a besoin. */
  body: string;
};

export type MailResult = { delivered: boolean };

/** Un fournisseur est-il configuré ? */
export const isMailerConfigured = Boolean(process.env.SMTP_URL || process.env.RESEND_API_KEY);

export async function sendMail(mail: Mail): Promise<MailResult> {
  if (!isMailerConfigured) {
    if (isProduction) {
      console.error(
        `[mail] AUCUN FOURNISSEUR CONFIGURE — message non remis a ${mail.to} : ${mail.subject}`,
      );
      return { delivered: false };
    }

    // En développement, le contenu complet est affiché : c'est ce qui rend
    // le parcours testable sans infrastructure.
    console.info(
      [
        '',
        '─────────────── EMAIL (developpement) ───────────────',
        `A       : ${mail.to}`,
        `Objet   : ${mail.subject}`,
        '',
        mail.body,
        '─────────────────────────────────────────────────────',
        '',
      ].join('\n'),
    );
    return { delivered: true };
  }

  // Point d'accroche pour un vrai fournisseur. Laissé non implémenté plutôt
  // qu'à moitié : un envoi qui échoue en silence donnerait l'illusion que
  // la fonctionnalité marche.
  console.error('[mail] fournisseur declare mais non implemente');
  return { delivered: false };
}
