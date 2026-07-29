import {
  assertValidEmail,
  assertValidPassword,
  assertLength,
  normalizeEmail,
  ValidationError,
} from '@/lib/validation';

describe('normalizeEmail', () => {
  it('met en minuscules et retire les espaces autour', () => {
    expect(normalizeEmail('  Maxime@Example.COM ')).toBe('maxime@example.com');
  });
});

describe('assertValidEmail', () => {
  it('accepte une adresse normale', () => {
    expect(() => assertValidEmail('maxime@example.com')).not.toThrow();
  });

  it('accepte les sous-domaines et les signes plus', () => {
    expect(() => assertValidEmail('max+tag@mail.example.co.uk')).not.toThrow();
  });

  it.each(['', 'pasdemail', 'a@', '@b.com', 'a b@c.com', 'a@b', 'a@@b.com'])(
    'rejette %p',
    (bad) => {
      expect(() => assertValidEmail(bad)).toThrow(ValidationError);
    },
  );

  it('rejette une adresse de plus de 254 caractères', () => {
    const long = `${'a'.repeat(250)}@example.com`;
    expect(() => assertValidEmail(long)).toThrow(ValidationError);
  });
});

describe('assertValidPassword', () => {
  it('accepte un mot de passe de 10 caractères ou plus', () => {
    expect(() => assertValidPassword('motdepasse1')).not.toThrow();
  });

  it('rejette un mot de passe trop court', () => {
    expect(() => assertValidPassword('court')).toThrow(ValidationError);
    expect(() => assertValidPassword('123456789')).toThrow(ValidationError);
  });

  it('rejette un mot de passe au-dela de la limite bcrypt de 72 octets', () => {
    expect(() => assertValidPassword('a'.repeat(73))).toThrow(ValidationError);
  });

  it('compte les octets et non les caracteres pour la limite bcrypt', () => {
    // 'é' fait 2 octets en UTF-8 : 40 caracteres = 80 octets, au-dela de 72.
    expect(() => assertValidPassword('é'.repeat(40))).toThrow(ValidationError);
  });

  it('rejette une valeur vide', () => {
    expect(() => assertValidPassword('')).toThrow(ValidationError);
  });
});

describe('assertLength', () => {
  it('accepte une valeur dans les bornes', () => {
    expect(() => assertLength('Titre', 'titre', { min: 1, max: 10 })).not.toThrow();
  });

  it('rejette une valeur trop longue', () => {
    expect(() => assertLength('a'.repeat(11), 'titre', { min: 1, max: 10 })).toThrow(
      ValidationError,
    );
  });

  it('rejette une valeur vide ou uniquement des espaces quand min vaut 1', () => {
    expect(() => assertLength('', 'titre', { min: 1, max: 10 })).toThrow(ValidationError);
    expect(() => assertLength('   ', 'titre', { min: 1, max: 10 })).toThrow(ValidationError);
  });

  it('ignore les valeurs absentes (champ optionnel)', () => {
    expect(() => assertLength(undefined, 'description', { min: 1, max: 10 })).not.toThrow();
    expect(() => assertLength(null, 'description', { min: 1, max: 10 })).not.toThrow();
  });

  it("nomme le champ fautif dans le message d'erreur", () => {
    expect(() => assertLength('a'.repeat(11), 'titre', { min: 1, max: 10 })).toThrow(/titre/);
  });
});
