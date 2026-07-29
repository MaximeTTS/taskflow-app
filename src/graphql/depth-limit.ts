import { GraphQLError } from 'graphql';
import type { ASTVisitor, ValidationContext, FragmentDefinitionNode, SelectionSetNode } from 'graphql';
import { Kind } from 'graphql';

/**
 * Refuse les requêtes trop profondes.
 *
 * Le schéma est cyclique — `Project.tasks -> Task.project -> Project.tasks…` —
 * donc une requête courte peut demander un travail exponentiel à la base et
 * suffire à saturer le serveur. Apollo n'impose aucune limite par défaut.
 *
 * 10 niveaux couvrent largement les requêtes réelles de l'application (la plus
 * profonde, `project { tasks { assignee { … } } }`, en compte 4).
 */
export const MAX_QUERY_DEPTH = 10;

export function depthLimit(maxDepth: number = MAX_QUERY_DEPTH) {
  return function depthLimitRule(context: ValidationContext): ASTVisitor {
    const fragments = context.getDocument().definitions.reduce<Record<string, FragmentDefinitionNode>>(
      (acc, def) => {
        if (def.kind === Kind.FRAGMENT_DEFINITION) acc[def.name.value] = def;
        return acc;
      },
      {},
    );

    /** Profondeur maximale atteinte sous cet ensemble de sélections. */
    function depthOf(
      selectionSet: SelectionSetNode | undefined,
      current: number,
      seenFragments: ReadonlySet<string>,
    ): number {
      if (!selectionSet) return current;

      let deepest = current;
      for (const selection of selectionSet.selections) {
        if (selection.kind === Kind.FIELD) {
          // Les champs d'introspection ne comptent pas : ils sont bornés.
          if (selection.name.value.startsWith('__')) continue;
          const branch = depthOf(selection.selectionSet, current + 1, seenFragments);
          if (branch > deepest) deepest = branch;
        } else if (selection.kind === Kind.INLINE_FRAGMENT) {
          const branch = depthOf(selection.selectionSet, current, seenFragments);
          if (branch > deepest) deepest = branch;
        } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
          const name = selection.name.value;
          // Un fragment qui se référence lui-même boucle à l'infini ; une autre
          // règle de validation le signalera, on se contente de ne pas y entrer.
          if (seenFragments.has(name)) continue;
          const fragment = fragments[name];
          if (!fragment) continue;
          const branch = depthOf(
            fragment.selectionSet,
            current,
            new Set([...seenFragments, name]),
          );
          if (branch > deepest) deepest = branch;
        }
      }
      return deepest;
    }

    return {
      OperationDefinition(node) {
        const depth = depthOf(node.selectionSet, 0, new Set());
        if (depth > maxDepth) {
          context.reportError(
            new GraphQLError(
              `Requête trop profonde (${depth} niveaux, maximum ${maxDepth})`,
              { nodes: [node] },
            ),
          );
        }
      },
    };
  };
}
