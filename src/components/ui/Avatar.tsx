import { TfAvatar } from '@/components/tf/atoms';

type AvatarProps = {
  name: string;
  avatar?: string | null;
  size?: 'sm' | 'md' | 'lg';
};

const px = { sm: 28, md: 32, lg: 44 } as const;

export function Avatar({ name, avatar, size = 'md' }: AvatarProps) {
  return <TfAvatar name={name} avatar={avatar} size={px[size]} ring />;
}
