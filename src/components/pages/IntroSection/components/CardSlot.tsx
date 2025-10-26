interface CardSlotProps {
  children: React.ReactNode;
  variant?: 'default' | 'highlighted';
  className?: string;
}

export default function CardSlot({
  children,
  variant = 'default',
  className = ''
}: CardSlotProps) {
  const baseClasses = 'rounded-3xl p-6 sm:p-8 lg:p-12 shadow-subtle';

  const variantClasses = {
    default: 'border border-outline-subtle/40 bg-surface/80',
    highlighted: 'border border-mint bg-background'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}
