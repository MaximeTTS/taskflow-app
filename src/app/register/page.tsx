'use client';

import { useState } from 'react';
import { gql } from 'graphql-tag';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apolloClient } from '@/lib/apollo-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        email
        name
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
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-[#f0f0ff] mb-2">
            Task<span className="text-indigo-400">Flow</span>
          </div>
          <p className="text-sm text-[#8888aa]">Créez votre compte</p>
        </div>

        <div className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            <Input
              label="Nom"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Maxime Dupont"
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
            <Button type="submit" loading={loading} className="w-full mt-2">
              Créer mon compte
            </Button>
          </form>

          <p className="text-center text-[#55556a] text-sm mt-5">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
