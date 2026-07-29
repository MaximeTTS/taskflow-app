import { makeExecutableSchema } from '@graphql-tools/schema';
import { validateSchema, isObjectType } from 'graphql';
import type { GraphQLObjectType } from 'graphql';
import { typeDefs } from '@/graphql/schema/typeDefs';
import { resolvers } from '@/graphql/schema/resolvers';

/**
 * Cohérence entre le schéma et les resolvers.
 *
 * Les tests de resolvers appellent les fonctions directement : ils ne voient
 * donc rien d'un champ déclaré dans le schéma mais jamais résolu, ni d'un
 * resolver écrit pour un champ qui n'existe plus. Ces écarts ne se manifestent
 * qu'à l'exécution d'une vraie requête — c'est-à-dire en production.
 *
 * `makeExecutableSchema` refuse d'assembler un schéma incohérent : construire
 * le schéma est déjà l'essentiel du test.
 */

const schema = makeExecutableSchema({ typeDefs, resolvers });

/** Champs réellement déclarés sur un type du schéma. */
function champs(nomDuType: string): string[] {
  const type = schema.getType(nomDuType);
  if (!type || !isObjectType(type)) {
    throw new Error(`Type absent du schéma : ${nomDuType}`);
  }
  return Object.keys((type as GraphQLObjectType).getFields());
}

describe('Schéma GraphQL', () => {
  it('est valide', () => {
    expect(validateSchema(schema)).toEqual([]);
  });

  it('n’a aucun resolver orphelin', () => {
    // Un resolver dont le champ n'existe plus est du code mort qui ment :
    // il donne l'illusion d'une garde ou d'un calcul toujours en place.
    for (const [nomDuType, champsResolus] of Object.entries(resolvers)) {
      const déclarés = new Set(champs(nomDuType));
      for (const champ of Object.keys(champsResolus)) {
        expect({ type: nomDuType, champ, déclaré: déclarés.has(champ) }).toEqual({
          type: nomDuType,
          champ,
          déclaré: true,
        });
      }
    }
  });
});

describe('Pagination — le schéma la rend obligatoire', () => {
  it.each(['projects', 'tasks', 'users'])('%s renvoie une page, pas une liste nue', (nom) => {
    const query = schema.getQueryType()!.getFields()[nom]!;
    // La régression à empêcher : revenir à `[Project!]!`, qui renvoie tout.
    expect(String(query.type)).toMatch(/Page!$/);
  });

  it.each(['projects', 'tasks', 'users'])('%s accepte limit et offset', (nom) => {
    const args = schema.getQueryType()!.getFields()[nom]!.args.map((a) => a.name);
    expect(args).toEqual(expect.arrayContaining(['limit', 'offset']));
  });

  it('les tâches d’un projet sont paginées elles aussi', () => {
    const type = schema.getType('Project') as GraphQLObjectType;
    const tasks = type.getFields().tasks!;

    expect(String(tasks.type)).toBe('TaskPage!');
    expect(tasks.args.map((a) => a.name)).toEqual(expect.arrayContaining(['limit', 'offset']));
  });

  it('chaque page annonce son total et sa suite', () => {
    for (const page of ['ProjectPage', 'TaskPage', 'UserPage', 'AuditEventPage']) {
      expect(champs(page)).toEqual(expect.arrayContaining(['items', 'totalCount', 'hasMore']));
    }
  });
});

describe('Vérification d’adresse — surface exposée', () => {
  it('User porte l’état de vérification', () => {
    expect(champs('User')).toEqual(expect.arrayContaining(['emailVerified', 'pendingEmail']));
  });

  it('le journal d’audit est interrogeable', () => {
    const requêtes = Object.keys(schema.getQueryType()!.getFields());
    expect(requêtes).toEqual(expect.arrayContaining(['projectAuditLog', 'accountAuditLog']));
  });

  it('l’énumération AuditAction couvre les actions enregistrées', () => {
    const type = schema.getType('AuditAction');
    const valeurs = (type as unknown as { getValues(): { name: string }[] }).getValues();

    // Doit rester aligné sur l'enum Prisma : une action enregistrée mais
    // absente d'ici serait écrite en base et illisible par l'API.
    expect(valeurs.map((v) => v.name).sort()).toEqual(
      [
        'ACCOUNT_CREATED',
        'EMAIL_CHANGED',
        'EMAIL_CHANGE_REQUESTED',
        'EMAIL_VERIFIED',
        'MEMBER_ADDED',
        'MEMBER_REMOVED',
        'MEMBER_ROLE_CHANGED',
        'PASSWORD_CHANGED',
        'PASSWORD_RESET',
        'PROJECT_CREATED',
        'PROJECT_DELETED',
      ].sort(),
    );
  });
});
