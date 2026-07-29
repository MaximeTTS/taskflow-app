import { ApolloClient, InMemoryCache, createHttpLink, from, Observable } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

/**
 * `credentials: 'same-origin'` remplace l'ancien lien qui lisait le jeton dans
 * `localStorage` : le navigateur attache desormais le cookie `httpOnly`
 * lui-meme, et plus aucun jeton n'est accessible au JavaScript de la page.
 */
const httpLink = createHttpLink({
  uri: '/api/graphql',
  credentials: 'same-origin',
});

/** Empeche plusieurs rafraichissements concurrents de se declencher. */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccess(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'same-origin',
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      // Liberé au tour suivant pour que les appels simultanes partagent bien
      // la meme promesse.
      queueMicrotask(() => {
        refreshInFlight = null;
      });
    }
  })();

  return refreshInFlight;
}

/**
 * L'acces expire au bout de 15 minutes. Plutot que de deconnecter
 * l'utilisateur en pleine action, on tente un rafraichissement et on rejoue la
 * requete une seule fois.
 */
const authRecoveryLink = onError(({ graphQLErrors, operation, forward }) => {
  const isUnauthenticated = graphQLErrors?.some((e) => e.message === 'Non autorisé');
  if (!isUnauthenticated) return;

  // Marque l'operation pour ne pas boucler si le rafraichissement echoue.
  const context = operation.getContext();
  if (context.retriedAfterRefresh) return;
  operation.setContext({ ...context, retriedAfterRefresh: true });

  return new Observable((observer) => {
    refreshAccess()
      .then((ok) => {
        if (!ok) {
          observer.error(new Error('Session expirée'));
          return;
        }
        forward(operation).subscribe(observer);
      })
      .catch((error) => observer.error(error));
  });
});

export const apolloClient = new ApolloClient({
  link: from([authRecoveryLink, httpLink]),
  cache: new InMemoryCache(),
});
