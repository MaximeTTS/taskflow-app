'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { gql } from 'graphql-tag';
import { apolloClient } from '@/lib/apollo-client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      name
      email
    }
  }
`;

const CHANGE_PASSWORD = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`;

const GET_ME = gql`
  query Me {
    me {
      id
      name
      email
    }
  }
`;

export default function ProfilePage() {
  const router = useRouter();
  const { user, login } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login');
      return;
    }
    void fetchMe();
  }, []);

  const fetchMe = async () => {
    try {
      const { data } = await apolloClient.query({ query: GET_ME, fetchPolicy: 'network-only' });
      const me = (data as { me: { id: string; name: string; email: string } }).me;
      setName(me.name ?? '');
      setEmail(me.email);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_PROFILE,
        variables: { input: { name, email } },
      });
      const updated = (data as { updateProfile: { id: string; name: string; email: string } })
        .updateProfile;
      const token = localStorage.getItem('token') ?? '';
      login(token, updated);
      setProfileSuccess('Profil mis à jour !');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Le mot de passe doit faire au moins 6 caractères');
      return;
    }
    setSavingPassword(true);
    try {
      await apolloClient.mutate({
        mutation: CHANGE_PASSWORD,
        variables: { input: { currentPassword, newPassword } },
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Mot de passe modifié !');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#111118] border-r border-[#2a2a3a] flex flex-col fixed h-full">
        <div className="p-5 border-b border-[#2a2a3a]">
          <div className="text-base font-bold text-[#f0f0ff]">
            Task<span className="text-indigo-400">Flow</span>
          </div>
        </div>
        <nav className="p-3 flex-1">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#8888aa] hover:text-[#f0f0ff] hover:bg-[#1e1e2a] transition-colors mb-1"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            Dashboard
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm bg-indigo-500/10 text-indigo-400">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profil
          </button>
        </nav>
        <div className="p-3 border-t border-[#2a2a3a]">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <Avatar name={user?.name ?? user?.email ?? 'U'} size="sm" />
            <div className="min-w-0">
              <div className="text-xs font-medium text-[#f0f0ff] truncate">
                {user?.name ?? 'Utilisateur'}
              </div>
              <div className="text-[10px] text-[#55556a] truncate">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-56 flex-1 p-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#f0f0ff]">Profil</h1>
          <p className="text-sm text-[#55556a] mt-0.5">Gérez vos informations personnelles</p>
        </div>

        {/* Avatar + infos */}
        <div className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-6 mb-6 flex items-center gap-4">
          <Avatar name={user?.name ?? user?.email ?? 'U'} size="lg" />
          <div>
            <div className="text-base font-semibold text-[#f0f0ff]">{user?.name ?? 'Sans nom'}</div>
            <div className="text-sm text-[#55556a]">{user?.email}</div>
          </div>
        </div>

        {/* Formulaire profil */}
        <div className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-[#f0f0ff] mb-5">Informations générales</h2>
          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
            {profileSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
                <p className="text-green-400 text-sm">{profileSuccess}</p>
              </div>
            )}
            {profileError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm">{profileError}</p>
              </div>
            )}
            <Input
              label="Nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
            />
            <div className="flex justify-end">
              <Button type="submit" loading={savingProfile}>
                Enregistrer
              </Button>
            </div>
          </form>
        </div>

        {/* Formulaire mot de passe */}
        <div className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[#f0f0ff] mb-5">Changer le mot de passe</h2>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            {passwordSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
                <p className="text-green-400 text-sm">{passwordSuccess}</p>
              </div>
            )}
            {passwordError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm">{passwordError}</p>
              </div>
            )}
            <Input
              label="Mot de passe actuel"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="Nouveau mot de passe"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <div className="flex justify-end">
              <Button type="submit" loading={savingPassword}>
                Changer le mot de passe
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
