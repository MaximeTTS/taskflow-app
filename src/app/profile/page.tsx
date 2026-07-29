'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gql } from 'graphql-tag';
import { apolloClient } from '@/lib/apollo-client';
import { useAuthStore } from '@/store/auth-store';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AppShell } from '@/components/tf/AppShell';
import { GlassCard, TfAvatar } from '@/components/tf/atoms';
import { stagger, fadeUp } from '@/components/tf/motion';

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
  const { user, login } = useAuthStore();

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
      login(token, {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        avatar: updated.avatar ?? null,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <AppShell breadcrumb={['Dashboard', 'Profil']} active="profile">
      <motion.div
        variants={stagger(0.09)}
        initial="hidden"
        animate="visible"
        className="w-full max-w-3xl mx-auto flex flex-col gap-5"
      >
        <motion.div variants={fadeUp}>
          <h1 className="text-3xl font-bold" style={{ letterSpacing: '-0.025em' }}>
            Profil
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--tf-text-muted)' }}>
            Gérez vos informations personnelles, votre photo et votre mot de passe.
          </p>
        </motion.div>

        {/* Identity */}
        <motion.div variants={fadeUp}>
        <GlassCard style={{ padding: 20 }}>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <TfAvatar name={user?.name ?? user?.email ?? 'U'} avatar={avatar} size={84} ring />
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: 'var(--tf-accent-solid)',
                  color: 'var(--tf-accent-text)',
                  boxShadow: '0 6px 14px -4px rgba(0,0,0,0.3)',
                }}
                title="Changer la photo"
              >
                {uploadingAvatar ? (
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 16V4M6 10l6-6 6 6" />
                    <path d="M4 20h16" />
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
            <div className="min-w-0">
              <h2 className="text-xl font-semibold truncate" style={{ letterSpacing: '-0.01em' }}>
                {user?.name ?? 'Sans nom'}
              </h2>
              <p className="text-[13.5px] mt-0.5 truncate" style={{ color: 'var(--tf-text-muted)' }}>
                {user?.email}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--tf-text-faint)' }}>
                Cliquez sur l&apos;avatar pour le modifier
              </p>
            </div>
          </div>
        </GlassCard>
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* General info */}
          <GlassCard style={{ padding: 24 }}>
            <h3 className="text-base font-semibold" style={{ letterSpacing: '-0.01em' }}>
              Informations générales
            </h3>
            <p className="mt-1 mb-5 text-[12.5px]" style={{ color: 'var(--tf-text-muted)' }}>
              Visible par tous les membres de vos projets.
            </p>
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              {profileSuccess && (
                <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <p className="text-green-400 text-sm">{profileSuccess}</p>
                </div>
              )}
              {profileError && (
                <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <p className="text-red-400 text-sm">{profileError}</p>
                </div>
              )}
              <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" />
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
          </GlassCard>

          {/* Password */}
          <GlassCard style={{ padding: 24 }}>
            <h3 className="text-base font-semibold" style={{ letterSpacing: '-0.01em' }}>
              Sécurité
            </h3>
            <p className="mt-1 mb-5 text-[12.5px]" style={{ color: 'var(--tf-text-muted)' }}>
              Changez votre mot de passe. Minimum 6 caractères.
            </p>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              {passwordSuccess && (
                <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <p className="text-green-400 text-sm">{passwordSuccess}</p>
                </div>
              )}
              {passwordError && (
                <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
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
                label="Confirmer"
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
          </GlassCard>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
