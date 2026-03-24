'use client';

import { useEffect, useState, useRef } from 'react';
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

const UPDATE_AVATAR = gql`
  mutation UpdateAvatar($base64Image: String!) {
    updateAvatar(base64Image: $base64Image) {
      id
      name
      email
      avatar
    }
  }
`;

const GET_ME = gql`
  query Me {
    me {
      id
      name
      email
      avatar
    }
  }
`;

type MeResult = { id: string; name: string; email: string; avatar?: string };

export default function ProfilePage() {
  const router = useRouter();
  const { user, login, logout } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
      const me = (data as { me: MeResult }).me;
      setName(me.name ?? '');
      setEmail(me.email);
      setAvatar(me.avatar ?? null);
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
      const updated = (data as { updateProfile: MeResult }).updateProfile;
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

  const handleUploadAvatar = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_AVATAR,
        variables: { base64Image: base64 },
      });
      const updated = (data as { updateAvatar: MeResult }).updateAvatar;
      setAvatar(updated.avatar ?? null);
      const token = localStorage.getItem('token') ?? '';
      const userToSave = {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        avatar: updated.avatar ?? null,
      };
      login(token, userToSave);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Sidebar */}
      <aside className="w-60 bg-[#111118] border-r border-[#2a2a3a] flex flex-col fixed h-full">
        <div className="p-6 border-b border-[#2a2a3a]">
          <div className="text-xl font-bold text-[#f0f0ff]">
            Task<span className="text-indigo-400">Flow</span>
          </div>
        </div>
        <nav className="p-3 flex-1">
          <div className="text-[12px] font-medium text-[#55556a] uppercase tracking-wider px-2 mb-3">
            Menu
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-md text-[#8888aa] hover:text-[#f0f0ff] hover:bg-[#1e1e2a] transition-colors mb-1"
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
          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-md bg-indigo-500/10 text-indigo-400 mb-1">
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
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-md text-[#8888aa] hover:text-red-400 hover:bg-red-500/10 transition-colors mb-1"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Déconnexion
          </button>
        </nav>
        <div className="p-4 border-t border-[#2a2a3a]">
          <div className="flex items-center gap-3 px-2 py-2">
            {avatar ? (
              <img src={avatar} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <Avatar name={user?.name ?? user?.email ?? 'U'} size="sm" />
            )}
            <div className="min-w-0">
              <div className="text-sm font-medium text-[#f0f0ff] truncate">
                {user?.name ?? 'Utilisateur'}
              </div>
              <div className="text-xs text-[#55556a] truncate">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 flex flex-col items-center py-10 px-8">
        {/* Flèche retour */}
        <div className="w-full max-w-2xl mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-sm text-[#8888aa] hover:text-[#f0f0ff] transition-colors"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Retour au dashboard
          </button>
        </div>

        {/* Titre */}
        <div className="w-full max-w-2xl mb-8">
          <h1 className="text-2xl font-bold text-[#f0f0ff]">Profil</h1>
          <p className="text-base text-[#8888aa] mt-1">Gérez vos informations personnelles</p>
        </div>

        {/* Avatar + infos */}
        <div className="w-full max-w-2xl bg-[#16161f] border border-[#2a2a3a] rounded-xl p-6 mb-6 flex items-center gap-5">
          <div className="relative">
            {avatar ? (
              <img
                src={avatar}
                alt="avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#2a2a3a]"
              />
            ) : (
              <Avatar name={user?.name ?? user?.email ?? 'U'} size="lg" />
            )}
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 bg-indigo-500 hover:bg-indigo-600 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
            >
              {uploadingAvatar ? (
                <svg className="animate-spin w-3 h-3 text-white" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3 h-3 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) void handleUploadAvatar(e.target.files[0]);
              }}
            />
          </div>
          <div>
            <div className="text-lg font-semibold text-[#f0f0ff]">{user?.name ?? 'Sans nom'}</div>
            <div className="text-sm text-[#8888aa] mt-0.5">{user?.email}</div>
            <div className="text-xs text-[#55556a] mt-1">
              Cliquez sur l&apos;avatar pour le modifier
            </div>
          </div>
        </div>

        {/* Formulaire profil */}
        <div className="w-full max-w-2xl bg-[#16161f] border border-[#2a2a3a] rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-[#f0f0ff] mb-5">Informations générales</h2>
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
        <div className="w-full max-w-2xl bg-[#16161f] border border-[#2a2a3a] rounded-xl p-6">
          <h2 className="text-base font-semibold text-[#f0f0ff] mb-5">Changer le mot de passe</h2>
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
