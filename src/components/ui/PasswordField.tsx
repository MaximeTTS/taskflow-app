'use client';

import type { InputHTMLAttributes } from 'react';
import { Field } from './Field';
import { checkPassword, PASSWORD_MIN } from '@/lib/password-strength';
import type { PasswordContext } from '@/lib/password-strength';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  /** Email et nom du compte, pour refuser un mot de passe qui les reprend. */
  context?: PasswordContext;
};

/**
 * Champ de nouveau mot de passe, avec le verdict de robustesse en direct.
 *
 * Les règles viennent du même module que celles du serveur : il n'y a pas deux
 * définitions de « mot de passe acceptable » qui pourraient diverger. Le
 * serveur reste seul juge — ce composant sert à ne pas faire découvrir le refus
 * après l'envoi du formulaire.
 *
 * Le verdict n'apparaît qu'une fois la saisie commencée : reprocher sa
 * faiblesse à un champ vide n'aide personne.
 */
export function PasswordField({ value, onChange, context, ...rest }: Props) {
  const verdict = checkPassword(value, context);
  const touché = value.length > 0;

  return (
    <Field
      type="password"
      autoComplete="new-password"
      minLength={PASSWORD_MIN}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={touché && !verdict.ok ? verdict.reason : undefined}
      hint={
        touché && verdict.ok
          ? 'Ce mot de passe convient.'
          : `${PASSWORD_MIN} caractères minimum, et rien de devinable.`
      }
      {...rest}
    />
  );
}

/**
 * Le mot de passe est-il acceptable ? Sert à conditionner l'envoi du
 * formulaire, sans dupliquer l'appel dans chaque page.
 */
export function passwordAcceptable(value: string, context?: PasswordContext): boolean {
  return checkPassword(value, context).ok;
}
