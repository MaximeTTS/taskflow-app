type AvatarProps = {
  name: string;
  avatar?: string | null;
  size?: 'sm' | 'md' | 'lg';
};

const sizes = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

const colors = ['bg-indigo-500', 'bg-green-500', 'bg-amber-500', 'bg-blue-500', 'bg-pink-500'];

export function Avatar({ name, avatar, size = 'md' }: AvatarProps) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const color = colors[name.charCodeAt(0) % colors.length];

  return (
    <div
      className={`${sizes[size]} ${color} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`}
    >
      {initials}
    </div>
  );
}
