import {
  checkPassword,
  byteLength,
  PASSWORD_MIN,
  PASSWORD_MAX_BYTES,
} from '@/lib/password-strength';

/** Raccourci de lecture : le verdict seul, sans le motif. */
function accepte(password: string, context?: Parameters<typeof checkPassword>[1]): boolean {
  return checkPassword(password, context).ok;
}

/** Motif du refus, ou chaine vide si accepte. */
function motif(password: string, context?: Parameters<typeof checkPassword>[1]): string {
  const verdict = checkPassword(password, context);
  return verdict.ok ? '' : verdict.reason;
}

describe('checkPassword — le cas qui a motive ce module', () => {
  it('rejette aaaaaaaaaa malgre ses 10 caracteres', () => {
    expect(accepte('aaaaaaaaaa')).toBe(false);
    expect(motif('aaaaaaaaaa')).toMatch(/répétitif/);
  });

  it('rejette les variantes du meme motif', () => {
    for (const faible of ['abababababab', 'aaaaaaaaaa1', '1111111111', 'azeazeazeaze']) {
      expect(accepte(faible)).toBe(false);
    }
  });
});

describe('checkPassword — longueur', () => {
  it(`refuse en dessous de ${PASSWORD_MIN} caracteres`, () => {
    expect(accepte('fjord-la7')).toBe(false);
    expect(motif('fjord-la7')).toMatch(new RegExp(String(PASSWORD_MIN)));
  });

  it('accepte exactement la longueur minimale si le contenu est varie', () => {
    const dix = 'fjord-la72';
    expect(dix).toHaveLength(PASSWORD_MIN);
    expect(accepte(dix)).toBe(true);
  });

  it(`refuse au-dela de ${PASSWORD_MAX_BYTES} octets, limite de bcrypt`, () => {
    const trop = `fjord-lampe-${'v'.repeat(70)}`;
    expect(byteLength(trop)).toBeGreaterThan(PASSWORD_MAX_BYTES);
    expect(accepte(trop)).toBe(false);
  });

  it('compte les octets et non les caracteres', () => {
    // 40 fois 'é' = 40 caracteres mais 80 octets.
    expect(byteLength('é'.repeat(40))).toBe(80);
    expect(accepte(`fjord-${'é'.repeat(40)}`)).toBe(false);
  });
});

describe('checkPassword — formes devinables', () => {
  it('refuse une repetition de quatre caracteres identiques', () => {
    expect(accepte('fjordaaaalampe')).toBe(false);
    expect(motif('fjordaaaalampe')).toMatch(/répéter/);
  });

  it('tolere une repetition de trois', () => {
    expect(accepte('fjordaaalampe')).toBe(true);
  });

  it('refuse les suites consecutives', () => {
    expect(accepte('fjord12345lampe')).toBe(false);
    expect(accepte('fjordabcdelampe')).toBe(false);
    expect(accepte('fjord98765lampe')).toBe(false);
    expect(motif('fjord12345lampe')).toMatch(/suites/);
  });

  it('tolere une suite courte', () => {
    expect(accepte('fjord123lampe')).toBe(true);
  });

  it('refuse les rangees de clavier, azerty comme qwerty', () => {
    expect(accepte('azertyuiop')).toBe(false);
    expect(accepte('monazertyu')).toBe(false);
    expect(accepte('monqwertyu')).toBe(false);
    expect(accepte('monasdfghj')).toBe(false);
  });
});

describe('checkPassword — liste de refus', () => {
  it('refuse les mots de passe les plus courants', () => {
    for (const courant of ['motdepasse', 'password12', 'iloveyou11', 'bonjour123']) {
      expect(accepte(courant)).toBe(false);
    }
  });

  it('refuse les substitutions l33t d’un mot courant', () => {
    // p4ssw0rd ne coute pas plus cher a deviner que password.
    expect(accepte('p4ssw0rd!!')).toBe(false);
    expect(accepte('m0td3p4ss3')).toBe(false);
  });

  it('refuse un mot courant simplement rallonge', () => {
    expect(accepte('password2026')).toBe(false);
    expect(accepte('motdepasse!!')).toBe(false);
  });

  it('refuse le nom du produit', () => {
    expect(accepte('taskflow2026')).toBe(false);
  });
});

describe('checkPassword — contexte du compte', () => {
  it('refuse un mot de passe qui reprend la partie locale de l’email', () => {
    expect(accepte('maxime-fjord', { email: 'maxime@example.com' })).toBe(false);
    expect(motif('maxime-fjord', { email: 'maxime@example.com' })).toMatch(/nom ou votre adresse/);
  });

  it('decoupe prenom.nom en fragments distincts', () => {
    expect(accepte('samus-fjord7', { email: 'maxime.samus@example.com' })).toBe(false);
  });

  it('refuse un mot de passe qui reprend le nom', () => {
    expect(accepte('fjord-turquet', { name: 'Maxime Turquet' })).toBe(false);
  });

  it('ignore les fragments trop courts pour etre significatifs', () => {
    // « max » fait moins de 4 caracteres : le contraindre reviendrait a
    // interdire toute syllabe courante.
    expect(accepte('fjord-maxlp7', { email: 'max@example.com' })).toBe(true);
  });

  it('accepte le meme mot de passe sans le contexte fautif', () => {
    expect(accepte('maxime-fjord')).toBe(true);
    expect(accepte('maxime-fjord', { email: 'autre@example.com' })).toBe(true);
  });
});

describe('checkPassword — ce qui doit passer', () => {
  it('accepte une phrase de passe longue sans chiffre ni symbole', () => {
    // Aucune regle de composition : une phrase longue est plus solide qu’un
    // « Password1! » qui coche toutes les cases.
    expect(accepte('cheval agrafe pile correcte')).toBe(true);
  });

  it('accepte un mot de passe genere aleatoirement', () => {
    expect(accepte('T7vq-Rm2xLp9')).toBe(true);
    expect(accepte('bK4nZr8wQt')).toBe(true);
  });

  it('accepte des caracteres accentues et des symboles', () => {
    expect(accepte('férié-brume-8')).toBe(true);
  });
});
