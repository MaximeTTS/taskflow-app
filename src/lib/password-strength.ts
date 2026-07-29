/**
 * Robustesse des mots de passe.
 *
 * La seule règle appliquée jusqu'ici était une longueur de 10 caractères :
 * `aaaaaaaaaa` passait. Or la longueur ne dit rien de la difficulté à deviner.
 *
 * Les contrôles suivent la recommandation NIST SP 800-63B : longueur, liste
 * de refus, et rejet des formes structurellement devinables. Volontairement
 * pas de règle de composition (« une majuscule, un chiffre, un symbole ») :
 * elle pousse vers `Password1!` — court, prévisible, et en tête de toutes les
 * listes d'attaque — tout en refusant des phrases de passe longues et solides.
 *
 * Le module est pur et sans dépendance : la page d'inscription l'utilise pour
 * un retour immédiat, le serveur pour la décision qui fait foi.
 */

export const PASSWORD_MIN = 10;

/**
 * bcrypt ne prend en compte que les 72 premiers octets : au-delà, deux mots de
 * passe différents produisent le même hash. On refuse plutôt que de tronquer
 * silencieusement.
 */
export const PASSWORD_MAX_BYTES = 72;

/** Nombre minimal de caractères distincts. `aaaaaaaaaa` en compte 1. */
const MIN_DISTINCT = 5;

/** Longueur à partir de laquelle une suite (abcde, 12345) est refusée. */
const MAX_SEQUENCE = 4;

/** Longueur à partir de laquelle une répétition (aaaa) est refusée. */
const MAX_REPEAT = 3;

/**
 * Mots de passe et racines les plus courants. Liste courte et assumée : elle
 * arrête ce qu'une attaque par dictionnaire essaie dans ses premières
 * secondes. Une couverture sérieuse demanderait un jeu de plusieurs millions
 * d'entrées — c'est le rôle d'un service dédié (Have I Been Pwned), pas d'un
 * tableau embarqué qu'il faudrait charger à chaque requête.
 */
const COMMON = new Set([
  'password', 'motdepasse', 'passw0rd', 'password1', 'azerty', 'qwerty',
  'qwertyuiop', 'azertyuiop', 'motdepasse1', 'iloveyou', 'admin', 'administrateur',
  'welcome', 'bienvenue', 'letmein', 'monkey', 'dragon', 'sunshine', 'princess',
  'football', 'baseball', 'superman', 'batman', 'trustno1', 'starwars',
  'whatever', 'freedom', 'shadow', 'master', 'jordan', 'harley', 'hunter',
  'ranger', 'buster', 'soccer', 'hockey', 'killer', 'george', 'sexy', 'andrew',
  'charlie', 'thomas', 'robert', 'jessica', 'pepper', 'daniel', 'ginger',
  'summer', 'ashley', 'nicole', 'chelsea', 'biteme', 'matthew', 'access',
  'yankees', 'dallas', 'austin', 'thunder', 'taylor', 'matrix', 'secret',
  'chocolat', 'chocolate', 'bonjour', 'salut', 'coucou', 'soleil', 'amour',
  'jetaime', 'famille', 'maison', 'liberte', 'nintendo', 'pokemon', 'internet',
  'ordinateur', 'computer', 'samsung', 'google', 'facebook', 'linkedin',
  'taskflow', 'projet', 'project', 'test', 'temporaire', 'temporary', 'changeme',
  'changerapidement', 'nouveaumotdepasse', 'motdepassesecret', 'jenesaispas',
  'anonymous', 'qazwsx', 'zaq12wsx', 'asdfgh', 'zxcvbn', 'qwertz', 'wasd',
  'abcdef', 'abcdefg', 'abc123', 'a1b2c3', '123abc', 'passwordpassword',
]);

/**
 * Rangées de clavier, dans les deux dispositions courantes. Uniquement des
 * lettres : les suites de chiffres sont déjà couvertes par `longestSequence`,
 * et la normalisation l33t remplace les chiffres avant cette comparaison.
 */
const KEYBOARD_ROWS = [
  'azertyuiop', 'qsdfghjklm', 'wxcvbn',
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
];

/**
 * Substitutions « l33t » les plus répandues, appliquées avant la comparaison à
 * la liste de refus : sans cela, `p4ssw0rd` passerait alors qu'il ne coûte rien
 * de plus à deviner que `password`.
 */
const LEET: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b',
  '@': 'a', '$': 's', '!': 'i', '|': 'i', '+': 't',
};

function normalize(password: string): string {
  return password
    .toLowerCase()
    .split('')
    .map((c) => LEET[c] ?? c)
    .join('');
}

/** Longueur en octets UTF-8. `TextEncoder` fonctionne aussi dans le navigateur. */
export function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

/** Plus longue répétition d'un même caractère. */
function longestRepeat(value: string): number {
  let best = 0;
  let run = 0;
  let previous = '';

  for (const char of value) {
    run = char === previous ? run + 1 : 1;
    previous = char;
    if (run > best) best = run;
  }
  return best;
}

/**
 * Plus longue suite de codes consécutifs, dans un sens ou dans l'autre.
 * Couvre `abcdef` comme `987654`.
 */
function longestSequence(value: string): number {
  let best = 0;
  let ascending = 1;
  let descending = 1;

  for (let i = 1; i < value.length; i += 1) {
    const écart = value.charCodeAt(i) - value.charCodeAt(i - 1);
    ascending = écart === 1 ? ascending + 1 : 1;
    descending = écart === -1 ? descending + 1 : 1;
    best = Math.max(best, ascending, descending);
  }
  return Math.max(best, value.length > 0 ? 1 : 0);
}

/**
 * Longueur minimale pour qu'un mot de la liste soit cherché à l'intérieur du
 * mot de passe. En dessous, `test` ou `sexy` apparaîtraient dans trop de
 * chaînes légitimes pour que le signal veuille dire quelque chose.
 */
const RACINE_MIN = 6;

/**
 * Le mot de passe est-il un mot courant à peine déguisé ?
 *
 * Vrai si un mot de la liste s'y trouve et en couvre au moins la moitié :
 * `password2026` oui, une phrase de passe de six mots dont l'un est `soleil`
 * non.
 */
function racineCourante(normalized: string): boolean {
  for (const mot of COMMON) {
    if (mot.length < RACINE_MIN) continue;
    if (normalized.includes(mot) && mot.length * 2 >= normalized.length) {
      return true;
    }
  }
  return false;
}

/** Le mot de passe contient-il une portion de rangée de clavier assez longue ? */
function hasKeyboardRun(normalized: string): boolean {
  for (const row of KEYBOARD_ROWS) {
    for (let start = 0; start + MAX_SEQUENCE + 1 <= row.length; start += 1) {
      if (normalized.includes(row.slice(start, start + MAX_SEQUENCE + 1))) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Fragments personnels à ne pas retrouver dans le mot de passe : la partie
 * locale de l'email et chaque mot du nom. Un mot de passe fondé sur l'identité
 * du compte est la première chose qu'un attaquant essaie, et c'est aussi ce
 * qu'un collègue devine sans outil.
 */
function personalFragments(context: PasswordContext): string[] {
  const fragments: string[] = [];

  const local = context.email?.split('@')[0] ?? '';
  // Les séparateurs découpent prenom.nom en deux fragments utiles.
  for (const part of local.split(/[._\-+]/)) {
    if (part.length >= 4) fragments.push(part.toLowerCase());
  }

  for (const part of (context.name ?? '').split(/\s+/)) {
    if (part.length >= 4) fragments.push(part.toLowerCase());
  }

  return fragments;
}

export type PasswordContext = {
  email?: string;
  name?: string;
};

export type PasswordVerdict =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Évalue un mot de passe. Rend le premier problème rencontré plutôt que la
 * liste complète : corriger un défaut en révèle souvent un autre, et une seule
 * consigne à la fois est plus facile à suivre que cinq.
 */
export function checkPassword(password: string, context: PasswordContext = {}): PasswordVerdict {
  if (password.length < PASSWORD_MIN) {
    return {
      ok: false,
      reason: `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères`,
    };
  }

  if (byteLength(password) > PASSWORD_MAX_BYTES) {
    return {
      ok: false,
      reason: `Le mot de passe est trop long (maximum ${PASSWORD_MAX_BYTES} octets)`,
    };
  }

  const distinct = new Set(password).size;
  if (distinct < MIN_DISTINCT) {
    return {
      ok: false,
      reason: `Le mot de passe est trop répétitif : il ne compte que ${distinct} caractère(s) différent(s), il en faut au moins ${MIN_DISTINCT}`,
    };
  }

  if (longestRepeat(password) > MAX_REPEAT) {
    return {
      ok: false,
      reason: `Évitez de répéter ${MAX_REPEAT + 1} fois le même caractère d’affilée`,
    };
  }

  if (longestSequence(password) > MAX_SEQUENCE) {
    return {
      ok: false,
      reason: 'Évitez les suites de caractères consécutifs (abcde, 12345)',
    };
  }

  const normalized = normalize(password);

  if (hasKeyboardRun(normalized)) {
    return {
      ok: false,
      reason: 'Évitez les suites de touches voisines sur le clavier (azerty, qwerty)',
    };
  }

  if (COMMON.has(normalized)) {
    return {
      ok: false,
      reason: 'Ce mot de passe est trop courant et figure dans les listes d’attaque',
    };
  }

  // Un mot courant simplement rallongé (`password2026`, `motdepasse!!`) ne
  // coûte pas plus cher à deviner : ce qui l'entoure est court et prévisible.
  //
  // La condition de couverture — le mot courant doit représenter au moins la
  // moitié du total — est ce qui distingue `taskflow2026` d'une phrase de
  // passe qui contiendrait `soleil` parmi quatre autres mots. Sans elle, la
  // liste de refus punirait précisément les mots de passe qu'on veut encourager.
  if (racineCourante(normalized)) {
    return {
      ok: false,
      reason: 'Ce mot de passe repose sur un mot trop courant',
    };
  }

  for (const fragment of personalFragments(context)) {
    if (normalized.includes(fragment)) {
      return {
        ok: false,
        reason: 'Le mot de passe ne doit pas reprendre votre nom ou votre adresse email',
      };
    }
  }

  return { ok: true };
}
