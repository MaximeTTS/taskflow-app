import type { Transporter } from 'nodemailer';
import { isProduction } from '@/lib/env';

/**
 * Envoi d'emails.
 *
 * Deux fournisseurs, choisis par la configuration :
 *   RESEND_API_KEY → API HTTP Resend, via `fetch`, sans dépendance.
 *   SMTP_URL       → SMTP classique, via nodemailer.
 *
 * Resend a la priorité : en environnement serverless, une requête HTTP courte
 * se comporte mieux qu'une connexion SMTP qu'il faut ouvrir, négocier puis
 * fermer à chaque invocation.
 *
 * Sans fournisseur, le message part dans la console en développement — le lien
 * de réinitialisation y est lisible et le parcours testable sans boîte mail.
 * En production, l'absence de fournisseur est une erreur journalisée : un email
 * silencieusement perdu est pire qu'un échec visible.
 */

export type Mail = {
  to: string;
  subject: string;
  /** Version texte. On n'envoie pas de HTML : rien ici n'en a besoin. */
  body: string;
};

export type MailResult = {
  delivered: boolean;
  /** Renseigné en cas d'échec, pour les journaux de l'appelant. */
  error?: string;
};

/**
 * Adresse d'expédition. Les deux fournisseurs la refusent si elle n'appartient
 * pas à un domaine vérifié : il n'y a pas de valeur de repli qui fonctionne.
 */
function mailFrom(): string {
  return process.env.MAIL_FROM?.trim() || '';
}

/** Un fournisseur est-il configuré ? */
export function isMailerConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() || process.env.SMTP_URL?.trim());
}

/**
 * Au-delà, on considère l'envoi perdu. Sans cette borne, une API qui ne répond
 * pas retient la requête HTTP de l'utilisateur jusqu'au délai de la plateforme.
 */
const TIMEOUT_MS = 10_000;

async function sendViaResend(mail: Mail, from: string, apiKey: string): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [mail.to],
      subject: mail.subject,
      text: mail.body,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    // Le corps porte le motif exact du refus (domaine non vérifié, clé
    // invalide) : le perdre rendrait le diagnostic impossible.
    const détail = await response.text().catch(() => '');
    throw new Error(`Resend a répondu ${response.status} ${détail}`.trim());
  }
}

/**
 * Le transport nodemailer est conservé entre les appels : il maintient un pool
 * de connexions, en recréer un à chaque envoi rouvrirait une session SMTP
 * complète à chaque fois.
 */
let transport: Transporter | null = null;

async function sendViaSmtp(mail: Mail, from: string, url: string): Promise<void> {
  if (!transport) {
    const { createTransport } = await import('nodemailer');
    transport = createTransport(url);
  }

  await transport.sendMail({
    from,
    to: mail.to,
    subject: mail.subject,
    text: mail.body,
  });
}

/** Affiche le message en clair. Réservé au développement sans fournisseur. */
function logToConsole(mail: Mail): void {
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
}

/**
 * Remet un message.
 *
 * Ne lève jamais : l'échec est rendu dans `delivered`. Les appelants sont des
 * parcours d'authentification qui ne doivent pas révéler, par une erreur HTTP,
 * qu'une adresse existe ou non — c'est à eux de décider quoi faire d'un échec,
 * pas à une exception de trancher à leur place.
 */
export async function sendMail(mail: Mail): Promise<MailResult> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const smtpUrl = process.env.SMTP_URL?.trim();
  const from = mailFrom();

  if (!resendKey && !smtpUrl) {
    if (isProduction) {
      console.error(
        `[mail] aucun fournisseur configure — message non remis a ${mail.to} : ${mail.subject}`,
      );
      return { delivered: false, error: 'Aucun fournisseur d’email configuré' };
    }

    logToConsole(mail);
    return { delivered: true };
  }

  if (!from) {
    console.error('[mail] MAIL_FROM manquant — un fournisseur est configure mais sans expediteur');
    return { delivered: false, error: 'MAIL_FROM manquant' };
  }

  try {
    if (resendKey) {
      await sendViaResend(mail, from, resendKey);
    } else {
      await sendViaSmtp(mail, from, smtpUrl!);
    }
    return { delivered: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[mail] echec de remise a ${mail.to} : ${message}`);
    return { delivered: false, error: message };
  }
}
