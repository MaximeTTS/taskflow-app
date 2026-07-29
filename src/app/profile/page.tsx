'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { gql } from 'graphql-tag';
import { apolloClient } from '@/lib/apollo-client';
import { useAuthStore } from '@/store/auth-store';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { PASSWORD_MIN } from '@/lib/validation';
import { AppShell } from '@/components/glass/AppShell';
import { Surface } from '@/components/glass/Surface';
import { Button } from '@/components/glass/Button';
import { Field } from '@/components/glass/Field';
import { Alert } from '@/components/glass/Alert';
import { Avatar } from '@/components/glass/Avatar';
import { Icon } from '@/components/glass/Icon';

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

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      name
      email
      avatar
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

type Me = { id: string; name: string | null; email: string; avatar?: string | null };

/** Doit rester aligné sur MAX_IMAGE_BYTES côté serveur. */
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await apolloClient.query({ query: GET_ME, fetchPolicy: 'network-only' });
      const me = (data as { me: Me }).me;
      setName(me.name ?? '');
      setEmail(me.email);
      setAvatar(me.avatar ?? null);
    } catch {
      setProfileError('Impossible de charger votre profil.');
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    void fetchMe();
  }, [authLoading, isAuthenticated, fetchMe]);

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');
    setSavingProfile(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_PROFILE,
        variables: { input: { name, email } },
      });
      const updated = (data as { updateProfile: Me }).updateProfile;
      setUser({ ...updated, avatar: updated.avatar ?? null });
      setProfileMessage('Profil enregistré.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Enregistrement impossible');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < PASSWORD_MIN) {
      setPasswordError(`Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`);
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
      // Le serveur révoque toutes les sessions : le dire évite de croire à
      // un bug quand un autre appareil se retrouve déconnecté.
      setPasswordMessage('Mot de passe modifié. Vos autres appareils ont été déconnectés.');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Modification impossible');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAvatar = async (file: File) => {
    setAvatarError('');

    // Contrôle côté client en plus du serveur : inutile d'envoyer 20 Mo
    // pour se les faire refuser.
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('Image trop lourde. 5 Mo maximum.');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
      setAvatarError('Formats acceptés : PNG, JPEG, WebP, GIF.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
        reader.readAsDataURL(file);
      });

      const { data } = await apolloClient.mutate({
        mutation: UPDATE_AVATAR,
        variables: { base64Image: base64 },
      });
      const updated = (data as { updateAvatar: Me }).updateAvatar;
      setAvatar(updated.avatar ?? null);
      setUser({ ...updated, avatar: updated.avatar ?? null });
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Envoi impossible');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const displayName = name || user?.name || email || '?';

  return (
    <AppShell active="profile" breadcrumb={[{ label: 'Profil' }]}>
      <header className="mb-9">
        <p className="tf-eyebrow mb-3">Votre compte</p>
        <h1 className="tf-display text-[clamp(2rem,5vw,2.9rem)]">
          <span className="tf-mask">
            <span>Profil</span>
          </span>
        </h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
        {/* ── Identité ────────────────────────────────────────── */}
        <Surface radius="xl" panel className="h-fit p-7 text-center">
          <div className="mb-5 inline-block">
            <Avatar name={displayName} avatar={avatar} size={92} />
          </div>

          <p className="mb-1 text-[16px] font-semibold tracking-[-0.015em]">{displayName}</p>
          <p className="mb-6 text-[13px]" style={{ color: 'var(--color-haze)' }}>
            {email}
          </p>

          {avatarError && (
            <div className="mb-4">
              <Alert tone="danger">{avatarError}</Alert>
            </div>
          )}

          <Button
            variant="glass"
            block
            loading={uploadingAvatar}
            onClick={() => fileInput.current?.click()}
          >
            <Icon.Image size={16} />
            Changer la photo
          </Button>

          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleAvatar(file);
              // Réinitialisé pour que choisir deux fois le même fichier
              // déclenche bien un second envoi.
              e.target.value = '';
            }}
          />
        </Surface>

        <div className="flex flex-col gap-4">
          {/* ── Informations ──────────────────────────────────── */}
          <Surface radius="xl" panel className="p-7">
            <h2 className="tf-display mb-1 text-[1.2rem]">Informations</h2>
            <p className="mb-6 text-[13px]" style={{ color: 'var(--color-haze)' }}>
              Votre nom apparaît sur les tâches que vous créez.
            </p>

            <form onSubmit={handleProfile} className="flex flex-col gap-4">
              {profileError && <Alert tone="danger">{profileError}</Alert>}
              {profileMessage && <Alert tone="success">{profileMessage}</Alert>}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nom complet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  autoComplete="name"
                />
                <Field
                  label="Adresse email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <Button type="submit" variant="primary" loading={savingProfile}>
                  Enregistrer
                </Button>
              </div>
            </form>
          </Surface>

          {/* ── Mot de passe ──────────────────────────────────── */}
          <Surface radius="xl" panel className="p-7">
            <h2 className="tf-display mb-1 text-[1.2rem]">Mot de passe</h2>
            <p className="mb-6 text-[13px]" style={{ color: 'var(--color-haze)' }}>
              Le modifier déconnecte tous vos autres appareils.
            </p>

            <form onSubmit={handlePassword} className="flex flex-col gap-4">
              {passwordError && <Alert tone="danger">{passwordError}</Alert>}
              {passwordMessage && <Alert tone="success">{passwordMessage}</Alert>}

              <Field
                label="Mot de passe actuel"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nouveau mot de passe"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={PASSWORD_MIN}
                  hint={`${PASSWORD_MIN} caractères minimum.`}
                  required
                />
                <Field
                  label="Confirmation"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  error={
                    confirmPassword.length > 0 && confirmPassword !== newPassword
                      ? 'Ne correspond pas.'
                      : undefined
                  }
                  required
                />
              </div>

              <div>
                <Button type="submit" variant="primary" loading={savingPassword}>
                  Modifier le mot de passe
                </Button>
              </div>
            </form>
          </Surface>
        </div>
      </div>
    </AppShell>
  );
}
