import { sendMail } from '@/lib/mailer';
import { VERIFICATION_TTL_HOURS } from '@/lib/email-verification';

/**
 * Messages liés au cycle de vie d'un compte.
 *
 * Rassemblés ici pour une raison précise : deux d'entre eux n'existent que
 * pour fermer l'énumération de comptes, et leur formulation *est* la mesure de
 * sécurité. Éparpillés dans les routes, ils dériveraient — et une réponse
 * d'inscription qui trahit l'existence d'un compte est exactement ce qu'on
 * cherche à supprimer.
 *
 * Le principe : quelle que soit l'issue, l'appelant reçoit la même réponse
 * HTTP. Ce qui diffère, c'est le message qui part dans la boîte mail — que
 * seul le titulaire légitime peut lire.
 */

function salutation(name: string | null | undefined): string {
  return `Bonjour${name ? ` ${name}` : ''},`;
}

/** Lien de confirmation à l'inscription ou après changement d'adresse. */
export async function sendVerificationMail(options: {
  to: string;
  name: string | null;
  origin: string;
  token: string;
  /** Vrai s'il s'agit d'un changement d'adresse et non d'une inscription. */
  isChange?: boolean;
}): Promise<void> {
  const lien = `${options.origin}/verifier-email?jeton=${encodeURIComponent(options.token)}`;

  const result = await sendMail({
    to: options.to,
    subject: options.isChange
      ? 'Confirmez votre nouvelle adresse TaskFlow'
      : 'Confirmez votre adresse TaskFlow',
    body: [
      salutation(options.name),
      '',
      options.isChange
        ? 'Vous avez demandé à utiliser cette adresse pour votre compte TaskFlow.'
        : 'Bienvenue sur TaskFlow. Confirmez votre adresse pour activer votre compte :',
      '',
      lien,
      '',
      `Ce lien expire dans ${VERIFICATION_TTL_HOURS} heures et ne fonctionne qu’une fois.`,
      '',
      options.isChange
        ? 'Tant que vous n’avez pas ouvert ce lien, votre compte conserve son adresse actuelle.'
        : 'Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.',
    ].join('\n'),
  });

  if (!result.delivered) {
    // Journalisé et non propagé : l'inscription a réussi, et faire échouer la
    // requête laisserait croire au contraire. L'utilisateur pourra demander un
    // nouveau lien depuis la page de connexion.
    console.error(`[account-mail] lien de verification non remis a ${options.to}`);
  }
}

/**
 * Quelqu'un a tenté de s'inscrire avec une adresse déjà prise.
 *
 * C'est la contrepartie de la réponse constante : le formulaire ne dit plus
 * « un compte existe déjà », mais le titulaire de l'adresse, lui, est prévenu.
 * L'information n'est pas perdue — elle est envoyée à la seule personne qui a
 * le droit de la connaître.
 */
export async function sendExistingAccountNotice(options: {
  to: string;
  name: string | null;
  origin: string;
}): Promise<void> {
  await sendMail({
    to: options.to,
    subject: 'Tentative d’inscription avec votre adresse TaskFlow',
    body: [
      salutation(options.name),
      '',
      'Quelqu’un vient d’essayer de créer un compte TaskFlow avec cette adresse.',
      'Un compte existe déjà : aucun nouveau compte n’a été créé, et rien n’a changé.',
      '',
      'Si c’était vous, connectez-vous simplement :',
      `${options.origin}/login`,
      '',
      'Si vous avez oublié votre mot de passe :',
      `${options.origin}/mot-de-passe-oublie`,
      '',
      'Si ce n’était pas vous, vous pouvez ignorer ce message. Votre compte est',
      'intact et personne n’y a accédé.',
    ].join('\n'),
  });
}

/**
 * Quelqu'un a tenté de déplacer son compte vers une adresse déjà utilisée.
 * Même logique que ci-dessus, pour le changement d'adresse.
 */
export async function sendAddressTakenNotice(options: {
  to: string;
  name: string | null;
  origin: string;
}): Promise<void> {
  await sendMail({
    to: options.to,
    subject: 'Quelqu’un a tenté d’utiliser votre adresse TaskFlow',
    body: [
      salutation(options.name),
      '',
      'Un autre compte TaskFlow vient de demander à utiliser cette adresse email.',
      'La demande a été refusée : cette adresse est déjà la vôtre, et rien n’a changé.',
      '',
      'Si ce n’était pas vous, aucune action n’est nécessaire. Par précaution, vous',
      'pouvez changer votre mot de passe :',
      `${options.origin}/mot-de-passe-oublie`,
    ].join('\n'),
  });
}
