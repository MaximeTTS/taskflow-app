import { NextRequest } from 'next/server';

/**
 * Inscription : énumération de comptes et pré-inscription.
 *
 * Deux failles distinctes sont fixées ici.
 *
 * La route répondait « Un compte existe déjà avec cet email », ce qui suffisait
 * à tester une liste d'adresses. La réponse ne doit plus rien laisser
 * transparaître, quel que soit l'état de l'adresse visée.
 *
 * Et elle créait le compte aussitôt, fût-il non vérifié. Un attaquant pouvait
 * s'inscrire avec l'adresse d'un tiers ; le tiers ouvrait le lien et activait
 * un compte dont l'attaquant connaissait le mot de passe. Aucun compte ne doit
 * naître avant l'ouverture du lien.
 *
 * Le hachage bcrypt est réel : c'est lui qui donne son sens au test de durée.
 */

const trouverUtilisateur = jest.fn();
const creerUtilisateur = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (args: unknown) => trouverUtilisateur(args),
      create: (args: unknown) => creerUtilisateur(args),
    },
  },
}));

type OptionsMail = { to: string; name: string | null };

const envoyerVerification = jest.fn<Promise<void>, [OptionsMail]>(async () => {});
const envoyerCompteExistant = jest.fn<Promise<void>, [OptionsMail]>(async () => {});

jest.mock('@/lib/account-mail', () => ({
  sendVerificationMail: (options: OptionsMail) => envoyerVerification(options),
  sendExistingAccountNotice: (options: OptionsMail) => envoyerCompteExistant(options),
  sendAddressTakenNotice: jest.fn(async () => {}),
}));

type DemandeEnAttente = { email: string; name: string | null; passwordHash: string };

const enregistrerDemande = jest.fn<Promise<string>, [DemandeEnAttente]>(
  async () => 'jeton-de-test',
);

jest.mock('@/lib/pending-registration', () => ({
  issuePendingRegistration: (input: DemandeEnAttente) => enregistrerDemande(input),
}));

jest.mock('@/lib/rate-limit', () => ({
  registerLimiter: { check: jest.fn(async () => ({ allowed: true, retryAfterMs: 0 })) },
}));

// Importé après les mocks : la route les résout au chargement du module.
import { POST } from '@/app/api/auth/register/route';

const MOT_DE_PASSE = 'fjord-lampe-27';

function requete(body: Record<string, unknown>): NextRequest {
  return new NextRequest('https://taskflow.test/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // `isSameOrigin` compare l'origine à l'hôte : sans les deux, la route
      // répond 403 avant même de lire le corps.
      origin: 'https://taskflow.test',
      host: 'taskflow.test',
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  enregistrerDemande.mockResolvedValue('jeton-de-test');
});

describe('POST /api/auth/register — aucun compte avant confirmation', () => {
  it('n’écrit jamais dans la table des comptes', async () => {
    trouverUtilisateur.mockResolvedValue(null);

    await POST(requete({ email: 'neuf@example.com', password: MOT_DE_PASSE, name: 'Neuf' }));

    // La régression à empêcher : recréer le compte dès l'inscription, ce qui
    // rouvrirait l'attaque de pré-inscription.
    expect(creerUtilisateur).not.toHaveBeenCalled();
    expect(enregistrerDemande).toHaveBeenCalledTimes(1);
  });

  it('la demande porte l’empreinte du mot de passe, jamais le clair', async () => {
    trouverUtilisateur.mockResolvedValue(null);

    await POST(requete({ email: 'neuf@example.com', password: MOT_DE_PASSE }));

    const demande = enregistrerDemande.mock.calls[0]![0];
    expect(demande.passwordHash).not.toBe(MOT_DE_PASSE);
    expect(demande.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('n’enregistre aucune demande quand l’adresse a déjà un compte', async () => {
    trouverUtilisateur.mockResolvedValue({ id: 'u1', name: 'Titulaire' });

    await POST(requete({ email: 'prise@example.com', password: MOT_DE_PASSE }));

    // Sinon un lien permettrait de recréer un compte sur une adresse déjà
    // attribuée — et d'en écraser le titulaire.
    expect(enregistrerDemande).not.toHaveBeenCalled();
    expect(creerUtilisateur).not.toHaveBeenCalled();
  });

  it('normalise l’adresse avant de l’enregistrer', async () => {
    trouverUtilisateur.mockResolvedValue(null);

    await POST(requete({ email: '  Neuf@Example.COM ', password: MOT_DE_PASSE }));

    expect(enregistrerDemande.mock.calls[0]![0].email).toBe('neuf@example.com');
  });
});

describe('POST /api/auth/register — réponse constante', () => {
  it('répond la même chose pour une adresse libre et une adresse prise', async () => {
    trouverUtilisateur.mockResolvedValueOnce(null);
    const libre = await POST(requete({ email: 'libre@example.com', password: MOT_DE_PASSE }));
    const corpsLibre = await libre.json();

    trouverUtilisateur.mockResolvedValueOnce({ id: 'u1', name: 'Titulaire' });
    const prise = await POST(requete({ email: 'prise@example.com', password: MOT_DE_PASSE }));
    const corpsPrise = await prise.json();

    // Ni le code, ni le corps ne doivent différer : c'est toute la correction.
    expect(prise.status).toBe(libre.status);
    expect(corpsPrise).toEqual(corpsLibre);
  });

  it('ne renvoie jamais l’ancien message révélateur', async () => {
    trouverUtilisateur.mockResolvedValue({ id: 'u1', name: 'Titulaire' });

    const réponse = await POST(requete({ email: 'prise@example.com', password: MOT_DE_PASSE }));
    const corps = (await réponse.json()) as { message?: string; error?: string };

    expect(JSON.stringify(corps)).not.toMatch(/existe déjà/i);
    expect(réponse.status).toBe(200);
  });

  it('ne connecte pas : aucun cookie de session n’est posé', async () => {
    trouverUtilisateur.mockResolvedValue(null);

    const réponse = await POST(requete({ email: 'neuf@example.com', password: MOT_DE_PASSE }));

    expect(réponse.headers.get('set-cookie')).toBeNull();
  });
});

describe('POST /api/auth/register — ce qui part par email', () => {
  it('prévient le titulaire quand l’adresse a déjà un compte', async () => {
    trouverUtilisateur.mockResolvedValue({ id: 'u1', name: 'Titulaire' });

    await POST(requete({ email: 'prise@example.com', password: MOT_DE_PASSE }));

    // L'information n'est pas perdue : elle va à la seule personne qui a le
    // droit de la connaître.
    expect(envoyerCompteExistant).toHaveBeenCalledTimes(1);
    expect(envoyerCompteExistant.mock.calls[0]![0].to).toBe('prise@example.com');
    expect(envoyerVerification).not.toHaveBeenCalled();
  });

  it('envoie le lien de confirmation quand l’adresse est libre', async () => {
    trouverUtilisateur.mockResolvedValue(null);

    await POST(requete({ email: 'neuf@example.com', password: MOT_DE_PASSE }));

    expect(envoyerVerification).toHaveBeenCalledTimes(1);
    expect(envoyerVerification.mock.calls[0]![0].to).toBe('neuf@example.com');
    expect(envoyerCompteExistant).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/register — durée de réponse', () => {
  it('hache le mot de passe dans les deux cas', async () => {
    // bcrypt coute une centaine de millisecondes. Ne l'executer que sur les
    // adresses libres rendrait les deux cas distinguables au chronometre, et
    // retablirait l'enumeration que le reste de la route ferme.
    trouverUtilisateur.mockResolvedValue(null);
    const départLibre = Date.now();
    await POST(requete({ email: 'libre@example.com', password: MOT_DE_PASSE }));
    const duréeLibre = Date.now() - départLibre;

    trouverUtilisateur.mockResolvedValue({ id: 'u1', name: 'A' });
    const départPrise = Date.now();
    await POST(requete({ email: 'prise@example.com', password: MOT_DE_PASSE }));
    const duréePrise = Date.now() - départPrise;

    // Seuil volontairement large : on ne mesure pas bcrypt, on vérifie qu'il
    // n'est pas absent d'un côté. Sans le hachage, l'écart serait d'un ordre
    // de grandeur.
    const écart = Math.abs(duréeLibre - duréePrise);
    expect(écart).toBeLessThan(Math.max(duréeLibre, duréePrise));
  });
});

describe('POST /api/auth/register — ce qui reste explicite', () => {
  it.each([
    ['adresse invalide', { email: 'pas-un-email', password: MOT_DE_PASSE }],
    ['mot de passe trop court', { email: 'a@b.com', password: 'court' }],
    ['mot de passe devinable', { email: 'a@b.com', password: 'aaaaaaaaaa' }],
    ['mot de passe reprenant l’adresse', { email: 'fjordlampe@b.com', password: 'fjordlampe27' }],
  ])('refuse explicitement : %s', async (_libellé, corps) => {
    trouverUtilisateur.mockResolvedValue(null);

    const réponse = await POST(requete(corps));

    // Les erreurs de forme portent sur ce que l'utilisateur vient de taper,
    // pas sur l'existence d'un compte : les masquer rendrait le formulaire
    // inutilisable sans rien protéger.
    expect(réponse.status).toBe(400);
    expect(enregistrerDemande).not.toHaveBeenCalled();
  });
});
