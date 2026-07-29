'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import type { User } from '@/store/auth-store';
import { PASSWORD_MIN } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthShell } from '@/components/tf/AuthShell';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password, name }),
      });

      const data = (await response.json()) as { user?: User; error?: string };

      if (!response.ok || !data.user) {
        setError(data.error ?? 'Une erreur est survenue');
        return;
      }

      setUser(data.user);
      router.push('/dashboard');
    } catch {
      setError('Impossible de joindre le serveur');
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
          minLength={PASSWORD_MIN}
          required
        />
        <p className="text-[12px] -mt-1.5" style={{ color: 'var(--tf-text-faint)' }}>
          {PASSWORD_MIN} caractères minimum.
        </p>
        <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
          Créer mon compte <span>→</span>
        </Button>
      </form>
    </AuthShell>
  );
}
