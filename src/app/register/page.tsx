'use client';

import { useState } from 'react';
import { gql } from 'graphql-tag';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apolloClient } from '@/lib/apollo-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthShell } from '@/components/tf/AuthShell';

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        email
        name
        avatar
      }
    }
  }
`;

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: REGISTER_MUTATION,
        variables: { input: { email, password, name } },
      });
      const result = data as {
        register: { token: string; user: { id: string; email: string; name: string } };
      };
      login(result.register.token, result.register.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Créer un compte"
      subtitle="Quelques secondes pour rejoindre votre première équipe."
      altPrompt="Déjà un compte ?"
      altLabel="Se connecter"
      altHref="/login"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {error && (
          <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        <Input
          label="Nom complet"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Maxime Turquet"
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
          required
        />
        <Input
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
        <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
          Créer mon compte <span>→</span>
        </Button>
      </form>
    </AuthShell>
  );
}
