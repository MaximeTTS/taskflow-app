type CardProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-[#16161f] border border-[#2a2a3a] rounded-xl p-5
        ${onClick ? 'cursor-pointer hover:border-[#3a3a50] transition-colors' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
